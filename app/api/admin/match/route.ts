import { z } from "zod";
import { q, one, log } from "@/lib/server/db";
import { HttpError, body, json, requireAdmin, route } from "@/lib/server/http";
import { confirmBooking } from "@/lib/server/bookings";

const In = z.object({ receiptId: z.uuid(), bookingId: z.uuid().optional(), pledgeId: z.uuid().optional() }).refine((v) => v.bookingId || v.pledgeId, "Choose what this money is for");

/** Match a receipt to a pending booking (confirms it and issues bibs) or to a steps pledge (marks it paid). */
export const POST = route(async (req: Request) => {
  const admin = await requireAdmin();
  const input = await body(req, In);
  const r = await one<{ id: string; status: string; amount: string; method: string }>("select id, status, amount, method from receipts where id = $1", [input.receiptId]);
  if (!r) throw new HttpError(404, "Receipt not found");
  if (r.status !== "unmatched") throw new HttpError(409, "That receipt is already matched");

  if (input.bookingId) {
    const b = await one<{ status: string }>("select status from bookings where id = $1", [input.bookingId]);
    if (!b) throw new HttpError(404, "Booking not found");
    if (b.status === "paid") throw new HttpError(409, "That booking is already paid");
    const res = await confirmBooking(input.bookingId, r.id, admin.name, false);
    return json({ ok: true, bibs: res.bibs.map((x) => x.bib) });
  }

  const p = await one<{ reference: string; steps_code: string }>("update step_pledges set status = 'paid' where id = $1 and status = 'pledged' returning reference, steps_code", [input.pledgeId]);
  if (!p) throw new HttpError(409, "That pledge is not waiting for payment");
  await q("update receipts set status = 'matched', matched_by = $2, matched_at = now() where id = $1", [r.id, admin.name]);
  await log("pledge", `${p.reference} for ${p.steps_code} matched by ${admin.name} to a ${r.method} receipt of GMD ${r.amount}.`, { actor: admin.name });
  return json({ ok: true });
});

/** Set a receipt aside (a refund, a duplicate, money for something else). */
export const DELETE = route(async (req: Request) => {
  const admin = await requireAdmin();
  const { receiptId } = await body(req, z.object({ receiptId: z.uuid() }));
  const r = await one<{ amount: string }>("update receipts set status = 'ignored', matched_by = $2, matched_at = now() where id = $1 and status = 'unmatched' returning amount", [receiptId, admin.name]);
  if (!r) throw new HttpError(409, "Only unmatched receipts can be set aside");
  await log("receipt", `${admin.name} set aside a receipt of GMD ${r.amount}.`, { actor: admin.name });
  return json({ ok: true });
});
