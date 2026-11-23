import { memberships, offers, salon } from "../data/content";

const gbp = (pounds: number) => `£${pounds}`;

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted">
      {items.map((d) => (
        <li key={d} className="flex gap-3">
          <span className="mt-2.5 h-px w-4 shrink-0 bg-gold" aria-hidden />
          {d}
        </li>
      ))}
    </ul>
  );
}

export default function Offers() {
  return (
    <section id="offers" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-gold">Offers & memberships</p>
          <h2 className="mt-4 font-serif text-3xl leading-tight sm:text-4xl">More for regular visits</h2>
          <p className="mt-4 leading-relaxed text-muted">
            Ways to save if you're a student, come often or bring the family. Ask in the salon to join or buy.
          </p>
        </div>

        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {offers.map((o) => (
            <li
              key={o.title}
              className={`flex flex-col rounded-2xl border p-6 sm:p-8 ${o.featured ? "border-gold" : "border-line"}`}
            >
              {o.featured && <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold-dark">Weekday off-peak</p>}
              <h3 className={`font-serif text-2xl ${o.featured ? "mt-2" : ""}`}>{o.title}</h3>
              <p className="mt-3 font-medium">{o.summary}</p>
              <Bullets items={o.details} />
            </li>
          ))}
        </ul>

        <div className="mt-6 rounded-2xl border border-line p-6 sm:p-8">
          <h3 className="font-serif text-2xl">{memberships.title}</h3>
          <p className="mt-3 font-medium">{memberships.summary}</p>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="text-xs uppercase tracking-widest text-muted">
                <tr className="border-b border-line">
                  <th className="py-2.5 pr-4 font-medium">Membership</th>
                  <th className="py-2.5 pr-4 font-medium">Included</th>
                  <th className="py-2.5 pr-4 text-right font-medium">Standard value</th>
                  <th className="py-2.5 text-right font-medium">Member price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {memberships.tiers.map((t) => (
                  <tr key={t.name}>
                    <td className="py-3 pr-4">
                      <span className="font-medium">{t.name}</span>
                      <span className="block text-xs text-muted">{t.term}</span>
                    </td>
                    <td className="py-3 pr-4">{t.visits}</td>
                    <td className="py-3 pr-4 text-right text-muted">{gbp(t.standard)}</td>
                    <td className="py-3 text-right">
                      <span className="font-medium">{gbp(t.price)}</span>
                      <span className="block text-xs text-gold-dark">
                        {t.discount}% off, save {gbp(t.standard - t.price)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Bullets items={memberships.terms} />
        </div>
        <p className="mt-6 text-xs text-muted">{salon.launchNote}</p>
      </div>
    </section>
  );
}
