import { z } from "zod";
import { q, one, log } from "@/lib/server/db";
import { HttpError, body, json, route } from "@/lib/server/http";
import { currentBooking, KIT_LOCK } from "@/lib/server/entry";
import { SHIRT_SIZES } from "@/lib/data";

const In = z.object({
  shirt: z.enum(SHIRT_SIZES).optional(),
  bibName: z.string().max(10).regex(/^[A-Z' -]*$/, "Letters only on bibs").optional(),
});

/** Kit changes: T-shirt size and name on bib, until the kit locks for printing. */
export const PATCH = route(async (req: Request, ctx: RouteContext<"/api/entry/participants/[id]">) => {
  const { id } = await ctx.params;
  const b = await currentBooking();
  if (Date.now() >= KIT_LOCK.getTime()) throw new HttpError(409, "Kit choices are locked for printing");
  const p = await one<{ id: string; full_name: string }>("select id, full_name from participants where id = $1 and booking_id = $2", [id, b.id]);
  if (!p) throw new HttpError(404, "Participant not found");
  const input = await body(req, In);
  await q("update participants set shirt = coalesce($2, shirt), bib_name = coalesce($3, bib_name) where id = $1", [id, input.shirt ?? null, input.bibName ?? null]);
  await log("kit", `${b.reference}: ${p.full_name} kit now ${[input.shirt, input.bibName].filter(Boolean).join(", ")}.`, { actor: "participant", bookingId: b.id });
  return json({ ok: true });
});
