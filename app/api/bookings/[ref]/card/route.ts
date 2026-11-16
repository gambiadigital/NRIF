import type { NextRequest } from "next/server";
import { json, route } from "@/lib/server/http";
import { payerBooking } from "@/lib/server/entry";
import { startCardPayment } from "@/lib/server/mpgs";
import { siteUrl } from "@/lib/server/messages";

/** Opens a Mastercard Hosted Checkout session for this booking. The browser then calls Checkout.showPaymentPage(). */
export const POST = route(async (req: NextRequest, ctx: RouteContext<"/api/bookings/[ref]/card">) => {
  const { ref } = await ctx.params;
  const key = req.nextUrl.searchParams.get("k") ?? "";
  const b = await payerBooking(ref, key);
  const back = `${siteUrl()}/register/pending?ref=${b.reference}&k=${encodeURIComponent(key || b.access_key)}`;
  const s = await startCardPayment(b, { back });
  return json({ sessionId: s.sessionId, script: s.script, orderId: s.orderId });
});
