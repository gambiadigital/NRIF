import "server-only";
import { randomBytes, randomInt } from "node:crypto";
import { z } from "zod";
import { q, one, log } from "./db";
import { HttpError } from "./http";
import { queueForBooking, sendSoon } from "./messages";
import { cardTakes } from "./cardConfig";
import { CURRENCIES } from "@/lib/data";
import { raceDayAge, suggested } from "@/lib/format";
import { WAIVER } from "@/lib/content";

/* ---------- input ---------- */

const Phone = z.object({
  iso: z.string().length(2),
  digits: z.string().regex(/^\d{6,12}$/, "Enter a full phone number"),
});

const ParticipantIn = z.object({
  fullName: z.string().trim().min(2, "Enter every participant's full name").max(80),
  dob: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, "Enter dates of birth as DD/MM/YYYY"),
  gender: z.enum(["Female", "Male", ""]),
  eventId: z.string().min(2).max(20),
  // No T-shirts and no names on bibs any more; older clients may still send these, and they are ignored.
  shirt: z.string().max(4).default(""),
  bibName: z.string().max(10).default(""),
  guardianIsLead: z.boolean().default(true),
  guardian: z
    .object({ name: z.string().max(80).default(""), relation: z.string().max(40).default(""), phone: z.object({ iso: z.string(), digits: z.string() }) })
    .optional(),
});

export const BookingIn = z.object({
  residence: z.enum(["gambia", "abroad"]),
  city: z.string().max(80).default(""),
  currency: z.enum(["GMD", ...CURRENCIES.map((c) => c.code)] as [string, ...string[]]),
  participants: z.array(ParticipantIn).min(1).max(10, "One booking can hold up to 10 people"),
  contact: z.object({
    phone: Phone,
    email: z.email("Enter a valid email address"),
    town: z.string().trim().max(80).default(""),
    emergency: z.object({ name: z.string().trim().min(2, "Enter an emergency contact").max(80), relation: z.string().max(40).default(""), phone: Phone }),
  }),
  teamCode: z.string().trim().max(24).default(""),
  steps: z.boolean().default(false),
  consents: z.object({ waiver: z.literal(true, { message: "Accept the health disclaimer and waiver" }), guardian: z.boolean(), photos: z.boolean(), news: z.boolean() }),
  donation: z.number().min(0).max(1_000_000).default(0),
  payMethod: z.enum(["wave", "yonna", "ecobank", "remit", "card"]),
  source: z.string().max(40).default("direct"),
  referral: z.string().max(20).default(""),
});
export type BookingInput = z.infer<typeof BookingIn>;

type EventRow = { id: string; name: string; kind: string; min_age: number; fee_gmd: number; suggested_gbp: number; open: boolean; start_time: string; distance: string };

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const newReference = () => "RFI-" + Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
const isoDate = (dob: string) => {
  const [d, m, y] = dob.split("/");
  return `${y}-${m}-${d}`;
};

export const HOLD_DAYS = 5;

