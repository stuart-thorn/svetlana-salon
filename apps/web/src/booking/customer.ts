import { useCallback, useEffect, useState } from "react";
import type { CustomerProfile, CustomerSession } from "@salon/booking";
import { customerAuth, provider } from "./provider";

export type CustomerState =
  | { status: "off" }
  | { status: "signed_out" }
  | { status: "signed_in"; session: CustomerSession; profile?: CustomerProfile };

/**
 * The signed-in customer for this booking: their session (kept for the tab), and once loaded, what the salon
 * knows about them. `profile` stays undefined if it can't be loaded; booking still works without it.
 */
export function useCustomer() {
  const [state, setState] = useState<CustomerState>(() => {
    if (!customerAuth || !provider.getCustomerProfile) return { status: "off" };
    const session = customerAuth.session();
    return session ? { status: "signed_in", session } : { status: "signed_out" };
  });

  const session = state.status === "signed_in" ? state.session : undefined;
  // Bumped to load the profile again (e.g. after a booking used a membership visit).
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (!session || !provider.getCustomerProfile) return;
    let cancelled = false;
    provider.getCustomerProfile().then(
      (profile) => !cancelled && setState({ status: "signed_in", session, profile }),
      () => {
        // A token the API won't accept (expired, revoked): sign out rather than book with it.
        if (cancelled) return;
        customerAuth?.signOut();
        setState({ status: "signed_out" });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [session, version]);

  /** Loads the profile again, keeping the one shown until the new one arrives. */
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const signedIn = useCallback((s: CustomerSession) => setState({ status: "signed_in", session: s }), []);
  const signOut = useCallback(() => {
    customerAuth?.signOut();
    setState({ status: "signed_out" });
  }, []);

  return { state, signedIn, signOut, refresh };
}
