import type { NextRequest } from "next/server";
import { HttpError, json, route } from "@/lib/server/http";
import { bookingByPayToken, participantsOf } from "@/lib/server/bookings";

/*
 * What someone paying for the booker sees: first names, events, amount, status and the reference to quote. No surnames,
 * dates of birth, phone, email or bibs, and it never signs them in to My entry.
 */
export const GET = route(async (_req: NextRequest, ctx: RouteContext<"/api/pay/[token]">) => {
  const { token } = await ctx.params;
  const b = await bookingByPayToken(token);
  if (!b) throw new HttpError(404, "This pay link is not valid. Ask for a new one.");
  const people = await participantsOf(b.id);
  return json({
    reference: b.reference,
    status: b.status,
    residence: b.residence,
    city: null,
    currency: b.currency,
    total: Number(b.total),
    payMethod: b.pay_method,
    holdUntil: b.hold_until,
    claimedAt: b.payer_claimed_at,
    payerFromTail: b.payer_from ? b.payer_from.slice(-4) : null,
    participants: people.map((p) => {
      const first = p.full_name.split(/\s+/)[0]!;
      return { id: p.id, fullName: first, firstName: first, eventId: p.event_id, bib: null };
    }),
    sponsor: true,
  });
});