/** Validates against the live events, prices on the server, and writes the booking and its people in one statement. */
export async function createBooking(input: BookingInput) {
  const events = await q<EventRow>("select id, name, kind, min_age, fee_gmd, suggested_gbp, open, start_time, distance from events");
  const byId = new Map(events.map((e) => [e.id, e]));

  if (input.residence === "abroad" && !input.city.trim()) throw new HttpError(400, "Tell us which city you live in");
  if (input.residence === "gambia" && input.currency !== "GMD") throw new HttpError(400, "Entries from The Gambia are paid in dalasi");
  if (input.residence === "gambia" && input.payMethod === "remit") throw new HttpError(400, "Choose Wave, Yonna, Ecobank or a card");
  // People abroad give their city at step 1 and are not asked for a town again.
  const town = input.residence === "abroad" ? input.city.split(",")[0]!.trim() : input.contact.town.trim();
  if (town.length < 2) throw new HttpError(400, "Enter your town or area");
  if (input.payMethod === "card" && !cardTakes(input.currency)) throw new HttpError(400, "Card payments are not available for this booking. Choose another way to pay.");

  let minors = 0;
  const people = input.participants.map((p, i) => {
    const ev = byId.get(p.eventId);
    if (!ev || !ev.open) throw new HttpError(400, `${p.fullName}: that event is not open`);
    if (ev.kind === "virtual" && input.residence !== "abroad") throw new HttpError(400, `${p.fullName}: the ${ev.name} is for people who live abroad`);
    const age = raceDayAge(p.dob);
    if (age === null) throw new HttpError(400, `${p.fullName}: check the date of birth`);
    if (i === 0 && age < 18) throw new HttpError(400, "The person booking must be 18 or over on race day");
    if (age < ev.min_age) throw new HttpError(400, `${p.fullName} will be ${age} on race day. The ${ev.name} is for ${ev.min_age} and over.`);
    const minor = age < 18;
    if (minor) {
      minors++;
      if (!p.guardianIsLead && (!p.guardian?.name.trim() || (p.guardian?.phone.digits ?? "").length < 6)) throw new HttpError(400, `${p.fullName}: add the guardian's name and phone`);
    }
    const price = input.residence === "gambia" ? ev.fee_gmd : suggested(ev.suggested_gbp, input.currency as never);
    return {
      position: i,
      is_lead: i === 0,
      full_name: p.fullName.trim(),
      dob: isoDate(p.dob),
      gender: p.gender || null,
      event_id: ev.id,
      shirt: null,
      bib_name: null,
      guardian_is_lead: minor ? p.guardianIsLead : true,
      guardian_name: minor && !p.guardianIsLead ? p.guardian?.name.trim() ?? null : null,
      guardian_relation: minor && !p.guardianIsLead ? p.guardian?.relation ?? null : null,
      guardian_phone: minor && !p.guardianIsLead && p.guardian ? `${p.guardian.phone.iso}:${p.guardian.phone.digits}` : null,
      price,
    };
  });
  if (minors > 0 && !input.consents.guardian) throw new HttpError(400, "As their guardian, accept the waiver for the under 18s");

  let team: string | null = null;
  if (input.teamCode) {
    const t = await one<{ code: string }>("select code from teams where upper(code) = upper($1)", [input.teamCode]);
    if (!t) throw new HttpError(400, "We do not recognise that team code");
    team = t.code;
  }

  const total = people.reduce((a, p) => a + p.price, 0) + input.donation;
  const accessKey = randomBytes(18).toString("base64url");
  const rows = JSON.stringify(people.map((p) => ({ ...p, price: undefined })));

  for (let attempt = 0; attempt < 6; attempt++) {
    const reference = newReference();
    try {
      const res = await q<{ booking_id: string }>(
        `with b as (
           insert into bookings (reference, access_key, residence, city, currency, phone_iso, phone, email, town,
             emergency_name, emergency_relation, emergency_phone, team_code, steps, consent_waiver, consent_guardian,
             consent_photos, consent_news, waiver_version, waiver_accepted_at, donation, total, pay_method, source, referral, hold_until)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,true,$15,$16,$17,$18,now(),$19,$20,$21,$22,$23, now() + make_interval(days => $24))
           returning id
         )
         insert into participants (booking_id, position, is_lead, full_name, dob, gender, event_id, shirt, bib_name,
           guardian_is_lead, guardian_name, guardian_relation, guardian_phone)
         select b.id, x.position, x.is_lead, x.full_name, x.dob, x.gender, x.event_id, x.shirt, x.bib_name,
                x.guardian_is_lead, x.guardian_name, x.guardian_relation, x.guardian_phone
           from b, jsonb_to_recordset($25::jsonb) as x(position int, is_lead boolean, full_name text, dob date, gender text,
                event_id text, shirt text, bib_name text, guardian_is_lead boolean, guardian_name text, guardian_relation text, guardian_phone text)
         returning booking_id`,
        [
          reference,
          accessKey,
          input.residence,
          input.residence === "abroad" ? input.city.trim() : null,
          input.currency,
          input.contact.phone.iso,
          input.contact.phone.digits,
          input.contact.email.trim().toLowerCase(),
          town,
          input.contact.emergency.name.trim(),
          input.contact.emergency.relation || null,
          `${input.contact.emergency.phone.iso}:${input.contact.emergency.phone.digits}`,
          team,
          false, // the steps challenge was withdrawn
          minors > 0 ? input.consents.guardian : false,
          input.consents.photos,
          input.consents.news,
          WAIVER.version,
          input.donation,
          total,
          input.payMethod,
          input.source.replace(/[^a-z0-9_-]/gi, "").slice(0, 40) || "direct",
          input.referral.replace(/[^A-Z0-9]/gi, "").slice(0, 20) || null,
          HOLD_DAYS,
          rows,
        ],
      );
      const bookingId = res[0]!.booking_id;
      await log("booking", `${reference} booked: ${people.length} ${people.length === 1 ? "entry" : "entries"}, ${input.payMethod}, ${input.currency} ${total}.`, { bookingId });
      await queueForBooking(bookingId, "pending").catch((e) => console.error("queue pending", e));
      sendSoon(bookingId);
      return { reference, key: accessKey, total, currency: input.currency };
    } catch (e) {
      if (String((e as Error).message).includes("bookings_reference_key")) continue;
      throw e;
    }
  }
  throw new HttpError(500, "Could not create a reference code. Please try again.");
}

