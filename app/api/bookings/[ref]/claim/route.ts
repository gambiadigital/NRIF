import type { NextRequest } from "next/server";
import { z } from "zod";
import { json, route } from "@/lib/server/http";
import { payerBooking } from "@/lib/server/entry";
import { e164 } from "@/lib/server/messages";
import { log, q } from "@/lib/server/db";

const In = z.object({ from: z.object({ iso: z.string().length(2), digits: z.string().regex(/^\d{6,12}$/, "Enter the full Wave number you paid from") }).optional() });

/*
 * "I have sent it": tells staff to look out for the payment. It does not confirm anything by itself. Wave merchant
 * payments have no box for a reference, so a Wave payer also gives the number they paid from, which staff match on.
 */
export const POST = route(async (req: NextRequest, ctx: RouteContext<"/api/bookings/[ref]/claim">) => {
  const { ref } = await ctx.params;
  const b = await payerBooking(ref, req.nextUrl.searchParams.get("k") ?? "");
  const input = In.parse(await req.json().catch(() => ({})));
  if (b.status !== "pending") return json({ ok: true });
  const from = input.from ? e164(input.from.iso, input.from.digits) : null;
  if (!b.payer_claimed_at || (from && from !== b.payer_from)) {
    await q("update bookings set payer_claimed_at = coalesce(payer_claimed_at, now()), payer_from = coalesce($2, payer_from) where id = $1", [b.id, from]);
    await log("claim", `${b.reference}: payer says they have sent ${b.currency} ${b.total} by ${b.pay_method}${from ? ` from ${from}` : ""}.`, { actor: "payer", bookingId: b.id });
  }
  return json({ ok: true });
});
