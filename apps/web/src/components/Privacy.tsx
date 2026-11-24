import { useEffect } from "react";
import { Link } from "../router";
import { salon } from "../data/content";

/**
 * Privacy notice: what the salon keeps about customers and why. Draft wording for the salon to confirm;
 * the salon is the controller, Bookable Agent the processor that hosts the booking system.
 */
export default function Privacy() {
  useEffect(() => {
    document.title = `Privacy | ${salon.name}`;
  }, []);

  const h2 = "mt-10 mb-3 font-serif text-2xl";
  return (
    <article className="mx-auto max-w-2xl px-4 py-12 leading-relaxed text-ink sm:px-6">
      <p className="text-sm">
        <Link to="/" className="text-muted underline underline-offset-2 hover:text-accent">
          ← {salon.name}
        </Link>
      </p>
      <h1 className="mt-6 font-serif text-4xl">Privacy</h1>
      <p className="mt-4 text-muted">
        How {salon.legalName} ("we") looks after the details you give us when you book. We're responsible for your
        information (the data controller).
      </p>

      <h2 className={h2}>What we keep</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Your name, email address and phone number.</li>
        <li>Your appointments: the date and time, the services, who looked after you, and what you paid.</li>
        <li>Anything you tell us in the notes, and notes our team adds to help look after you, such as allergies or patch-test dates.</li>
      </ul>

      <h2 className={h2}>Why</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>To take and manage your bookings, and to contact you about them (to perform our contract with you).</li>
        <li>
          To remember your past visits, so we can suggest the person who looked after you last and keep your details
          up to date (our legitimate interest in giving you good service).
        </li>
        <li>To keep financial records, as the law requires.</li>
      </ul>
      <p className="mt-3">We don't send marketing unless you've said yes, and we never sell your information.</p>

      <h2 className={h2}>Signing in</h2>
      <p>
        You can book without an account. If you choose to sign in, we email you a one-time code. Signing in only proves
        that the email address is yours, so we can show you your details. There's no password, and you stay signed in
        for this visit to our site only.
      </p>

      <h2 className={h2}>Who else sees it</h2>
      <p>
        Our booking system is run for us by Bookable Agent, which stores your information on Amazon Web Services in the
        UK (London) and handles it only on our instructions. Card payments are handled by our payment provider; we
        never see your full card number.
      </p>

      <h2 className={h2}>How long we keep it</h2>
      <p>
        We keep your details while you're a customer and for up to two years after your last visit, then delete them.
        Records of payments are kept for six years, as the law requires.
      </p>

      <h2 className={h2}>Your rights</h2>
      <p>
        You can ask for a copy of what we hold about you, ask us to correct it, or ask us to delete it. Email{" "}
        <a href={`mailto:${salon.email}`} className="underline underline-offset-2 hover:text-accent">
          {salon.email}
        </a>
        . If you're unhappy with how we've handled your information, you can complain to the Information
        Commissioner's Office (ico.org.uk).
      </p>
    </article>
  );
}
