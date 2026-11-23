# Client decisions

Decisions and clarifications from Svetlana (N&G Canary Wharf Ltd), newest first.

## 2026-11-23: contact, hours, menu, offers, company details

Two emails from Svetlana, plus a table of the men's memberships. The full breakdown and the platform gaps are
in bookable-agent's `docs/clients/ng-canary-wharf.md`.

- **Contact.** Phone 020 7512 9890 (being transferred through the liquidator). Email: she wants a mailbox on
  the domain, e.g. **info@ngcanarywharf.co.uk**, on her phone and linked to the POS. The site now shows
  info@ (it replaces hello@). Link Instagram (handle still to come); Google Business Profile later.
- **Address.** Lead with the **Mezzanine Floor**, not the unit number. Directions: main central hall of
  Jubilee Place, behind Café Brera, near Starbucks and Pret, up the escalator from the main walkway; not
  the passage by Wagamama.
- **Hours.** Mon–Fri 08:00–19:00, Thu/Fri possibly to 20:00. Bank holidays usually 11:00–18:00. Longer hours
  over Christmas (to about 20:00/20:30), to be confirmed. Weekends weren't restated, so the site keeps
  Sat–Sun 10:00–18:00 and "Open 7 days" until she confirms.
- **Positioning.** "Family Hair Salon": warm, clear, easy to read. Highlight precision Asian hair styling and
  technical cutting (chopping, texturing, thinning, crops), and cuts from a reference photo.
- **Menu.** One price tier for all stylists. Women's cut & finish from £70 (£70–£90 by length and thickness);
  blow-dry from £40 (to £55); colour / regrowth from £70 (about 30 min applying, then 40–45 min developing);
  balayage from £180 (2.5 h or more); Nanoplasty (organic, formaldehyde-free smoothing) from £250, replacing
  keratin; deep treatment from £40 (to £50, about 30 min); Personalised Hair Design & Cut from £45 men / £75
  women, price agreed in advance.
- **Deposit.** 50% of the "from" price on online bookings. Extra work, toner or product is agreed with the
  client and paid in the salon. Applied to colour, highlights and Nanoplasty (assumed, to confirm).
- **Patch test.** Ideally 48 hours before colour, at least 24 hours. For an urgent booking, a client who has
  had colour before can sign a waiver.
- **Offers.**
  - Blow-dry package: £180 for 4, the 5th free, no expiry.
  - Men's haircut memberships, men's cuts only, one payment upfront (no Direct Debit), unused visits expire at
    the end of the term, Wallet pass with QR check-in:
    Junior 3 months, 5 visits (3 full cuts + 2 back & sides), £162;
    Executive 6 months, 10 visits (6 + 4), £306;
    Founder 12 months, 20 visits (12 + 8), £576.
  - Family Visit: 15% off for 3 or more family members on the same day, not combined with other discounts.
  - Student offer (to highlight): 10% off haircuts Mon–Fri 14:00–17:00 with a valid student ID, not combined
    with other discounts or memberships.
- **Footer.** N&G CANARY WHARF LTD, company number 17349131, registered office 124–128 City Road, London
  EC1V 2NX.
- **Privacy.** Retention agreed: client records 2 years after the last visit, payment records 6 years (the
  privacy page already says this).
- **Domain.** She will switch the 123-reg nameservers to Route 53 when ready to go live.
- **Email.** Still to choose a provider (Google Workspace or Microsoft 365 suit a phone and most POS
  systems). Once chosen, add its MX, SPF, DKIM and DMARC records to `infra/dns.yml`.

Open with Svetlana: weekend hours, the Instagram handle, which menu items are "full haircut" and "back &
sides", which services take a deposit, the unlisted colour services and prices, whether Junior is for
children, and the email provider.

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
- Open: **the email shown on the site (now info@ngcanarywharf.co.uk, 23 Nov) has no mailbox.** The domain has no MX records yet. Ask
  Svetlana which email provider she wants (Google Workspace, Microsoft 365 or 123-reg email), then add its MX
  and SPF records in Route 53.
- Open: when production moves from demo mode to the live booking API, add `https://www.ngcanarywharf.co.uk`
  to the live API key's allowed origins (admin app → Settings → API keys).
