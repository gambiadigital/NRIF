import "server-only";
import { randomBytes, randomInt } from "node:crypto";
import { z } from "zod";
import { q, one, log } from "./db";
import { HttpError } from "./http";
import { cardTakes } from "./cardConfig";
import { e164 } from "./messages";
import { CURRENCIES, PAYMENT_METHODS } from "@/lib/data";
import { suggested } from "@/lib/format";

/*
 * Pay first. An order is the money for a booking before the booking exists: the entries (one event per person, the
 * booker first), the price the server worked out, and how it was paid. A Wave, Yonna, Ecobank or Remitly/ACE payer
 * pays, then gives the transaction reference from their receipt (and the number they paid from), which "claims" the
 * order. A card payer goes through Modem Pay and the order is "paid" once Modem Pay says so. Only then can the
 * details be filled in, and the booking takes the order's reference. The token is the payer's proof that the order
 * is theirs, kept in their browser and in the link they can come back to.
 */

export const PhoneIn = z.object({
  iso: z.string().length(2),
  digits: z.string().regex(/^\d{6,12}$/, "Enter a full phone number"),
});

export const OrderIn = z.object({
  residence: z.enum(["gambia", "abroad"]),
  city: z.string().max(80).default(""),
  currency: z.enum(["GMD", ...CURRENCIES.map((c) => c.code)] as [string, ...string[]]),
  events: z.array(z.string().min(2).max(20)).min(1).max(10, "One booking can hold up to 10 people"),
  donation: z.number().min(0).max(1_000_000).default(0),
  method: z.enum(["wave", "yonna", "ecobank", "remit", "card"]),
  payerReference: z.string().trim().max(60).optional(),
  payerFrom: PhoneIn.optional(),
});
export type OrderInput = z.infer<typeof OrderIn>;

export type OrderRow = {
  id: string;
  reference: string;
  token: string;
  residence: "gambia" | "abroad";
  city: string | null;
  currency: string;
  events: string[];
  donation: string;
  total: string;
  method: string;
  payer_reference: string | null;
  payer_from: string | null;
  status: "open" | "claimed" | "paid" | "used" | "cancelled";
  booking_id: string | null;
  created_at: string;
  claimed_at: string | null;
  paid_at: string | null;
};

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const candidate = () => "RFI-" + Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");

/** A reference no booking or order has used. */
export async function newReference() {
  for (let i = 0; i < 8; i++) {
    const r = candidate();
    const taken = await one("select 1 from bookings where reference = $1 union all select 1 from orders where reference = $1 limit 1", [r]);
    if (!taken) return r;
  }
  throw new HttpError(500, "Could not create a reference code. Please try again.");
}

export const newToken = () => randomBytes(18).toString("base64url");

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

/** The order, if the token is right. */
export async function orderFor(id: string, token: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id) || !token) return null;
  const o = await one<OrderRow>("select * from orders where id = $1", [id]);
  return o && safeEqual(o.token, token) ? o : null;
}

type EventRow = { id: string; name: string; kind: string; fee_gmd: number; suggested_gbp: number; open: boolean };

/** Prices the entries on the server and checks they can be booked from where the person lives. */
export async function priceEntries(input: Pick<OrderInput, "residence" | "currency" | "events" | "donation">) {
  const events = await q<EventRow>("select id, name, kind, fee_gmd, suggested_gbp, open from events");
  const byId = new Map(events.map((e) => [e.id, e]));
  if (input.residence === "gambia" && input.currency !== "GMD") throw new HttpError(400, "Entries from The Gambia are paid in dalasi");
  let sum = 0;
  for (const id of input.events) {
    const ev = byId.get(id);
    if (!ev || !ev.open) throw new HttpError(400, "One of those events is not open. Go back and choose again.");
    if (ev.kind === "virtual" && input.residence !== "abroad") throw new HttpError(400, `The ${ev.name} is for people who live abroad`);
    sum += input.residence === "gambia" ? ev.fee_gmd : suggested(ev.suggested_gbp, input.currency as never);
  }
  return sum + input.donation;
}

/**
 * Creates the order. Card: "open" until Modem Pay confirms it (the route opens the card page). Every other way: the
 * person has already paid and gives their transaction reference, so the order is "claimed" for staff to check.
 */
export async function createOrder(input: OrderInput) {
  if (input.residence === "abroad" && !input.city.trim()) throw new HttpError(400, "Tell us which city you live in");
  const m = PAYMENT_METHODS[input.method];
  if (!(input.residence === "gambia" ? m.home : m.abroad)) throw new HttpError(400, `${m.name} is not available ${input.residence === "gambia" ? "in The Gambia" : "from abroad"}. Choose another way to pay.`);
  const card = input.method === "card";
  if (card && !cardTakes(input.currency)) throw new HttpError(400, "Card payments are taken in dalasi only. Choose another way to pay.");
  const payerReference = (input.payerReference ?? "").replace(/\s+/g, " ").trim();
  if (!card && payerReference.length < 3) throw new HttpError(400, "Enter the reference from your payment receipt or message");
  if (input.method === "wave" && !input.payerFrom) throw new HttpError(400, "Enter the Wave number you paid from");

  const total = await priceEntries(input);
  const reference = await newReference();
  const token = newToken();
  const from = input.payerFrom ? e164(input.payerFrom.iso, input.payerFrom.digits) : null;
  const o = await one<OrderRow>(
    `insert into orders (reference, token, residence, city, currency, events, donation, total, method, payer_reference, payer_from, status, claimed_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, case when $12 = 'claimed' then now() end)
     returning *`,
    [
      reference,
      token,
      input.residence,
      input.residence === "abroad" ? input.city.trim() : null,
      input.currency,
      input.events,
      input.donation,
      total,
      input.method,
      card ? null : payerReference,
      card ? null : from,
      card ? "open" : "claimed",
    ],
  );
  if (!card)
    await log(
      "claim",
      `${reference}: paid ${input.currency} ${total} by ${m.name} before registering (their reference ${payerReference}${from ? `, from ${from}` : ""}). Details to follow.`,
      { actor: "payer" },
    );
  return o!;
}

/** What the payer's own browser sees: enough to carry on, nothing about anyone else. */
export async function orderView(o: OrderRow) {
  let booking: { reference: string; key: string; status: string } | null = null;
  if (o.booking_id) {
    const b = await one<{ reference: string; access_key: string; status: string }>("select reference, access_key, status from bookings where id = $1", [o.booking_id]);
    if (b) booking = { reference: b.reference, key: b.access_key, status: b.status };
  }
  return {
    id: o.id,
    reference: o.reference,
    residence: o.residence,
    city: o.city ?? "",
    currency: o.currency,
    events: o.events,
    donation: Number(o.donation),
    total: Number(o.total),
    method: o.method,
    status: o.status,
    payerReference: o.payer_reference,
    booking,
  };
}
export type OrderView = Awaited<ReturnType<typeof orderView>>;
