import { useState } from "react";
import {
  formatDuration,
  formatPrice,
  formatServicePrice,
  minutesToTime,
  servicesById,
  timeToMinutes,
  totals,
  withMembershipVisits,
  type Catalog,
  type MembershipSummary,
} from "@salon/booking";
import { salon } from "../data/content";
import { ANY, type Draft } from "./state";
import { Avatar, Spinner, formatLongDate } from "./ui";

export interface CartAction {
  label: string;
  disabled: boolean;
  busy?: boolean;
  /** Submit a form by id instead of calling onClick. */
  form?: string;
  onClick?: () => void;
}

function ActionButton({ action, className = "" }: { action: CartAction; className?: string }) {
  return (
    <button
      type={action.form ? "submit" : "button"}
      form={action.form}
      onClick={action.form ? undefined : action.onClick}
      disabled={action.disabled || action.busy}
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-gold disabled:cursor-not-allowed disabled:bg-stone-300 ${className}`}
    >
      {action.busy && <Spinner />}
      {action.label}
    </button>
  );
}

function CartBody({ catalog, draft, memberships }: { catalog: Catalog; draft: Draft; memberships?: MembershipSummary[] }) {
  const services = withMembershipVisits(servicesById(catalog, draft.serviceIds), memberships);
  const { durationMin, price } = totals(services);
  const stylistIndex = catalog.stylists.findIndex((s) => s.id === draft.stylist);
  const stylist = catalog.stylists[stylistIndex];

  return (
    <>
      <div className="border-b border-line pb-5">
        <p className="font-serif text-lg">{catalog.salonName}</p>
        <p className="text-xs text-muted">{salon.address.join(", ")}</p>
      </div>

      {draft.stylist && (
        <div className="flex items-center gap-3 border-b border-line py-4">
          <Avatar stylist={stylist} index={stylistIndex} size="sm" />
          <div className="text-sm">
            <p className="font-medium">{draft.stylist === ANY ? "Any professional" : stylist?.name}</p>
            <p className="text-xs text-muted">{draft.stylist === ANY ? "Assigned on confirmation" : stylist?.role}</p>
          </div>
        </div>
      )}

      {draft.date && (
        <div className="flex items-start gap-3 border-b border-line py-4 text-sm">
          <span className="mt-0.5 text-muted" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="3.5" y="5" width="17" height="15" rx="2" />
              <path d="M3.5 10h17M8 3v4M16 3v4" />
            </svg>
          </span>
          <div>
            <p className="font-medium">{formatLongDate(draft.date)}</p>
            {draft.time && (
              <p className="text-xs text-muted">
                {draft.time} – {minutesToTime(timeToMinutes(draft.time) + durationMin)} ({formatDuration(durationMin)})
              </p>
            )}
          </div>
        </div>
      )}

      <div className="py-4">
        {services.length === 0 ? (
          <p className="text-sm text-muted">No services selected</p>
        ) : (
          <ul className="space-y-3">
            {services.map((s, i) => (
              <li key={s.id} className="flex justify-between gap-4 text-sm">
                <div>
                  <p>{s.name}</p>
                  <p className="text-xs text-muted">
                    {i > 0 && "Add-on · "}
                    {formatDuration(s.durationMin)}
                  </p>
                  {s.included && (
                    <p className="text-xs text-gold-dark">
                      Included in your {s.included.membershipName} ({s.included.label})
                    </p>
                  )}
                </div>
                <p className="shrink-0">{s.included ? "Included" : formatServicePrice(s)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-baseline justify-between border-t border-line pt-4">
        <p className="font-medium">Total</p>
        <p className="text-lg font-medium">{services.length ? (price === 0 ? formatPrice(0) : `${services.some((s) => s.priceFrom) ? "from " : ""}${formatPrice(price)}`) : "Free"}</p>
      </div>
    </>
  );
}

/** Desktop: sticky side panel. */
export function CartPanel({ catalog, draft, action, memberships }: { catalog: Catalog; draft: Draft; action?: CartAction; memberships?: MembershipSummary[] }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
      <CartBody catalog={catalog} draft={draft} memberships={memberships} />
      {action && <ActionButton action={action} className="mt-6 w-full" />}
    </div>
  );
}

/** Mobile: fixed bottom bar with an expandable summary. */
export function CartBar({ catalog, draft, action, memberships }: { catalog: Catalog; draft: Draft; action?: CartAction; memberships?: MembershipSummary[] }) {
  const [open, setOpen] = useState(false);
  const services = withMembershipVisits(servicesById(catalog, draft.serviceIds), memberships);
  const { durationMin, price } = totals(services);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
      {open && (
        <div className="max-h-[60vh] overflow-y-auto border-t border-line bg-white px-4 pt-5 pb-2 shadow-[0_-8px_24px_rgba(0,0,0,0.06)]">
          <CartBody catalog={catalog} draft={draft} memberships={memberships} />
        </div>
      )}
      <div className="flex items-center justify-between gap-4 border-t border-line bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="min-w-0 text-left">
          <p className="font-medium">{services.length ? `${services.some((s) => s.priceFrom) ? "from " : ""}${formatPrice(price)}` : "Free"}</p>
          <p className="truncate text-xs text-muted">
            {services.length
              ? `${services.length} service${services.length > 1 ? "s" : ""} · ${formatDuration(durationMin)}`
              : "No services yet"}{" "}
            · <span className="underline underline-offset-2">{open ? "Hide" : "View"} summary</span>
          </p>
        </button>
        {action && <ActionButton action={action} className="shrink-0" />}
      </div>
    </div>
  );
}
