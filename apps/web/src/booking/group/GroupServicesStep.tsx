import { canAdd, eligibleStylists, personLabel, servicesFor, type Catalog, type PartyMember, type Service } from "@salon/booking";
import { ServiceCard, type CardState } from "../steps/ServicesStep";

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
