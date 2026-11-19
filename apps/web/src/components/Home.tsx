import interior from "../assets/salon-interior.jpg";
import { salon } from "../data/content";
import { Link } from "../router";

export default function Home() {
  return (
    <section id="home" className="pt-16">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 md:py-20">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-gold">Hair salon · London E14</p>
          <h1 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl lg:text-6xl">
            {salon.name}
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">{salon.tagline}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/book"
              className="rounded-full bg-ink px-7 py-3 text-sm font-medium text-white transition-colors hover:bg-gold"
            >
              Book an appointment
            </Link>
            <a
              href="#about"
              className="rounded-full border border-ink/20 px-7 py-3 text-sm font-medium transition-colors hover:border-gold hover:text-gold"
            >
              Discover the salon
            </a>
          </div>
        </div>
        <div className="relative">
          <img
            src={interior}
            alt="Bright salon interior with oval mirrors, styling chairs and a marble floor"
            className="aspect-[4/3] w-full rounded-2xl object-cover shadow-xl shadow-black/5"
            fetchPriority="high"
          />
          <div className="absolute -bottom-5 left-5 rounded-xl bg-white px-5 py-3 shadow-lg shadow-black/5 sm:left-auto sm:right-6">
            <p className="font-serif text-lg">Open 6 days</p>
            <p className="text-xs text-muted">Late evenings Tue – Fri</p>
          </div>
        </div>
      </div>
    </section>
  );
}
