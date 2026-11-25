import { useState } from "react";
import { formatPrice, formatServicePrice, personLabel, type Catalog, type Offer, type PartyMember, type PartySlot, type PricedService } from "@salon/booking";
import { salon } from "../../data/content";
import { ActionButton, type CartAction, type Deposit } from "../Cart";
import { formatLongDate } from "../ui";

export interface GroupPricing {
  /** Each person's services at their list prices, in the order of `people`. */
  services: PricedService[][];
  savings: { offer: Offer; amount: number }[];
  total: number;
  from: boolean;
  deposit?: Deposit;
}

function Body({ catalog, people, date, slot, pricing }: { catalog: Catalog; people: PartyMember[]; date: string | null; slot: PartySlot | null; pricing: GroupPricing }) {
  const stylistName = (id: string | null | undefined) => (id ? catalog.stylists.find((s) => s.id === id)?.name : undefined);
  return (
    <>
      <div className="border-b border-line pb-5">
        <p className="font-serif text-lg">{catalog.salonName}</p>
        <p className="text-xs text-muted">{salon.address.join(", ")}</p>
      </div>
      {date && (
        <div className="border-b border-line py-4 text-sm">
          <p className="font-medium">{formatLongDate(date)}</p>
          {slot && <p className="text-xs text-muted">From {slot.time}, everyone together</p>}
        </div>
      )}
      <ul className="space-y-4 py-4">
        {people.length === 0 && <li className="text-sm text-muted">No one added yet</li>}
        {people.map((p, i) => {
          const a = slot?.assignments.find((x) => x.ref === p.ref);
          const who = stylistName(a?.stylistId ?? p.stylistId);
          return (
            <li key={p.ref} className="text-sm">
              <p className="font-medium">{personLabel(p, i)}</p>
              {(pricing.services[i] ?? []).length === 0 ? (
                <p className="text-xs text-muted">No services yet</p>
              ) : (
                (pricing.services[i] ?? []).map((s) => (
                  <div key={s.id} className="flex justify-between gap-4">
                    <span>{s.name}</span>
                    <span className="shrink-0">{formatServicePrice(s)}</span>
                  </div>
                ))
              )}
              {(who || a) && (
                <p className="text-xs text-muted">
                  {a ? `${a.time} – ${a.endTime}` : ""}
                  {who ? `${a ? " " : ""}with ${who}` : ""}
                </p>
              )}
            </li>
          );
        })}
      </ul>
      {pricing.savings.map(({ offer, amount }) => (
        <div key={offer.id} className="flex justify-between gap-4 pb-3 text-sm text-accent-dark">
          <p>{offer.name}</p>
          <p className="shrink-0">−{formatPrice(amount)}</p>
        </div>
      ))}
      <div className="flex items-baseline justify-between border-t border-line pt-4">
        <p className="font-medium">Total</p>
        <p className="text-lg font-medium">
          {pricing.from ? "from " : ""}
          {formatPrice(pricing.total)}
        </p>
      </div>
      {pricing.deposit && (
        <dl className="mt-2 space-y-1 text-sm text-muted">
          <div className="flex justify-between gap-4">
            <dt>{pricing.deposit.atSalon > 0 ? "Deposit to pay now" : "To pay now"}</dt>
            <dd>{formatPrice(pricing.deposit.now)}</dd>
          </div>
          {pricing.deposit.atSalon > 0 && (
            <div className="flex justify-between gap-4">
              <dt>To pay in the salon</dt>
              <dd>
                {pricing.from ? "from " : ""}
                {formatPrice(pricing.deposit.atSalon)}
              </dd>
            </div>
          )}
        </dl>
      )}
    </>
  );
}

type Props = { catalog: Catalog; people: PartyMember[]; date: string | null; slot: PartySlot | null; pricing: GroupPricing; action: CartAction };

/** Desktop: sticky side panel. */
export function GroupPanel({ action, ...rest }: Props) {
  return (
    <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
      <Body {...rest} />
      <ActionButton action={action} className="mt-6 w-full" />
    </div>
  );
}

/** Mobile: fixed bottom bar with an expandable summary. */
export function GroupBar({ action, ...rest }: Props) {
  const [open, setOpen] = useState(false);
  const count = rest.pricing.services.flat().length;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
      {open && (
        <div className="max-h-[60vh] overflow-y-auto border-t border-line bg-white px-4 pt-5 pb-2 shadow-[0_-8px_24px_rgba(0,0,0,0.06)]">
          <Body {...rest} />
        </div>
      )}
      <div className="flex items-center justify-between gap-4 border-t border-line bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="min-w-0 text-left">
          <p className="font-medium">
            {rest.pricing.from ? "from " : ""}
            {formatPrice(rest.pricing.total)}
          </p>
          <p className="truncate text-xs text-muted">
            {rest.people.length} {rest.people.length === 1 ? "person" : "people"} · {count} service{count === 1 ? "" : "s"} ·{" "}
            <span className="underline underline-offset-2">{open ? "Hide" : "View"} summary</span>
          </p>
        </button>
        <ActionButton action={action} className="shrink-0" />
      </div>
    </div>
  );
}
