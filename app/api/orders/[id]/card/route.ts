import type { NextRequest } from "next/server";
import { HttpError, json, route } from "@/lib/server/http";
import { orderFor } from "@/lib/server/orders";
import { startOrderCard } from "@/lib/server/modempay";
import { siteUrl } from "@/lib/server/messages";

/** Another try at the card page for an order that is not paid yet (a declined card, or a closed tab). */
export const POST = route(async (req: NextRequest, ctx: RouteContext<"/api/orders/[id]/card">) => {
  const { id } = await ctx.params;
  const token = req.nextUrl.searchParams.get("t") ?? "";
  const o = await orderFor(id, token);
  if (!o) throw new HttpError(404, "We could not find that payment");
  const back = `${siteUrl()}/register/payment?order=${o.id}&t=${encodeURIComponent(token)}`;
  const s = await startOrderCard(o, { back, site: siteUrl() });
  return json({ url: s.url });
});
