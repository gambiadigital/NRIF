import type { NextRequest } from "next/server";
import { HttpError, json, route } from "@/lib/server/http";
import { payerBooking } from "@/lib/server/entry";
import { createWaveCheckout, waveCheckoutEnabled, waveLink } from "@/lib/server/wave";
import { siteUrl } from "@/lib/server/messages";
import { log } from "@/lib/server/db";

/** Where the "Pay with Wave" button goes: a checkout session when the API is connected, else NRIF's payment link. */
export const POST = route(async (req: NextRequest, ctx: RouteContext<"/api/bookings/[ref]/wave">) => {
  const { ref } = await ctx.params;
  const key = req.nextUrl.searchParams.get("k") ?? "";
  const token = req.nextUrl.searchParams.get("t") ?? "";
  const b = await payerBooking(ref, key, token);
  if (b.status !== "pending") throw new HttpError(409, "This booking is not waiting for payment");
  if (waveCheckoutEnabled() && b.currency === "GMD") {
    const back = `${siteUrl()}/register/pending?ref=${b.reference}&${token ? `t=${encodeURIComponent(token)}` : `k=${encodeURIComponent(key || b.access_key)}`}`;
    const s = await createWaveCheckout({ amount: Number(b.total), reference: b.reference, successUrl: `${back}&wave=done`, errorUrl: `${back}&wave=failed` });
    await log("wave", `${b.reference}: Wave checkout ${s.id} opened.`, { bookingId: b.id });
    return json({ mode: "checkout", url: s.url });
  }
  return json({ mode: "link", url: waveLink() });
});
