import { q, one } from "@/lib/server/db";
import { json, requireAdmin, route } from "@/lib/server/http";
import { flushOutbox, providers } from "@/lib/server/messages";

export const GET = route(async () => {
  await requireAdmin();
  const log = await q(
    `select m.id, m.channel, m.to_addr, m.template, m.status, m.error, m.created_at, m.sent_at, b.reference
       from messages m left join bookings b on b.id = m.booking_id order by m.id desc limit 100`,
  );
  const counts = await one("select count(*) filter (where status = 'queued')::int as queued, count(*) filter (where status = 'sent')::int as sent, count(*) filter (where status = 'failed')::int as failed from messages");
  return json({ log, counts, providers: providers() });
});

/** Send whatever is queued now, instead of waiting for the daily run. */
export const POST = route(async () => {
  await requireAdmin();
  return json(await flushOutbox(100));
});
