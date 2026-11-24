import { useState } from "react";
import { addDays, parseISODate, toISODate, type DayStatus, type ISODate } from "@salon/booking";
import { provider } from "../provider";
import { useAsync } from "../useAsync";
import { Chevron, Notice } from "../ui";

interface Props {
  stylistId: string | null;
  serviceIds: string[];
  selected: ISODate | null;
  onSelect: (date: ISODate) => void;
}

/** How far ahead the calendar lets you browse; the provider has the final say per day. */
const MAX_DAYS_AHEAD = 60;
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const monthStart = (d: ISODate) => `${d.slice(0, 7)}-01`;
const shiftMonth = (m: ISODate, by: number) => {
  const d = parseISODate(m);
  return toISODate(new Date(d.getFullYear(), d.getMonth() + by, 1));
};
const monthEnd = (m: ISODate) => addDays(shiftMonth(m, 1), -1);

export default function DateStep({ stylistId, serviceIds, selected, onSelect }: Props) {
  const today = toISODate(new Date());
  const lastDay = addDays(today, MAX_DAYS_AHEAD);
  const [month, setMonth] = useState(() => monthStart(selected ?? today));

  const from = month < today ? today : month;
  const to = monthEnd(month) > lastDay ? lastDay : monthEnd(month);

  const { data, loading, error } = useAsync(
    () => provider.getAvailableDates({ from, to, stylistId, serviceIds }),
    [from, to, stylistId, serviceIds.join(",")],
  );
  const statusFor = new Map<ISODate, DayStatus>(data?.map((d) => [d.date, d.status]));
  const hasAvailability = data?.some((d) => d.status === "available");

  const first = parseISODate(month);
  const leadingBlanks = (first.getDay() + 6) % 7; // Monday-first grid
  const days = Array.from({ length: parseISODate(monthEnd(month)).getDate() }, (_, i) => addDays(month, i));
  const canPrev = month > monthStart(today);
  const canNext = shiftMonth(month, 1) <= lastDay;

  return (
    <div className="max-w-md">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-xl">{first.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMonth(shiftMonth(month, -1))}
            disabled={!canPrev}
            aria-label="Previous month"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line transition-colors enabled:hover:border-accent disabled:opacity-30"
          >
            <Chevron dir="left" />
          </button>
          <button
            type="button"
            onClick={() => setMonth(shiftMonth(month, 1))}
            disabled={!canNext}
            aria-label="Next month"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line transition-colors enabled:hover:border-accent disabled:opacity-30"
          >
            <Chevron />
          </button>
        </div>
      </div>

      {error && <Notice tone="error">Couldn't load availability. Please try again.</Notice>}

      <div className={`grid grid-cols-7 gap-1 text-center transition-opacity ${loading ? "opacity-50" : ""}`} aria-busy={loading}>
        {WEEKDAYS.map((d) => (
          <div key={d} className="pb-2 text-xs font-medium text-muted">
            {d}
          </div>
        ))}
        {Array.from({ length: leadingBlanks }, (_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {days.map((d) => {
          const status = d < today || d > lastDay ? "closed" : statusFor.get(d);
          const available = status === "available";
          const isSelected = d === selected;
          const label = parseISODate(d).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
          return (
            <button
              key={d}
              type="button"
              disabled={!available}
              onClick={() => onSelect(d)}
              aria-pressed={isSelected}
              aria-label={`${label}${status === "fully-booked" ? ", fully booked" : status === "closed" ? ", unavailable" : ""}`}
              className={`relative mx-auto flex aspect-square w-full max-w-12 items-center justify-center rounded-full text-sm transition-colors ${
                isSelected
                  ? "bg-ink font-medium text-white"
                  : available
                    ? "font-medium hover:bg-accent/15"
                    : status === "fully-booked"
                      ? "text-muted/60 line-through"
                      : "text-muted/40"
              } ${d === today && !isSelected ? "ring-1 ring-line" : ""}`}
            >
              {parseISODate(d).getDate()}
              {available && !isSelected && <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-accent" aria-hidden />}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Available
        </span>
        <span className="line-through">Fully booked</span>
        <span className="text-muted/50">Unavailable</span>
      </div>

      {!loading && data && !hasAvailability && (
        <div className="mt-6">
          <Notice>
            No availability this month.{" "}
            {canNext && (
              <button type="button" onClick={() => setMonth(shiftMonth(month, 1))} className="font-medium text-ink underline underline-offset-2">
                Try next month
              </button>
            )}
          </Notice>
        </div>
      )}
    </div>
  );
}
