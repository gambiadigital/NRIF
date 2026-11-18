import { z } from "zod";
import { one, q, log } from "@/lib/server/db";
import { body, json, requireAdmin, route } from "@/lib/server/http";
import { confirmBooking } from "@/lib/server/bookings";

const In = z.object({
  method: z.enum(["wave", "yonna", "ecobank", "remit", "cash", "other"]),
  amount: z.number().positive().max(10_000_000),
  payer: z.string().trim().max(80).optional(),
  note: z.string().trim().max(200).optional(),
  referenceGiven: z.string().trim().max(20).optional(),
});

/*
 * Staff record money that reached an NRIF account. If the payer quoted a pending booking's reference and the amount
 * covers it (dalasi bookings), it is matched straight away. A Wave payment with no reference matches by the payer's
 * number instead. Anything else waits in Unmatched with likely bookings suggested.
 */
export const POST = route(async (req: Request) => {
  const admin = await requireAdmin();
  const input = await body(req, In);
  const ref = input.referenceGiven?.toUpperCase().replace(/^(RFI)?-?/, "RFI-") ?? null;
  const r = await one<{ id: string }>(
    "insert into receipts (method, amount, currency, payer, note, reference_given, created_by) values ($1, $2, 'GMD', $3, $4, $5, $6) returning id",
    [input.method, input.amount, input.payer || null, input.note || null, ref, admin.name],
  );
  await log("receipt", `${admin.name} recorded a ${input.method} receipt of GMD ${input.amount}${ref ? ` quoting ${ref}` : " with no reference"}.`, { actor: admin.name });

  if (ref) {
    const b = await one<{ id: string; total: string; currency: string; status: string }>("select id, total, currency, status from bookings where reference = $1", [ref]);
    if (b && b.status === "pending" && b.currency === "GMD" && input.amount >= Number(b.total)) {
      await confirmBooking(b.id, r!.id, admin.name, false);
      return json({ id: r!.id, matched: true });
    }
  }

  // Wave merchant payments carry no reference. If the payer box holds a phone number, match on it instead: the number
  // the payer told us they paid from (or their booking phone) and the amount. Only a single clear match is confirmed.
  const digits = (input.payer ?? "").replace(/\D/g, "");
  if (!ref && digits.length >= 7) {
    const tail = digits.slice(-7);
    const hits = await q<{ id: string; reference: string }>(
      `select id, reference from bookings
        where status = 'pending' and currency = 'GMD' and total <= $2
          and (right(regexp_replace(coalesce(payer_from, ''), '\\D', '', 'g'), 7) = $1 or right(phone, 7) = $1)`,
      [tail, input.amount],
    );
    if (hits.length === 1) {
      await q("update receipts set reference_given = $2 where id = $1", [r!.id, hits[0]!.reference]);
      await confirmBooking(hits[0]!.id, r!.id, admin.name, false);
      await log("receipt", `${admin.name}'s ${input.method} receipt from ${input.payer} matched ${hits[0]!.reference} by phone number.`, { actor: admin.name });
      return json({ id: r!.id, matched: true, by: "phone", reference: hits[0]!.reference });
    }
  }
  return json({ id: r!.id, matched: false });
});
