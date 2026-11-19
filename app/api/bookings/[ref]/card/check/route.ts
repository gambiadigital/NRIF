import type { NextRequest } from "next/server";
import { json, route } from "@/lib/server/http";
import { payerBooking } from "@/lib/server/entry";
import { cardEnabled, settleBookingCards } from "@/lib/server/modempay";

/** The payer is back from the card page: ask the gateway what happened, and confirm the booking if the money is in. */
export const POST = route(async (req: NextRequest, ctx: RouteContext<"/api/bookings/[ref]/card/check">) => {
  const { ref } = await ctx.params;
  const b = await payerBooking(ref, req.nextUrl.searchParams.get("k") ?? "", req.nextUrl.searchParams.get("t") ?? "");
  if (b.status === "paid") return json({ outcome: "paid" });
  if (!cardEnabled()) return json({ outcome: "waiting" });
  return json({ outcome: await settleBookingCards(b.id) });
});
