import { useEffect, useState } from "react";
import type { Offer, Product } from "@salon/booking";
import { isPrelaunch, memberships, offers, salon } from "../data/content";
import { provider } from "../booking/provider";
import { Link } from "../router";

/**
 * From the booking system: the memberships sold online (clubs and packages), so each can show "Buy online", and
 * the offers customers claim when booking. None pre-launch, and no memberships in demo mode or when the salon
 * sells them only in person. Undefined until known.
 */
interface Online {
  memberships: Product[];
  claimable: Offer[];
}
const NOTHING_ONLINE: Online = { memberships: [], claimable: [] };

function useOnline(): Online | undefined {
  const [online, setOnline] = useState<Online | undefined>(isPrelaunch ? NOTHING_ONLINE : undefined);
  useEffect(() => {
    if (isPrelaunch) return;
    let cancelled = false;
    provider.getCatalog().then(
      (c) =>
        !cancelled &&
        setOnline({
          memberships: provider.buyProducts ? (c.products ?? []).filter((p) => p.kind === "membership") : [],
          claimable: (c.offers ?? []).filter((o) => o.claim),
        }),
      () => !cancelled && setOnline(NOTHING_ONLINE),
    );
    return () => {
      cancelled = true;
    };
  }, []);
  return online;
}

/** The product for a club or package: by its tier name, else a product named after it. */
const productFor = (products: readonly Product[], name: string) =>
  products.find((p) => p.membership?.tier?.toLowerCase() === name.toLowerCase()) ??
  products.find((p) => p.name.toLowerCase().startsWith(name.toLowerCase()));

const gbp = (pounds: number) => `£${pounds}`;

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted">
      {items.map((d) => (
        <li key={d} className="flex gap-3">
          <span className="mt-2.5 h-px w-4 shrink-0 bg-accent" aria-hidden />
          {d}
        </li>
      ))}
    </ul>
  );
}

function BuyLink({ product, name, className }: { product: Product; name: string; className: string }) {
  return (
    <Link
      to={`/buy?product=${encodeURIComponent(product.id)}`}
      className={`rounded-full bg-accent font-medium text-white cta-hover ${className}`}
    >
      Buy online<span className="sr-only">: {name}</span>
    </Link>
  );
}

export default function Offers() {
  const loaded = useOnline();
  const { memberships: online, claimable } = loaded ?? NOTHING_ONLINE;
  const anyOnline = memberships.tiers.some((t) => productFor(online, t.name));
  const soldInSalonOnly = loaded !== undefined && !anyOnline;
  return (
    <section id="offers" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-accent">Offers & memberships</p>
          <h2 className="mt-4 font-serif text-3xl leading-tight sm:text-4xl">More for regular visits</h2>
          <p className="mt-4 leading-relaxed text-muted">
            Ways to save if you're a student, come often or bring the family. You can ask in the salon for more details.
          </p>
        </div>

        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {offers.map((o) => {
            const product = productFor(online, o.title);
            const claim = claimable.find((c) => c.name.toLowerCase() === o.title.toLowerCase())?.claim;
            return (
              <li
                key={o.title}
                className={`flex flex-col rounded-2xl border p-6 sm:p-8 ${o.featured ? "border-accent" : "border-line"}`}
              >
                {o.featured && <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent-dark">Weekday off-peak</p>}
                <h3 className={`font-serif text-2xl ${o.featured ? "mt-2" : ""}`}>{o.title}</h3>
                <p className="mt-3 font-medium">{o.summary}</p>
                <Bullets items={o.details} />
                {product && (
                  <div className="mt-auto pt-6">
                    <BuyLink product={product} name={o.title} className="block px-5 py-3 text-center text-sm" />
                  </div>
                )}
                {o.group && !isPrelaunch && provider.createPartyBooking && (
                  <div className="mt-auto pt-6">
                    <Link
                      to="/book/group?step=people"
                      className="block rounded-full bg-accent px-5 py-3 text-center text-sm font-medium text-white cta-hover"
                    >
                      Book together<span className="sr-only">: {o.title}</span>
                    </Link>
                  </div>
                )}
                {claim && (
                  <div className="mt-auto pt-6">
                    <p className="mb-3 text-sm text-muted">Book a haircut at an offer time, then tick “{claim.label}” on the details step.</p>
                    <Link
                      to="/book"
                      className="block rounded-full bg-accent px-5 py-3 text-center text-sm font-medium text-white cta-hover"
                    >
                      Book online<span className="sr-only">: {o.title}</span>
                    </Link>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-6 rounded-2xl border border-line p-6 sm:p-8">
          <h3 className="font-serif text-2xl">{memberships.title}</h3>
          <p className="mt-3 font-medium">{memberships.summary}</p>

          {/* Phones: one block per club. */}
          <ul className="mt-6 divide-y divide-line border-y border-line md:hidden">
            {memberships.tiers.map((t) => {
              const product = productFor(online, t.name);
              return (
                <li key={t.name} className="py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{t.name}</p>
                      <p className="text-xs text-muted">{t.term}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p>
                        <s className="mr-2 text-sm text-muted">
                          <span className="sr-only">Standard value </span>
                          {gbp(t.standard)}
                        </s>
                        <span className="sr-only">Club price </span>
                        <span className="font-medium">{gbp(t.price)}</span>
                      </p>
                      <p className="text-xs text-accent-dark">Save {gbp(t.standard - t.price)}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm">{t.visits}</p>
                  {product && <BuyLink product={product} name={t.name} className="mt-4 block px-5 py-3 text-center text-sm sm:inline-block" />}
                </li>
              );
            })}
          </ul>

          {/* Wider screens: a table, with a column for the buttons when any club is sold online. */}
          <table className="mt-6 hidden w-full text-left text-sm md:table">
            <thead className="text-xs uppercase tracking-widest text-muted">
              <tr className="border-b border-line">
                <th className="py-2.5 pr-6 font-medium">Club</th>
                <th className="py-2.5 pr-6 font-medium">Included</th>
                <th className="py-2.5 pr-6 text-right font-medium">Standard value</th>
                <th className="py-2.5 text-right font-medium">Club price</th>
                {anyOnline && (
                  <th className="py-2.5 pl-6">
                    <span className="sr-only">Buy online</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {memberships.tiers.map((t) => {
                const product = productFor(online, t.name);
                return (
                  <tr key={t.name}>
                    <td className="py-3 pr-6 whitespace-nowrap">
                      <span className="font-medium">{t.name}</span>
                      <span className="block text-xs text-muted">{t.term}</span>
                    </td>
                    <td className="py-3 pr-6">{t.visits}</td>
                    <td className="py-3 pr-6 text-right text-muted">{gbp(t.standard)}</td>
                    <td className="py-3 text-right whitespace-nowrap">
                      <span className="font-medium">{gbp(t.price)}</span>
                      <span className="block text-xs text-accent-dark">Save {gbp(t.standard - t.price)}</span>
                    </td>
                    {anyOnline && (
                      <td className="py-3 pl-6 text-right whitespace-nowrap">
                        {product && <BuyLink product={product} name={t.name} className="inline-block px-4 py-2 text-xs" />}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Bullets items={soldInSalonOnly ? [...memberships.terms, memberships.notOnlineNote] : memberships.terms} />
        </div>
        <p className="mt-6 text-xs text-muted">{salon.launchNote}</p>
      </div>
    </section>
  );
}
