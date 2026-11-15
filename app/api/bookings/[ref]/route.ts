import type { NextRequest } from "next/server";
import { HttpError, json, route } from "@/lib/server/http";
import { bookingByRef, participantsOf, publicBooking } from "@/lib/server/bookings";

/** A booking, for whoever holds its reference and access key (the confirmation and payment screens). */
export const GET = route(async (req: NextRequest, ctx: RouteContext<"/api/bookings/[ref]">) => {
  const { ref } = await ctx.params;
  const b = await bookingByRef(ref, req.nextUrl.searchParams.get("k") ?? "");
  if (!b) throw new HttpError(404, "We could not find that booking");
  return json(publicBooking(b, await participantsOf(b.id)));
});
