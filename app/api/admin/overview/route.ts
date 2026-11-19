import { q, one, settings } from "@/lib/server/db";
import { json, requireAdmin, route } from "@/lib/server/http";
import { visibleActor } from "@/lib/server/admin";

export const GET = route(async () => {
  await requireAdmin();
  const [k, daily, byEvent, bySource, residence, cities, activity, s] = await Promise.all([
  one<{ entries: number; bookings: number; pending: number; pending_late: number; claimed: number; raised: string; today: number }>(
    `select
       (select count(*)::int from participants p join bookings b on b.id = p.booking_id where b.status = 'paid') as entries,
       (select count(*)::int from bookings where status = 'paid') as bookings,
       (select count(*)::int from bookings where status = 'pending' and hold_until > now()) as pending,
       (select count(*)::int from bookings where status = 'pending' and hold_until > now() and created_at < now() - interval '3 days') as pending_late,
       (select count(*)::int from bookings where status = 'pending' and payer_claimed_at is not null) as claimed,
       (select coalesce(sum(total), 0) from bookings where status = 'paid' and currency = 'GMD') as raised,
       (select count(*)::int from participants p join bookings b on b.id = p.booking_id where b.created_at > now() - interval '1 day') as today`,
  ),
  q<{ day: string; n: number }>(
    `select to_char(d, 'YYYY-MM-DD') as day, coalesce(x.n, 0)::int as n
       from generate_series(current_date - 29, current_date, interval '1 day') d
       left join (select date_trunc('day', b.created_at)::date as day, count(p.id) as n from bookings b join participants p on p.booking_id = b.id
                   where b.status <> 'cancelled' group by 1) x on x.day = d::date
      order by d`,
  ),
  q<{ id: string; name: string; n: number }>(
    // Retired events only show once they have confirmed entries.
    "select e.id, e.name, count(p.id) filter (where b.status = 'paid')::int as n from events e left join participants p on p.event_id = e.id left join bookings b on b.id = p.booking_id group by e.id having e.open or count(p.id) filter (where b.status = 'paid') > 0 order by e.sort",
  ),
  q<{ source: string; n: number }>(
    "select coalesce(b.source, 'direct') as source, count(p.id)::int as n from bookings b join participants p on p.booking_id = b.id where b.status = 'paid' group by 1 order by 2 desc",
  ),
  one<{ home: number; abroad: number; cities: number }>(
    `select count(*) filter (where b.residence = 'gambia')::int as home, count(*) filter (where b.residence = 'abroad')::int as abroad,
            (select count(distinct lower(split_part(city, ',', 1)))::int from bookings where status = 'paid' and residence = 'abroad' and coalesce(city,'') <> '') as cities
       from participants p join bookings b on b.id = p.booking_id where b.status = 'paid'`,
  ),
  q<{ city: string; n: number }>(
    "select initcap(split_part(city, ',', 1)) as city, count(*)::int as n from bookings where status = 'paid' and residence = 'abroad' and coalesce(city,'') <> '' group by 1 order by 2 desc limit 30",
  ),
  q<{ at: string; actor: string; text: string }>(`select at, actor, text from activity a where ${visibleActor("a")} order by at desc limit 60`),
  settings(["fund_goal_gmd"]),
  ]);
  return json({ kpis: { ...k, raised: Number(k?.raised ?? 0), goal: Number(s.fund_goal_gmd || 20_000_000) }, daily, byEvent, bySource, residence, cities, activity });
});
