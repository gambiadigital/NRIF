import type { NextRequest } from "next/server";
import { q } from "@/lib/server/db";
import { json, requireAdmin, route } from "@/lib/server/http";
import { csv } from "@/lib/server/admin";

/** Every participant, searchable, with a CSV export of the same rows. */
export const GET = route(async (req: NextRequest) => {
  await requireAdmin();
  const sp = req.nextUrl.searchParams;
  const term = (sp.get("q") ?? "").trim();
  const event = sp.get("event") ?? "";
  const status = sp.get("status") ?? "";
  const rows = await q<Record<string, unknown>>(
    `select p.id, b.id as booking_id, b.reference, b.status, p.bib, p.full_name, e.name as event, e.kind,
            date_part('year', age(date '2027-01-30', p.dob))::int as age, p.gender, p.shirt, p.bib_name,
            b.residence, coalesce(b.city, b.town) as lives_in, b.team_code, b.source, b.phone_iso, b.phone, b.email,
            b.consent_photos, b.consent_news, b.waiver_version, b.waiver_accepted_at, p.guardian_is_lead, p.guardian_name, b.created_at, b.paid_at
       from participants p join bookings b on b.id = p.booking_id join events e on e.id = p.event_id
      where ($1 = '' or p.full_name ilike '%' || $1 || '%' or coalesce(p.bib, '') ilike $1 || '%' or b.reference ilike '%' || $1 || '%'
             or coalesce(b.town, '') ilike '%' || $1 || '%' or coalesce(b.team_code, '') ilike $1 || '%' or b.phone like '%' || $1 || '%')
        and ($2 = '' or p.event_id = $2)
        and ($3 = '' or b.status = $3)
      order by b.created_at desc, p.position
      limit 2000`,
    [term, event, status],
  );
  if (sp.get("format") === "csv") {
    return new Response(csv(rows), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="run4independence-entries-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" },
    });
  }
  return json({ rows: rows.slice(0, 500), total: rows.length });
});
