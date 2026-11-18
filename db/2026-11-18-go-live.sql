-- NRIF's changes before go-live (18 Nov 2026), for databases made before them. Safe to run more than once.
--   node scripts/migrate.mjs db/2026-11-18-go-live.sql

-- Three events instead of six: the 5 km run and the Heritage Walk at 07:30, and the Diaspora Virtual Run for people
-- abroad at GBP 15. The old four close but stay, so bookings made before the change keep their event and can still be paid.
insert into events (id, name, distance, km, min_age, kind, start_time, fee_gmd, suggested_gbp, bib_start, bib_end, bib_prefix, bib_next, sort) values
  ('virtual', 'Diaspora Virtual Run', '5/10K', 10, 12, 'virtual', 'Any day', 0, 15, 7000, 9999, 'V', 7000, 3)
on conflict (id) do nothing;
update events set name = '5 km Run', start_time = '07:30', open = true, sort = 1 where id = '5k';
update events set name = '1.965 km Heritage Walk', start_time = '07:30', open = true, sort = 2 where id = 'heritage';
update events set open = false, start_time = case when kind = 'virtual' then start_time else '07:30' end, sort = sort + 10
 where id in ('21k', '10k', '10k-virtual', '5k-virtual') and open;

-- Messages: new times, no race-pack dates. Each one changes only if nobody has edited it in the admin console.
update templates set body = 'Run for Independence: You''re in, {first}. {event}, bib {bib}. Sat 30 Jan, gates 06:30, {start} start, Independence Stadium. {link}'
 where id = 'confirm' and body = 'Run for Independence: You''re in, {first}. {event}, bib {bib}. Sat 30 Jan, {start} start, Independence Stadium. Day plan: {link}';
update templates set body = 'Run for Independence: You''re in, {first}. {event}, e-bib {bib}. Run 5 or 10 km any day 23-31 Jan, upload by 2 Feb: {link}'
 where id = 'confirm-virtual' and body = 'Run for Independence: You''re in, {first}. {event}, e-bib {bib}. Run any day 23-31 Jan, upload by 2 Feb: {link}';
update templates set body = '7 days to go, {first}. Sat 30 Jan at Independence Stadium: gates 06:30, start 07:30. Bibs {bibs}. Latest plan: {link}'
 where id = 'race-7' and body = '7 days to go. Collect race packs for bib {bibs} on Thu 28 or Fri 29 Jan, 10:00-17:00. Show the QR code in your email.';
update templates set body = 'Tomorrow. Gates open 06:30, {event} starts {start}. Bring water and your bib. See you at Independence Stadium.'
 where id = 'race-1' and body = 'Tomorrow. Gates open 05:30, {event} starts {start}. Bring water and your bib. See you at Independence Stadium.';

-- NRIF's contact details, where none were entered yet.
update settings set value = 'info@nrif.gm' where key = 'contact_email' and value = '';
update settings set value = '+220 833796680' where key in ('contact_phone', 'contact_whatsapp') and value = '';
