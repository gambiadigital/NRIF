import "server-only";
import { after } from "next/server";
import nodemailer, { type Transporter } from "nodemailer";
import { q, one, settings } from "./db";
import { COUNTRY_CODES, money } from "@/lib/format";
import { PAYMENT_METHODS } from "@/lib/data";

const METHOD_NAMES: Record<string, string> = Object.fromEntries(Object.values(PAYMENT_METHODS).map((m) => [m.id, m.name]));
import { emailFooter, render, subjectFor } from "@/lib/messages";
import { emailHtml, type EmailData, type EmailPerson } from "./emailHtml";

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
  const b = await one<{ reference: string; access_key: string; currency: string; total: string; hold_until: string; phone_iso: string; phone: string; email: string; payer_reference: string | null; pay_method: string }>(
    "select reference, access_key, currency, total, hold_until, phone_iso, phone, email, payer_reference, pay_method from bookings where id = $1",
    [bookingId],
  );
  if (!b) return null;
  const people = await q<{ full_name: string; bib: string | null; name: string; start_time: string; kind: string }>(
    "select p.full_name, p.bib, e.name, e.start_time, e.kind from participants p join events e on e.id = p.event_id where p.booking_id = $1 order by p.position",
    [bookingId],
  );
  const lead = people[0];
  const hold = new Date(b.hold_until).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
  const url = shortLink(b.reference, b.access_key);
  return {
    b,
    url,
    people: people.map((p): EmailPerson => ({ name: p.full_name, bib: p.bib, event: p.name, kind: p.kind, start: p.start_time })),
    vars: {
      first: lead?.full_name.split(/\s+/)[0] ?? "runner",
      event: lead?.name ?? "",
      start: lead?.start_time ?? "",
      bib: lead?.bib ?? "",
      bibs: people.map((p) => p.bib).filter(Boolean).join(", "),
      ref: b.reference,
      amount: money(Number(b.total), b.currency as never, { decimals: b.currency !== "GMD" }),
      hold,
      payref: b.payer_reference ?? "",
      method: METHOD_NAMES[b.pay_method] ?? b.pay_method,
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

/** What one email is made of when it goes out: the words, and the designed HTML when it belongs to a booking. */
type Outgoing = { subject: string; text: string; html: string };

/** The site's contact details, for the email footer. */
async function contactDetails() {
  const s = await settings(["contact_email", "contact_phone", "contact_whatsapp"]);
  return { email: s.contact_email?.trim() || undefined, phone: s.contact_phone?.trim() || undefined, whatsapp: s.contact_whatsapp?.trim() || undefined };
}

/**
 * Builds a booking's email from its template and the booking as it is now, so a delayed or resent email never shows
 * an old hold date or a missing bib. Returns null when the booking or template is gone.
 */
export async function composeForBooking(bookingId: string, templateId: string, contact?: EmailData["contact"]): Promise<Outgoing | null> {
  const [t, ctx] = await Promise.all([one<{ body: string }>("select body from templates where id = $1", [templateId]), varsFor(bookingId)]);
  if (!t || !ctx) return null;
  const words = render(t.body, ctx.vars);
  return {
    subject: subjectFor(templateId, ctx.vars),
    text: `${words}\n\n${emailFooter(ctx.vars.link!)}`,
    html: emailHtml({ templateId, text: words, vars: ctx.vars, people: ctx.people, link: ctx.url, site: siteUrl(), contact: contact ?? (await contactDetails()) }),
  };
}

/** The designed email for any data (the admin preview and test sends use sample bookings). */
export async function composeSample(templateId: string, body: string, vars: Record<string, string>, people: EmailPerson[], link: string): Promise<Outgoing> {
  const words = render(body, vars);
  return {
    subject: subjectFor(templateId, vars),
    text: `${words}\n\n${emailFooter(link.replace(/^https?:\/\//, ""))}`,
    html: emailHtml({ templateId, text: words, vars, people, link, site: siteUrl(), contact: await contactDetails() }),
  };
}

/** A plain email with no booking behind it: the same frame, no booking panel. */
function plainHtml(text: string, contact: EmailData["contact"]) {
  return emailHtml({ templateId: "plain", text, vars: {}, people: [], link: siteUrl(), site: siteUrl(), contact });
}

let transport: { url: string; t: Transporter } | null = null;

/** SMTP: a login or connection problem, or the server asking us to slow down, is the account's problem (keep queued). */
async function sendSmtp(cfg: Smtp, to: string, { subject, text, html }: Outgoing, replyTo: string | undefined) {
  if (transport?.url !== cfg.url) transport = { url: cfg.url, t: nodemailer.createTransport(cfg.url, { connectionTimeout: 15_000, socketTimeout: 20_000 }) };
  try {
    await transport.t.sendMail({ from: cfg.from, to, subject, text, html, ...(replyTo ? { replyTo } : {}) });
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

export async function sendEmail(to: string, mail: Outgoing, replyTo: string | undefined) {
  const { subject, text, html } = mail;
  const cfg = smtp();
  if (cfg) return sendSmtp(cfg, to, mail, replyTo);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, text, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
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
  const rows = await q<{ id: number; booking_id: string | null; template: string; to_addr: string; subject: string | null; body: string }>(
    `select id, booking_id, template, to_addr, subject, body from messages
      where status = 'queued' and channel = 'email'
      order by (booking_id is not distinct from $2::uuid) desc, id limit $1`,
    [limit, bookingId ?? null],
  );
  if (!rows.length) return { sent: 0 };
  const contact = await contactDetails();
  const replyTo = contact.email;
  let sent = 0;
  let error: string | undefined;
  for (const [i, m] of rows.entries()) {
    if (i > 0) await new Promise((r) => setTimeout(r, 550));
    try {
      const mail = (m.booking_id ? await composeForBooking(m.booking_id, m.template, contact) : null) ?? { subject: m.subject ?? "Run for Independence", text: m.body, html: plainHtml(m.body, contact) };
      await sendEmail(m.to_addr, mail, replyTo);
      // Keep what actually went out, so the outbox shows the real subject and words.
      await q("update messages set status = 'sent', sent_at = now(), error = null, subject = $2, body = $3 where id = $1", [m.id, mail.subject, mail.text]);
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
