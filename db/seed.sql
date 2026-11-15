-- Starting data: the six events (sample fees from the storyboard, editable in the admin console), the first teams,
-- the message templates and empty contact settings. Re-running keeps anything NRIF has already changed.

insert into events (id, name, distance, km, min_age, kind, start_time, fee_gmd, suggested_gbp, bib_start, bib_end, bib_prefix, bib_next, sort) values
  ('21k',         '21K Half marathon',    '21K',    21.1,  18, 'in-person', '06:30',   1000, 30, 1,    999,  '',  1,    1),
  ('10k',         '10K',                  '10K',    10,    16, 'in-person', '07:00',    500, 20, 1000, 3999, '',  1000, 2),
  ('5k',          '5K',                   '5K',     5,     12, 'in-person', '07:30',    300, 15, 4000, 6999, '',  4000, 3),
  ('heritage',    '1.965K Heritage walk', '1.965K', 1.965,  0, 'in-person', '08:00',    200, 10, 7000, 8999, '',  7000, 4),
  ('10k-virtual', '10K Virtual',          '10K',    10,    16, 'virtual',   'Any day',  500, 20, 1000, 3999, 'V', 1000, 5),
  ('5k-virtual',  '5K Virtual',           '5K',     5,     12, 'virtual',   'Any day',  300, 15, 4000, 6999, 'V', 4000, 6)
on conflict (id) do nothing;

insert into teams (code, name, kind) values
  ('NRIF-STAFF', 'NRIF Staff', 'company')
on conflict (code) do nothing;

insert into templates (id, name, channel, when_label, body) values
  ('pending',  'Reference code',       'sms', 'When a booking is made',
   'Run for Independence: your place is held until {hold}. Pay {amount} with reference {ref}. Details: {link}'),
  ('confirm',  'Confirmation',         'sms', 'When a payment is matched',
   'Run for Independence: You''re in, {first}. {event}, bib {bib}. Sat 30 Jan, {start} start, Independence Stadium. Day plan: {link}'),
  ('confirm-virtual', 'Virtual confirmation', 'sms', 'When a virtual entry is paid',
   'Run for Independence: You''re in, {first}. {event}, e-bib {bib}. Run any day 23-31 Jan, upload by 2 Feb: {link}'),
  ('reminder3', 'Pending reminder',    'sms', 'Day 3 of a 5-day hold',
   'Your Run for Independence place is held until {hold}. Pay {amount} with reference {ref}. Already paid? Ignore this.'),
  ('race-7',   '7 days to go',         'sms', 'Sat 23 Jan, 09:00',
   '7 days to go. Collect race packs for bib {bibs} on Thu 28 or Fri 29 Jan, 10:00-17:00. Show the QR code in your email.'),
  ('race-1',   'Tomorrow',             'sms', 'Fri 29 Jan, 18:00',
   'Tomorrow. Gates open 05:30, {event} starts {start}. Bring water and your bib. See you at Independence Stadium.'),
  ('virtual-open', 'Run window opens', 'sms', 'Sat 23 Jan, 07:00',
   'The run window is open, {first}. Run your {event} any day to 31 Jan and upload a screenshot or link: {link}')
on conflict (id) do nothing;

insert into settings (key, value) values
  ('contact_whatsapp', ''),
  ('contact_phone', ''),
  ('contact_email', ''),
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
