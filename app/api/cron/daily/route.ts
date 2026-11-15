import { q, log } from "@/lib/server/db";
import { HttpError, json, route } from "@/lib/server/http";
import { flushOutbox, queueForBooking } from "@/lib/server/messages";

/*
 * Once a day (vercel.json): release unpaid places after their 5-day hold, remind on day 3, send the race-week texts on
 * their dates, then push the outbox. Vercel calls it with "Authorization: Bearer $CRON_SECRET".
 */
export const GET = route(async (req: Request) => {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) throw new HttpError(401, "Not allowed");

  const released = await q<{ id: string; reference: string }>("update bookings set status = 'released' where status = 'pending' and hold_until < now() returning id, reference");
  for (const r of released) await log("release", `${r.reference} released: no payment within the hold.`, { bookingId: r.id });

  const due = await q<{ id: string }>(
    "update bookings set reminded_at = now() where status = 'pending' and reminded_at is null and created_at < now() - interval '3 days' returning id",
  );
  for (const d of due) await queueForBooking(d.id, "reminder3");

  const today = new Date().toISOString().slice(0, 10);
  const plan: Record<string, { tpl: string; kind: "in-person" | "virtual" }[]> = {
    "2027-01-23": [
      { tpl: "race-7", kind: "in-person" },
      { tpl: "virtual-open", kind: "virtual" },
    ],
    "2027-01-29": [{ tpl: "race-1", kind: "in-person" }],
  };
  let raceTexts = 0;
  for (const step of plan[today] ?? []) {
    const ids = await q<{ id: string }>(
      `select distinct b.id from bookings b join participants p on p.booking_id = b.id join events e on e.id = p.event_id
        where b.status = 'paid' and e.kind = $1
          and not exists (select 1 from messages m where m.booking_id = b.id and m.template = $2)`,
      [step.kind, step.tpl],
    );
    for (const r of ids) await queueForBooking(r.id, step.tpl);
    raceTexts += ids.length;
  }

  const { sent } = await flushOutbox(200);
  return json({ released: released.length, reminders: due.length, raceTexts, sent });
});
