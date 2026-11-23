import type { NextRequest } from "next/server";
import { HttpError, json, route } from "@/lib/server/http";
import { orderFor, orderView } from "@/lib/server/orders";

/** A pay-first order, for whoever holds its token: lets the payer carry on, or come back later to finish. */
export const GET = route(async (req: NextRequest, ctx: RouteContext<"/api/orders/[id]">) => {
  const { id } = await ctx.params;
  const o = await orderFor(id, req.nextUrl.searchParams.get("t") ?? "");
  if (!o) throw new HttpError(404, "We could not find that payment");
  return json(await orderView(o));
});
