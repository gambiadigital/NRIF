import { z } from "zod";
import { q, one, log } from "@/lib/server/db";
import { HttpError, body, json, requireAdmin, route } from "@/lib/server/http";
import { bookingById, confirmBooking, participantsOf } from "@/lib/server/bookings";
import { flushOutbox, queueForBooking, shortLink } from "@/lib/server/messages";

/** Everything about one booking, for the entry drawer. */
export const GET = route(async (_req: Request, ctx: RouteContext<"/api/admin/bookings/[id]">) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const b = await bookingById(id);
  if (!b) throw new HttpError(404, "Booking not found");
  const people = await participantsOf(id);
  const messages = await q("select channel, to_addr, template, status, created_at, sent_at, error from messages where booking_id = $1 order by id desc limit 20", [id]);
  const activity = await q("select at, actor, text from activity where booking_id = $1 order by at desc limit 20", [id]);
  const receipts = await q("select method, amount::float as amount, payer, received_at, matched_by from receipts where booking_id = $1", [id]);
  const transfers = await q("select t.id, t.new_name, t.new_phone, t.status, p.full_name from transfer_requests t join participants p on p.id = t.participant_id where p.booking_id = $1", [id]);
  const { access_key, ...safe } = b;
  return json({ booking: { ...safe, link: shortLink(b.reference, access_key) }, people, messages, activity, receipts, transfers });
});

const Action = z.object({
  action: z.enum(["confirm", "remind", "release", "extend", "cancel"]),
  note: z.string().max(200).optional(),
});

/** Staff actions on a booking: confirm without a receipt (cash, or seen in a bank app), remind, extend, release. */
export const POST = route(async (req: Request, ctx: RouteContext<"/api/admin/bookings/[id]">) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  const { action, note } = await body(req, Action);
  const b = await bookingById(id);
  if (!b) throw new HttpError(404, "Booking not found");

  if (action === "confirm") {
    if (b.status === "paid") throw new HttpError(409, "Already paid");
    const res = await confirmBooking(id, null, admin.name, false);
    if (note) await log("note", `${b.reference}: ${note}`, { actor: admin.name, bookingId: id });
    return json({ ok: true, bibs: res.bibs.map((x) => x.bib) });
  }
  if (action === "remind") {
    if (b.status !== "pending") throw new HttpError(409, "Only pending bookings get payment reminders");
    await queueForBooking(id, "reminder3");
    await q("update bookings set reminded_at = now() where id = $1", [id]);
    await log("remind", `${admin.name} sent ${b.reference} a payment reminder.`, { actor: admin.name, bookingId: id });
    await flushOutbox(5).catch(() => {});
    return json({ ok: true });
  }
  if (action === "extend") {
    await q("update bookings set hold_until = greatest(hold_until, now()) + interval '3 days', status = case when status = 'released' then 'pending' else status end where id = $1 and status in ('pending', 'released')", [id]);
    await log("extend", `${admin.name} extended ${b.reference}'s hold by 3 days.`, { actor: admin.name, bookingId: id });
    return json({ ok: true });
  }
  const status = action === "release" ? "released" : "cancelled";
  const done = await one("update bookings set status = $2 where id = $1 and status = 'pending' returning id", [id, status]);
  if (!done) throw new HttpError(409, "Only pending bookings can be released or cancelled");
  await log(action, `${admin.name} ${status} ${b.reference}${note ? `: ${note}` : "."}`, { actor: admin.name, bookingId: id });
  return json({ ok: true });
});
