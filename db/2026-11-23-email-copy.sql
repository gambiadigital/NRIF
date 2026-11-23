-- 2026-11-23: the email templates rewritten as emails (they were written as 160-character texts). The designed email
-- adds the reference, bibs, race-day details and a button around these words, so the words no longer carry the link.
-- Only templates still in their original wording are replaced, so anything staff have edited is kept.
-- Run with: node scripts/migrate.mjs db/2026-11-23-email-copy.sql (safe to run again).

update templates set body = E'Thank you for signing up for Run for Independence, {first}. Your place is held until {hold}.\n\nTo confirm it, pay {amount} and quote your reference {ref} with the payment. Your bib number arrives by email as soon as NRIF confirms it.', updated_at = now()
 where id = 'pending' and body = 'Run for Independence: your place is held until {hold}. Pay {amount} with reference {ref}. Details: {link}';

update templates set body = E'Hi {first}, your place in Run for Independence is held until {hold}, but we have not seen your payment yet.\n\nPay {amount} and quote your reference {ref} to keep it. Already paid? Thank you, there is nothing more to do: NRIF will confirm it shortly.', updated_at = now()
 where id = 'reminder3' and body = 'Your Run for Independence place is held until {hold}. Pay {amount} with reference {ref}. Already paid? Ignore this.';

update templates set body = E'Your payment is confirmed and your place is yours, {first}. Thank you for running for research and innovation in The Gambia.\n\nKeep this email: it has your bib number and everything you need for race day.', updated_at = now()
 where id = 'confirm' and body = 'Run for Independence: You''re in, {first}. {event}, bib {bib}. Sat 30 Jan, gates 06:30, {start} start, Independence Stadium. {link}';

update templates set body = E'Your payment is confirmed and your e-bib is ready, {first}.\n\nRun 5 or 10 km wherever you are, on any day from 23 to 31 January, then upload a screenshot or link from your running app by 2 February to get your e-certificate.', updated_at = now()
 where id = 'confirm-virtual' and body = 'Run for Independence: You''re in, {first}. {event}, e-bib {bib}. Run 5 or 10 km any day 23-31 Jan, upload by 2 Feb: {link}';

update templates set body = E'Seven days to go, {first}! Here is everything you need for Saturday at Independence Stadium.\n\nArrive early: gates open at 06:30 and the start is at 07:30.', updated_at = now()
 where id = 'race-7' and body = '7 days to go, {first}. Sat 30 Jan at Independence Stadium: gates 06:30, start 07:30. Bibs {bibs}. Latest plan: {link}';

update templates set body = E'Tomorrow is race day, {first}. Gates open at 06:30 and your {event} starts at {start}.\n\nBring water, wear something comfortable and arrive early. See you at Independence Stadium!', updated_at = now()
 where id = 'race-1' and body = 'Tomorrow. Gates open 06:30, {event} starts {start}. Bring water and your bib. See you at Independence Stadium.';

update templates set body = E'The run window is open, {first}! Run your {event} on any day until 31 January.\n\nThen upload a screenshot or link from your running app by 2 February to get your e-certificate.', updated_at = now()
 where id = 'virtual-open' and body = 'The run window is open, {first}. Run your {event} any day to 31 Jan and upload a screenshot or link: {link}';
