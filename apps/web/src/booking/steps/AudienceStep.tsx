import type { Catalog } from "@salon/booking";
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

      {selected === FAMILY && (
        <Notice>
          Booking for more than one person? For now, please book each person's appointment separately, choosing
          the right menu each time. We'll do our best to seat you together.
        </Notice>
      )}
    </div>
  );
}
