import { offers, salon } from "../data/content";

export default function Offers() {
  return (
    <section id="offers" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-gold">Packages & memberships</p>
          <h2 className="mt-4 font-serif text-3xl leading-tight sm:text-4xl">More for regular visits</h2>
          <p className="mt-4 leading-relaxed text-muted">
            Ways to save if you come often or bring the family. Ask in the salon to join or buy.
          </p>
        </div>

        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {offers.map((o) => (
            <li key={o.title} className="flex flex-col rounded-2xl border border-line p-6 sm:p-8">
              <h3 className="font-serif text-2xl">{o.title}</h3>
              <p className="mt-3 font-medium">{o.summary}</p>
              <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted">
                {o.details.map((d) => (
                  <li key={d} className="flex gap-3">
                    <span className="mt-2.5 h-px w-4 shrink-0 bg-gold" aria-hidden />
                    {d}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs text-muted">{salon.launchNote}</p>
      </div>
    </section>
  );
}
