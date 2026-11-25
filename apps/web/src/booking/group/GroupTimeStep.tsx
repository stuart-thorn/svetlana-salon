import { useState } from "react";
import { addDays, eligibleStylists, personLabel, timeToMinutes, toISODate, type Catalog, type ISODate, type PartyMember, type PartySlot } from "@salon/booking";
import { provider } from "../provider";
import { useAsync } from "../useAsync";
import { Avatar, Chevron, Notice, Spinner, formatLongDate } from "../ui";

interface Props {
  catalog: Catalog;
  people: PartyMember[];
  date: ISODate;
  selected: PartySlot | null;
  error?: string | null;
  onStylistChange: (ref: string, stylistId: string | null) => void;
  onDateChange: (date: ISODate) => void;
  onChangeDateClick: () => void;
  onSelect: (slot: PartySlot) => void;
}

const PERIODS = [
  { label: "Morning", test: (m: number) => m < 12 * 60 },
  { label: "Afternoon", test: (m: number) => m >= 12 * 60 && m < 17 * 60 },
  { label: "Evening", test: (m: number) => m >= 17 * 60 },
];

/** The party's key for fetching: people, services and chosen professionals. */
export const partyKey = (people: readonly PartyMember[]) => people.map((p) => `${p.ref}:${p.serviceIds.join("+")}:${p.stylistId ?? ""}:${p.age ?? ""}`).join("|");

/**
 * Times when the whole group can come: everyone with "any professional" starts together, each with someone
 * different; people given the same professional follow one another. Each time shows who goes with whom.
 */
export default function GroupTimeStep(props: Props) {
  const { catalog, people, date, selected, error } = props;
  const today = toISODate(new Date());
  const key = partyKey(people);
  const { data: slots, loading, error: loadError } = useAsync(() => provider.getPartyTimes!({ party: people, date }), [date, key]);

  const [searching, setSearching] = useState(false);
  const [noneAhead, setNoneAhead] = useState(false);
  const findNextAvailable = async () => {
    setSearching(true);
    setNoneAhead(false);
    try {
      const days = await provider.getPartyDates!({ party: people, from: addDays(date, 1), to: addDays(date, 60) });
      const next = days.find((d) => d.status === "available");
      if (next) props.onDateChange(next.date);
      else setNoneAhead(true);
    } finally {
      setSearching(false);
    }
  };

  const stylistName = (id: string) => catalog.stylists.find((s) => s.id === id)?.name ?? "";
  const label = (ref: string) => {
    const i = people.findIndex((p) => p.ref === ref);
    return personLabel(people[i] ?? {}, i);
  };

  return (
    <div className="space-y-8">
      {error && <Notice tone="error">{error}</Notice>}

      {/* Professional per person: anyone, or someone in particular. */}
      <details className="rounded-2xl border border-line px-5 py-4" open={people.some((p) => p.stylistId)}>
        <summary className="cursor-pointer text-sm font-medium">Choose professionals (optional)</summary>
        <p className="mt-2 text-sm text-muted">Two people with the same professional go one after the other.</p>
        <div className="mt-4 space-y-5">
          {people.map((p, i) => {
            const options = eligibleStylists(catalog, p.serviceIds);
            return (
              <div key={p.ref}>
                <p className="mb-2 text-sm">{personLabel(p, i)}</p>
                <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap">
                  {[{ id: null as string | null, name: "Any professional" }, ...options].map((o) => {
                    const index = catalog.stylists.findIndex((s) => s.id === o.id);
                    const active = p.stylistId === o.id;
                    return (
                      <li key={o.id ?? "any"}>
                        <button
                          type="button"
                          onClick={() => props.onStylistChange(p.ref, o.id)}
                          aria-pressed={active}
                          className={`flex items-center gap-2 rounded-full border py-1.5 pr-4 pl-1.5 text-sm whitespace-nowrap transition ${
                            active ? "border-ink bg-ink text-white" : "border-line hover:border-accent"
                          }`}
                        >
                          <Avatar stylist={catalog.stylists[index]} index={index} size="sm" />
                          {o.name}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </details>

      {/* Day switcher */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-line px-2 py-2">
        <button
          type="button"
          onClick={() => props.onDateChange(addDays(date, -1))}
          disabled={date <= today}
          aria-label="Previous day"
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors enabled:hover:bg-stone-100 disabled:opacity-30"
        >
          <Chevron dir="left" />
        </button>
        <button type="button" onClick={props.onChangeDateClick} className="text-center">
          <span className="block font-medium">{formatLongDate(date)}</span>
          <span className="block text-xs text-muted underline underline-offset-2">Change date</span>
        </button>
        <button
          type="button"
          onClick={() => props.onDateChange(addDays(date, 1))}
          disabled={date >= addDays(today, 60)}
          aria-label="Next day"
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors enabled:hover:bg-stone-100 disabled:opacity-30"
        >
          <Chevron />
        </button>
      </div>

      {loadError ? (
        <Notice tone="error">{loadError.message || "Couldn't load times. Please try again."}</Notice>
      ) : loading && !slots ? (
        <div className="flex items-center gap-3 text-sm text-muted">
          <Spinner /> Checking availability…
        </div>
      ) : slots && slots.length === 0 ? (
        <Notice>
          <p className="font-medium text-ink">No time for everyone together on this day</p>
          <p className="mt-1">Try other professionals, or jump to the next day that works for the whole group.</p>
          <button
            type="button"
            onClick={findNextAvailable}
            disabled={searching}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm text-white cta-hover disabled:opacity-60"
          >
            {searching && <Spinner />} Find next available date
          </button>
          {noneAhead && <p className="mt-2">No availability in the next 60 days for this group.</p>}
        </Notice>
      ) : (
        <div className={`space-y-8 transition-opacity ${loading ? "opacity-50" : ""}`} aria-busy={loading}>
          {PERIODS.map((period) => {
            const group = (slots ?? []).filter((s) => period.test(timeToMinutes(s.time)));
            if (!group.length) return null;
            return (
              <section key={period.label}>
                <h3 className="mb-3 text-sm font-medium text-muted">{period.label}</h3>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {group.map((s) => {
                    const active = s.time === selected?.time;
                    const end = s.assignments.reduce((m, a) => (a.endTime > m ? a.endTime : m), s.time);
                    return (
                      <li key={s.time}>
                        <button
                          type="button"
                          onClick={() => props.onSelect(s)}
                          aria-pressed={active}
                          className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                            active ? "border-ink bg-ink text-white" : "border-line hover:border-accent"
                          }`}
                        >
                          <span className="block font-medium">
                            {s.time} <span className={`font-normal ${active ? "text-white/70" : "text-muted"}`}>to {end}</span>
                          </span>
                          {s.assignments.map((a) => (
                            <span key={a.ref} className={`block text-xs ${active ? "text-white/80" : "text-muted"}`}>
                              {label(a.ref)}: {stylistName(a.stylistId)}
                              {a.time !== s.time && `, from ${a.time}`}
                            </span>
                          ))}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
