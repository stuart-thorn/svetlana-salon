import { useEffect, useState } from "react";
import { Link } from "../router";

/** Put on every in-page "Book an appointment" link; the bar shows only while none of them is on screen. */
export const BOOK_CTA_ATTR = "data-book-cta";

/**
 * Phones only (below `md`, where the header's Book now sits in the menu): a "Book an appointment" bar fixed to
 * the bottom of the screen, so there is always a way to book in view.
 */
export default function StickyBookBar() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const ctas = document.querySelectorAll(`[${BOOK_CTA_ATTR}]`);
    const visible = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.add(e.target);
        else visible.delete(e.target);
      }
      setShow(visible.size === 0);
    });
    ctas.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Room at the end of the page so the bar never covers the footer. */}
      <div aria-hidden className="h-24 md:hidden" />
      <div
        inert={!show}
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur transition-transform duration-300 motion-reduce:transition-none md:hidden ${
          show ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <Link to="/book" className="block rounded-full bg-ink px-7 py-3.5 text-center text-sm font-medium text-white transition-colors hover:bg-accent">
          Book an appointment
        </Link>
      </div>
    </>
  );
}
