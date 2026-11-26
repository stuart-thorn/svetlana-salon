import type { ReactNode } from "react";
import { needsFirstStatus, type NeedsFirst, type RequirementRecord, type Service } from "@salon/booking";
import { salon } from "../data/content";

const linkClass = "font-medium underline underline-offset-2 hover:text-ink";
const tel = `tel:${salon.phone.replace(/\s/g, "")}`;

/** "Friday 27 November at 21:11", in the salon's time. */
const when = (d: Date) => {
  const zone = { timeZone: "Europe/London" } as const;
  const day = d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", ...zone });
  return `${day} at ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", ...zone })}`;
};

/** "patch test" / "colour waiver": the salon's names, mid-sentence. */
const lower = (name: string) => name.charAt(0).toLowerCase() + name.slice(1);

/**
 * What a chosen service needs first (a patch test before colour), and the customer's way through it, from what
 * they have on record when signed in. The booking API has the last word; this says so before they pick a time.
 */
export function NeedsFirstNote({
  service,
  needs,
  signedIn,
  records,
  signIn,
  bookFirst,
  onBookFirst,
}: {
  service: Service;
  needs: NeedsFirst;
  signedIn: boolean;
  /** The signed-in customer's records; undefined while their profile loads or when not signed in. */
  records: RequirementRecord[] | undefined;
  /** The sign-in form, offered when not signed in. Absent when the site has no sign-in. */
  signIn?: ReactNode;
  /** The service whose booking meets it (the consultation & patch test), when it can be booked here. */
  bookFirst?: Service;
  onBookFirst: () => void;
}) {
  if (signedIn && !records) return null;
  const status = needsFirstStatus(needs, signedIn ? records : undefined);
  const timed = needs.options.find((o) => o.minHoursBefore) ?? needs.options[0]!;
  const others = needs.options.filter((o) => o !== timed);
  const hours = timed.minHoursBefore;
  const test = lower(timed.name);

  if (status.kind === "met") {
    return (
      <div role="note" className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        Your {lower(status.via)} is on record, so you can book {service.name.toLowerCase()}.
      </div>
    );
  }
  if (status.kind === "met_from") {
    return (
      <div role="note" className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {status.at <= new Date() ? (
          <>
            Your {lower(status.via)} was on {when(status.at)}.
          </>
        ) : (
          <>
            Your {lower(status.via)} is booked for {when(status.at)}.
          </>
        )}{" "}
        {service.name} has to be at least {status.hours} hours after it, so the earliest you can book is{" "}
        <strong>{when(status.from)}</strong>. Please choose a day and time from then.
      </div>
    );
  }

  const step = "mt-2 flex gap-2";
  return (
    <div role="note" className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p className="font-medium">
        {service.name} needs a {test} first{hours ? `, at least ${hours} hours before your appointment` : ""}.
      </p>
      {signedIn && (
        <p className="mt-1">
          We don't have a {test}
          {others.map((o) => ` or ${lower(o.name)}`).join("")} on record for you yet.
        </p>
      )}
      <ul>
        {bookFirst && (
          <li className={step}>
            <span aria-hidden>•</span>
            <span>
              <strong>First time?</strong>{" "}
              <button type="button" className={linkClass} onClick={onBookFirst}>
                Book a {bookFirst.name}
              </button>
              {bookFirst.price === 0 && " (free)"} first, then come back and book your {service.name.toLowerCase()}
              {hours ? ` for ${hours} hours or more after it` : ""}.
              {!signedIn && " Sign in when you do, so we know it's you."}
            </span>
          </li>
        )}
        {!signedIn && signIn && (
          <li className={step}>
            <span aria-hidden>•</span>
            <span className="min-w-0 flex-1">
              <strong>Had a {test} with us{others.map((o) => ` or signed a ${lower(o.name)}`).join("")}?</strong> Sign in so we can
              see it.
              <span className="mt-2 block">{signIn}</span>
            </span>
          </li>
        )}
        <li className={step}>
          <span aria-hidden>•</span>
          <span>
            {signedIn ? `Had a ${test} with us${others.map((o) => ` or signed a ${lower(o.name)}`).join("")}, and it's not showing? ` : "Or "}
            <a href={tel} className={linkClass}>
              call us on {salon.phone}
            </a>
            {signedIn ? " and we'll add it." : " and we'll sort it out."}
          </span>
        </li>
      </ul>
    </div>
  );
}
