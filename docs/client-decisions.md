# Client decisions

Decisions and clarifications from Svetlana (N&G Canary Wharf Ltd), newest first.

## 2026-11-26: toddler and children's haircuts, patch test, terms, email

- **Toddler haircut.** 18 months to 4, only with Svetlana, 15–20 minutes (booked as 20). The final price is
  agreed in the salon once she has seen the child. She asked for a £10 deposit: we kept one rule (50% of the price
  on every online booking) and asked for the toddler cut's lowest full price; it shows £30 until then (ours).
- **Boys' and girls' haircuts.** 30 minutes each.
- **Patch test.** Mandatory for first-time colour clients: a free patch test first (call, come in, or book the
  Colour consultation & patch test online), with the colour at least 24 hours after it. Colour clients she knows
  sign a waiver instead. Neither: no colour, any deposit refunded. The booking system now enforces it: colour
  online needs a signed-in customer with a patch test (or a consultation booked) 24 hours before, or a waiver,
  recorded by staff. A colour service, once chosen, says where the customer stands from what they have on record
  (`needsFirst`, `/me` records): their options when nothing counts (book the free consultation first, sign in,
  call), the earliest time when a patch test is under 24 hours old or still to come, or that they're all set.
  A refused booking goes back to that note.
- **Terms complete.** §6 patch tests, §7 refunds after 14 days (none for unused visits unless we can't provide
  the service; emergencies case by case), §9 if we cancel (a new time, ideally within 10 days, or a full refund;
  visits credited back). No "To confirm" left; still a draft until a solicitor reviews it.
- **Email.** Google Workspace for info@ngcanarywharf.co.uk. `infra/dns.yml` has its MX and SPF records behind
  `GoogleWorkspace=true`, for when the mailbox exists; DKIM comes from her Google admin console.
- **Student offer.** Haircuts only, not colour or other services (as built).

Still open with Svetlana: the toddler haircut's lowest full price, her full price list, the logo, her own working
days and services.

## 2026-11-24 (second batch): blue buttons, walk-ins, children, hair types, blow-dry, terms

- **Brand.** The royal blue is the signature accent: the booking buttons ("Book now", "Book an appointment" and
  the booking steps) are the logo blue `#1e4687`, slightly lighter `#2d5ba7` on hover.
- **Deposits and walk-ins.** 50% deposit on every online booking, except membership/package visits and walk-ins
  when there's a free slot. Walk-ins aren't guaranteed, especially at lunchtime and in the evening; booking ahead,
  even the same day, is recommended. Membership and package visits still need booking (no deposit).
- **Children.** Children's prices up to 12; from 13, adult prices (hair type and time). Boys' haircut £30, girls'
  haircut from £40. Svetlana takes children from 18 months (the toddler haircut, only with her); the other
  stylists from about 4–5, once they can sit on their own. Svetlana is now on the demo team (Mon–Fri, assumed).
- **Hair types.** Not mainly Asian hair: all hair types and modern precision techniques across the team (razor
  cutting, texturing, thinning, chopping). Replaces the positioning line of 23 Nov.
- **Blow-dry.** £50, any length or style, premium products.
- **Blow-dry package.** 4 blow-dries paid upfront for £180 (save £20 on 4 at £50), valid 1 month, a few days'
  flexibility at the salon's discretion (staff can move the end date). No free 5th, no "no expiry".
- **Terms confirmed.** Late arrival limit 10 minutes (let us know early); complaints within 7 days; late cancel
  or no-show within 24 hours: deposit kept / membership visit used; memberships and packages non-transferable
  and not for cash. Still marked "To confirm": patch-test refusal, refunds after 14 days, the salon cancelling.

Toddler haircut length, girls' haircut length and the remaining terms: answered on 26 Nov (above).

## 2026-11-24: hours, Instagram, memberships, deposits, menu, Family Visit, brand

Svetlana's answers to the open questions. Full mapping in bookable-agent's `docs/clients/ng-canary-wharf.md`.

- **Weekends.** Sat–Sun 10:00–18:00 stand ("Open 7 days" stays).
- **Instagram.** @ng_canarywharf, linked from Contact.
- **Back & sides.** "Full haircut" is the Men's standard cut (£40); "back & sides" is the Graded cut / clean-up
  (£30), used between full cuts by skin fade clients.
- **Memberships** become four **clubs** (Junior, Executive and Founder are dropped). One upfront payment, a
  fixed term, no renewal or Direct Debit, visits tracked with the last (free) visit shown clearly:
  - Skin Fade Club, 3 months: 2 skin fades + 2 back & sides + a 5th back & sides free, £150 (worth £180)
  - Classic Club, 3 months: 5 men's haircuts (5th free), £170 (worth £200)
  - Exclusive Club, 6 months: 6 men's haircuts (6th free), £190 (worth £240)
  - Premium Club, 12 months: 13 men's haircuts (13th free), £420 (worth £520)

  Sold in the salon first; online buying later. (Which visit is "free" in Classic, Exclusive and Premium is
  our presentation: she asked for the final/bonus visit to be shown clearly.)
- **Deposit.** 50% on **every** online booking (not only colour). Not on bookings made in the salon or by
  phone, nor on membership/package visits.
- **Menu.** The old site prices are replaced by her updated price list (her business plan is coming). Colour
  for now: Roots colour from £70, Full head colour from £95. T-section, half and full head highlights are off
  the menu until then, and so are the buzz cut and beard trim (prices never confirmed by her).
- **Deep treatment** can be added to a cut, blow-dry or colour in the same visit.
- **Family Visit.** 15% off haircuts and blow-dries for 3 or more family members on the same day (not colour);
  trusted, confirmed on the day; the larger discount applies, never both. Applied by staff at the desk.
- **Walk-ins.** Always welcome; online shows available times, nothing held back.
- **Late opening (to 20:00).** She decides the days (often Thu/Fri, Christmas) and tells us ahead; staff open
  those slots as extra hours in the admin app.
- **Brand.** Vibrant royal blue accents to match the coming logo (the site's gold accent is now the logo's royal blue,
  `#1e4687`). Logo received 24 Nov (a screenshot; a transparent PNG or SVG is needed to put it on the site).

Still open with Svetlana: her full price list, the logo, the email provider, the cancellation/terms points,
which services the student offer covers (blow-dry price and package settled in the second batch).

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
