import { useState } from "react";
import {
  addDays,
  eligibleStylists,
  timeToMinutes,
  toISODate,
  type Catalog,
  type ClockTime,
  type ISODate,
  type TimeSlot,
} from "@salon/booking";
import { provider } from "../provider";
import { ANY } from "../state";
import { useAsync } from "../useAsync";
import { Avatar, Chevron, Notice, Spinner, formatLongDate } from "../ui";

interface Props {
  catalog: Catalog;
  stylist: string;
  serviceIds: string[];
  date: ISODate;
  selected: ClockTime | null;
  error?: string | null;
  onStylistChange: (stylist: string) => void;
  onDateChange: (date: ISODate) => void;
  onChangeDateClick: () => void;
  onSelect: (time: ClockTime) => void;
  /** Keep to `stylist` (moving a booking): no professional switcher. */
  fixedStylist?: boolean;
}

const PERIODS = [
  { label: "Morning", test: (m: number) => m < 12 * 60 },
  { label: "Afternoon", test: (m: number) => m >= 12 * 60 && m < 17 * 60 },
  { label: "Evening", test: (m: number) => m >= 17 * 60 },
];

export default function TimeStep(props: Props) {
  const { catalog, stylist, serviceIds, date, selected, error } = props;
  const stylistId = stylist === ANY ? null : stylist;
  const options = eligibleStylists(catalog, serviceIds);
  const today = toISODate(new Date());

  const { data: slots, loading } = useAsync(
    () => provider.getTimeSlots({ date, stylistId, serviceIds }),
    [date, stylistId, serviceIds.join(",")],
  );

  const [searching, setSearching] = useState(false);
  const [noneAhead, setNoneAhead] = useState(false);
  const findNextAvailable = async () => {
    setSearching(true);
    setNoneAhead(false);
    try {
      const days = await provider.getAvailableDates({
        from: addDays(date, 1),
        to: addDays(date, 60),
        stylistId,
        serviceIds,
      });
      const next = days.find((d) => d.status === "available");
      if (next) props.onDateChange(next.date);
      else setNoneAhead(true);
    } finally {
      setSearching(false);
    }
  };

  const stylistName = (slot: TimeSlot) =>
    slot.stylistIds.length === 1
      ? catalog.stylists.find((s) => s.id === slot.stylistIds[0])?.name
      : undefined;

  return (
    <div className="space-y-8">
      {error && <Notice tone="error">{error}</Notice>}

      {/* Professional switcher */}
      {!props.fixedStylist && (
        <div>
          <p className="mb-3 text-sm font-medium">Professional</p>
          <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            {[{ id: ANY, name: "Any professional" }, ...options].map((o) => {
              const index = catalog.stylists.findIndex((s) => s.id === o.id);
              const active = stylist === o.id;
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => props.onStylistChange(o.id)}
                    aria-pressed={active}
                    className={`flex items-center gap-2 rounded-full border py-1.5 pr-4 pl-1.5 text-sm whitespace-nowrap transition ${
                      active
                        ? "border-ink bg-ink text-white"
                        : "border-line hover:border-gold"
                    }`}
                  >
                    <Avatar
                      stylist={catalog.stylists[index]}
                      index={index}
                      size="sm"
                    />
                    {o.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

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
        <button
          type="button"
          onClick={props.onChangeDateClick}
          className="text-center"
        >
          <span className="block font-medium">{formatLongDate(date)}</span>
          <span className="block text-xs text-muted underline underline-offset-2">
            Change date
          </span>
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

      {/* Slots */}
      {loading && !slots ? (
        <div className="flex items-center gap-3 text-sm text-muted">
          <Spinner /> Checking availability…
        </div>
      ) : slots && slots.length === 0 ? (
        <Notice>
          <p className="font-medium text-ink">No availability on this day</p>
          <p className="mt-1">
            Try another professional, or jump to the next free day.
          </p>
          <button
            type="button"
            onClick={findNextAvailable}
            disabled={searching}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2 text-sm text-white transition-colors hover:bg-gold disabled:opacity-60"
          >
            {searching && <Spinner />} Find next available date
          </button>
          {noneAhead && (
            <p className="mt-2">
              No availability in the next 60 days with this selection.
            </p>
          )}
        </Notice>
      ) : (
        <div
          className={`space-y-8 transition-opacity ${loading ? "opacity-50" : ""}`}
          aria-busy={loading}
        >
          {PERIODS.map((p) => {
            const group = (slots ?? []).filter((s) =>
              p.test(timeToMinutes(s.time)),
            );
            if (!group.length) return null;
            return (
              <section key={p.label}>
                <h3 className="mb-3 text-sm font-medium text-muted">
                  {p.label}
                </h3>
                <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-5">
                  {group.map((s) => {
                    const active = s.time === selected;
                    const who = stylist === ANY ? stylistName(s) : undefined;
                    return (
                      <li key={s.time}>
                        <button
                          type="button"
                          onClick={() => props.onSelect(s.time)}
                          aria-pressed={active}
                          className={`w-full rounded-xl border px-2 py-3 text-sm transition ${
                            active
                              ? "border-ink bg-ink text-white"
                              : "border-line hover:border-gold"
                          }`}
                        >
                          <span className="block font-medium">{s.time}</span>
                          {who && (
                            <span
                              className={`block text-[11px] ${active ? "text-white/70" : "text-muted"}`}
                            >
                              {who}
                            </span>
                          )}
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
