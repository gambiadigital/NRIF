-- 2026-11-19: payments are confirmed by staff (no more receipts to record and match), and messages go by email only.
-- Run once with: node scripts/migrate.mjs db/2026-11-19-confirm-email-only.sql (safe to run again).

-- Templates are emails now.
update templates set channel = 'email' where channel = 'sms';
update templates set when_label = 'When a payment is confirmed' where id = 'confirm' and when_label = 'When a payment is matched';

-- Texts are no longer sent. The ones still waiting are kept for the record but will never go out.
update messages set status = 'skipped', error = 'Texts are no longer sent; email only.' where channel = 'sms' and status = 'queued';

-- Paid bookings from before confirmed_by existed take the name from their confirmation in the activity log.
update bookings b
   set confirmed_by = (select a.actor from activity a where a.booking_id = b.id and a.kind = 'confirm' order by a.at desc limit 1)
 where b.status = 'paid' and b.confirmed_by is null;
