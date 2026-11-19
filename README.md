# Canary Wharf Salon

Single-page website for Canary Wharf Salon. It's a pnpm + Turborepo monorepo, and the site is built with Vite, React, TypeScript and Tailwind CSS v4.

## Structure

```
apps/web     # the SPA (sections: Home, About us, Bookings, Contact)
packages/    # reserved for shared packages
```

Editable copy (services, prices, opening hours, contact details) lives in `apps/web/src/data/content.ts`.

## Scripts

```bash
pnpm install
pnpm dev        # start the dev server (http://localhost:5180)
pnpm build      # production build → apps/web/dist
pnpm typecheck
pnpm preview    # serve the production build
```

## Notes

- The booking form validates on the client and shows a confirmation. It is not connected to a backend yet.
- Photos are from Unsplash (credited in the footer).

## Deployment (AWS CloudFront)

Hosted in the **Canary Wharf Salon** AWS account (`247671893694`, eu-west-2) as a private S3 bucket behind CloudFront with Origin Access Control. Infrastructure is in `infra/site.yml` (stack `canary-wharf-salon-site`).

```bash
aws sso login --sso-session console-admin
AWS_PROFILE=admin-CanaryWharfSalon pnpm deploy:aws          # build + upload + invalidate
AWS_PROFILE=admin-CanaryWharfSalon pnpm deploy:aws --infra  # also create/update the stack
```

Live URL: https://d3pgslnze1o1uf.cloudfront.net
