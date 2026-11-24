import { catalog, formatDuration, formatServicePrice } from "@salon/booking";
import { hoursNote, isPrelaunch, prelaunchNote } from "../data/content";
import clippers from "../assets/clippers.jpg";
import { Link } from "../router";

const steps = ["Choose your professional (optional)","Pick your services", "Select a date", "Grab a time that suits you"];

export default function Bookings() {
  return (
    <section id="bookings" className="bg-stone-50/60 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-accent">Bookings</p>
          <h2 className="mt-4 font-serif text-3xl leading-tight sm:text-4xl">Services & appointments</h2>
          <p className="mt-4 leading-relaxed text-muted">
            {isPrelaunch
              ? "See our prices below. Online booking, with live availability for every stylist, is coming shortly."
              : "See our prices below, then book online in under a minute, with live availability for every stylist."}
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
              Indicative prices, subject to the final launch menu. "From" prices depend on hair length, thickness
              and the time needed, and are confirmed at your consultation. Colour needs a patch test at least 24
              hours before (ideally 48).
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
              <h3 className="font-serif text-2xl">{isPrelaunch ? "Online booking opens soon" : "Book online"}</h3>
              {isPrelaunch && (
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {prelaunchNote} Here's how it will work:
                </p>
              )}
              <ol className="mt-5 space-y-3">
                {steps.map((s, i) => (
                  <li key={s} className="flex items-center gap-3 text-sm">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-medium text-accent-dark">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
              {isPrelaunch ? (
                <a
                  href="#contact"
                  className="mt-8 block rounded-full border border-ink/20 px-7 py-3.5 text-center text-sm font-medium transition-colors hover:border-accent hover:text-accent"
                >
                  Find us
                </a>
              ) : (
                <Link
                  to="/book"
                  data-book-cta
                  className="mt-8 block rounded-full bg-accent px-7 py-3.5 text-center text-sm font-medium text-white cta-hover"
                >
                  Book an appointment
                </Link>
              )}
              <p className="mt-3 text-center text-xs text-muted">
                Colour, highlights and Nanoplasty need a deposit online: 50% of the starting price. Any extra work or
                toner is agreed with you and paid in the salon, as is everything else.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
