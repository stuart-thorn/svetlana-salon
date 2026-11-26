import type { ReactNode } from "react";
import { formatDuration, formatServicePrice, type Catalog, type RequirementRecord, type Service } from "@salon/booking";
import { NeedsFirstNote } from "../NeedsFirstNote";
import { ANY, fitsVisit, forAudience } from "../state";
import { Check, Plus } from "../ui";

interface Props {
  catalog: Catalog;
  stylist: string | null;
  /** Chosen on the first step; filters the menu. */
  audience: string | null;
  /** The visit so far, main first. */
  selectedIds: string[];
  onSelect: (id: string) => void;
  /** Services the signed-in customer's memberships still have visits for. */
  includedIds?: ReadonlySet<string>;
  /** Signed in: what they have on record (a patch test, a waiver), once their profile has loaded. */
  signedIn: boolean;
  records?: RequirementRecord[];
  /** The sign-in form, for a service that needs something only a signed-in customer's records can show. */
  signIn?: ReactNode;
}

/**
 * `chosen` is in the visit (tap to remove), `add` can join it, `unavailable` can't be combined with what's chosen
 * (or is an add-on with nothing to add it to) and can't be tapped until the visit changes.
 */
export type CardState = "chosen" | "add" | "unavailable";

const STATE_WORDS: Record<CardState, string> = {
  chosen: "in your visit",
  add: "add to your visit",
  unavailable: "can't be combined with your visit",
};

export function ServiceCard({ service, state, addOn, included, onClick }: { service: Service; state: CardState; addOn: boolean; included: boolean; onClick: () => void }) {
  const chosen = state === "chosen";
  const off = state === "unavailable";
  const meta = [
    addOn ? "Add-on" : undefined,
    formatDuration(service.durationMin),
    included ? "Included in your membership" : formatServicePrice(service),
    !included && service.deposit && service.price > 0 && !service.priceAgreed ? "Deposit online" : undefined,
  ].filter(Boolean);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state === "unavailable"}
      aria-pressed={chosen}
      aria-label={`${service.name}, ${formatDuration(service.durationMin)}, ${formatServicePrice(service)}, ${STATE_WORDS[state]}`}
      className={`flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left transition ${
        chosen ? "border-ink ring-1 ring-ink" : "border-line enabled:hover:border-accent"
      } ${off ? "bg-stone-50 opacity-40" : ""} disabled:cursor-not-allowed`}
    >
      <span className="min-w-0">
        <span className="block font-medium">{service.name}</span>
        <span className="mt-0.5 block text-sm text-muted">{meta.join(" · ")}</span>
        {service.description && <span className={`mt-1 text-sm text-muted ${chosen ? "block" : "line-clamp-1"}`}>{service.description}</span>}
      </span>
      {!off && (
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
            chosen ? "bg-ink text-white" : "bg-stone-100 text-ink"
          }`}
          aria-hidden
        >
          {chosen ? <Check /> : <Plus />}
        </span>
      )}
    </button>
  );
}

export default function ServicesStep({ catalog, stylist, audience, selectedIds, onSelect, includedIds, signedIn, records, signIn }: Props) {
  const specific = stylist && stylist !== ANY ? catalog.stylists.find((s) => s.id === stylist) : undefined;
  const visible = catalog.services.filter((s) => (!specific || specific.serviceIds.includes(s.id)) && forAudience(audience, s));

  const draft = { stylist, serviceIds: selectedIds };
  const stateOf = (s: Service): CardState => {
    if (selectedIds.includes(s.id)) return "chosen";
    if (!selectedIds.length) return s.standalone === false ? "unavailable" : "add";
    return fitsVisit(catalog, draft, s.id) ? "add" : "unavailable";
  };

  return (
    <div>
      {specific && (
        <p className="mb-4 text-sm text-muted">
          Showing services offered by <span className="text-ink">{specific.name}</span>.
        </p>
      )}

      {/* Always one line here, so choosing a service doesn't move the list. */}
      <p className="mb-4 min-h-5 text-sm text-muted">
        {selectedIds.length > 0 ? (
          "Greyed out: can't be combined with your choice."
        ) : (
          "Choose a service, then we'll show what you can add to it."
        )}
      </p>

      <ul className="space-y-2">
        {visible.map((s, i) => {
          const newGroup = i > 0 && s.categoryId !== visible[i - 1]!.categoryId;
          return (
            <li key={s.id} className={newGroup ? "mt-1 border-t border-line pt-3" : undefined}>
              <ServiceCard
                service={s}
                state={stateOf(s)}
                addOn={selectedIds.indexOf(s.id) > 0 || (s.standalone === false && !selectedIds.includes(s.id))}
                included={includedIds?.has(s.id) ?? false}
                onClick={() => onSelect(s.id)}
              />
              {s.needsFirst && selectedIds.includes(s.id) && (
                <NeedsFirstNote
                  service={s}
                  needs={s.needsFirst}
                  signedIn={signedIn}
                  records={records}
                  signIn={signIn}
                  bookFirst={visible.find((v) => s.needsFirst!.bookServiceIds.includes(v.id))}
                  onBookFirst={() => onSelect(s.needsFirst!.bookServiceIds.find((id) => visible.some((v) => v.id === id))!)}
                />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
