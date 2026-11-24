/** The salon's cancellation rule in words, for the booking flow (the deadline itself is worked out by the API). */

const TZ = "Europe/London";

/** Minutes the zone is ahead of UTC at an instant. */
function offsetMin(ms: number): number {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(ms));
  const n = (t: string) => Number(p.find((x) => x.type === t)?.value);
  return (
    (Date.UTC(n("year"), n("month") - 1, n("day"), n("hour"), n("minute")) -
      ms) /
    60_000
  );
}

/** "Tue 25 Nov, 10:00": the salon's day and time `hours` before a local appointment start. */
export function freeCancellationUntil(
  date: string,
  time: string,
  hours: number,
): string {
  const wall = Date.parse(`${date}T${time}:00Z`);
  const start = wall - offsetMin(wall - offsetMin(wall) * 60_000) * 60_000;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(start - hours * 3_600_000));
  const get = (t: string) => parts.find((x) => x.type === t)?.value ?? "";
  return `${get("weekday")} ${get("day")} ${get("month")}, ${get("hour")}:${get("minute")}`;
}

/** Before booking: when they can cancel or change for free, and what happens to a deposit after that. */
export function cancellationRule(hours: number, deposit: boolean): string {
  return `Free cancellation or changes up to ${hours} hours before your appointment${deposit ? "; after that, the deposit isn't refunded" : ""}.`;
}
