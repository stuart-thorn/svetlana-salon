import { useEffect, useState } from "react";
import { navLinks, salon } from "../data/content";
import { Link } from "../router";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("home");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    navLinks.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 bg-white/95 backdrop-blur transition-shadow ${
        scrolled ? "shadow-[0_1px_0_var(--color-line)]" : ""
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#home" className="font-serif text-xl tracking-wide" onClick={() => setOpen(false)}>
          {salon.name}
        </a>

        <ul className="hidden items-center gap-6 md:flex lg:gap-8">
          {navLinks.map(({ id, label }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                aria-current={active === id ? "page" : undefined}
                className={`text-sm tracking-wide transition-colors hover:text-gold ${
                  active === id ? "text-gold" : "text-ink"
                }`}
              >
                {label}
              </a>
            </li>
          ))}
          <li>
            <Link
              to="/book"
              className="rounded-full bg-ink px-5 py-2 text-sm text-white transition-colors hover:bg-gold"
            >
              Book now
            </Link>
          </li>
        </ul>

        <button
          type="button"
          className="-mr-2 p-2 md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((o) => !o)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>

      {open && (
        <ul id="mobile-menu" className="border-t border-line bg-white px-4 pb-4 md:hidden">
          {navLinks.map(({ id, label }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                onClick={() => setOpen(false)}
                className={`block py-3 text-base ${active === id ? "text-gold" : "text-ink"}`}
              >
                {label}
              </a>
            </li>
          ))}
          <li className="pt-2">
            <Link to="/book" className="block rounded-full bg-ink px-5 py-3 text-center text-sm text-white">
              Book now
            </Link>
          </li>
        </ul>
      )}
    </header>
  );
}
