import { useCallback, useState } from "react";
import {
  formatDuration,
  formatPrice,
  formatAtSalon,
  formatLinePrice,
  formatTotal,
  minutesToTime,
  servicesById,
  timeToMinutes,
  totals,
  withMembershipVisits,
  type Catalog,
  type MembershipSummary,
  type Offer,
} from "@salon/booking";
import { salon } from "../data/content";
import { ANY, type Draft } from "./state";
import { Avatar, SummarySheet, Spinner, formatLongDate } from "./ui";

export interface CartAction {
  label: string;
  disabled: boolean;
  busy?: boolean;
  /** Submit a form by id instead of calling onClick. */
  form?: string;
  onClick?: () => void;
}

/** `onPress` runs on every press, before the action (or the form submit), e.g. to close the mobile summary. */
export function ActionButton({ action, className = "", onPress }: { action: CartAction; className?: string; onPress?: () => void }) {
  return (
    <button
      type={action.form ? "submit" : "button"}
      form={action.form}
      onClick={() => {
        onPress?.();
        if (!action.form) action.onClick?.();
      }}
      disabled={action.disabled || action.busy}
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-medium text-white cta-hover disabled:cursor-not-allowed disabled:bg-stone-300 ${className}`}
    >
      {action.busy && <Spinner />}
      {action.label}
    </button>
  );
}

type Savings = { offer: Offer; amount: number }[];

/** What is paid online and what's left to pay in the salon, in pounds. */
export interface Deposit {
  now: number;
  atSalon: number;
  /** A service's price is agreed in the salon: the deposit counts towards it, and `atSalon` leaves it out. */
  agreed?: boolean;
}

function CartBody({
  catalog,
  draft,
  memberships,
  savings = [],
  deposit,
}: {
  catalog: Catalog;
  draft: Draft;
  memberships?: MembershipSummary[];
  savings?: Savings;
  deposit?: Deposit;
}) {
  const services = withMembershipVisits(servicesById(catalog, draft.serviceIds), memberships);
  const { durationMin } = totals(services);
  const price = totals(services).price - savings.reduce((sum, x) => sum + x.amount, 0);
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
                    {s.priceAgreed && !s.included && " · price agreed in the salon"}
                  </p>
                  {s.included && (
                    <p className="text-xs text-accent-dark">
                      Included in your {s.included.membershipName} ({s.included.label})
                    </p>
                  )}
                </div>
                <p className="shrink-0">{s.included ? "Included" : formatLinePrice(s)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {savings.map(({ offer, amount }) => (
        <div key={offer.id} className="flex justify-between gap-4 pb-3 text-sm text-accent-dark">
          <p>{offer.name}</p>
          <p className="shrink-0">−{formatPrice(amount)}</p>
        </div>
      ))}

      <div className="flex items-baseline justify-between border-t border-line pt-4">
        <p className="font-medium">Total</p>
        <p className="text-right text-lg font-medium">{services.length ? (price === 0 && !services.some((s) => s.priceAgreed) ? formatPrice(0) : formatTotal(price, services)) : "Free"}</p>
      </div>
      {deposit && (
        <dl className="mt-2 space-y-1 text-sm text-muted">
          <div className="flex justify-between gap-4">
            <dt>{deposit.atSalon > 0 || services.some((s) => s.priceAgreed) ? "Deposit to pay now" : "To pay now"}</dt>
            <dd>{formatPrice(deposit.now)}</dd>
          </div>
          {(deposit.atSalon > 0 || services.some((s) => s.priceAgreed)) && (
            <div className="flex justify-between gap-4">
              <dt className="shrink-0">To pay in the salon</dt>
              <dd className="text-right">{formatAtSalon(deposit.atSalon, services)}</dd>
            </div>
          )}
        </dl>
      )}
    </>
  );
}

/** Desktop: sticky side panel. */
export function CartPanel({
  catalog,
  draft,
  action,
  memberships,
  savings,
  deposit,
}: {
  catalog: Catalog;
  draft: Draft;
  action?: CartAction;
  memberships?: MembershipSummary[];
  savings?: Savings;
  deposit?: Deposit;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
      <CartBody catalog={catalog} draft={draft} memberships={memberships} savings={savings} deposit={deposit} />
      {action && <ActionButton action={action} className="mt-6 w-full" />}
    </div>
  );
}

/** Mobile: fixed bottom bar with an expandable summary. */
export function CartBar({
  catalog,
  draft,
  action,
  memberships,
  savings = [],
  deposit,
}: {
  catalog: Catalog;
  draft: Draft;
  action?: CartAction;
  memberships?: MembershipSummary[];
  savings?: Savings;
  deposit?: Deposit;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const services = withMembershipVisits(servicesById(catalog, draft.serviceIds), memberships);
  const { durationMin } = totals(services);
  const price = totals(services).price - savings.reduce((sum, x) => sum + x.amount, 0);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
      <SummarySheet open={open} onClose={close}>
        <CartBody catalog={catalog} draft={draft} memberships={memberships} savings={savings} deposit={deposit} />
      </SummarySheet>
      <div className="relative flex items-center justify-between gap-4 border-t border-line bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="min-w-0 text-left">
          <p className="font-medium">{services.length ? formatTotal(price, services) : "Free"}</p>
          <p className="truncate text-xs text-muted">
            {services.length
              ? `${services.length} service${services.length > 1 ? "s" : ""} · ${formatDuration(durationMin)}`
              : "No services yet"}{" "}
            · <span className="underline underline-offset-2">{open ? "Hide" : "View"} summary</span>
          </p>
        </button>
        {action && <ActionButton action={action} onPress={close} className="shrink-0" />}
      </div>
    </div>
  );
}
