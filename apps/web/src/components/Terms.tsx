import { useEffect, type ReactNode } from "react";
import { Link } from "../router";
import { salon } from "../data/content";

/**
 * Booking terms: appointments, deposits, cancelling, memberships and packages. DRAFT for the salon to review
 * (from the "N&G Canary Wharf: Booking terms (draft)" doc): points marked "To confirm" wait on the salon's
 * answers. Shown with a draft banner until agreed; not reviewed by a solicitor.
 */
export default function Terms() {
  useEffect(() => {
    document.title = `Booking terms | ${salon.name}`;
  }, []);

  const h2 = "mt-10 mb-3 font-serif text-2xl";
  const list = "list-disc space-y-2 pl-5";
  const th = "border-b border-line py-2 pr-4 text-left font-medium";
  const td = "border-b border-line py-2 pr-4 align-top";
  return (
    <article className="mx-auto max-w-2xl px-4 py-12 leading-relaxed text-ink sm:px-6">
      <p className="text-sm">
        <Link to="/" className="text-muted underline underline-offset-2 hover:text-gold">
          ← {salon.name}
        </Link>
      </p>
      <h1 className="mt-6 font-serif text-4xl">Booking terms</h1>
      <p className="mt-4 rounded-xl border border-gold bg-white px-4 py-3 text-sm">
        <span className="font-medium">Draft for review.</span> These terms aren't in force yet. Points marked <ToConfirm /> are still being
        decided.
      </p>

      <h2 className={h2}>1. About us</h2>
      <p>
        These terms apply when you book an appointment or buy a membership, package or product from {salon.company.name} ("we", "us"), a
        company registered in England and Wales, company number {salon.company.number}, registered office {salon.company.registeredOffice}.
      </p>
      <p className="mt-3">
        Our salon is on the Mezzanine Floor, Unit 38C, Jubilee Place, Canary Wharf, London E14 5NY. You can reach us on{" "}
        <a href={`tel:${salon.phone.replace(/\s/g, "")}`} className="underline underline-offset-2 hover:text-gold">
          {salon.phone}
        </a>{" "}
        or{" "}
        <a href={`mailto:${salon.email}`} className="underline underline-offset-2 hover:text-gold">
          {salon.email}
        </a>
        .
      </p>

      <h2 className={h2}>2. Prices</h2>
      <ul className={list}>
        <li>Prices are shown on our website and in the salon, in pounds and including VAT where it applies.</li>
        <li>
          A "from" price is the starting price. The final price depends on your hair's length and thickness and the time needed, and your
          stylist agrees it with you before starting.
        </li>
        <li>All our stylists work at the same prices.</li>
        <li>
          Extra work or products not in the service you booked (for example toner or a treatment) are agreed with you first and paid in the
          salon.
        </li>
      </ul>

      <h2 className={h2}>3. Booking</h2>
      <ul className={list}>
        <li>You can book online, by phone or in the salon. Walk-ins are welcome when we have space.</li>
        <li>
          A booking is made in the name and email of the person booking and paying (the account holder). You can book for your children; we
          only keep your details, not theirs.
        </li>
        <li>Children under 16 must be accompanied by a parent or guardian during their appointment.</li>
        <li>
          We email you a confirmation with a link to change or cancel your booking. Please check the details and tell us straight away if
          anything is wrong.
        </li>
        <li>
          If you sign in with your email when booking, any membership visits you hold are used automatically for the services they cover.
        </li>
      </ul>

      <h2 className={h2}>4. Deposits</h2>
      <ul className={list}>
        <li>
          Colour, highlights, balayage and Nanoplasty need a deposit when you book online: 50% of the starting price.{" "}
          <ToConfirm what="exactly which services" />
        </li>
        <li>The rest, and anything agreed at your appointment, is paid in the salon.</li>
        <li>Your booking is held for 10 minutes while you pay the deposit, and confirmed once it has gone through.</li>
        <li>Other services are paid in full in the salon.</li>
      </ul>

      <h2 className={h2} id="cancelling">
        5. Changing or cancelling your appointment
      </h2>
      <p>
        You can change or cancel free of charge up to 24 hours before your appointment, online (with the link in your confirmation email) or
        by phone. <ToConfirm what="notice period" />
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className={th}>When</th>
              <th className={th}>Your deposit</th>
              <th className={th}>Membership visit</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={td}>Cancelled 24 hours or more before</td>
              <td className={td}>Refunded in full to your card (usually 5–10 working days)</td>
              <td className={td}>Given back</td>
            </tr>
            <tr>
              <td className={td}>Changed 24 hours or more before</td>
              <td className={td}>Moves to the new appointment</td>
              <td className={td}>Moves to the new appointment</td>
            </tr>
            <tr>
              <td className={td}>Cancelled less than 24 hours before</td>
              <td className={td}>
                Kept <ToConfirm />
              </td>
              <td className={td}>
                Used <ToConfirm />
              </td>
            </tr>
            <tr>
              <td className={td}>Not attended (no-show)</td>
              <td className={td}>
                Kept <ToConfirm />
              </td>
              <td className={td}>
                Used <ToConfirm />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <ul className={`${list} mt-4`}>
        <li>
          Within 24 hours, please call us to change your appointment; we'll help if we can. <ToConfirm />
        </li>
        <li>
          If you arrive more than 15 minutes late, we may shorten your service or treat it as a missed appointment.{" "}
          <ToConfirm what="minutes" />
        </li>
      </ul>

      <h2 className={h2}>6. Patch tests</h2>
      <ul className={list}>
        <li>
          Colour services need a skin patch test at least 24 hours (ideally 48 hours) before your appointment, to check for an allergic
          reaction. The test is free.
        </li>
        <li>
          If you have had colour with us before and need an appointment sooner, you may sign a form confirming you accept the risk. We can
          refuse if we think it isn't safe.
        </li>
        <li>
          If you haven't had a patch test and won't sign the form, we won't carry out the colour. We'll offer you another time or refund
          your deposit. <ToConfirm />
        </li>
        <li>Please tell us about any allergies, skin or scalp conditions, or reactions you have had before.</li>
      </ul>

      <h2 className={h2} id="memberships">
        7. Memberships and packages
      </h2>
      <p>Memberships and packages are paid in full when you buy them. Nothing renews automatically and there is no Direct Debit.</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className={th}></th>
              <th className={th}>Includes</th>
              <th className={th}>Valid for</th>
              <th className={th}>Price</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Junior membership", "3 full haircuts + 2 back & sides", "3 months", "£162"],
              ["Executive membership", "6 full haircuts + 4 back & sides", "6 months", "£306"],
              ["Founder membership", "12 full haircuts + 8 back & sides", "12 months", "£576"],
              ["Blow-dry package", "5 blow-dries (4 + 1 free)", "No expiry", "£180"],
            ].map(([name, includes, term, price]) => (
              <tr key={name}>
                <td className={`${td} font-medium`}>{name}</td>
                <td className={td}>{includes}</td>
                <td className={td}>{term}</td>
                <td className={td}>{price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className={`${list} mt-4`}>
        <li>Men's memberships cover men's full haircuts and back &amp; sides only, not other services.</li>
        <li>Visits must be used within the membership's term. Visits not used by the end of it expire.</li>
        <li>
          A membership or package is for the person who bought it and can't be transferred or exchanged for cash. <ToConfirm />
        </li>
        <li>A visit is used when you book a covered service while signed in, or when we apply it in the salon.</li>
        <li>
          <span className="font-medium">Your right to cancel:</span> if you buy online, you can cancel within 14 days of buying. We refund
          you in full, less the value at our usual prices of any visits you used in that time.
        </li>
        <li>
          After 14 days, we don't refund unused visits, unless we can't provide the service. <ToConfirm />
        </li>
      </ul>

      <h2 className={h2}>8. Offers</h2>
      <ul className={list}>
        <li>
          <span className="font-medium">Student offer:</span> 10% off haircuts Monday to Friday, 2pm to 5pm, with a valid student ID shown
          in the salon.
        </li>
        <li>
          <span className="font-medium">Family Visit:</span> 15% off haircuts and blow-dries when 3 or more family members have them on the
          same day. Not colour or technical services.
        </li>
        <li>
          Offers can't be combined with each other or with memberships, and can't be applied to past bookings. Only one reduction applies to
          each service: the larger one.
        </li>
        <li>We may change or end an offer, but we'll honour it for appointments already booked with it.</li>
      </ul>

      <h2 className={h2}>9. If we need to cancel</h2>
      <p>
        If we have to cancel or move your appointment (for example if your stylist is ill), we'll tell you as soon as we can. You can choose
        a new time or a full refund of anything you paid, and any membership visit is given back. <ToConfirm />
      </p>

      <h2 className={h2}>10. Your hair, allergies and our responsibility</h2>
      <ul className={list}>
        <li>
          We carry out every service with reasonable care and skill. Results depend on your hair's condition and history, so we can't
          promise an exact result, especially with colour and smoothing.
        </li>
        <li>
          Please tell us about previous colour, treatments, allergies and medical conditions. We may decline or change a service if we think
          it could harm your hair or skin.
        </li>
        <li>
          Nothing in these terms limits our responsibility for death or personal injury caused by our negligence, or anything else the law
          doesn't allow us to limit.
        </li>
      </ul>

      <h2 className={h2}>11. Complaints</h2>
      <p>
        If you're not happy with a service, please tell us in the salon or within 7 days by phone or email, so we can put it right. We'll
        usually offer to redo or adjust the service free of charge first. <ToConfirm what="time limit and approach" /> This doesn't affect
        your legal rights.
      </p>

      <h2 className={h2}>12. Your data and the law</h2>
      <ul className={list}>
        <li>
          How we use your details is explained in our{" "}
          <Link to="/privacy" className="underline underline-offset-2 hover:text-gold">
            Privacy notice
          </Link>
          .
        </li>
        <li>We may update these terms. The version on our website when you book or buy applies to that booking or purchase.</li>
        <li>
          These terms are governed by the law of England and Wales, and the courts of England and Wales can hear any dispute. If you live
          elsewhere in the UK, you can also bring a claim where you live.
        </li>
      </ul>
    </article>
  );
}

/** A point still to be agreed with the salon, highlighted while the terms are a draft. */
function ToConfirm({ what }: { what?: ReactNode }) {
  return (
    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium whitespace-nowrap text-amber-900">
      To confirm{what ? `: ${what}` : ""}
    </span>
  );
}
