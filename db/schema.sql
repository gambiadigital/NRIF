-- Run for Independence 2027: the database.
-- Applied with `node scripts/migrate.mjs`. Every statement is idempotent, so running it again is safe.

-- Events, their fees and their bib counters. Fees are NRIF's to change from the admin console.
create table if not exists events (
  id            text primary key,
  name          text not null,
  distance      text not null,
  km            numeric(6,3) not null,
  min_age       int not null default 0,
  kind          text not null check (kind in ('in-person', 'virtual')),
  start_time    text not null,
  fee_gmd       int not null,
  suggested_gbp int not null,
  bib_start     int not null,
  bib_end       int not null,
  bib_prefix    text not null default '',
  bib_next      int not null,
  sort          int not null default 0,
  open          boolean not null default true
);

create table if not exists teams (
  code       text primary key,
  name       text not null,
  kind       text not null default 'company' check (kind in ('school', 'company', 'club')),
  created_at timestamptz not null default now()
);

-- One booking holds many participants and goes through one payment.
create table if not exists bookings (
  id                 uuid primary key default gen_random_uuid(),
  reference          text not null unique,
  access_key         text not null,
  status             text not null default 'pending' check (status in ('pending', 'paid', 'released', 'cancelled')),
  residence          text not null check (residence in ('gambia', 'abroad')),
  city               text,
  currency           text not null default 'GMD',
  phone_iso          text not null,
  phone              text not null,
  email              text not null,
  town               text,
  emergency_name     text not null,
  emergency_relation text,
  emergency_phone    text not null,
  team_code          text references teams(code),
  steps              boolean not null default false,
  steps_code         text unique,
  consent_waiver     boolean not null,
  consent_guardian   boolean not null default false,
  consent_photos     boolean not null default false,
  consent_news       boolean not null default false,
  waiver_version     text not null,
  waiver_accepted_at timestamptz not null,
  donation           numeric(12,2) not null default 0,
  total              numeric(12,2) not null,
  pay_method         text not null,
  payer_claimed_at   timestamptz,
  source             text,
  referral           text,
  hold_until         timestamptz not null,
  reminded_at        timestamptz,
  paid_at            timestamptz,
  created_at         timestamptz not null default now()
);
create index if not exists bookings_status_idx on bookings (status, created_at desc);
create index if not exists bookings_phone_idx on bookings (phone);

create table if not exists participants (
  id                uuid primary key default gen_random_uuid(),
  booking_id        uuid not null references bookings(id) on delete cascade,
  position          int not null,
  is_lead           boolean not null default false,
  full_name         text not null,
  dob               date not null,
  gender            text,
  event_id          text not null references events(id),
  shirt             text,
  bib_name          text,
  guardian_is_lead  boolean not null default true,
  guardian_name     text,
  guardian_relation text,
  guardian_phone    text,
  bib               text unique,
  created_at        timestamptz not null default now()
);
create index if not exists participants_booking_idx on participants (booking_id, position);

-- Money that reached an NRIF account: entered by staff, or reported by Wave once the API is connected.
create table if not exists receipts (
  id              uuid primary key default gen_random_uuid(),
  method          text not null,
  amount          numeric(12,2) not null,
  currency        text not null default 'GMD',
  payer           text,
  note            text,
  reference_given text,
  external_id     text unique,
  booking_id      uuid references bookings(id),
  status          text not null default 'unmatched' check (status in ('unmatched', 'matched', 'ignored')),
  auto            boolean not null default false,
  matched_by      text,
  matched_at      timestamptz,
  received_at     timestamptz not null default now(),
  created_by      text
);
create index if not exists receipts_status_idx on receipts (status, received_at desc);

create table if not exists activity (
  id         bigserial primary key,
  at         timestamptz not null default now(),
  actor      text not null default 'system',
  kind       text not null,
  text       text not null,
  booking_id uuid references bookings(id) on delete set null
);
create index if not exists activity_at_idx on activity (at desc);

-- Message templates and the outbox. A message stays "queued" until an SMS or email provider is configured.
create table if not exists templates (
  id         text primary key,
  name       text not null,
  channel    text not null,
  when_label text not null,
  body       text not null,
  enabled    boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists messages (
  id         bigserial primary key,
  booking_id uuid references bookings(id) on delete cascade,
  channel    text not null check (channel in ('sms', 'email')),
  to_addr    text not null,
  template   text not null,
  subject    text,
  body       text not null,
  status     text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'skipped')),
  error      text,
  created_at timestamptz not null default now(),
  sent_at    timestamptz
);
create index if not exists messages_status_idx on messages (status, created_at);

create table if not exists admins (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  name          text not null,
  password_hash text not null,
  role          text not null default 'admin',
  created_at    timestamptz not null default now(),
  last_login_at timestamptz
);
create unique index if not exists admins_email_idx on admins (lower(email));

