import type { NextRequest } from "next/server";
import { HttpError, json, route } from "@/lib/server/http";
import { bookingByRef } from "@/lib/server/bookings";
import { currentBooking } from "@/lib/server/entry";
import { log, q } from "@/lib/server/db";

/** "I have sent it": tells staff to look out for the payment. It does not confirm anything by itself. */
export const POST = route(async (req: NextRequest, ctx: RouteContext<"/api/bookings/[ref]/claim">) => {
  const { ref } = await ctx.params;
  const key = req.nextUrl.searchParams.get("k") ?? "";
  // The access key from the link, or the My entry sign-in for this same booking.
  const b = key ? await bookingByRef(ref, key) : await currentBooking().then((x) => (x.reference === ref.toUpperCase() ? x : null));
  if (!b) throw new HttpError(404, "We could not find that booking");
  if (b.status === "pending" && !b.payer_claimed_at) {
    await q("update bookings set payer_claimed_at = now() where id = $1", [b.id]);
    await log("claim", `${b.reference}: payer says they have sent ${b.currency} ${b.total} by ${b.pay_method}.`, { actor: "payer", bookingId: b.id });
  }
  return json({ ok: true });
});
