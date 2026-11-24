import { useState, type ReactNode } from "react";
import type { ISODate, Stylist } from "@salon/booking";
import { parseISODate } from "@salon/booking";

const AVATAR_TONES = ["bg-amber-100 text-amber-900", "bg-stone-200 text-stone-800", "bg-rose-100 text-rose-900", "bg-sky-100 text-sky-900"];

export function Avatar({ stylist, index = 0, size = "md" }: { stylist?: Stylist; index?: number; size?: "sm" | "md" | "lg" }) {
  const dims = { sm: "h-8 w-8 text-xs", md: "h-12 w-12 text-sm", lg: "h-16 w-16 text-lg" }[size];
  if (!stylist) {
    return (
      <span className={`${dims} inline-flex shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent-dark`} aria-hidden>
        <svg width="55%" height="55%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="9" cy="8" r="3.2" />
          <path d="M3 19c.6-3.2 3-5 6-5s5.4 1.8 6 5" />
          <circle cx="17" cy="9" r="2.4" />
          <path d="M16.5 14.2c2.3.2 4 1.7 4.5 4.3" />
        </svg>
      </span>
    );
  }
  return <StylistAvatar stylist={stylist} index={index} dims={dims} />;
}

/** Their photo when there is one (and it loads), else their initial on a tone. Decorative: the name is beside it. */
function StylistAvatar({ stylist, index, dims }: { stylist: Stylist; index: number; dims: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  if (stylist.photoUrl && failed !== stylist.photoUrl) {
    return (
      <img
        src={stylist.photoUrl}
        alt=""
        aria-hidden
        loading="lazy"
        onError={() => setFailed(stylist.photoUrl!)}
        className={`${dims} shrink-0 rounded-full bg-stone-100 object-cover`}
      />
    );
  }
  return (
    <span
      className={`${dims} ${AVATAR_TONES[index % AVATAR_TONES.length]} inline-flex shrink-0 items-center justify-center rounded-full font-medium`}
      aria-hidden
    >
      {stylist.name.slice(0, 1)}
    </span>
  );
}

export const formatLongDate = (d: ISODate) =>
  parseISODate(d).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Check({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}

export function Plus({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function Chevron({ dir = "right", size = 18 }: { dir?: "left" | "right"; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d={dir === "right" ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"} />
    </svg>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "error"; children: ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3 text-sm ${
        tone === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-line bg-stone-50 text-muted"
      }`}
    >
      {children}
    </div>
  );
}
