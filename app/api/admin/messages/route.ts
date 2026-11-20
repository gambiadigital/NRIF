import { q, one } from "@/lib/server/db";
import { json, requireAdmin, route } from "@/lib/server/http";
import { emailError, flushOutbox, providers } from "@/lib/server/messages";

/** The email outbox, newest first, with counts. (Texts were dropped on 2026-11-19, so only emails are listed.) */
export const GET = route(async () => {
  await requireAdmin();
  const log = await q(
    `select m.id, m.to_addr, m.template, m.subject, m.status, m.error, m.created_at, m.sent_at, b.reference
       from messages m left join bookings b on b.id = m.booking_id
      where m.channel = 'email'
      order by m.id desc limit 300`,
  );
  const counts = await one(
    `select count(*) filter (where status = 'queued')::int as queued, count(*) filter (where status = 'sent')::int as sent,
            count(*) filter (where status = 'failed')::int as failed
       from messages where channel = 'email'`,
  );
  return json({ log, counts, providers: providers(), emailError: await emailError() });
});

/** Send whatever is queued now, instead of waiting for the daily run. */
export const POST = route(async () => {
  await requireAdmin();
  return json(await flushOutbox(50));
});
