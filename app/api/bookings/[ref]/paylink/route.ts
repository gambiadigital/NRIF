import type { NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { HttpError, json, route } from "@/lib/server/http";
import { payerBooking } from "@/lib/server/entry";
import { siteUrl } from "@/lib/server/messages";
import { log, one } from "@/lib/server/db";

/**
 * "Ask someone to pay": the booker's link (or My entry sign-in) gets a pay-only link to send to a relative, friend or
 * sponsor. The same link is returned each time. A pay link itself cannot make another one.
 */
export const POST = route(async (req: NextRequest, ctx: RouteContext<"/api/bookings/[ref]/paylink">) => {
  const { ref } = await ctx.params;
  const b = await payerBooking(ref, req.nextUrl.searchParams.get("k") ?? "");
  if (b.status !== "pending") throw new HttpError(409, "This booking is not waiting for payment");
  let token = b.pay_token;
  if (!token) {
    token = randomBytes(15).toString("base64url");
    const set = await one<{ pay_token: string }>("update bookings set pay_token = coalesce(pay_token, $2) where id = $1 returning pay_token", [b.id, token]);
    token = set!.pay_token;
    await log("paylink", `${b.reference}: a pay-for-me link was made.`, { actor: "payer", bookingId: b.id });
  }
  return json({ url: `${siteUrl()}/p/${token}` });
});
