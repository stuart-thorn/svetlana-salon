import type { Catalog } from "@salon/booking";
import { ANY, servesAudience } from "../state";
import { Avatar, Check } from "../ui";

interface Props {
  catalog: Catalog;
  /** Only professionals who offer something to this audience are listed. */
  audience: string | null;
  selected: string | null;
  onSelect: (stylist: string) => void;
}

export default function ProfessionalStep({ catalog, audience, selected, onSelect }: Props) {
  const options = [
    { id: ANY, name: "Any professional", role: "For maximum availability", index: 0, stylist: undefined },
    ...catalog.stylists
      .map((s, index) => ({ id: s.id, name: s.name, role: s.role, index, stylist: s }))
      .filter((o) => servesAudience(catalog, o.id, audience)),
  ];

  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {options.map((o) => {
        const isSelected = selected === o.id;
        return (
          <li key={o.id}>
            <button
              type="button"
              onClick={() => onSelect(o.id)}
              aria-pressed={isSelected}
              className={`relative flex h-full w-full flex-col items-center gap-3 rounded-2xl border px-4 py-6 text-center transition hover:border-gold hover:shadow-sm ${
                isSelected ? "border-ink ring-1 ring-ink" : "border-line"
              }`}
            >
              {isSelected && (
                <span className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-white">
                  <Check size={14} />
                </span>
              )}
              <Avatar stylist={o.stylist} index={o.index} size="lg" />
              <span>
                <span className="block font-medium">{o.name}</span>
                <span className="block text-sm text-muted">{o.role}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
