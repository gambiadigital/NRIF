import type { NextRequest } from "next/server";
import { HttpError, json, route } from "@/lib/server/http";
import { orderFor, orderView } from "@/lib/server/orders";
import { cardEnabled, settleOrderCards } from "@/lib/server/modempay";

/** Back from the card page: ask Modem Pay (through our server) whether the money is in. The answer never comes from the URL. */
export const POST = route(async (req: NextRequest, ctx: RouteContext<"/api/orders/[id]/card/check">) => {
  const { id } = await ctx.params;
  const token = req.nextUrl.searchParams.get("t") ?? "";
  const o = await orderFor(id, token);
  if (!o) throw new HttpError(404, "We could not find that payment");
  if (o.status !== "open" || !cardEnabled()) return json({ outcome: o.status === "paid" || o.status === "used" ? "paid" : "waiting", order: await orderView(o) });
  const outcome = await settleOrderCards(o.id);
  const fresh = (await orderFor(id, token))!;
  return json({ outcome, order: await orderView(fresh) });
});