/* ---------- reading ---------- */

export type BookingRow = {
  id: string;
  reference: string;
  access_key: string;
  status: string;
  residence: string;
  city: string | null;
  currency: string;
  phone_iso: string;
  phone: string;
  email: string;
  town: string | null;
  emergency_name: string;
  emergency_relation: string | null;
  emergency_phone: string;
  team_code: string | null;
  steps: boolean;
  steps_code: string | null;
  consent_waiver: boolean;
  consent_guardian: boolean;
  consent_photos: boolean;
  consent_news: boolean;
  waiver_version: string;
  waiver_accepted_at: string;
  donation: string;
  total: string;
  pay_method: string;
  payer_claimed_at: string | null;
  payer_from: string | null;
  pay_token: string | null;
  source: string | null;
  referral: string | null;
  hold_until: string;
  paid_at: string | null;
  created_at: string;
};

export type ParticipantRow = {
  id: string;
  booking_id: string;
  position: number;
  is_lead: boolean;
  full_name: string;
  dob: string;
  gender: string | null;
  event_id: string;
  shirt: string | null;
  bib_name: string | null;
  guardian_is_lead: boolean;
  guardian_name: string | null;
  bib: string | null;
};

export async function bookingByRef(reference: string, key: string) {
  const b = await one<BookingRow>("select * from bookings where reference = $1", [reference.toUpperCase()]);
  if (!b || !key || !safeEqual(b.access_key, key)) return null;
  return b;
}

/** A "pay for me" link's token. It only ever unlocks paying, never the booking itself. */
export async function bookingByPayToken(token: string) {
  if (!/^[A-Za-z0-9_-]{16,40}$/.test(token)) return null;
  return one<BookingRow>("select * from bookings where pay_token = $1", [token]);
}

export async function bookingById(id: string) {
  return one<BookingRow>("select * from bookings where id = $1", [id]);
}

export async function participantsOf(bookingId: string) {
  return q<ParticipantRow>("select id, booking_id, position, is_lead, full_name, to_char(dob, 'YYYY-MM-DD') as dob, gender, event_id, shirt, bib_name, guardian_is_lead, guardian_name, bib from participants where booking_id = $1 order by position", [bookingId]);
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

const ageOn = (dobIso: string) => {
  const [y, m, d] = dobIso.split("-");
  return raceDayAge(`${d}/${m}/${y}`);
};

/** What the participant's own screens see: no access key, no emergency details. */
export function publicBooking(b: BookingRow, people: ParticipantRow[], extra: Record<string, unknown> = {}) {
  return {
    reference: b.reference,
    status: b.status === "pending" && new Date(b.hold_until).getTime() < Date.now() ? "released" : b.status,
    residence: b.residence,
    city: b.city,
    town: b.town,
    currency: b.currency,
    total: Number(b.total),
    donation: Number(b.donation),
    payMethod: b.pay_method,
    holdUntil: b.hold_until,
    paidAt: b.paid_at,
    claimedAt: b.payer_claimed_at,
    // Only the end of the number the payer said they paid from, enough for them to recognise it.
    payerFromTail: b.payer_from ? b.payer_from.slice(-4) : null,
    createdAt: b.created_at,
    steps: b.steps,
    stepsCode: b.steps_code,
    teamCode: b.team_code,
    phoneIso: b.phone_iso,
    phoneTail: b.phone.slice(-2),
    participants: people.map((p) => ({
      id: p.id,
      fullName: p.full_name,
      firstName: p.full_name.split(/\s+/)[0],
      eventId: p.event_id,
      bib: p.bib,
      bibName: p.bib_name,
      shirt: p.shirt,
      age: ageOn(p.dob),
      isLead: p.is_lead,
      guardian: p.guardian_is_lead ? null : p.guardian_name,
    })),
    ...extra,
  };
}
export type PublicBooking = ReturnType<typeof publicBooking>;

/* ---------- confirming ---------- */

export async function confirmBooking(bookingId: string, receiptId: string | null, actor: string, auto: boolean) {
  const rows = await q<{ participant_id: string; bib: string }>("select * from confirm_booking($1, $2, $3, $4)", [bookingId, receiptId, actor, auto]);
  const b = await bookingById(bookingId);
  const people = await participantsOf(bookingId);
  const virtualOnly = people.length > 0 && (await q<{ n: number }>("select count(*)::int as n from participants p join events e on e.id = p.event_id where p.booking_id = $1 and e.kind = 'in-person'", [bookingId]))[0]!.n === 0;
  await queueForBooking(bookingId, virtualOnly ? "confirm-virtual" : "confirm").catch((e) => console.error("queue confirm", e));
  sendSoon(bookingId);
  return { booking: b, bibs: rows };
}
