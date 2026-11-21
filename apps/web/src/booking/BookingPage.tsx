import { useEffect, useState } from "react";
import { BookingExpiredError, SlotUnavailableError, depositFor, servicesById, totals, type BookingConfirmation, type Customer } from "@salon/booking";
import { Link, navigate, scrollToTop, useLocation } from "../router";
import { CartBar, CartPanel, type CartAction } from "./Cart";
import Confirmation from "./Confirmation";
import Payment from "./Payment";
import { salon } from "../data/content";
import { isDemo, isTestMode, provider } from "./provider";
import { FAMILY, STEPS, STEP_LABELS, STEP_TITLES, furthestStep, isStep, stepIndex, stylistIdOrNull, useDraft, type Step } from "./state";
import AudienceStep from "./steps/AudienceStep";
import DateStep from "./steps/DateStep";
import DetailsStep, { DETAILS_FORM_ID, validateCustomer, type CustomerErrors } from "./steps/DetailsStep";
import ProfessionalStep from "./steps/ProfessionalStep";
import ServicesStep from "./steps/ServicesStep";
import TimeStep from "./steps/TimeStep";
import { useAsync } from "./useAsync";
import { Chevron, Notice, Spinner } from "./ui";

const emptyCustomer: Customer = { name: "", email: "", phone: "", notes: "" };

