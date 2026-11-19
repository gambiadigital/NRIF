import { z } from "zod";
import { q, one, log } from "@/lib/server/db";
import { HttpError, body, json, requireAdmin, route } from "@/lib/server/http";
import { bookingById, confirmBooking, participantsOf } from "@/lib/server/bookings";
import { flushOutbox, providers, queueForBooking, shortLink } from "@/lib/server/messages";
import { visibleActor } from "@/lib/server/admin";

/** Everything about one booking, for the booking drawer. */
export const GET = route(async (_req: Request, ctx: RouteContext<"/api/admin/bookings/[id]">) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const b = await bookingById(id);
  if (!b) throw new HttpError(404, "Booking not found");
  const people = await participantsOf(id);
  const messages = await q("select channel, to_addr, template, status, created_at, sent_at, error from messages where booking_id = $1 and channel = 'email' order by id desc limit 20", [id]);
  const activity = await q(`select at, actor, text from activity a where booking_id = $1 and ${visibleActor("a")} order by at desc limit 20`, [id]);
  const transfers = await q("select t.id, t.new_name, t.new_phone, t.status, p.full_name from transfer_requests t join participants p on p.id = t.participant_id where p.booking_id = $1", [id]);
  const { access_key, ...safe } = b;
  return json({ booking: { ...safe, link: shortLink(b.reference, access_key) }, people, messages, activity, transfers });
});

const Action = z.object({ action: z.enum(["confirm", "remind", "release"]) });

/*
 * Staff actions on a booking. Confirm: the staff member has seen the money arrive in an NRIF account with this booking's
 * reference (or, for Wave, from the paying number); it issues the bibs and is recorded under their name. Remind: emails
 * the payment details again. Release: frees the place; a late payment can still be confirmed afterwards.
 */
export const POST = route(async (req: Request, ctx: RouteContext<"/api/admin/bookings/[id]">) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  const { action } = await body(req, Action);
  const b = await bookingById(id);
  if (!b) throw new HttpError(404, "Booking not found");

  if (action === "confirm") {
    if (b.status === "paid") throw new HttpError(409, "This payment is already confirmed");
    if (b.status === "cancelled") throw new HttpError(409, "This booking was cancelled");
    const res = await confirmBooking(id, null, admin.name, false);
    return json({ ok: true, bibs: res.bibs.map((x) => x.bib), confirmedBy: admin.name });
  }
  if (action === "remind") {
    if (b.status !== "pending") throw new HttpError(409, "Only bookings waiting for payment get reminders");
    await queueForBooking(id, "reminder3");
    await q("update bookings set reminded_at = now() where id = $1", [id]);
    await log("remind", `${admin.name} sent ${b.reference} a payment reminder.`, { actor: admin.name, bookingId: id });
    await flushOutbox(5).catch(() => {});
    return json({ ok: true, emailed: providers().email });
  }
  const done = await one("update bookings set status = 'released' where id = $1 and status = 'pending' returning id", [id]);
  if (!done) throw new HttpError(409, "Only bookings waiting for payment can be released");
  await log("release", `${admin.name} released ${b.reference}.`, { actor: admin.name, bookingId: id });
  return json({ ok: true });
});
