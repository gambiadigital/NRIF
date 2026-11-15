import { z } from "zod";
import { q, one, log } from "@/lib/server/db";
import { HttpError, body, json, requireAdmin, route } from "@/lib/server/http";

export const GET = route(async () => {
  await requireAdmin();
  const rows = await q(
    `select e.id, e.name, e.kind, e.start_time, e.fee_gmd, e.suggested_gbp, e.bib_start, e.bib_end, e.bib_prefix, e.bib_next, e.open, e.min_age,
            (select count(*)::int from participants p where p.event_id = e.id and p.bib is not null) as issued
       from events e order by e.sort`,
  );
  return json({ events: rows });
});

const In = z.object({
  id: z.string(),
  fee_gmd: z.number().int().min(0).max(100000).optional(),
  suggested_gbp: z.number().int().min(0).max(1000).optional(),
  start_time: z.string().max(20).optional(),
  bib_start: z.number().int().min(0).max(99999).optional(),
  bib_end: z.number().int().min(0).max(99999).optional(),
  open: z.boolean().optional(),
});

/** Fees, start times and bib ranges. A range can't move below a number already issued. */
export const PATCH = route(async (req: Request) => {
  const admin = await requireAdmin();
  const v = await body(req, In);
  const e = await one<{ bib_start: number; bib_end: number; bib_next: number; name: string }>("select bib_start, bib_end, bib_next, name from events where id = $1", [v.id]);
  if (!e) throw new HttpError(404, "Event not found");
  const start = v.bib_start ?? e.bib_start;
  const end = v.bib_end ?? e.bib_end;
  if (end < start) throw new HttpError(400, "The range ends before it starts");
  const issuedAny = e.bib_next > e.bib_start;
  if (issuedAny && start !== e.bib_start) throw new HttpError(409, "Bibs are already issued from this range, so its start can't move");
  if (end < e.bib_next - 1) throw new HttpError(409, `The range can't end below ${e.bib_next - 1}, which is already issued`);
  await q(
    `update events set fee_gmd = coalesce($2, fee_gmd), suggested_gbp = coalesce($3, suggested_gbp), start_time = coalesce($4, start_time),
            bib_start = $5, bib_end = $6, bib_next = case when bib_next = bib_start then $5 else bib_next end, open = coalesce($7, open)
      where id = $1`,
    [v.id, v.fee_gmd ?? null, v.suggested_gbp ?? null, v.start_time ?? null, start, end, v.open ?? null],
  );
  await log("event", `${admin.name} updated ${e.name}.`, { actor: admin.name });
  return json({ ok: true });
});
