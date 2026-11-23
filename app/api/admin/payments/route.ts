import { q } from "@/lib/server/db";
import { json, requireAdmin, route } from "@/lib/server/http";

/*
 * The payments screen: every booking that is waiting for money, has been confirmed, or was released, with what staff
 * need to find the payment in NRIF's accounts: the reference, the amount, the method, and the payer's own transaction
 * reference and paying number (pay first).
 */
export const GET = route(async () => {
  await requireAdmin();
  const [bookings, methods, unfinished] = await Promise.all([
    q(
      `select b.id, b.reference, b.status, b.total::float as total, b.currency, b.pay_method, b.created_at, b.hold_until,
              b.payer_claimed_at, b.payer_from, b.payer_reference, right(b.phone, 4) as phone_tail, b.email, b.paid_at, b.reminded_at, b.residence, b.city,
              coalesce(b.confirmed_by, (select a.actor from activity a where a.booking_id = b.id and a.kind = 'confirm' order by a.at desc limit 1)) as confirmed_by,
              exists (select 1 from card_payments c where c.booking_id = b.id and c.status = 'paid') as by_card,
              greatest(1, ceil(extract(epoch from (now() - b.created_at)) / 86400))::int as day,
              (b.hold_until < now()) as expired,
              (select p.full_name from participants p where p.booking_id = b.id and p.is_lead) as lead,
              (select count(*)::int from participants p where p.booking_id = b.id) as people,
              (select string_agg(e.name, ', ' order by p.position) from participants p join events e on e.id = p.event_id where p.booking_id = b.id) as events,
              (select string_agg(p.bib, ', ' order by p.position) from participants p where p.booking_id = b.id and p.bib is not null) as bibs
         from bookings b
        where b.status in ('pending', 'paid', 'released')
        order by b.created_at desc
        limit 1000`,
    ),
    q(
      `select pay_method as method, count(*) filter (where status = 'paid')::int as confirmed, count(*) filter (where status = 'pending')::int as waiting
         from bookings group by 1`,
    ),
    // Pay first: money claimed or paid by someone who has not filled in their names yet. No booking, so nothing to
    // confirm; listed so staff know the payment is there, with the number they paid from to reach them.
    q(
      `select id, reference, total::float as total, currency, method, payer_reference, payer_from, status, claimed_at, paid_at, created_at,
              array_length(events, 1) as entries
         from orders where status in ('claimed', 'paid') and booking_id is null
        order by coalesce(claimed_at, paid_at, created_at) desc limit 200`,
    ),
  ]);
  return json({ bookings, methods, unfinished });
});
