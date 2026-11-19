import { useState, type FormEvent } from "react";
import clippers from "../assets/clippers.jpg";
import { services, timeSlots } from "../data/content";

type FormState = {
  name: string;
  email: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  notes: string;
};

type Errors = Partial<Record<keyof FormState, string>>;

const empty: FormState = { name: "", email: "", phone: "", service: "", date: "", time: "", notes: "" };

const today = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

function validate(f: FormState): Errors {
  const e: Errors = {};
  if (!f.name.trim()) e.name = "Please enter your name.";
  if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = "Please enter a valid email address.";
  if (f.phone.replace(/\D/g, "").length < 10) e.phone = "Please enter a valid phone number.";
  if (!f.service) e.service = "Please choose a service.";
  if (!f.date) e.date = "Please choose a date.";
  else if (f.date < today()) e.date = "Please choose a date in the future.";
  else if (new Date(`${f.date}T12:00:00`).getDay() === 1) e.date = "Sorry, we're closed on Mondays.";
  if (!f.time) e.time = "Please choose a time.";
  return e;
}

const inputClass =
  "mt-1.5 w-full rounded-lg border border-line bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-gold aria-[invalid=true]:border-red-400";

export default function Bookings() {
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState<FormState | null>(null);

  const update = (key: keyof FormState) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const onSubmit = (ev: FormEvent) => {
    ev.preventDefault();
    const e = validate(form);
    setErrors(e);
    if (Object.keys(e).length === 0) {
      // No backend yet: connect this to email or a booking provider.
      setSubmitted(form);
      setForm(empty);
    }
  };

  const field = (key: keyof FormState, label: string) => ({
    id: `booking-${key}`,
    name: key,
    value: form[key],
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `booking-${key}-error` : undefined,
    className: inputClass,
    label,
  });

  const Error = ({ k }: { k: keyof FormState }) =>
    errors[k] ? (
      <p id={`booking-${k}-error`} className="mt-1 text-xs text-red-600">
        {errors[k]}
      </p>
    ) : null;

  return (
    <section id="bookings" className="bg-stone-50/60 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-gold">Bookings</p>
          <h2 className="mt-4 font-serif text-3xl leading-tight sm:text-4xl">Services & appointments</h2>
          <p className="mt-4 leading-relaxed text-muted">
            Choose a service and a time that suits you, and we'll confirm your appointment by email.
          </p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.1fr]">
          {/* Price list */}
          <div className="space-y-8">
            {services.map((group) => (
              <div key={group.category}>
                <h3 className="font-serif text-xl">{group.category}</h3>
                <ul className="mt-3 divide-y divide-line border-y border-line">
                  {group.items.map((s) => (
                    <li key={s.name} className="flex items-baseline justify-between gap-4 py-3 text-sm">
                      <span>
                        {s.name}
                        <span className="ml-2 text-xs text-muted">{s.duration}</span>
                      </span>
                      <span className="shrink-0 font-medium">{s.price}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <img
              src={clippers}
              alt="Professional clippers and guards laid out on a wooden table"
              loading="lazy"
              className="hidden aspect-[16/9] w-full rounded-2xl object-cover lg:block"
            />
          </div>

          {/* Form */}
          <div className="h-fit rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
            {submitted ? (
              <div role="status" className="py-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold/10 text-gold">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                </div>
                <h3 className="mt-6 font-serif text-2xl">Thank you, {submitted.name.split(" ")[0]}!</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  We've received your request for <strong className="text-ink">{submitted.service}</strong> on{" "}
                  {new Date(`${submitted.date}T12:00:00`).toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}{" "}
                  at {submitted.time}. We'll confirm by email at {submitted.email}.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(null)}
                  className="mt-8 rounded-full border border-ink/20 px-6 py-2.5 text-sm transition-colors hover:border-gold hover:text-gold"
                >
                  Make another booking
                </button>
              </div>
            ) : (
              <form noValidate onSubmit={onSubmit} className="grid gap-5 sm:grid-cols-2">
                {(
                  [
                    ["name", "Full name", "text", "name"],
                    ["email", "Email", "email", "email"],
                    ["phone", "Phone", "tel", "tel"],
                  ] as const
                ).map(([key, label, type, autoComplete]) => {
                  const { label: l, ...props } = field(key, label);
                  return (
                    <div key={key} className={key === "name" ? "sm:col-span-2" : ""}>
                      <label htmlFor={props.id} className="text-sm font-medium">
                        {l}
                      </label>
                      <input
                        {...props}
                        type={type}
                        autoComplete={autoComplete}
                        onChange={(e) => update(key)(e.target.value)}
                      />
                      <Error k={key} />
                    </div>
                  );
                })}

                <div className="sm:col-span-2">
                  {(() => {
                    const { label, ...props } = field("service", "Service");
                    return (
                      <>
                        <label htmlFor={props.id} className="text-sm font-medium">
                          {label}
                        </label>
                        <select {...props} onChange={(e) => update("service")(e.target.value)}>
                          <option value="">Select a service…</option>
                          {services.map((g) => (
                            <optgroup key={g.category} label={g.category}>
                              {g.items.map((s) => (
                                <option key={s.name} value={s.name}>
                                  {s.name} ({s.price})
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </>
                    );
                  })()}
                  <Error k="service" />
                </div>

                <div>
                  {(() => {
                    const { label, ...props } = field("date", "Date");
                    return (
                      <>
                        <label htmlFor={props.id} className="text-sm font-medium">
                          {label}
                        </label>
                        <input {...props} type="date" min={today()} onChange={(e) => update("date")(e.target.value)} />
                      </>
                    );
                  })()}
                  <Error k="date" />
                </div>

                <div>
                  {(() => {
                    const { label, ...props } = field("time", "Time");
                    return (
                      <>
                        <label htmlFor={props.id} className="text-sm font-medium">
                          {label}
                        </label>
                        <select {...props} onChange={(e) => update("time")(e.target.value)}>
                          <option value="">Select a time…</option>
                          {timeSlots.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </>
                    );
                  })()}
                  <Error k="time" />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="booking-notes" className="text-sm font-medium">
                    Notes <span className="font-normal text-muted">(optional)</span>
                  </label>
                  <textarea
                    id="booking-notes"
                    name="notes"
                    rows={3}
                    value={form.notes}
                    onChange={(e) => update("notes")(e.target.value)}
                    className={inputClass}
                    placeholder="Anything we should know: hair history, preferred stylist…"
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-full bg-ink px-7 py-3.5 text-sm font-medium text-white transition-colors hover:bg-gold sm:col-span-2"
                >
                  Request appointment
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
