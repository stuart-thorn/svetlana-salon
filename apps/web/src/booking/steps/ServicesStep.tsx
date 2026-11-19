import { eligibleStylists, formatDuration, formatPrice, type Catalog } from "@salon/booking";
import { ANY } from "../state";
import { Check, Plus } from "../ui";

interface Props {
  catalog: Catalog;
  stylist: string | null;
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export default function ServicesStep({ catalog, stylist, selectedIds, onToggle }: Props) {
  const specific = stylist && stylist !== ANY ? catalog.stylists.find((s) => s.id === stylist) : undefined;
  const visible = catalog.services.filter((s) => !specific || specific.serviceIds.includes(s.id));
  const categories = catalog.categories.filter((c) => visible.some((s) => s.categoryId === c.id));

  // With "any professional", every chosen service must still be doable by one person.
  const isCompatible = (id: string) =>
    selectedIds.includes(id) || eligibleStylists(catalog, [...selectedIds, id]).length > 0;

  return (
    <div>
      {specific && (
        <p className="mb-6 text-sm text-muted">
          Showing services offered by <span className="text-ink">{specific.name}</span>.
        </p>
      )}

      <nav aria-label="Service categories" className="sticky top-16 z-10 -mx-4 mb-6 bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:px-0">
        <ul className="flex gap-2 overflow-x-auto">
          {categories.map((c) => (
            <li key={c.id}>
              <a
                href={`#cat-${c.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(`cat-${c.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="block rounded-full border border-line px-4 py-2 text-sm whitespace-nowrap transition-colors hover:border-gold hover:text-gold"
              >
                {c.name}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-10">
        {categories.map((c) => (
          <section key={c.id} id={`cat-${c.id}`} className="scroll-mt-32">
            <h2 className="font-serif text-xl">{c.name}</h2>
            <ul className="mt-4 space-y-3">
              {visible
                .filter((s) => s.categoryId === c.id)
                .map((s) => {
                  const selected = selectedIds.includes(s.id);
                  const compatible = isCompatible(s.id);
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => onToggle(s.id)}
                        disabled={!compatible}
                        aria-pressed={selected}
                        className={`flex w-full items-start justify-between gap-4 rounded-2xl border p-5 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          selected ? "border-ink ring-1 ring-ink" : "border-line enabled:hover:border-gold"
                        }`}
                      >
                        <span className="min-w-0">
                          <span className="block font-medium">{s.name}</span>
                          <span className="mt-0.5 block text-sm text-muted">{formatDuration(s.durationMin)}</span>
                          {s.description && <span className="mt-2 block text-sm text-muted">{s.description}</span>}
                          {!compatible && (
                            <span className="mt-2 block text-xs text-muted">
                              No single professional offers this with your current selection.
                            </span>
                          )}
                          <span className="mt-3 block font-medium">{formatPrice(s.price)}</span>
                        </span>
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                            selected ? "bg-ink text-white" : "bg-stone-100 text-ink"
                          }`}
                          aria-hidden
                        >
                          {selected ? <Check /> : <Plus />}
                        </span>
                      </button>
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