create table if not exists virtual_results (
  id               uuid primary key default gen_random_uuid(),
  participant_id   uuid not null references participants(id) on delete cascade,
  run_date         date not null,
  distance_km      numeric(6,2) not null,
  duration_seconds int not null,
  link             text,
  image            bytea,
  image_type       text,
  status           text not null default 'submitted' check (status in ('submitted', 'approved', 'rejected')),
  review_note      text,
  reviewed_by      text,
  reviewed_at      timestamptz,
  created_at       timestamptz not null default now()
);
create index if not exists virtual_results_participant_idx on virtual_results (participant_id, created_at desc);

create table if not exists step_logs (
  id         bigserial primary key,
  booking_id uuid not null references bookings(id) on delete cascade,
  day        date not null,
  steps      int not null check (steps between 0 and 200000),
  created_at timestamptz not null default now(),
  unique (booking_id, day)
);

create table if not exists step_pledges (
  id         uuid primary key default gen_random_uuid(),
  steps_code text not null references bookings(steps_code),
  name       text,
  message    text,
  amount     numeric(12,2) not null,
  phone      text,
  reference  text not null unique,
  status     text not null default 'pledged' check (status in ('pledged', 'paid', 'cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists transfer_requests (
  id             uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  new_name       text not null,
  new_phone      text not null,
  status         text not null default 'requested' check (status in ('requested', 'done', 'declined')),
  created_at     timestamptz not null default now()
);

-- Contact details, social links and the like, edited from the admin console.
create table if not exists settings (
  key        text primary key,
  value      text not null default '',
  updated_at timestamptz not null default now()
);

-- Confirm a booking: mark it paid, issue a bib to every participant from its event's range, give it a steps code,
-- attach the receipt, and log it. One statement from the app, all-or-nothing inside Postgres.
create or replace function confirm_booking(p_booking uuid, p_receipt uuid, p_actor text, p_auto boolean)
returns table (participant_id uuid, bib text)
language plpgsql as $$
declare
  b bookings%rowtype;
  p record;
  n int;
  e events%rowtype;
  lead_bib text;
begin
  select * into b from bookings where id = p_booking for update;
  if not found then raise exception 'booking not found'; end if;
  if b.status = 'paid' then
    return query select pa.id, pa.bib from participants pa where pa.booking_id = p_booking order by pa.position;
    return;
  end if;
  if b.status in ('cancelled') then raise exception 'booking is cancelled'; end if;

  for p in select * from participants where booking_id = p_booking and participants.bib is null order by position loop
    select * into e from events where id = p.event_id for update;
    if e.bib_next > e.bib_end then raise exception 'bib range for % is full', e.id; end if;
    n := e.bib_next;
    update events set bib_next = bib_next + 1 where id = e.id;
    update participants set bib = e.bib_prefix || lpad(n::text, 4, '0') where id = p.id;
  end loop;

  select pa.bib into lead_bib from participants pa where pa.booking_id = p_booking order by pa.position limit 1;
  update bookings
     set status = 'paid',
         paid_at = now(),
         steps_code = case when steps then 'SC-' || regexp_replace(lead_bib, '\D', '', 'g') else null end
   where id = p_booking;

  if p_receipt is not null then
    update receipts set booking_id = p_booking, status = 'matched', matched_by = p_actor, matched_at = now(), auto = p_auto where id = p_receipt;
  end if;

  insert into activity (actor, kind, text, booking_id)
  select p_actor, 'confirm',
         b.reference || case when p_auto then ' auto-matched.' else ' matched by ' || p_actor || '.' end ||
         ' Bibs ' || string_agg(pa.bib, ', ' order by pa.position) || ' issued.',
         p_booking
    from participants pa where pa.booking_id = p_booking;

  return query select pa.id, pa.bib from participants pa where pa.booking_id = p_booking order by pa.position;
end;
$$;

-- Email sign-in codes (sent by Neon Auth). Kept only to rate-limit requests per address.
create table if not exists code_requests (
  id      bigserial primary key,
  email   text not null,
  purpose text not null,
  at      timestamptz not null default now()
);
create index if not exists code_requests_email_idx on code_requests (lower(email), at desc);
create index if not exists bookings_email_idx on bookings (lower(email));

-- Visa and Mastercard through the Mastercard Payment Gateway. One row per checkout attempt (order RFI-XXXX-C1, -C2...).
-- The gateway's Retrieve Order is the only source of truth; this table only remembers which orders to ask about.
create table if not exists card_payments (
  order_id          text primary key,
  booking_id        uuid not null references bookings(id),
  session_id        text,
  success_indicator text,
  amount            numeric(12,2) not null,
  currency          text not null,
  status            text not null default 'open' check (status in ('open', 'paid')),
  result            text,
  receipt_id        uuid references receipts(id),
  created_at        timestamptz not null default now(),
  checked_at        timestamptz
);
create index if not exists card_payments_booking_idx on card_payments (booking_id, created_at desc);
create index if not exists card_payments_open_idx on card_payments (created_at) where status = 'open';
