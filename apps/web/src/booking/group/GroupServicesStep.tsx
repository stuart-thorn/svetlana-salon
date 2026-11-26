import { canAdd, eligibleStylists, personLabel, servicesFor, type Catalog, type PartyMember, type Service } from "@salon/booking";
import { ServiceCard, type CardState } from "../steps/ServicesStep";
import { salon } from "../../data/content";

interface Props {
  catalog: Catalog;
  people: PartyMember[];
  onToggle: (ref: string, serviceId: string) => void;
}

/**
 * Each person's own list: only what suits their menu and age (a toddler sees the toddler cut, children see no
 * colour), built into one visit each as on the one-person menu.
 */
export default function GroupServicesStep({ catalog, people, onToggle }: Props) {
  return (
    <div className="space-y-10">
      <p className="text-sm text-muted">
        A group booking is priced as a group: memberships, prepaid visits and other offers can't be used on it. To use them, book
        that person on their own.
      </p>
      {people.map((p, i) => {
        const audience = catalog.audiences.find((a) => a.id === p.audienceId);
        const visible = servicesFor(catalog, p).filter((s) => eligibleStylists(catalog, [s.id]).length > 0);
        const stateOf = (s: Service): CardState => {
          if (p.serviceIds.includes(s.id)) return "chosen";
          if (!p.serviceIds.length) return s.standalone === false ? "unavailable" : "add";
          return canAdd(catalog, p.serviceIds, s.id) && eligibleStylists(catalog, [...p.serviceIds, s.id]).length > 0 ? "add" : "unavailable";
        };
        return (
          <section key={p.ref} aria-labelledby={`person-${p.ref}`}>
            <h2 id={`person-${p.ref}`} className="font-serif text-xl">
              {personLabel(p, i)}
            </h2>
            <p className="mt-0.5 mb-4 text-sm text-muted">
              {audience?.name}
              {p.serviceIds.length === 0 && " · choose a service"}
            </p>
            {visible.length === 0 ? (
              <p className="text-sm text-muted">Nothing on the menu suits this age. Please call us.</p>
            ) : (
              <ul className="space-y-2">
                {visible.map((s, n) => (
                  <li key={s.id} className={n > 0 && s.categoryId !== visible[n - 1]!.categoryId ? "mt-1 border-t border-line pt-3" : undefined}>
                    <ServiceCard
                      service={s}
                      state={stateOf(s)}
                      addOn={p.serviceIds.indexOf(s.id) > 0 || (s.standalone === false && !p.serviceIds.includes(s.id))}
                      included={false}
                      onClick={() => onToggle(p.ref, s.id)}
                    />
                    {s.needsFirst && p.serviceIds.includes(s.id) && (
                      <p role="note" className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        {s.name} needs a {s.needsFirst.options.map((o) => o.name.toLowerCase()).join(" or ")} first, which we can't check on a
                        group booking. Book it for this person on their own while signed in, or call us on {salon.phone}.
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
