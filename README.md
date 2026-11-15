# Run for Independence 2027 · NRIF

Registration, payments and race administration for the National Research & Innovation Fund's Run for Independence
(Saturday 30 January 2027, Independence Stadium, Bakau, plus 10K and 5K virtual runs from anywhere).

Built from the storyboard *Registration from User POV*: every frame is a working screen, backed by a Neon Postgres
database.

## Run it locally

```bash
npm install
cp .env.example .env.local   # then fill in the values
node scripts/migrate.mjs     # creates the tables and the starting data; safe to re-run
npm run dev
```

## Environment variables

| Name | What it is |
| --- | --- |
| `DATABASE_URL` | Neon pooled connection string (project NRIF, branch `production`) |
| `SESSION_SECRET` | 32+ random characters; signs the admin and My entry cookies |
| `ADMIN_SETUP_TOKEN` | One-time code for creating the first admin at `/admin/login` |
| `CRON_SECRET` | Vercel sends it to `/api/cron/daily`; anything else is refused |
| `WAVE_PAYMENT_LINK` | NRIF's Wave merchant payment link |
| `NEXT_PUBLIC_SITE_URL` | The public address, used in text-message links |
| `WAVE_API_KEY`, `WAVE_WEBHOOK_SECRET` | Optional. Wave Checkout API: makes Wave instant and confirms bookings automatically |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` | Optional. Sends the texts |
| `RESEND_API_KEY`, `EMAIL_FROM` | Optional. Sends the emails |

## How it works

**Registration.** Five steps (where you live and the event, your details, who is running, waiver and consents,
payment). The server re-checks everything: ages against each event's minimum, a lead booker of 18 or over, guardians
for under 18s, the waiver version, team codes. It prices the booking from the database, not from the browser.

**Payment.** Every booking gets a reference such as `RFI-7Q4K` and a five-day hold. Payers use Wave (NRIF's payment
link, QR or number), Yonna (QR or number), Ecobank (EMV QR or account 6240050636), or Remitly/ACE from abroad. Staff
record each receipt in **Admin → Payments**; a receipt quoting a waiting reference with the full amount matches by
itself, anything else is matched by hand. Matching runs `confirm_booking()` in Postgres, which marks the booking paid,
issues the next bib in each event's range (virtual entries get a `V` prefix) and gives steps-challenge bookings their
`SC-` code, all in one transaction. The payer's screen notices within seconds and shows their bibs.

When Wave Checkout API keys arrive, set `WAVE_API_KEY` and `WAVE_WEBHOOK_SECRET` and point Wave's webhook at
`/api/webhooks/wave`: each booking then gets its own checkout with the exact amount, and payment confirms itself.

**Messages.** Texts and emails go into an outbox. Without a provider they wait as "queued" (visible in
**Admin → Messages**); add Twilio and/or Resend and the queue sends. Templates are editable there, with a
160-character counter.

**Daily job.** `/api/cron/daily` (scheduled in `vercel.json`) releases unpaid places after five days, sends the day-3
reminder, the race-week texts on 23 and 29 January, and pushes the outbox.

**Participants.** My entry signs in with the booking reference and the phone number used to book. It shows bibs, the
race-pack QR code, kit changes (until 9 January), place transfers, steps logging and, for virtual runners, uploading a
run and the e-certificate once staff approve it.

**Admin.** `/admin`, behind its own sign-in. The first account is created at `/admin/login` with the setup code;
further accounts are added in **Settings**, along with contact details, social links, payment numbers, the fund goal and
team codes. **Events and bibs** sets fees, start times and bib ranges.

## Code map

- `app/` pages; `app/api/` route handlers; `app/admin/(console)/` the signed-in admin screens.
- `lib/server/` database access, bookings, sessions, messages and Wave (server only).
- `db/schema.sql`, `db/seed.sql` the database; `scripts/migrate.mjs` applies both.
- `lib/data.ts` the run's fixed facts and the look of each event; live fees come from the database.
- `proxy.ts` keeps signed-out visitors away from `/admin`.
