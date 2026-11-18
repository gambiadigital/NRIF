import "server-only";
import { q, one } from "./db";
import { COUNTRY_CODES, money } from "@/lib/format";

/*
 * Texts and emails go through an outbox table. Rendering and queueing always happen; sending happens only when a
 * provider is configured (Twilio for SMS, Resend for email). Until then messages wait as "queued" and the admin
 * console shows them, so nothing is lost.
 */

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://nrif.vercel.app").replace(/\/$/, "");
}

/** The short link printed in texts: /b/7Q4K-a8Kd2f3x opens that booking without signing in. */
export function shortLink(reference: string, key: string) {
  return `${siteUrl()}/b/${reference.replace(/^RFI-/, "")}-${key.slice(0, 8)}`;
}

export function e164(iso: string, digits: string) {
  const dial = COUNTRY_CODES.find((c) => c.iso === iso)?.dial ?? "+220";
  return `${dial}${digits}`;
}

export function render(body: string, vars: Record<string, string>) {
  return body.replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m);
}

const SUBJECTS: Record<string, (v: Record<string, string>) => string> = {
  pending: (v) => `Your reference ${v.ref}: Run for Independence`,
  confirm: (v) => `You're in: ${v.event}, bib ${v.bib}`,
  "confirm-virtual": (v) => `You're in: ${v.event}, e-bib ${v.bib}`,
  reminder3: (v) => `Your place is held until ${v.hold}`,
  "race-7": () => "7 days to go: Run for Independence",
  "race-1": () => "Tomorrow: Run for Independence",
  "virtual-open": () => "Your run window is open",
};

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
  const subject = (SUBJECTS[templateId] ?? (() => "Run for Independence"))(ctx.vars);
  await q(
    `insert into messages (booking_id, channel, to_addr, template, subject, body) values
       ($1, 'sms', $2, $3, null, $4),
       ($1, 'email', $5, $3, $6, $7)`,
    [bookingId, e164(ctx.b.phone_iso, ctx.b.phone), templateId, text, ctx.b.email, subject, `${text}\n\nOpen your booking: https://${ctx.vars.link}\n\nNational Research & Innovation Fund`],
  );
}

export function providers() {
  return {
    sms: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM),
    email: !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
  };
}

async function sendSms(to: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: { Authorization: "Basic " + btoa(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ To: to, From: process.env.TWILIO_FROM!, Body: body }),
  });
  if (!res.ok) throw new Error(`SMS ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

async function sendEmail(to: string, subject: string, text: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, text }),
  });
  if (!res.ok) throw new Error(`Email ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

/** Sends what it can. Messages for a channel with no provider stay queued. */
export async function flushOutbox(limit = 25) {
  const p = providers();
  const channels = [p.sms && "sms", p.email && "email"].filter(Boolean) as string[];
  if (!channels.length) return { sent: 0 };
  const rows = await q<{ id: number; channel: string; to_addr: string; subject: string | null; body: string }>(
    "select id, channel, to_addr, subject, body from messages where status = 'queued' and channel = any($1) order by id limit $2",
    [channels, limit],
  );
  let sent = 0;
  for (const m of rows) {
    try {
      if (m.channel === "sms") await sendSms(m.to_addr, m.body);
      else await sendEmail(m.to_addr, m.subject ?? "Run for Independence", m.body);
      await q("update messages set status = 'sent', sent_at = now(), error = null where id = $1", [m.id]);
      sent++;
    } catch (e) {
      await q("update messages set status = 'failed', error = $2 where id = $1", [m.id, String((e as Error).message).slice(0, 300)]);
    }
  }
  return { sent };
}