export default function BookingPage() {
  const { search } = useLocation();
  const { data: catalog, error: catalogError } = useAsync(() => provider.getCatalog(), []);
  const { draft, chooseStylist, chooseAudience, selectService, setDate, setTime, reset } = useDraft(catalog);

  const [customer, setCustomer] = useState<Customer>(emptyCustomer);
  const [customerErrors, setCustomerErrors] = useState<CustomerErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);
  /** A booking waiting for its deposit (the slot is held until it expires). */
  const [pending, setPending] = useState<BookingConfirmation | null>(null);

  // The URL drives the step, but you can't skip ahead of what you've chosen.
  const requested = search.get("step");
  // Without audiences in the catalogue there's nothing to ask on the first step.
  const needsAudience = !catalog || catalog.audiences.length > 0;
  const furthest = furthestStep(draft, needsAudience);
  const first: Step = needsAudience ? "audience" : "professional";
  const wanted: Step = isStep(requested) && (needsAudience || requested !== "audience") ? requested : first;
  const step: Step = stepIndex(wanted) <= stepIndex(furthest) ? wanted : furthest;

  useEffect(() => {
    if (!confirmation && !pending && requested !== step) navigate(`/book?step=${step}`, { replace: true });
  }, [step, requested, confirmation, pending]);

  useEffect(() => {
    document.title = `Book an appointment | ${salon.name}`;
  }, []);

  const goTo = (s: Step) => {
    navigate(`/book?step=${s}`);
    scrollToTop();
  };
  const next = () => goTo(STEPS[stepIndex(step) + 1]!);
  const back = () => (step === first ? navigate("/") : goTo(STEPS[stepIndex(step) - 1]!));

  const submit = async () => {
    const errors = validateCustomer(customer);
    setCustomerErrors(errors);
    if (Object.keys(errors).length || !draft.date || !draft.time) return;
    setSubmitting(true);
    try {
      const result = await provider.createBooking({
        stylistId: stylistIdOrNull(draft),
        serviceIds: draft.serviceIds,
        date: draft.date,
        time: draft.time,
        customer,
      });
      if (result.status === "pending_payment") {
        setPending(result);
      } else {
        setConfirmation(result);
        reset();
      }
      scrollToTop();
    } catch (e) {
      setTime(null);
      setSlotError(
        e instanceof SlotUnavailableError || e instanceof BookingExpiredError || (e instanceof Error && /still processing/.test(e.message))
          ? e.message
          : "Something went wrong. Please choose a time and try again.",
      );
      goTo("time");
    } finally {
      setSubmitting(false);
    }
  };

  const selected = catalog ? servicesById(catalog, draft.serviceIds) : [];
  const depositNow = depositFor(selected);
  const deposit = depositNow > 0 ? { now: depositNow, atSalon: totals(selected).price - depositNow } : undefined;

  const action: CartAction = {
    audience: { label: "Continue", disabled: !draft.audience || draft.audience === FAMILY, onClick: next },
    professional: { label: "Continue", disabled: !draft.stylist, onClick: next },
    services: { label: "Continue", disabled: !draft.serviceIds.length, onClick: next },
    date: { label: "Continue", disabled: !draft.date, onClick: next },
    time: { label: "Continue", disabled: !draft.time, onClick: next },
    details: { label: deposit ? "Continue to payment" : "Confirm booking", disabled: false, busy: submitting, form: DETAILS_FORM_ID },
  }[step];

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          {!confirmation && !pending && (
            <button
              type="button"
              onClick={back}
              aria-label={step === first ? "Back to website" : `Back to ${STEP_LABELS[STEPS[stepIndex(step) - 1]!]}`}
              className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full hover:bg-stone-100"
            >
              <Chevron dir="left" />
            </button>
          )}

          {!confirmation && !pending && (
            <nav aria-label="Booking steps" className="min-w-0 flex-1">
              <p className="text-sm sm:hidden">
                <span className="text-muted">
                  Step {stepIndex(step) + 1} of {STEPS.length} ·{" "}
                </span>
                {STEP_LABELS[step]}
              </p>
              <ol className="hidden items-center gap-1 text-sm sm:flex">
                {STEPS.map((s, i) => {
                  const reachable = i <= stepIndex(furthest);
                  const current = s === step;
                  return (
                    <li key={s} className="flex items-center gap-1">
                      {i > 0 && <Chevron size={14} />}
                      <button
                        type="button"
                        disabled={!reachable || current}
                        onClick={() => goTo(s)}
                        aria-current={current ? "step" : undefined}
                        className={`rounded px-1.5 py-1 ${current ? "font-medium text-ink" : reachable ? "text-muted hover:text-gold" : "text-muted/40"}`}
                      >
                        {STEP_LABELS[s]}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </nav>
          )}
          {(confirmation || pending) && <p className="flex-1 font-serif text-lg">{catalog?.salonName ?? salon.name}</p>}

          <Link to="/" aria-label="Close booking" className="-mr-2 flex h-10 w-10 items-center justify-center rounded-full hover:bg-stone-100">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </Link>
        </div>
        {isDemo && (
          <p className="bg-amber-50 px-4 py-1.5 text-center text-xs text-amber-900">
            Demo mode: availability is simulated and no real bookings are made.
          </p>
        )}
        {isTestMode && (
          <p className="bg-amber-50 px-4 py-1.5 text-center text-xs text-amber-900">
            Test mode: bookings go to the test booking system and payments are simulated.
          </p>
        )}
      </header>

      {catalogError ? (
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <Notice tone="error">We couldn't load the booking system. Please refresh, or call us to book.</Notice>
        </div>
      ) : !catalog ? (
        <div className="flex items-center justify-center gap-3 py-24 text-muted">
          <Spinner /> Loading…
        </div>
      ) : pending ? (
        <main className="px-4 py-10 sm:px-6">
          <Payment
            booking={pending}
            catalog={catalog}
            onPay={(b) => provider.completeSimulatedPayment!(b)}
            onPaid={(b) => {
              setPending(null);
              setConfirmation(b);
              reset();
              scrollToTop();
            }}
            onExpired={(message) => {
              setPending(null);
              setTime(null);
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
            onBookAnother={() => {
              setConfirmation(null);
              setCustomerErrors({});
              navigate(`/book?step=${first}`, { replace: true });
            }}
          />
        </main>
      ) : (
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-10 px-4 pt-8 pb-36 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:pb-16">
          <main>
            <h1 className="mb-8 font-serif text-3xl sm:text-4xl">
              {(step === "audience" && catalog.audiencesPrompt) || STEP_TITLES[step]}
            </h1>

            {step === "audience" && (
              <AudienceStep
                catalog={catalog}
                selected={draft.audience}
                onSelect={(id) => {
                  chooseAudience(id);
                  if (id !== FAMILY) goTo("professional");
                }}
              />
            )}

            {step === "professional" && (
              <ProfessionalStep
                catalog={catalog}
                audience={draft.audience}
                selected={draft.stylist}
                onSelect={(id) => {
                  chooseStylist(id);
                  goTo("services");
                }}
              />
            )}

            {step === "services" && (
              <ServicesStep
                catalog={catalog}
                stylist={draft.stylist}
                audience={draft.audience}
                selectedIds={draft.serviceIds}
                onSelect={selectService}
              />
            )}

            {step === "date" && (
              <DateStep
                stylistId={stylistIdOrNull(draft)}
                serviceIds={draft.serviceIds}
                selected={draft.date}
                onSelect={(d) => {
                  setDate(d);
                  goTo("time");
                }}
              />
            )}

            {step === "time" && draft.date && draft.stylist && (
              <TimeStep
                catalog={catalog}
                stylist={draft.stylist}
                serviceIds={draft.serviceIds}
                date={draft.date}
                selected={draft.time}
                error={slotError}
                onStylistChange={(id) => {
                  setSlotError(null);
                  chooseStylist(id, { keepDate: true });
                }}
                onDateChange={(d) => {
                  setSlotError(null);
                  setDate(d);
                }}
                onChangeDateClick={() => goTo("date")}
                onSelect={(t) => {
                  setSlotError(null);
                  setTime(t);
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
                deposit={deposit}
              />
            )}
          </main>

          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <CartPanel catalog={catalog} draft={draft} action={action} />
            </div>
          </aside>
          <CartBar catalog={catalog} draft={draft} action={action} />
        </div>
      )}
    </div>
  );
}
