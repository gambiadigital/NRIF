import "server-only";
import { after } from "next/server";
import nodemailer, { type Transporter } from "nodemailer";
import { q, one, settings } from "./db";
import { COUNTRY_CODES, money } from "@/lib/format";
import { emailFooter, render, subjectFor } from "@/lib/messages";

/*
 * Emails go through an outbox table. Rendering and queueing always happen; sending happens once a way to send is
 * configured. Until then messages wait as "queued" and the admin console shows them, so nothing is lost. Texts (SMS)
 * were dropped on 2026-11-19: participants hear from NRIF by email only.
 *
 * Two ways to send, the first one configured wins:
 *  - SMTP, no domain needed: GMAIL_USER + GMAIL_APP_PASSWORD (a Gmail account with 2-step verification and an app
 *    password; Gmail allows about 500 emails a day), or any server as SMTP_URL (smtps://user:pass@host:465). The
 *    sender is EMAIL_FROM_NAME (default "Run for Independence") <the account's address, or SMTP_FROM>.
 *  - Resend: RESEND_API_KEY + EMAIL_FROM, which must be on a domain verified in Resend (its default sender only
 *    reaches the Resend account owner).
 */

export { render };

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://nrif.vercel.app").replace(/\/$/, "");
}

/** The short link printed in emails: /b/7Q4K-a8Kd2f3x opens that booking without signing in. */
export function shortLink(reference: string, key: string) {
  return `${siteUrl()}/b/${reference.replace(/^RFI-/, "")}-${key.slice(0, 8)}`;
}

export function e164(iso: string, digits: string) {
  const dial = COUNTRY_CODES.find((c) => c.iso === iso)?.dial ?? "+220";
  return `${dial}${digits}`;
}

export async function varsFor(bookingId: string) {
  const b = await one<{ reference: string; access_key: string; currency: string; total: string; hold_until: string; phone_iso: string; phone: string; email: string }>(
    "select reference, access_key, currency, total, hold_until, phone_iso, phone, email from bookings where id = $1",
    [bookingId],
  );
  if (!b) return null;
  const people = await q<{ full_name: string; bib: string | null; name: string; start_time: string }>(
    "select p.full_name, p.bib, e.name, e.start_time from participants p join events e on e.id = p.event_id where p.booking_id = $1 order by p.position",
    [bookingId],
  );
  const lead = people[0];
  const hold = new Date(b.hold_until).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
  return {
    b,
    vars: {
      first: lead?.full_name.split(/\s+/)[0] ?? "runner",
      event: lead?.name ?? "",
      start: lead?.start_time ?? "",
      bib: lead?.bib ?? "",
      bibs: people.map((p) => p.bib).filter(Boolean).join(", "),
      ref: b.reference,
      amount: money(Number(b.total), b.currency as never, { decimals: b.currency !== "GMD" }),
      hold,
      link: shortLink(b.reference, b.access_key).replace(/^https?:\/\//, ""),
    } as Record<string, string>,
  };
}

export async function queueForBooking(bookingId: string, templateId: string) {
  const t = await one<{ body: string; enabled: boolean }>("select body, enabled from templates where id = $1", [templateId]);
  if (!t || !t.enabled) return;
  const ctx = await varsFor(bookingId);
  if (!ctx) return;
  const text = render(t.body, ctx.vars);
  await q("insert into messages (booking_id, channel, to_addr, template, subject, body) values ($1, 'email', $2, $3, $4, $5)", [
    bookingId,
    ctx.b.email,
    templateId,
    subjectFor(templateId, ctx.vars),
    `${text}\n\n${emailFooter(ctx.vars.link!)}`,
  ]);
}

type Smtp = { url: string; from: string };
function smtp(): Smtp | null {
  const name = (process.env.EMAIL_FROM_NAME || "Run for Independence").replace(/"/g, "");
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
  if (user && pass) return { url: `smtps://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@smtp.gmail.com:465`, from: `"${name}" <${user}>` };
  const url = process.env.SMTP_URL?.trim();
  if (!url) return null;
  const addr = process.env.SMTP_FROM?.trim() || decodeURIComponent(new URL(url).username);
  return { url, from: `"${name}" <${addr}>` };
}
const resendOn = () => !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

/** email: emails can go out. emailKey: the Resend key is in, but EMAIL_FROM (a verified sender) may still be missing. */
export function providers() {
  return { email: !!smtp() || resendOn(), emailKey: !!process.env.RESEND_API_KEY, via: smtp() ? "smtp" : resendOn() ? "resend" : null };
}

/** A problem with the account (key, unverified sender domain, rate limit, outage), not with one email: stop, keep the rest queued. */
class ProviderError extends Error {}

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** The same words as the plain text, in a simple branded layout. Links become links; nothing else is added. */
function emailHtml(text: string) {
  const paras = esc(text)
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, "<br>").replace(/https?:\/\/[^\s<]+/g, (u) => `<a href="${u}" style="color:#135f40;font-weight:600">${u.replace(/^https?:\/\//, "")}</a>`))
    .map((p) => `<p style="margin:0 0 16px">${p}</p>`)
    .join("");
  return `<!doctype html><html><body style="margin:0;background:#f3f2ee;font-family:Arial,Helvetica,sans-serif;color:#0b1b3a">
<div style="max-width:560px;margin:0 auto;padding:24px 16px">
<div style="height:6px;border-radius:6px 6px 0 0;background:linear-gradient(90deg,#d7141a 0 33%,#1f3c99 33% 66%,#135f40 66%)"></div>
<div style="background:#ffffff;border-radius:0 0 16px 16px;padding:28px 24px;font-size:15px;line-height:1.55">
<p style="margin:0 0 18px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#5d6577;font-weight:700">Run for Independence 2027</p>
${paras}</div></div></body></html>`;
}

