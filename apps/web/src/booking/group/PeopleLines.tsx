import { personLabel, servicesById, type BookingConfirmation, type Catalog } from "@salon/booking";
import { Avatar } from "../ui";

/** A group booking's people: who has what, with whom, and when they start. */
export default function PeopleLines({ people, catalog }: { people: NonNullable<BookingConfirmation["people"]>; catalog: Catalog }) {
  return (
    <ul className="space-y-3">
      {people.map((p, i) => {
        const index = catalog.stylists.findIndex((s) => s.id === p.stylistId);
        const stylist = catalog.stylists[index];
        return (
          <li key={p.ref} className="flex items-start gap-3 text-sm">
            <Avatar stylist={stylist} index={index} size="sm" />
            <div className="min-w-0">
              <p className="font-medium">{personLabel(p, i)}</p>
              <p className="text-muted">
                {servicesById(catalog, p.serviceIds)
                  .map((s) => s.name)
                  .join(", ")}
              </p>
              <p className="text-xs text-muted">
                {p.time} – {p.endTime}
                {stylist && ` with ${stylist.name}`}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
