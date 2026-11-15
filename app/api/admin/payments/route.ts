import { q } from "@/lib/server/db";
import { json, requireAdmin, route } from "@/lib/server/http";

/** Everything the matching screen needs: receipts, bookings waiting for money, and unpaid steps pledges. */
export const GET = route(async () => {
  await requireAdmin();
  const [receipts, pending, pledges, activity] = await Promise.all([
  q(
    `select r.id, r.method, r.amount::float as amount, r.currency, r.payer, r.note, r.reference_given, r.status, r.auto, r.matched_by,
            r.received_at, b.reference as booking_reference,
            (select string_agg(p.bib, ' · ' order by p.position) from participants p where p.booking_id = r.booking_id) as bibs,
            (select p.full_name from participants p where p.booking_id = r.booking_id and p.is_lead) as lead
       from receipts r left join bookings b on b.id = r.booking_id
      order by (r.status = 'unmatched') desc, r.received_at desc limit 300`,
  ),
  q(
    `select b.id, b.reference, b.total::float as total, b.currency, b.pay_method, b.created_at, b.hold_until, b.payer_claimed_at, b.residence, b.city,
            greatest(1, ceil(extract(epoch from (now() - b.created_at)) / 86400))::int as day,
            (b.hold_until < now()) as expired,
            (select p.full_name from participants p where p.booking_id = b.id and p.is_lead) as lead,
            (select count(*)::int from participants p where p.booking_id = b.id) as people,
            (select string_agg(e.name, ', ' order by p.position) from participants p join events e on e.id = p.event_id where p.booking_id = b.id) as events
       from bookings b where b.status = 'pending' order by b.created_at desc limit 300`,
  ),
  q(
    `select s.id, s.reference, s.amount::float as amount, s.name, s.steps_code, s.created_at from step_pledges s where s.status = 'pledged' order by s.created_at desc limit 100`,
  ),
  q("select at, actor, text from activity order by at desc limit 12"),
  ]);
  return json({ receipts, pending, pledges, activity });
});
