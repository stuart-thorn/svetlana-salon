import { describe, expect, it } from "vitest";
import { CodeError, createCustomerAuth } from "./customer-auth";

type Reply = { status?: number; body: Record<string, unknown> };

/** A scripted Cognito: each operation answers from a queue of replies. */
function fakeCognito(script: Record<string, Reply[]>) {
  const calls: { op: string; body: Record<string, unknown> }[] = [];
  const fetch = (async (_url: string, init?: RequestInit) => {
    const op = String((init?.headers as Record<string, string>)["X-Amz-Target"]).split(".").pop()!;
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    calls.push({ op, body });
    const reply = script[op]?.shift();
    if (!reply) throw new Error(`Unexpected ${op}`);
    return new Response(JSON.stringify(reply.body), { status: reply.status ?? 200 });
  }) as typeof globalThis.fetch;
  const store = new Map<string, string>();
  const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) };
  return { auth: createCustomerAuth({ clientId: "client1", fetch, storage }), calls, store };
}

const tokens = { AuthenticationResult: { IdToken: "id.token", ExpiresIn: 3600 } };
const exists = { status: 400, body: { __type: "UsernameExistsException", message: "exists" } };

describe("customer sign-in by email code", () => {
  it("signs a known customer in with an EMAIL_OTP challenge", async () => {
    const { auth, calls, store } = fakeCognito({
      SignUp: [exists],
      InitiateAuth: [{ body: { ChallengeName: "EMAIL_OTP", Session: "s1" } }],
      RespondToAuthChallenge: [{ body: tokens }],
    });
    await auth.sendCode(" Ana@Example.com ");
    const session = await auth.verifyCode("123 456");
    expect(session).toMatchObject({ email: "ana@example.com", idToken: "id.token" });
    expect(calls.at(-1)).toEqual({
      op: "RespondToAuthChallenge",
      body: { ClientId: "client1", ChallengeName: "EMAIL_OTP", Session: "s1", ChallengeResponses: { USERNAME: "ana@example.com", EMAIL_OTP_CODE: "123456" } },
    });
    expect(auth.session()?.idToken).toBe("id.token");
    expect(store.size).toBe(1);
    auth.signOut();
    expect(auth.session()).toBeUndefined();
    expect(store.size).toBe(0);
  });

  it("creates someone new and signs them straight in with the confirmation code", async () => {
    const { auth, calls } = fakeCognito({
      SignUp: [{ body: { UserConfirmed: false, Session: "signup" } }],
      ConfirmSignUp: [{ body: { Session: "confirmed" } }],
      InitiateAuth: [{ body: tokens }],
    });
    await auth.sendCode("new@example.com");
    expect(calls[0]!.body).not.toHaveProperty("Password");
    expect(await auth.verifyCode("111111")).toMatchObject({ email: "new@example.com" });
    expect(calls.map((c) => c.op)).toEqual(["SignUp", "ConfirmSignUp", "InitiateAuth"]);
    expect(calls[1]!.body).toMatchObject({ Session: "signup", ConfirmationCode: "111111" });
  });

  it("re-sends a confirmation to someone who never finished signing up, then asks for one more code", async () => {
    const { auth } = fakeCognito({
      SignUp: [exists],
      InitiateAuth: [{ status: 400, body: { __type: "UserNotConfirmedException" } }, { body: { ChallengeName: "EMAIL_OTP", Session: "s2" } }],
      ResendConfirmationCode: [{ body: {} }],
      ConfirmSignUp: [{ body: {} }],
      RespondToAuthChallenge: [{ body: tokens }],
    });
    await auth.sendCode("half@example.com");
    expect(await auth.verifyCode("222222")).toBe("code_sent");
    expect(await auth.verifyCode("333333")).toMatchObject({ email: "half@example.com" });
  });

  it("explains a wrong or expired code", async () => {
    const { auth } = fakeCognito({
      SignUp: [exists, exists],
      InitiateAuth: [{ body: { ChallengeName: "EMAIL_OTP", Session: "s" } }, { body: { ChallengeName: "EMAIL_OTP", Session: "s" } }],
      RespondToAuthChallenge: [
        { status: 400, body: { __type: "CodeMismatchException" } },
        { status: 400, body: { __type: "NotAuthorizedException" } },
      ],
    });
    await auth.sendCode("ana@example.com");
    await expect(auth.verifyCode("000000")).rejects.toBeInstanceOf(CodeError);
    await auth.sendCode("ana@example.com");
    await expect(auth.verifyCode("000000")).rejects.toThrow("expired");
  });
});
