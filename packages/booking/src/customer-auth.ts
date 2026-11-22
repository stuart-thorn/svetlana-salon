/**
 * Customer sign-in with a code sent by email: the Bookable customer pool (Amazon Cognito, passwordless
 * EMAIL_OTP), called directly over its JSON API so the site ships no AWS SDK.
 *
 * Someone new gets an account as they sign in: SignUp sends the code that confirms their email, and the
 * confirmation's session signs them straight in. Someone known gets an EMAIL_OTP challenge. Either way the
 * customer sees the same thing: "enter the code we emailed you".
 *
 * Only the ID token is kept (sessionStorage, for this tab's booking): it proves the email to the booking API
 * for an hour. Nothing longer-lived is stored in the browser.
 */

export interface CustomerAuthOptions {
  /** The booking-sites app client of the customer pool. */
  clientId: string;
  region?: string;
  fetch?: typeof fetch;
  storage?: Pick<Storage, "getItem" | "setItem" | "removeItem">;
}

export interface CustomerSession {
  email: string;
  idToken: string;
  /** Epoch ms. */
  expiresAt: number;
}

/** A code the customer typed wasn't right, or has expired. */
export class CodeError extends Error {}

type Pending =
  | { kind: "sign_up"; email: string; session?: string }
  | { kind: "sign_in"; email: string; session: string }
  | { kind: "confirm"; email: string };

const STORAGE_KEY = "cws:customer-session";

interface CognitoError {
  __type?: string;
  message?: string;
}

export function createCustomerAuth(options: CustomerAuthOptions) {
  const { clientId, region = "eu-west-2" } = options;
  const doFetch = options.fetch ?? ((input, init) => fetch(input, init));
  const storage = options.storage ?? (typeof sessionStorage === "undefined" ? undefined : sessionStorage);
  let pending: Pending | undefined;
  let current: CustomerSession | undefined;
  try {
    const stored = storage?.getItem(STORAGE_KEY);
    if (stored) current = JSON.parse(stored) as CustomerSession;
  } catch {
    current = undefined;
  }

  async function cognito<T>(operation: string, body: Record<string, unknown>): Promise<T> {
    let res: Response;
    try {
      res = await doFetch(`https://cognito-idp.${region}.amazonaws.com/`, {
        method: "POST",
        headers: { "Content-Type": "application/x-amz-json-1.1", "X-Amz-Target": `AWSCognitoIdentityProviderService.${operation}` },
        body: JSON.stringify({ ClientId: clientId, ...body }),
      });
    } catch {
      throw new Error("We couldn't reach the sign-in service. Check your connection and try again.");
    }
    const json = (await res.json().catch(() => ({}))) as T & CognitoError;
    if (res.ok) return json;
    const type = (json.__type ?? "").split("#").pop() ?? "";
    const err = Object.assign(new Error(json.message ?? `Sign-in failed (${res.status})`), { type });
    throw err;
  }

  const errorType = (err: unknown) => (err as { type?: string }).type ?? "";

  function save(email: string, result: { IdToken: string; ExpiresIn: number }): CustomerSession {
    const session = { email, idToken: result.IdToken, expiresAt: Date.now() + result.ExpiresIn * 1000 };
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      /* private mode: signed in for this page only */
    }
    current = session;
    pending = undefined;
    return session;
  }

  async function startSignIn(email: string): Promise<void> {
    const challenge = await cognito<{ ChallengeName?: string; Session?: string }>("InitiateAuth", {
      AuthFlow: "USER_AUTH",
      AuthParameters: { USERNAME: email, PREFERRED_CHALLENGE: "EMAIL_OTP" },
    });
    if (challenge.ChallengeName !== "EMAIL_OTP" || !challenge.Session) throw new Error("Sign-in by email code isn't available.");
    pending = { kind: "sign_in", email, session: challenge.Session };
  }

  return {
    /** The signed-in customer, while their token is good for at least another minute. */
    session(): CustomerSession | undefined {
      return current && current.expiresAt - Date.now() > 60_000 ? current : undefined;
    },

    /** Emails a sign-in code to `email`. */
    async sendCode(rawEmail: string): Promise<void> {
      const email = rawEmail.trim().toLowerCase();
      try {
        const res = await cognito<{ Session?: string }>("SignUp", { Username: email, UserAttributes: [{ Name: "email", Value: email }] });
        pending = { kind: "sign_up", email, ...(res.Session && { session: res.Session }) };
        return;
      } catch (err) {
        if (errorType(err) !== "UsernameExistsException") throw err;
      }
      try {
        await startSignIn(email);
      } catch (err) {
        // Signed up before but never typed the code: send the confirmation code again.
        if (errorType(err) !== "UserNotConfirmedException") throw err;
        await cognito("ResendConfirmationCode", { Username: email });
        pending = { kind: "confirm", email };
      }
    },

    /**
     * Checks the code. Returns the session once signed in, or "code_sent" when one more code was needed (an
     * account confirmed without a sign-in session gets a fresh sign-in code).
     */
    async verifyCode(rawCode: string): Promise<CustomerSession | "code_sent"> {
      const code = rawCode.replace(/\s/g, "");
      if (!pending) throw new Error("Ask for a code first.");
      const p = pending;
      try {
        if (p.kind === "sign_in") {
          const res = await cognito<{ AuthenticationResult?: { IdToken: string; ExpiresIn: number }; Session?: string }>("RespondToAuthChallenge", {
            ChallengeName: "EMAIL_OTP",
            Session: p.session,
            ChallengeResponses: { USERNAME: p.email, EMAIL_OTP_CODE: code },
          });
          if (!res.AuthenticationResult) throw new CodeError("That code didn't work. Ask for a new one.");
          return save(p.email, res.AuthenticationResult);
        }
        const confirmed = await cognito<{ Session?: string }>("ConfirmSignUp", {
          Username: p.email,
          ConfirmationCode: code,
          ...(p.kind === "sign_up" && p.session && { Session: p.session }),
        });
        if (confirmed.Session) {
          const res = await cognito<{ AuthenticationResult?: { IdToken: string; ExpiresIn: number } }>("InitiateAuth", {
            AuthFlow: "USER_AUTH",
            AuthParameters: { USERNAME: p.email },
            Session: confirmed.Session,
          });
          if (res.AuthenticationResult) return save(p.email, res.AuthenticationResult);
        }
        await startSignIn(p.email);
        return "code_sent";
      } catch (err) {
        const type = errorType(err);
        if (type === "CodeMismatchException") throw new CodeError("That code isn't right. Check the email and try again.");
        if (type === "ExpiredCodeException" || type === "NotAuthorizedException") {
          throw new CodeError("That code has expired. Ask for a new one.");
        }
        throw err;
      }
    },

    signOut(): void {
      current = undefined;
      pending = undefined;
      try {
        storage?.removeItem(STORAGE_KEY);
      } catch {
        /* nothing stored */
      }
    },
  };
}

export type CustomerAuth = ReturnType<typeof createCustomerAuth>;
