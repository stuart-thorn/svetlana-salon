import type { FormEvent } from "react";
import { formatPrice, type Customer } from "@salon/booking";

export type CustomerErrors = Partial<Record<keyof Customer, string>>;

export const DETAILS_FORM_ID = "booking-details";

export function validateCustomer(c: Customer): CustomerErrors {
  const e: CustomerErrors = {};
  if (!c.name.trim()) e.name = "Please enter your name.";
  if (!/^\S+@\S+\.\S+$/.test(c.email.trim())) e.email = "Please enter a valid email address.";
  if (c.phone.replace(/\D/g, "").length < 10) e.phone = "Please enter a valid phone number.";
  return e;
}

interface Props {
  value: Customer;
  errors: CustomerErrors;
  onChange: (value: Customer) => void;
  onSubmit: () => void;
  /** Amounts in pounds when part of the price is paid online. */
  deposit?: { now: number; atSalon: number };
}

const inputClass =
  "mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-base outline-none sm:text-sm transition-colors focus:border-gold aria-[invalid=true]:border-red-400";

const FIELDS = [
  { key: "name", label: "Full name", type: "text", autoComplete: "name" },
  { key: "email", label: "Email", type: "email", autoComplete: "email" },
  { key: "phone", label: "Mobile number", type: "tel", autoComplete: "tel" },
] as const;

export default function DetailsStep({ value, errors, onChange, onSubmit, deposit }: Props) {
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form id={DETAILS_FORM_ID} noValidate onSubmit={submit} className="max-w-lg space-y-5">
      {FIELDS.map((f) => (
        <div key={f.key}>
          <label htmlFor={`customer-${f.key}`} className="text-sm font-medium">
            {f.label}
          </label>
          <input
            id={`customer-${f.key}`}
            name={f.key}
            type={f.type}
            autoComplete={f.autoComplete}
            value={value[f.key]}
            onChange={(e) => onChange({ ...value, [f.key]: e.target.value })}
            aria-invalid={errors[f.key] ? true : undefined}
            aria-describedby={errors[f.key] ? `customer-${f.key}-error` : undefined}
            className={inputClass}
          />
          {errors[f.key] && (
            <p id={`customer-${f.key}-error`} className="mt-1 text-xs text-red-600">
              {errors[f.key]}
            </p>
          )}
        </div>
      ))}
      <div>
        <label htmlFor="customer-notes" className="text-sm font-medium">
          Notes <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="customer-notes"
          name="notes"
          rows={3}
          value={value.notes ?? ""}
          onChange={(e) => onChange({ ...value, notes: e.target.value })}
          placeholder="Anything we should know: hair history, allergies, access needs…"
          className={inputClass}
        />
      </div>
      <p className="text-xs text-muted">
        {deposit
          ? `A ${formatPrice(deposit.now)} deposit is paid online on the next step to secure your appointment. The remaining ${formatPrice(deposit.atSalon)} is paid in the salon. We'll email your confirmation.`
          : "No payment is taken online. We'll email your confirmation."}
      </p>
    </form>
  );
}