let transport: { url: string; t: Transporter } | null = null;

/** SMTP: a login or connection problem, or the server asking us to slow down, is the account's problem (keep queued). */
async function sendSmtp(cfg: Smtp, to: string, subject: string, text: string, replyTo: string | undefined) {
  if (transport?.url !== cfg.url) transport = { url: cfg.url, t: nodemailer.createTransport(cfg.url, { connectionTimeout: 15_000, socketTimeout: 20_000 }) };
  try {
    await transport.t.sendMail({ from: cfg.from, to, subject, text, html: emailHtml(text), ...(replyTo ? { replyTo } : {}) });
  } catch (e) {
    const err = e as Error & { code?: string; responseCode?: number };
    const msg = `Email ${err.responseCode ?? err.code ?? "error"}: ${err.message}`.slice(0, 300);
    const account = ["EAUTH", "ECONNECTION", "ETIMEDOUT", "ESOCKET", "EDNS", "ETLS"].includes(err.code ?? "") || (err.responseCode ?? 0) === 421 || (err.responseCode ?? 0) === 454 || /daily user sending limit|rate limit/i.test(err.message);
    if (account) {
      transport = null;
      throw new ProviderError(msg);
    }
    throw new Error(msg);
  }
}

async function sendEmail(to: string, subject: string, text: string, replyTo: string | undefined) {
  const cfg = smtp();
  if (cfg) return sendSmtp(cfg, to, subject, text, replyTo);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, text, html: emailHtml(text), ...(replyTo ? { reply_to: replyTo } : {}) }),
    signal: AbortSignal.timeout(15_000),
  });
  if (res.ok) return;
  const msg = `Email ${res.status}: ${(await res.text()).slice(0, 200)}`;
  if (res.status === 401 || res.status === 403 || res.status === 429 || res.status >= 500) throw new ProviderError(msg);
  throw new Error(msg);
}

/** Why emails could not go out last time (Resend's own words), or "" once one goes out. Shown in Admin → Messages. */
const EMAIL_ERROR = "email_error";
async function noteProviderError(message: string) {
  await q("insert into settings (key, value) values ($1, $2) on conflict (key) do update set value = excluded.value, updated_at = now()", [EMAIL_ERROR, message.slice(0, 400)]);
}
export async function emailError() {
  const row = await one<{ value: string; updated_at: string }>("select value, updated_at from settings where key = $1 and value <> ''", [EMAIL_ERROR]);
  return row ? { message: row.value, at: row.updated_at } : null;
}

/**
 * Sends what it can. With bookingId, that booking's emails go first and the oldest of the backlog follows, so a
 * confirmation never waits behind older emails and the backlog still drains. Resend takes about 2 requests a second,
 * so sends are spaced. If the account itself is the problem (see ProviderError), it stops and the emails stay queued for
 * the next try instead of being marked failed. Replies go to NRIF's contact email from Settings.
 */
export async function flushOutbox(limit = 25, bookingId?: string) {
  if (!providers().email) return { sent: 0 };
  const rows = await q<{ id: number; to_addr: string; subject: string | null; body: string }>(
    `select id, to_addr, subject, body from messages
      where status = 'queued' and channel = 'email'
      order by (booking_id is not distinct from $2::uuid) desc, id limit $1`,
    [limit, bookingId ?? null],
  );
  if (!rows.length) return { sent: 0 };
  const replyTo = (await settings(["contact_email"])).contact_email?.trim() || undefined;
  let sent = 0;
  let error: string | undefined;
  for (const [i, m] of rows.entries()) {
    if (i > 0) await new Promise((r) => setTimeout(r, 550));
    try {
      await sendEmail(m.to_addr, m.subject ?? "Run for Independence", m.body, replyTo);
      await q("update messages set status = 'sent', sent_at = now(), error = null where id = $1", [m.id]);
      sent++;
    } catch (e) {
      if (e instanceof ProviderError) {
        error = e.message;
        console.error("email provider", e.message);
        await noteProviderError(e.message).catch(() => {});
        break;
      }
      await q("update messages set status = 'failed', error = $2 where id = $1", [m.id, String((e as Error).message).slice(0, 300)]);
    }
  }
  if (sent) await q("update settings set value = '', updated_at = now() where key = $1 and value <> ''", [EMAIL_ERROR]).catch(() => {});
  return { sent, ...(error ? { error } : {}) };
}

/**
 * The automatic path: called wherever an email is queued (a booking, a confirmation, a reminder). It sends after the
 * response has gone back, so nobody waits for the email provider; that booking's emails go first, then up to a dozen
 * older ones. The daily job sends whatever is still waiting.
 */
export function sendSoon(bookingId?: string) {
  after(() => flushOutbox(12, bookingId).then(() => undefined, (e) => console.error("send soon", e)));
}
