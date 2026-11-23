-- Starting data: the three events (fees editable in the admin console), the first teams, the message templates and
-- NRIF's contact details. Re-running keeps anything NRIF has already changed. Databases made before the change from six
-- events to three get it from db/2026-11-18-go-live.sql.

insert into events (id, name, distance, km, min_age, kind, start_time, fee_gmd, suggested_gbp, bib_start, bib_end, bib_prefix, bib_next, sort) values
  ('5k',       '5 km Run',               '5K',     5,     12, 'in-person', '07:30',   300, 15, 4000, 6999, '',  4000, 1),
  ('heritage', '1.965 km Heritage Walk', '1.965K', 1.965,  0, 'in-person', '07:30',   200, 10, 7000, 8999, '',  7000, 2),
  ('virtual',  'Diaspora Virtual Run',   '5/10K',  10,    12, 'virtual',   'Any day',   0, 15, 7000, 9999, 'V', 7000, 3)
on conflict (id) do nothing;

insert into teams (code, name, kind) values
  ('NRIF-STAFF', 'NRIF Staff', 'company')
on conflict (code) do nothing;

insert into templates (id, name, channel, when_label, body) values
  ('pending', 'Reference code', 'email', 'When a booking is made',
   E'Thank you for signing up for Run for Independence, {first}. Your place is held until {hold}.

To confirm it, pay {amount} and quote your reference {ref} with the payment. Your bib number arrives by email as soon as NRIF confirms it.'),
  ('confirm', 'Confirmation', 'email', 'When a payment is confirmed',
   E'Your payment is confirmed and your place is yours, {first}. Thank you for running for research and innovation in The Gambia.

Keep this email: it has your bib number and everything you need for race day.'),
  ('confirm-virtual', 'Virtual confirmation', 'email', 'When a virtual entry is paid',
   E'Your payment is confirmed and your e-bib is ready, {first}.

Run 5 or 10 km wherever you are, on any day from 23 to 31 January, then upload a screenshot or link from your running app by 2 February to get your e-certificate.'),
  ('reminder3', 'Pending reminder', 'email', 'Day 3 of a 5-day hold',
   E'Hi {first}, your place in Run for Independence is held until {hold}, but we have not seen your payment yet.

Pay {amount} and quote your reference {ref} to keep it. Already paid? Thank you, there is nothing more to do: NRIF will confirm it shortly.'),
  ('race-7', '7 days to go', 'email', 'Sat 23 Jan, 09:00',
   E'Seven days to go, {first}! Here is everything you need for Saturday at Independence Stadium.

Arrive early: gates open at 06:30 and the start is at 07:30.'),
  ('race-1', 'Tomorrow', 'email', 'Fri 29 Jan, 18:00',
   E'Tomorrow is race day, {first}. Gates open at 06:30 and your {event} starts at {start}.

Bring water, wear something comfortable and arrive early. See you at Independence Stadium!'),
  ('virtual-open', 'Run window opens', 'email', 'Sat 23 Jan, 07:00',
   E'The run window is open, {first}! Run your {event} on any day until 31 January.

Then upload a screenshot or link from your running app by 2 February to get your e-certificate.')
on conflict (id) do nothing;

insert into settings (key, value) values
  ('contact_whatsapp', '+220 833796680'),
  ('contact_phone', '+220 833796680'),
  ('contact_email', 'info@nrif.gm'),
  ('contact_office', ''),
  ('social_facebook', ''),
  ('social_instagram', ''),
  ('social_tiktok', ''),
  ('social_x', ''),
  ('fund_goal_gmd', '20000000'),
  ('wave_number', '+220 83 379 6680'),
  ('yonna_number', '+220 83 379 6680'),
  ('ecobank_account', '6240050636'),
  ('ecobank_name', 'National Research and Innovation Fund')
on conflict (key) do nothing;
