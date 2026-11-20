import { hoursNote, openingHours, salon } from "../data/content";

export default function Contact() {
  return (
    <section id="contact" className="bg-stone-50/60 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-gold">Contact</p>
          <h2 className="mt-4 font-serif text-3xl leading-tight sm:text-4xl">Visit us in Canary Wharf</h2>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-1">
            <div>
              <h3 className="text-sm font-medium uppercase tracking-widest text-muted">Address</h3>
              <address className="mt-3 not-italic leading-relaxed">
                {salon.name}
                {salon.address.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
              <p className="mt-2 text-xs text-muted">Opening soon. {salon.launchNote}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium uppercase tracking-widest text-muted">Get in touch</h3>
              <p className="mt-3 leading-relaxed">
                <a href={`tel:${salon.phone.replace(/\s/g, "")}`} className="block hover:text-gold">
                  {salon.phone}
                </a>
                <a href={`mailto:${salon.email}`} className="block break-all hover:text-gold">
                  {salon.email}
                </a>
              </p>
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <h3 className="text-sm font-medium uppercase tracking-widest text-muted">Opening hours</h3>
              <dl className="mt-3 divide-y divide-line border-y border-line text-sm">
                {openingHours.map((o) => (
                  <div key={o.day} className="flex justify-between py-2.5">
                    <dt>{o.day}</dt>
                    <dd className={o.hours === "Closed" ? "text-muted" : "font-medium"}>{o.hours}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-xs leading-relaxed text-muted">{hoursNote}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-line">
            <iframe
              title="Map showing Jubilee Place, Canary Wharf, London"
              src="https://www.openstreetmap.org/export/embed.html?bbox=-0.0281%2C51.4990%2C-0.0091%2C51.5085&layer=mapnik&marker=51.5035%2C-0.0186"
              className="h-80 w-full lg:h-full lg:min-h-[28rem]"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
