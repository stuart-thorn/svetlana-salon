import { useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent } from "react";

const EVENT = "app:navigate";

const subscribe = (cb: () => void) => {
  window.addEventListener("popstate", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("popstate", cb);
    window.removeEventListener(EVENT, cb);
  };
};

const snapshot = () => window.location.pathname + window.location.search;

/** Current path + query string; re-renders on navigation. */
export function useLocation() {
  const href = useSyncExternalStore(subscribe, snapshot);
  const url = new URL(href, window.location.origin);
  return { pathname: url.pathname, search: url.searchParams };
}

export function navigate(to: string, { replace = false }: { replace?: boolean } = {}) {
  if (to === snapshot()) return;
  window.history[replace ? "replaceState" : "pushState"](null, "", to);
  window.dispatchEvent(new Event(EVENT));
}

/** In-app link: plain <a> that navigates client-side (modifier-clicks still open new tabs). */
export function Link({ to, onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) {
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(to);
    window.scrollTo(0, 0);
  };
  return <a href={to} onClick={handle} {...props} />;
}
