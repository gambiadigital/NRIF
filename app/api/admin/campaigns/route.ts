import { q } from "@/lib/server/db";
import { json, requireAdmin, route } from "@/lib/server/http";

/** Bookings and entries by source tag, paid and not. */
export const GET = route(async () => {
  await requireAdmin();
  const rows = await q(
    `select coalesce(b.source, 'direct') as source,
            count(distinct b.id)::int as bookings,
            count(distinct b.id) filter (where b.status = 'paid')::int as paid,
            count(p.id) filter (where b.status = 'paid')::int as entries
       from bookings b join participants p on p.booking_id = b.id
      group by 1 order by entries desc, bookings desc`,
  );
  const referrals = await q(
    `select b.referral as bib, count(distinct b.id)::int as bookings from bookings b where b.referral is not null group by 1 order by 2 desc limit 10`,
  );
  return json({ rows, referrals });
});
