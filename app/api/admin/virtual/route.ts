import { q } from "@/lib/server/db";
import { json, requireAdmin, route } from "@/lib/server/http";

export const GET = route(async () => {
  await requireAdmin();
  const rows = await q(
    `select v.id, v.status, to_char(v.run_date, 'YYYY-MM-DD') as run_date, v.distance_km::float as distance_km, v.duration_seconds, v.link,
            (v.image is not null) as has_image, v.review_note, v.reviewed_by, v.created_at,
            p.full_name, p.bib, e.name as event, e.km::float as event_km, b.reference, coalesce(b.city, b.town) as lives_in
       from virtual_results v join participants p on p.id = v.participant_id join events e on e.id = p.event_id join bookings b on b.id = p.booking_id
      order by (v.status = 'submitted') desc, v.created_at desc limit 300`,
  );
  return json({ rows });
});
