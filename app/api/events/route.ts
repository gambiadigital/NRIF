import { q } from "@/lib/server/db";
import { json, route } from "@/lib/server/http";

/** Live fees and start times. Everything else about an event (photos, copy) lives in lib/data.ts. */
export const GET = route(async () => {
  const rows = await q<{ id: string; name: string; distance: string; km: string; min_age: number; kind: string; start_time: string; fee_gmd: number; suggested_gbp: number; open: boolean }>(
    "select id, name, distance, km, min_age, kind, start_time, fee_gmd, suggested_gbp, open from events order by sort",
  );
  return json({
    events: rows.map((r) => ({
      id: r.id,
      name: r.name,
      distance: r.distance,
      km: Number(r.km),
      minAge: r.min_age,
      kind: r.kind,
      start: r.start_time,
      feeGMD: r.fee_gmd,
      suggestedGBP: r.suggested_gbp,
      open: r.open,
    })),
  });
});
