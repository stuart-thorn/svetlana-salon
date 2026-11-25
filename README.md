# N&G Canary Wharf

Single-page website for N&G Canary Wharf (N&G Canary Wharf Ltd, Unit 38C, Jubilee Place, London E14 5NY), first tenant of the Bookable platform. It's a pnpm + Turborepo monorepo, and the site is built with Vite, React, TypeScript and Tailwind CSS v4.

## Structure

```
apps/web          # the SPA (sections: Home, About, Prices, Offers, Contact) + /book flow
packages/booking  # @salon/booking: catalogue, availability types, mock provider (+ tests)
```

Editable copy (opening hours, contact details) lives in `apps/web/src/data/content.ts`.
Services, prices, stylists and their rotas live in `packages/booking/src/catalog.ts` (indicative launch menu, mirrored in bookable-agent's seed). Packages, memberships and the Family Visit offer are described in `content.ts`; the booking system applies the Family Visit to group bookings (`/book/group`) of 3 or more people.

## Scripts

```bash
pnpm install
pnpm dev        # start the dev server (http://localhost:5180)
pnpm build      # production build → apps/web/dist
pnpm typecheck
pnpm test       # vitest (booking package)
pnpm preview    # serve the production build
```

## Notes

- Online booking lives at `/book`: Professional → Services → Date → Time → Details, with the cart always visible
  (sticky panel on desktop, bottom bar on mobile). Steps are in the URL so the browser back button works.
- Availability comes from a `BookingProvider` (`packages/booking/src/types.ts`). It is currently the **mock** provider,
  which simulates a diary of existing appointments. To go live, implement `BookingProvider` against a real
  backend, swap it in `apps/web/src/booking/provider.ts`, and set `isDemo = false` to remove the demo banner.
  The planned backend (multi-tenant bookings and payments platform, separate repo) is designed in [`docs/backend.md`](docs/backend.md).
- Client decisions (payments, tips, Stripe, domain) are in [`docs/client-decisions.md`](docs/client-decisions.md).
- Photos are from Unsplash (credited in the footer).

## Deployment (AWS CloudFront)

Hosted in the **Canary Wharf Salon** AWS account (`247671893694`, eu-west-2) as a private S3 bucket behind CloudFront with Origin Access Control. Infrastructure is in `infra/site.yml` (stack `canary-wharf-salon-site`).

```bash
aws sso login --sso-session console-admin
AWS_PROFILE=admin-CanaryWharfSalon pnpm deploy:aws          # build + upload + invalidate
AWS_PROFILE=admin-CanaryWharfSalon pnpm deploy:aws --infra  # also create/update the stack
```

Live URL: https://d3pgslnze1o1uf.cloudfront.net

### Custom domain (www.ngcanarywharf.co.uk)

`www.ngcanarywharf.co.uk` is the site's main address. The bare domain and the cloudfront.net address redirect
to it (301), handled by a CloudFront Function in `infra/site.yml`. It takes three stacks:

1. **DNS:** `infra/dns.yml`, stack `canary-wharf-salon-dns` (eu-west-2). A Route 53 hosted zone, kept if the
   stack is deleted. The nameservers are set at 123-reg.
2. **Certificate:** `infra/cert.yml`, stack `canary-wharf-salon-cert`, **us-east-1** (CloudFront requires it).
   It's validated through DNS records in the zone, so it can only be issued once the nameservers point to Route 53.
3. **Site:** `infra/site.yml`. `deploy.sh --infra` passes `infra/params/<stack>.env` as parameters. The domain is
   switched on only when `DomainName`, `HostedZoneId` and `CertificateArn` are all set. Staging has no params
   file, so it stays on cloudfront.net.

```bash
dig +short NS ngcanarywharf.co.uk          # should list awsdns-… nameservers first
AWS_PROFILE=admin-CanaryWharfSalon aws cloudformation deploy --region us-east-1 \
  --stack-name canary-wharf-salon-cert --template-file infra/cert.yml \
  --parameter-overrides HostedZoneId=Z01045481U8YIZF1ZRA0E
AWS_PROFILE=admin-CanaryWharfSalon aws cloudformation describe-stacks --region us-east-1 \
  --stack-name canary-wharf-salon-cert --query "Stacks[0].Outputs[0].OutputValue" --output text
# put the ARN in infra/params/canary-wharf-salon-site.env, commit and push, then:
AWS_PROFILE=admin-CanaryWharfSalon pnpm deploy:aws --infra
```

`deploy.sh` refuses to run unless the working tree is clean and every commit is pushed to its upstream
(`scripts/check-pushed.sh`; `ALLOW_DIRTY=1` overrides in an emergency).

### Staging

A separate stack, `canary-wharf-salon-site-staging` (https://d3m61eocrko2zw.cloudfront.net), is built against the
staging booking API (bookable-agent stack `bookable-staging`) using `apps/web/.env.staging` (gitignored; values from
`pnpm stage:seed staging` in bookable-agent):

```bash
STACK_NAME=canary-wharf-salon-site-staging AWS_PROFILE=admin-CanaryWharfSalon pnpm deploy:aws --mode staging
```
