import { useState } from "react";
import { addDays, parseISODate, toISODate, type DayAvailability, type DayStatus, type ISODate } from "@salon/booking";
import { provider } from "../provider";
import { useAsync } from "../useAsync";
import { Chevron, Notice } from "../ui";

interface Props {
  stylistId: string | null;
  serviceIds: string[];
  selected: ISODate | null;
  onSelect: (date: ISODate) => void;
  /** Where the days come from, when not one person's visit (a group's). */
  load?: (from: ISODate, to: ISODate) => Promise<DayAvailability[]>;
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

const MAX_ROWS = 6;

const mondayIndex = (d: ISODate) => (parseISODate(d).getDay() + 6) % 7;

/**
 * The dates on a month's page. The current month's page has today's week on its top row and runs on into next
 * month, to the end of it or to the sixth row; other months are shown whole.
 */
function pageRange(month: ISODate, today: ISODate): { first: ISODate; last: ISODate } {
  if (month !== monthStart(today)) return { first: month, last: monthEnd(month) };
  const monday = addDays(today, -mondayIndex(today));
  const lastCell = addDays(monday, MAX_ROWS * 7 - 1);
  const nextEnd = monthEnd(shiftMonth(month, 1));
  return { first: monday < month ? month : monday, last: lastCell < nextEnd ? lastCell : nextEnd };
}

/** "December 2026", "November – December 2026" or "December 2026 – January 2027". */
function rangeTitle(first: ISODate, last: ISODate): string {
  const long = (d: ISODate) => parseISODate(d).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  if (monthStart(first) === monthStart(last)) return long(last);
  const sameYear = first.slice(0, 4) === last.slice(0, 4);
  return `${sameYear ? parseISODate(first).toLocaleDateString("en-GB", { month: "long" }) : long(first)} – ${long(last)}`;
}

export default function DateStep({ stylistId, serviceIds, selected, onSelect, load }: Props) {
  const today = toISODate(new Date());
  const lastDay = addDays(today, MAX_DAYS_AHEAD);
  const thisMonth = monthStart(today);
  const [month, setMonth] = useState(() =>
    !selected || selected <= pageRange(thisMonth, today).last ? thisMonth : monthStart(selected),
  );

  const { first, last } = pageRange(month, today);
  const straddles = monthStart(first) !== monthStart(last);
  const from = first < today ? today : first;
  const to = last > lastDay ? lastDay : last;

  const { data, loading, error } = useAsync(
    () => (load ? load(from, to) : provider.getAvailableDates({ from, to, stylistId, serviceIds })),
    [from, to, stylistId, serviceIds.join(","), load],
  );
  const statusFor = new Map<ISODate, DayStatus>(data?.map((d) => [d.date, d.status]));
  const hasAvailability = data?.some((d) => d.status === "available");

  const leadingBlanks = mondayIndex(first); // Monday-first grid
  const days: ISODate[] = [];
  for (let d = first; d <= last; d = addDays(d, 1)) days.push(d);

  // The page after this one starts at the first month not shown in full; going back skips a month the straddling page already covers.
  const nextMonth = monthStart(addDays(last, 1));
  const prevMonth = shiftMonth(month, -1);
  const prevTarget = monthEnd(prevMonth) <= pageRange(thisMonth, today).last ? thisMonth : prevMonth;
  const canPrev = month > thisMonth;
  const canNext = nextMonth <= lastDay;

  return (
    <div className="max-w-md">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-xl">{rangeTitle(first, last)}</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMonth(prevTarget)}
            disabled={!canPrev}
            aria-label="Earlier dates"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line transition-colors enabled:hover:border-accent disabled:opacity-30"
          >
            <Chevron dir="left" />
          </button>
          <button
            type="button"
            onClick={() => setMonth(nextMonth)}
            disabled={!canNext}
            aria-label="Later dates"
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
              {straddles && d === monthStart(d) && (
                <span className="absolute top-1 text-[10px] leading-none font-medium" aria-hidden>
                  {parseISODate(d).toLocaleDateString("en-GB", { month: "short" })}
                </span>
              )}
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
            {straddles ? "No availability on these dates." : "No availability this month."}{" "}
            {canNext && (
              <button type="button" onClick={() => setMonth(nextMonth)} className="font-medium text-ink underline underline-offset-2">
                {straddles ? "Try later dates" : "Try next month"}
              </button>
            )}
          </Notice>
        </div>
      )}
    </div>
  );
}
