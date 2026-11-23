import type { MembershipSummary, Product } from "@salon/booking";

/** "3 months · 5 visits: 3 Full haircut, 2 Back & sides". */
export function productDetail(p: Product): string {
  const m = p.membership;
  if (!m) return "";
  const visits = m.allowances.reduce((s, a) => s + a.count, 0);
  return [
    m.termMonths ? `${m.termMonths} month${m.termMonths === 1 ? "" : "s"}` : visits > 0 ? "No expiry" : "",
    visits > 0 ? `${visits} visits: ${m.allowances.map((a) => `${a.count} × ${a.label}`).join(", ")}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

/** "3 of 5 visits left: Full haircut 2 of 3, Back & sides 1 of 2". */
export function visitsText(m: MembershipSummary): string {
  const left = m.allowances.reduce((s, a) => s + a.left, 0);
  const of = m.allowances.reduce((s, a) => s + a.count, 0);
  return `${left} of ${of} visits left${m.allowances.length > 1 ? `: ${m.allowances.map((a) => `${a.label} ${a.left} of ${a.count}`).join(", ")}` : ""}`;
}
