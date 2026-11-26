import { useCallback, useEffect, useState } from "react";
import {
  BookingExpiredError,
  IncompatibleServicesError,
  PaymentsUnavailableError,
  SlotUnavailableError,
  depositFor,
  partyOfferSavings,
  servicesById,
  type BookingConfirmation,
  type Customer,
  type ISODate,
} from "@salon/booking";
import { Link, navigate, scrollToTop, useLocation } from "../../router";
import { salon } from "../../data/content";
import type { CartAction } from "../Cart";
import Confirmation from "../Confirmation";
import { useCustomer } from "../customer";
import Payment from "../Payment";
import { provider } from "../provider";
import DateStep from "../steps/DateStep";
import DetailsStep, { DETAILS_FORM_ID, validateCustomer, type CustomerErrors } from "../steps/DetailsStep";
import { useAsync } from "../useAsync";
import { Chevron, Notice, Spinner } from "../ui";
import GroupServicesStep from "./GroupServicesStep";
import { GroupBar, GroupPanel, type GroupPricing } from "./GroupSummary";
import GroupTimeStep, { partyKey } from "./GroupTimeStep";
import PeopleStep from "./PeopleStep";
import {
  GROUP_STEPS,
  GROUP_STEP_LABELS,
  GROUP_STEP_TITLES,
  furthestGroupStep,
  groupStepIndex,
  isGroupStep,
  useGroupDraft,
  type GroupStep,
} from "./state";

const emptyCustomer: Customer = { name: "", email: "", phone: "", notes: "" };

/**
 * Booking for several people at once (/book/group): who's coming, each person's services, a day, a time that
 * works for everyone, then one set of details and one payment. Offers for groups (the Family Visit) apply by
 * themselves when enough people come.
 */
