import { q, settings } from "@/lib/server/db";
import { json, route } from "@/lib/server/http";

/** The landing page's live numbers: money matched, paid entries, cities abroad, and the biggest teams. */
export const GET = route(async () => {
  const [[raised], [entries], cities, teams, s] = await Promise.all([
  q<{ v: string }>("select coalesce(sum(amount), 0) as v from receipts where status = 'matched' and currency = 'GMD'"),
  q<{ v: number; abroad: number }>(
    "select count(*)::int as v, count(*) filter (where b.residence = 'abroad')::int as abroad from participants p join bookings b on b.id = p.booking_id where b.status = 'paid'",
  ),
  q<{ city: string; n: number }>(
    "select initcap(split_part(city, ',', 1)) as city, count(*)::int as n from bookings where status = 'paid' and residence = 'abroad' and coalesce(city, '') <> '' group by 1 order by 2 desc",
  ),
  q<{ code: string; name: string; kind: string; n: number }>(
    "select t.code, t.name, t.kind, count(p.id)::int as n from teams t left join bookings b on b.team_code = t.code and b.status = 'paid' left join participants p on p.booking_id = b.id group by t.code order by n desc, t.name limit 5",
  ),
  settings(["fund_goal_gmd"]),
  ]);
  return json({
    raised: Number(raised?.v ?? 0),
    goal: Number(s.fund_goal_gmd || 20_000_000),
    entries: entries?.v ?? 0,
    abroadEntries: entries?.abroad ?? 0,
    cities,
    teams,
  });
});
