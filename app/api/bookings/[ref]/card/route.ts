import type { NextRequest } from "next/server";
import { json, route } from "@/lib/server/http";
import { payerBooking } from "@/lib/server/entry";
import { startCardPayment } from "@/lib/server/modempay";
import { siteUrl } from "@/lib/server/messages";

/** Opens a Modem Pay card checkout for this booking; the browser then goes to the returned link. */
export const POST = route(async (req: NextRequest, ctx: RouteContext<"/api/bookings/[ref]/card">) => {
  const { ref } = await ctx.params;
  const key = req.nextUrl.searchParams.get("k") ?? "";
  const token = req.nextUrl.searchParams.get("t") ?? "";
  const b = await payerBooking(ref, key, token);
  // Someone paying for the booker comes back to the pay-only view, never to the booker's own link.
  const back = `${siteUrl()}/register/pending?ref=${b.reference}&${token ? `t=${encodeURIComponent(token)}` : `k=${encodeURIComponent(key || b.access_key)}`}`;
  const s = await startCardPayment(b, { back, site: siteUrl() });
  return json({ url: s.url, orderId: s.orderId });
});
