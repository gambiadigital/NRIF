import { z } from "zod";
import { one, log } from "@/lib/server/db";
import { HttpError, body, json, requireAdmin, route } from "@/lib/server/http";

const In = z.object({ status: z.enum(["approved", "rejected"]), note: z.string().max(200).optional() });

/** Approve a virtual run (the certificate unlocks) or send it back with a note. */
export const PATCH = route(async (req: Request, ctx: RouteContext<"/api/admin/virtual/[id]">) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  const v = await body(req, In);
  const r = await one<{ full_name: string; booking_id: string }>(
    `update virtual_results set status = $2, review_note = $3, reviewed_by = $4, reviewed_at = now() where id = $1
     returning (select full_name from participants where id = participant_id), (select booking_id from participants where id = participant_id)`,
    [id, v.status, v.note ?? null, admin.name],
  );
  if (!r) throw new HttpError(404, "Result not found");
  await log("virtual", `${admin.name} ${v.status} ${r.full_name}'s virtual run.`, { actor: admin.name, bookingId: r.booking_id });
  return json({ ok: true });
});
