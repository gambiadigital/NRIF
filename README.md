# Run for Independence 2027 · NRIF

Registration, payments and race administration for the National Research & Innovation Fund's Run for Independence
(Saturday 30 January 2027, Independence Stadium, Bakau: a 5 km run and the 1.965 km Heritage Walk, gates 06:30,
start 07:30, plus the Diaspora Virtual Run, 5 or 10 km from anywhere, for people who live abroad).

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
| `NEXT_PUBLIC_SITE_URL` | The public address, used in text-message links and as the origin for Neon Auth |
| `NEON_AUTH_BASE_URL` | Neon Auth (Managed Better Auth) URL for the branch; sends and checks the email sign-in codes |
| `WAVE_API_KEY`, `WAVE_WEBHOOK_SECRET` | Optional. Wave Checkout API: makes Wave instant and confirms bookings automatically |
| `MODEMPAY_SECRET_KEY` | Visa and Mastercard through Modem Pay (`sk_live_…`). Card payments appear only when it is set |
| `MODEMPAY_CURRENCIES` | Optional. Currencies taken by card, comma-separated. Default `GMD`, the only one Modem Pay takes cards in today |
| `MODEMPAY_WEBHOOK_SECRET` | Optional. Only if an account webhook is added in the Modem Pay dashboard; each payment already carries its own signed callback |
| `RESEND_API_KEY`, `EMAIL_FROM` | Sends the emails (Resend). `EMAIL_FROM` is an address on a domain verified in Resend, such as `Run for Independence <run@nrif.gm>`. Until both are set, emails wait in the outbox |

## How it works

**Events.** Three are on sale: the 5 km run (GMD 300) and the Heritage Walk (GMD 200) for people in The Gambia, and
the Diaspora Virtual Run (GBP 15, shown in the payer's currency) only for people who pick Abroad. The six events from the
first version (21K, 10K, 5K, walk, 10K and 5K virtual) were cut to three before launch; the four that went are closed in
the database but kept, so bookings made before the change still show and can still be paid. There are no T-shirts, no
names on bibs and no steps challenge: the bib on screen is labelled as a picture only. `db/2026-11-18-go-live.sql`
brings a database made before the change up to date.

**Registration.** Five steps (where you live and the event, your details, who is running, waiver and consents,
payment). The server re-checks everything: ages against each event's minimum, a lead booker of 18 or over, guardians
for under 18s, the waiver version, team codes. It prices the booking from the database, not from the browser.

**Payment.** Every booking gets a reference such as `RFI-7Q4K` and a five-day hold. Payers use Wave (NRIF's payment
link, QR or number), Yonna (QR or number), Ecobank (EMV QR or account 6240050636), or Remitly/ACE from abroad. Staff
record each receipt in **Admin → Payments**; a receipt quoting a waiting reference with the full amount matches by
itself, anything else is matched by hand. Matching runs `confirm_booking()` in Postgres, which marks the booking paid,
issues the next bib in each event's range (virtual entries get a `V` prefix), all in one transaction. The payer's screen notices within seconds and shows their bibs.

**Cards.** Visa and Mastercard go through Modem Pay. For each try our server creates a payment intent for the booking's
exact amount, limited to cards, and sends the payer to Modem Pay's checkout page; the card is typed there, never on ours.
Each try is its own order (`RFI-7Q4K-C1`, `-C2`...), carried in the intent's metadata. The intent also sets a
`callback_url` (`/api/webhooks/modempay`), signed with HMAC-SHA512 keyed by sha256 of the secret key, so no dashboard webhook
is needed. Whatever the trigger (the payer coming back, the callback, or the daily job), the server asks Modem Pay's verify
endpoint whether the intent is `successful` for the full amount before it records a `card` receipt and runs
`confirm_booking()`. Modem Pay takes cards in GMD only, from GMD 74.74 (USD 1) up, so card shows for dalasi bookings.
Checkout links expire after 20 minutes.

**Wave without the API.** NRIF's Wave merchant link (`https://pay.wave.com/m/M_gm_CedMPBz-cNJ4/c/gm/`; the longer
`/mu/U_gm_…` form returns 404) has no box for a reference. So the Wave tab asks payers for the Wave number they paid
from, staff see it on the waiting booking, and a Wave receipt recorded with that number in the Payer box matches by
itself when the number (or the booking phone) belongs to exactly one waiting booking and the amount covers it.

When Wave Checkout API keys arrive, set `WAVE_API_KEY` and `WAVE_WEBHOOK_SECRET` and point Wave's webhook at
`/api/webhooks/wave`: each booking then gets its own checkout with the exact amount, and payment confirms itself.

**Messages.** Texts and emails go into an outbox. Without a provider they wait as "queued" (visible in
**Admin → Messages**); add Twilio and/or Resend and the queue sends. Templates are editable there, with a
160-character counter.

**Daily job.** `/api/cron/daily` (scheduled in `vercel.json`) releases unpaid places after five days, sends the day-3
reminder, the race-week texts on 23 and 29 January, and pushes the outbox.

**Signing in.** People sign in with a six-digit code emailed by Neon Auth (enabled on the `production` branch, with
`https://nrif.vercel.app` as a trusted domain and localhost access off). Codes go only to addresses that have a booking
(My entry) or an admin account, at most five an hour per address. Neon only proves the address; the session after it is
our own signed cookie. Codes come from Neon's shared sender (`auth@mail.myneon.app`); for launch, give Neon NRIF's own
SMTP account in **Settings → Better Auth** so codes come from NRIF and are not rate-limited.

**Participants.** My entry signs in with an email code, or with the booking reference and phone number as a fallback. It shows bibs, the
booking QR code, place transfers (until 9 January) and, for virtual runners, uploading a
run and the e-certificate once staff approve it.

**Brand.** NRIF's rule: accents come from the Gambian flag (red, blue, green) or white, never yellow. Sign up buttons
are flag red, as on the logo's "4". The NRIF and Run4Independence marks always appear together (`CoBrand` in
`components/brand.tsx`); phones show the NRIF tree on its own so the pair fits.

**Admin.** `/admin`, behind its own sign-in by email code. The first account is created at `/admin/login` with the
setup code and a code sent to its email; further accounts are added by email in **Settings**, along with contact details, social links, payment numbers, the fund goal and
team codes. **Events and bibs** sets fees, start times and bib ranges.

## Code map

- `app/` pages; `app/api/` route handlers; `app/admin/(console)/` the signed-in admin screens.
- `lib/server/` database access, bookings, sessions, messages and Wave (server only).
- `db/schema.sql`, `db/seed.sql` the database; `scripts/migrate.mjs` applies both.
- `lib/data.ts` the run's fixed facts and the look of each event; live fees come from the database.
- `proxy.ts` keeps signed-out visitors away from `/admin`.
