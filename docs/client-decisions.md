# Client decisions

Decisions and clarifications from Svetlana (N&G Canary Wharf Ltd), newest first.

## 2026-11-22: payments, payment provider, domain

### 1. Payment flow and stylist payouts

- **All customer payments go into one central account** belonging to N&G Canary Wharf Ltd. That covers
  online colour deposits and payments taken in the salon.
- **The salon pays stylists itself**, outside the platform. No per-stylist payouts or split payments are needed.
- **Tips (gratuities) are recorded per stylist, as their own line item**, completely separate from service
  revenue, so that 100% of each tip goes to that stylist.

What this means for us:

- This fits the backend design (`docs/backend.md` §8.1): the tenant is one Stripe Connect account, with no
  per-provider connected accounts.
- Tips are a new requirement. A tip must be recorded with its stylist (`providerId`) and kept apart from the
  service amount, both in our `Payment` records and in reports ("tips per stylist" for a period, so payroll
  can pay them out). It must not be counted as service revenue, and no platform fee should be taken on it.
- UK context: the Employment (Allocation of Tips) Act 2023 already requires employers to pass on all tips,
  keep a written tipping policy and keep tip records for 3 years. Per-stylist tip records help the salon
  comply with that.

Status (2026-11-22): **tips are done for payments taken in the salon** (bookable-agent). Staff enter a
tip for each stylist when they record a cash or card-machine payment, or add a tip on its own once the booking
is paid. Finances shows total tips, split by cash and card machine, tips per stylist for payroll, and the tip
on each payment, including in the CSV. Tips never count as takings or sales.

Status (2026-11-23): **Stripe card readers are built** (bookable-agent, design §8.8). The owner pairs a reader
on the Payments page, and staff send the amount from a booking. The reader asks for a tip (10 / 12.5 / 15%),
which is shared between the stylists on the booking by the price of their services, into the same per-stylist
tip records. Still to check with a real reader: on-reader tipping in GBP. Online tips are not built yet.

### 2. Payment provider: Stripe

- Stripe for online bookings and deposits **and** for payments in the salon.
- In-salon card payments mean **Stripe Terminal** (a card reader in the salon). That's new scope: the backend
  design currently only lets staff *record* a card-terminal payment by hand (§8.2). Terminal readers can
  ask for a tip on screen, which fits the per-stylist tip requirement.

### 3. Domain: ngcanarywharf.co.uk

- Svetlana registered **ngcanarywharf.co.uk** with **123-reg**, in the name of N&G Canary Wharf Ltd.
  (Her email linked it through a Google redirect URL. The domain itself is `ngcanarywharf.co.uk`.)
- If the liquidator later transfers the old Nicholson & Griffin domain to the company, it will **redirect**
  to ngcanarywharf.co.uk.

To connect it to the site (CloudFront, `infra/site.yml`):

- Preferred: **delegate DNS to Route 53** in the Canary Wharf Salon AWS account. We create a hosted zone and
  send her the four nameservers, and she sets them on the domain in 123-reg. After that we manage everything:
  the ACM certificate validation (us-east-1), the apex and `www` alias records to CloudFront, and later the
  email records (MX/SPF/DKIM/DMARC) for sending booking emails. A CNAME can't be used at the apex
  (`ngcanarywharf.co.uk` without `www`), which is why delegating is simpler than adding records in 123-reg.
- Alternative: she keeps DNS at 123-reg and adds the records we send her (the certificate validation CNAMEs
  and a `www` CNAME to CloudFront), and 123-reg forwards the apex to `www`.
- **Before moving the nameservers**, check whether she uses email on the domain through 123-reg. If she does,
  its MX records have to be copied into Route 53 first.

Status (2026-11-22):

- Decision: delegate to Route 53. The site's canonical host is **`www.ngcanarywharf.co.uk`**, and the apex
  `ngcanarywharf.co.uk` redirects to it.
- Hosted zone created by the `canary-wharf-salon-dns` stack (`infra/dns.yml`, zone `Z01045481U8YIZF1ZRA0E`).
  Nameservers for Svetlana to set in 123-reg:
  `ns-1446.awsdns-52.org`, `ns-335.awsdns-41.com`, `ns-1708.awsdns-21.co.uk`, `ns-990.awsdns-59.net`
- Current DNS at 123-reg (`ns11/ns12.domaincontrol.com`) has only parking A records, with no MX or TXT
  records, so nothing needs copying across.
- Ready to deploy (README, "Custom domain"): the certificate stack (`infra/cert.yml`, us-east-1), and the
  domain, alias records and apex → `www` redirect in `infra/site.yml`. These are waiting for Svetlana to switch
  the nameservers.
- Open: **hello@ngcanarywharf.co.uk, shown on the site, has no mailbox.** The domain has no MX records yet. Ask
  Svetlana which email provider she wants (Google Workspace, Microsoft 365 or 123-reg email), then add its MX
  and SPF records in Route 53.
- Open: when production moves from demo mode to the live booking API, add `https://www.ngcanarywharf.co.uk`
  to the live API key's allowed origins (admin app → Settings → API keys).
