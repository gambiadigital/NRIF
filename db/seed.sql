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
  ('pending',  'Reference code',       'sms', 'When a booking is made',
   'Run for Independence: your place is held until {hold}. Pay {amount} with reference {ref}. Details: {link}'),
  ('confirm',  'Confirmation',         'sms', 'When a payment is matched',
   'Run for Independence: You''re in, {first}. {event}, bib {bib}. Sat 30 Jan, gates 06:30, {start} start, Independence Stadium. {link}'),
  ('confirm-virtual', 'Virtual confirmation', 'sms', 'When a virtual entry is paid',
   'Run for Independence: You''re in, {first}. {event}, e-bib {bib}. Run 5 or 10 km any day 23-31 Jan, upload by 2 Feb: {link}'),
  ('reminder3', 'Pending reminder',    'sms', 'Day 3 of a 5-day hold',
   'Your Run for Independence place is held until {hold}. Pay {amount} with reference {ref}. Already paid? Ignore this.'),
  ('race-7',   '7 days to go',         'sms', 'Sat 23 Jan, 09:00',
   '7 days to go, {first}. Sat 30 Jan at Independence Stadium: gates 06:30, start 07:30. Bibs {bibs}. Latest plan: {link}'),
  ('race-1',   'Tomorrow',             'sms', 'Fri 29 Jan, 18:00',
   'Tomorrow. Gates open 06:30, {event} starts {start}. Bring water and your bib. See you at Independence Stadium.'),
  ('virtual-open', 'Run window opens', 'sms', 'Sat 23 Jan, 07:00',
   'The run window is open, {first}. Run your {event} any day to 31 Jan and upload a screenshot or link: {link}')
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