export default function GroupBookingPage() {
  const { search } = useLocation();
  const { data: catalog, error: catalogError } = useAsync(() => provider.getCatalog(), []);
  const { draft, update, add, removeFrom, toggle, setDate, setSlot, reset } = useGroupDraft(catalog);
  const supported = !!provider.createPartyBooking;

  const [customer, setCustomer] = useState<Customer>(emptyCustomer);
  const { state: customerState, signedIn } = useCustomer();
  const signedInEmail = customerState.status === "signed_in" ? customerState.session.email : undefined;
  const profile = customerState.status === "signed_in" ? customerState.profile : undefined;
  useEffect(() => {
    if (!signedInEmail) return;
    setCustomer((c) => ({ ...c, email: signedInEmail, name: profile?.customer?.name || c.name, phone: c.phone || profile?.customer?.phone || "" }));
  }, [signedInEmail, profile]);

  const [customerErrors, setCustomerErrors] = useState<CustomerErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [pending, setPending] = useState<BookingConfirmation | null>(null);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);
  const [bookedOffers, setBookedOffers] = useState<GroupPricing["savings"]>([]);

  const requested = search.get("step");
  const furthest = furthestGroupStep(draft, catalog);
  const wanted: GroupStep = isGroupStep(requested) ? requested : "people";
  const step: GroupStep = groupStepIndex(wanted) <= groupStepIndex(furthest) ? wanted : furthest;

  useEffect(() => {
    if (!confirmation && !pending && requested !== step) navigate(`/book/group?step=${step}`, { replace: true });
  }, [step, requested, confirmation, pending]);
  useEffect(() => {
    document.title = `Book for a group | ${salon.name}`;
  }, []);

  const goTo = (s: GroupStep) => {
    navigate(`/book/group?step=${s}`);
    scrollToTop();
  };
  const next = () => goTo(GROUP_STEPS[groupStepIndex(step) + 1]!);
  const back = () => (step === "people" ? navigate("/book?step=audience") : goTo(GROUP_STEPS[groupStepIndex(step) - 1]!));

  // Prices: each person's services from their own start, with group offers once enough people come.
  const services = catalog ? draft.people.map((p) => servicesById(catalog, p.serviceIds)) : [];
  const { savings, priced } = catalog
    ? partyOfferSavings(
        catalog,
        draft.people.map((p, i) => ({ services: services[i]!, time: draft.slot?.assignments.find((a) => a.ref === p.ref)?.time ?? null })),
        draft.slot ? draft.date : null,
      )
    : { savings: [], priced: [] };
  const total = Math.round(priced.flat().reduce((sum, s) => sum + s.price, 0) * 100) / 100;
  const depositNow = depositFor(priced.flat());
  const pricing: GroupPricing = {
    services,
    savings,
    total,
    from: services.flat().some((s) => s.priceFrom),
    ...(depositNow > 0 && {
      deposit: {
        now: depositNow,
        atSalon: Math.round((total - depositNow) * 100) / 100,
        ...(priced.flat().some((s) => s.priceAgreed) && { agreed: true }),
      },
    }),
  };

  const key = partyKey(draft.people);
  // The party's key stands for the people (a new array each render).
  const loadDates = useCallback((from: ISODate, to: ISODate) => provider.getPartyDates!({ party: draft.people, from, to }), [key]);

  const submit = async () => {
    const errors = validateCustomer(customer);
    setCustomerErrors(errors);
    if (Object.keys(errors).length || !draft.date || !draft.slot) return;
    setSubmitting(true);
    try {
      const result = await provider.createPartyBooking!({ party: draft.people, date: draft.date, slot: draft.slot, customer });
      setBookedOffers(savings);
      if (result.status === "pending_payment") setPending(result);
      else {
        setConfirmation(result);
        reset();
      }
      scrollToTop();
    } catch (e) {
      setSlot(null);
      setSlotError(
        e instanceof SlotUnavailableError || e instanceof BookingExpiredError || e instanceof PaymentsUnavailableError || e instanceof IncompatibleServicesError
          ? e.message
          : e instanceof Error && /still processing|book each person/i.test(e.message)
            ? e.message
            : "Something went wrong. Please choose a time and try again.",
      );
      goTo("time");
    } finally {
      setSubmitting(false);
    }
  };

  const action: CartAction = {
    people: { label: "Continue", disabled: furthest === "people", onClick: next },
    services: { label: "Continue", disabled: groupStepIndex(furthest) <= groupStepIndex("services"), onClick: next },
    date: { label: "Continue", disabled: !draft.date, onClick: next },
    time: { label: "Continue", disabled: !draft.slot, onClick: next },
    details: { label: pricing.deposit ? "Continue" : "Confirm booking", disabled: false, busy: submitting, form: DETAILS_FORM_ID },
  }[step];

  // Payment and confirmation come back without the people; they're as the chosen slot placed them.
  const withPeople = (b: BookingConfirmation) => ({ ...b, people: b.people ?? pending?.people ?? confirmation?.people });

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          {!confirmation && !pending && (
            <button
              type="button"
              onClick={back}
              aria-label={step === "people" ? "Back to booking" : `Back to ${GROUP_STEP_LABELS[GROUP_STEPS[groupStepIndex(step) - 1]!]}`}
              className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full hover:bg-stone-100"
            >
              <Chevron dir="left" />
            </button>
          )}
          {!confirmation && !pending ? (
            <nav aria-label="Booking steps" className="min-w-0 flex-1">
              <p className="text-sm sm:hidden">
                <span className="text-muted">
                  Step {groupStepIndex(step) + 1} of {GROUP_STEPS.length} ·{" "}
                </span>
                {GROUP_STEP_LABELS[step]}
              </p>
              <ol className="hidden items-center gap-1 text-sm sm:flex">
                {GROUP_STEPS.map((s, i) => {
                  const reachable = i <= groupStepIndex(furthest);
                  const current = s === step;
                  return (
                    <li key={s} className="flex items-center gap-1">
                      {i > 0 && <Chevron size={14} />}
                      <button
                        type="button"
                        disabled={!reachable || current}
                        onClick={() => goTo(s)}
                        aria-current={current ? "step" : undefined}
                        className={`rounded px-1.5 py-1 ${current ? "font-medium text-ink" : reachable ? "text-muted hover:text-accent" : "text-muted/40"}`}
                      >
                        {GROUP_STEP_LABELS[s]}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </nav>
          ) : (
            <p className="flex-1 font-serif text-lg">{catalog?.salonName ?? salon.name}</p>
          )}
          <Link to="/" aria-label="Close booking" className="-mr-2 flex h-10 w-10 items-center justify-center rounded-full hover:bg-stone-100">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </Link>
        </div>
      </header>

      {catalogError ? (
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <Notice tone="error">We couldn't load the booking system. Please refresh, or call us to book.</Notice>
        </div>
      ) : !catalog ? (
        <div className="flex items-center justify-center gap-3 py-24 text-muted">
          <Spinner /> Loading…
        </div>
      ) : !supported ? (
        <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
          <Notice>Booking for a group isn't available here yet. Please book each person separately, or call us on {salon.phone}.</Notice>
        </div>
      ) : pending ? (
        <main className="px-4 py-10 sm:px-6">
          <Payment
            booking={pending}
            catalog={catalog}
            onPay={async (b) => withPeople(await provider.completeSimulatedPayment!(b))}
            {...(provider.getBookingStatus && { getStatus: async (b: BookingConfirmation) => withPeople(await provider.getBookingStatus!(b)) })}
            onPaid={(b) => {
              setConfirmation(withPeople(b));
              setPending(null);
              reset();
              scrollToTop();
            }}
            onExpired={(message) => {
              setPending(null);
              setSlot(null);
              setSlotError(message);
              goTo("time");
            }}
          />
        </main>
      ) : confirmation ? (
        <main className="px-4 py-10 sm:px-6">
          <Confirmation
            confirmation={confirmation}
            catalog={catalog}
            email={customer.email}
            offers={bookedOffers.map((s) => s.offer)}
            onBookAnother={() => {
              setConfirmation(null);
              navigate("/book?step=audience", { replace: true });
            }}
          />
        </main>
      ) : (
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-10 px-4 pt-8 pb-36 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:pb-16">
          <main>
            <h1 className="mb-8 font-serif text-3xl sm:text-4xl">{GROUP_STEP_TITLES[step]}</h1>

            {step === "people" && <PeopleStep catalog={catalog} people={draft.people} onAdd={add} onRemove={removeFrom} onChange={update} />}

            {step === "services" && <GroupServicesStep catalog={catalog} people={draft.people} onToggle={toggle} />}

            {step === "date" && (
              <DateStep
                stylistId={null}
                serviceIds={[]}
                selected={draft.date}
                load={loadDates}
                onSelect={(d) => {
                  setDate(d);
                  goTo("time");
                }}
              />
            )}

            {step === "time" && draft.date && (
              <GroupTimeStep
                catalog={catalog}
                people={draft.people}
                date={draft.date}
                selected={draft.slot}
                error={slotError}
                onStylistChange={(ref, stylistId) => {
                  setSlotError(null);
                  update(ref, { stylistId });
                }}
                onDateChange={(d) => {
                  setSlotError(null);
                  setDate(d);
                }}
                onChangeDateClick={() => goTo("date")}
                onSelect={(s) => {
                  setSlotError(null);
                  setSlot(s);
                  goTo("details");
                }}
              />
            )}

            {step === "details" && (
              <DetailsStep
                value={customer}
                errors={customerErrors}
                onChange={(c) => {
                  setCustomer(c);
                  if (Object.keys(customerErrors).length) setCustomerErrors(validateCustomer(c));
                }}
                onSubmit={submit}
                deposit={pricing.deposit}
                signedInEmail={signedInEmail}
                {...(catalog.cancellation && { cancellationHours: catalog.cancellation.windowHours })}
                {...(profile?.customer?.name && { accountName: profile.customer.name })}
                {...(customerState.status === "signed_out" && { onSignedIn: signedIn })}
              />
            )}
          </main>

          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <GroupPanel catalog={catalog} people={draft.people} date={draft.date} slot={draft.slot} pricing={pricing} action={action} />
            </div>
          </aside>
          <GroupBar catalog={catalog} people={draft.people} date={draft.date} slot={draft.slot} pricing={pricing} action={action} />
        </div>
      )}
    </div>
  );
}
