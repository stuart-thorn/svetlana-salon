import type { Catalog } from "@salon/booking";
import { Link } from "../../router";
import { FAMILY, forAudience } from "../state";
import { Check, Notice } from "../ui";

interface Props {
  catalog: Catalog;
  selected: string | null;
  onSelect: (audience: string) => void;
}

export default function AudienceStep({ catalog, selected, onSelect }: Props) {
  const options = [
    ...catalog.audiences.map((a) => {
      const n = catalog.services.filter((s) => s.standalone !== false && forAudience(a.id, s)).length;
      return { id: a.id, name: a.name, hint: a.description ?? `${n} service${n === 1 ? "" : "s"}` };
    }),
    { id: FAMILY, name: "Family or group", hint: "Several people at the same visit" },
  ];

  return (
    <div className="space-y-6">
      <ul className="grid gap-3 sm:grid-cols-2">
        {options.map((o) => {
          const isSelected = selected === o.id;
          return (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => onSelect(o.id)}
                aria-pressed={isSelected}
                className={`relative flex h-full w-full flex-col gap-1 rounded-2xl border px-5 py-6 text-left transition hover:border-gold hover:shadow-sm ${
                  isSelected ? "border-ink ring-1 ring-ink" : "border-line"
                }`}
              >
                {isSelected && (
                  <span className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-white">
                    <Check size={14} />
                  </span>
                )}
                <span className="font-medium">{o.name}</span>
                {o.hint && <span className="text-sm text-muted">{o.hint}</span>}
              </button>
            </li>
          );
        })}
      </ul>

      <Deals catalog={catalog} />

      {selected === FAMILY && (
        <Notice>
          Booking for more than one person? For now, please book each person's appointment separately, choosing
          the right menu each time. We'll do our best to seat you together.
        </Notice>
      )}
    </div>
  );
}

/** Memberships and packages sold online, as a card under the choices: one tap to the list. */
function Deals({ catalog }: { catalog: Catalog }) {
  const memberships = (catalog.products ?? []).filter((p) => p.kind === "membership");
  if (memberships.length === 0) return null;
  return (
    <Link
      to="/buy?from=book"
      className="flex items-center justify-between gap-4 rounded-2xl border border-gold px-5 py-5 transition hover:shadow-sm"
    >
      <span className="flex flex-col gap-1">
        <span className="text-xs font-medium tracking-[0.2em] text-gold uppercase">Deals</span>
        <span className="font-medium">Memberships and packages</span>
        <span className="text-sm text-muted">Visits paid in advance, for less.</span>
      </span>
      <span aria-hidden className="text-xl text-gold">
        →
      </span>
    </Link>
  );
}
