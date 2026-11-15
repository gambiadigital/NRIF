import "server-only";
import { q, one } from "./db";
import { HttpError } from "./http";
import { siteUrl } from "./messages";

/*
 * Six-digit sign-in codes by email, sent and checked by Neon Auth (Managed Better Auth) on the NRIF branch.
 * We only use it to prove someone controls an email address; the session that follows is our own signed cookie.
 * Neon emails the code itself (its shared sender until NRIF connects SMTP), so no email provider is needed here.
 */

const PER_HOUR = 5;

function base() {
  const b = process.env.NEON_AUTH_BASE_URL;
  if (!b) throw new HttpError(503, "Email codes are not switched on yet. Use your booking reference instead.");
  return b.replace(/\/$/, "");
}

async function neonAuth(path: string, body: unknown) {
  // Better Auth checks the Origin against the branch's trusted domains, so it must be this site's own address.
  const res = await fetch(`${base()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: siteUrl() },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { code?: string; message?: string; user?: { email?: string } };
  return { ok: res.ok, status: res.status, data };
}

export const normaliseEmail = (e: string) => e.trim().toLowerCase();

/** Sends a code, at most PER_HOUR times an hour per address. Throws only for limits and outages. */
export async function sendEmailCode(email: string, purpose: "entry" | "admin" | "setup") {
  const e = normaliseEmail(email);
  const recent = await one<{ n: number }>("select count(*)::int as n from code_requests where lower(email) = $1 and at > now() - interval '1 hour'", [e]);
  if ((recent?.n ?? 0) >= PER_HOUR) throw new HttpError(429, "Too many codes asked for. Wait an hour and try again.");
  await q("insert into code_requests (email, purpose) values ($1, $2)", [e, purpose]);
  const r = await neonAuth("/email-otp/send-verification-otp", { email: e, type: "sign-in" });
  if (!r.ok) {
    console.error("neon auth send", r.status, r.data);
    throw new HttpError(502, "We could not send a code just now. Please try again in a minute.");
  }
}

/** Checks a code with Neon Auth and returns the verified address, or throws a message for the person. */
export async function checkEmailCode(email: string, code: string): Promise<string> {
  const e = normaliseEmail(email);
  if (!/^\d{6}$/.test(code)) throw new HttpError(400, "Enter the six-digit code from the email");
  const r = await neonAuth("/sign-in/email-otp", { email: e, otp: code });
  if (r.ok) {
    // Neon only answers 200 when the code matches this address; if it names the user, it must be the same one.
    const named = r.data.user?.email?.toLowerCase();
    if (named && named !== e) throw new HttpError(401, "That code did not work. Ask for a new one.");
    return e;
  }
  switch (r.data.code) {
    case "INVALID_OTP":
      throw new HttpError(401, "That code is not right. Check the email and try again.");
    case "OTP_EXPIRED":
      throw new HttpError(401, "That code has expired. Ask for a new one.");
    case "TOO_MANY_ATTEMPTS":
      throw new HttpError(429, "Too many tries with that code. Ask for a new one.");
    default:
      console.error("neon auth verify", r.status, r.data);
      throw new HttpError(502, "We could not check the code just now. Please try again.");
  }
}
