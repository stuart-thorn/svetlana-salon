import { catalog, formatDuration, formatServicePrice } from "@salon/booking";
import { hoursNote } from "../data/content";
import clippers from "../assets/clippers.jpg";
import { Link } from "../router";

const steps = ["Choose your professional (optional)","Pick your services", "Select a date", "Grab a time that suits you"];

export default function Bookings() {
  return (
    <section id="bookings" className="bg-stone-50/60 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-gold">Bookings</p>
          <h2 className="mt-4 font-serif text-3xl leading-tight sm:text-4xl">Services & appointments</h2>
          <p className="mt-4 leading-relaxed text-muted">
            See our prices below, then book online in under a minute, with live availability for every stylist.
            {" "}{hoursNote}
          </p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.1fr]">
          {/* Price list */}
          <div className="space-y-8">
            {catalog.categories.map((category) => (
              <div key={category.id}>
                <h3 className="font-serif text-xl">{category.name}</h3>
                <ul className="mt-3 divide-y divide-line border-y border-line">
                  {catalog.services
                    .filter((s) => s.categoryId === category.id)
                    .map((s) => (
                      <li key={s.id} className="flex items-baseline justify-between gap-4 py-3 text-sm">
                        <span>
                          {s.name}
                          <span className="ml-2 text-xs text-muted">{formatDuration(s.durationMin)}</span>
                        </span>
                        <span className="shrink-0 font-medium">{formatServicePrice(s)}</span>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
            <p className="text-xs leading-relaxed text-muted">
              Indicative prices, subject to the final launch menu. "From" prices depend on hair length and the
              time needed, and are confirmed at your consultation.
            </p>
          </div>

          {/* Book online CTA */}
          <div className="flex h-fit flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
            <img
              src={clippers}
              alt="Professional clippers and guards laid out on a wooden table"
              loading="lazy"
              className="aspect-[16/9] w-full object-cover"
            />
            <div className="p-6 sm:p-8">
              <h3 className="font-serif text-2xl">Book online</h3>
              <ol className="mt-5 space-y-3">
                {steps.map((s, i) => (
                  <li key={s} className="flex items-center gap-3 text-sm">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-medium text-gold-dark">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
              <Link
                to="/book"
                data-book-cta
                className="mt-8 block rounded-full bg-ink px-7 py-3.5 text-center text-sm font-medium text-white transition-colors hover:bg-gold"
              >
                Book an appointment
              </Link>
              <p className="mt-3 text-center text-xs text-muted">
                Colour and highlights need a 50% deposit online. Everything else is paid in the salon.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
