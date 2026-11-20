import { navLinks, salon } from "../data/content";

const credits = [
  ["Tile Merchant Ireland", "https://unsplash.com/@tilemerchantireland"],
  ["Lindsay Cash", "https://unsplash.com/@lindsaycash"],
  ["Nate Johnston", "https://unsplash.com/@natejohnston"],
  ["Agustin Fernandez", "https://unsplash.com/@agustinfernandez"],
] as const;

export default function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-sm sm:px-6 md:flex-row md:items-center md:justify-between">
        <p className="font-serif text-lg">{salon.name}</p>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {navLinks.map(({ id, label }) => (
            <li key={id}>
              <a href={`#${id}`} className="text-muted hover:text-gold">
                {label}
              </a>
            </li>
          ))}
        </ul>
        <p className="text-muted">© {new Date().getFullYear()} {salon.legalName}</p>
      </div>
      <p className="mx-auto max-w-6xl px-4 pb-8 text-xs text-muted/80 sm:px-6">
        Photos via Unsplash:{" "}
        {credits.map(([name, url], i) => (
          <span key={name}>
            <a href={url} className="underline-offset-2 hover:underline" target="_blank" rel="noreferrer">
              {name}
            </a>
            {i < credits.length - 1 ? ", " : ""}
          </span>
        ))}
      </p>
    </footer>
  );
}
