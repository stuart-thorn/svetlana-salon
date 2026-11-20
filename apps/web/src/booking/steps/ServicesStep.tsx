import { formatDuration, formatServicePrice, servicesById, type Catalog, type Service } from "@salon/booking";
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
}

function ServiceCard({ service, selected, hint, onClick }: { service: Service; selected: boolean; hint?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-start justify-between gap-4 rounded-2xl border p-5 text-left transition ${
        selected ? "border-ink ring-1 ring-ink" : "border-line hover:border-gold"
      }`}
    >
      <span className="min-w-0">
        <span className="block font-medium">{service.name}</span>
        <span className="mt-0.5 block text-sm text-muted">
          {hint && <span className="text-gold">{hint} · </span>}
          {formatDuration(service.durationMin)}
        </span>
        {service.description && <span className="mt-2 block text-sm text-muted">{service.description}</span>}
        <span className="mt-3 block font-medium">
          {formatServicePrice(service)}
          {service.deposit && <span className="ml-2 text-xs font-normal text-muted">Deposit online</span>}
        </span>
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
  );
}

export default function ServicesStep({ catalog, stylist, audience, selectedIds, onSelect }: Props) {
  const specific = stylist && stylist !== ANY ? catalog.stylists.find((s) => s.id === stylist) : undefined;
  const offered = catalog.services.filter((s) => !specific || specific.serviceIds.includes(s.id));

  const visible = offered.filter((s) => forAudience(audience, s));

  const draft = { stylist, serviceIds: selectedIds };
  const chosen = servicesById(catalog, selectedIds);
  const addOns = selectedIds.length ? visible.filter((s) => fitsVisit(catalog, draft, s.id)) : [];
  // Mains to start from; with a visit under way, the ones that would replace it.
  const others = visible.filter((s) => s.standalone !== false && !selectedIds.includes(s.id) && !addOns.includes(s));
  const categories = catalog.categories.filter((c) => others.some((s) => s.categoryId === c.id));
  const Heading = chosen.length ? "h3" : "h2";

  return (
    <div>
      {specific && (
        <p className="mb-6 text-sm text-muted">
          Showing services offered by <span className="text-ink">{specific.name}</span>.
        </p>
      )}

      {chosen.length > 0 && (
        <section className="mb-10">
          <h2 className="font-serif text-xl">Your visit</h2>
          <ul className="mt-4 space-y-3">
            {chosen.map((s, i) => (
              <li key={s.id}>
                <ServiceCard service={s} selected hint={i > 0 ? "Add-on" : undefined} onClick={() => onSelect(s.id)} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {addOns.length > 0 && (
        <section className="mb-10">
          <h2 className="font-serif text-xl">Add to your visit</h2>
          <ul className="mt-4 space-y-3">
            {addOns.map((s) => (
              <li key={s.id}>
                <ServiceCard service={s} selected={false} onClick={() => onSelect(s.id)} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {categories.length > 0 && (
        <>
          {chosen.length > 0 && (
            <div className="mb-2">
              <h2 className="font-serif text-xl">Or choose a different service</h2>
              <p className="mt-1 text-sm text-muted">These can't be combined with your visit, so choosing one replaces it.</p>
            </div>
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
                <Heading className={`font-serif ${chosen.length ? "text-lg" : "text-xl"}`}>{c.name}</Heading>
                <ul className="mt-4 space-y-3">
                  {others
                    .filter((s) => s.categoryId === c.id)
                    .map((s) => (
                      <li key={s.id}>
                        <ServiceCard service={s} selected={false} onClick={() => onSelect(s.id)} />
                      </li>
                    ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
