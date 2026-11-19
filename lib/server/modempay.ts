import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { HttpError } from "@/lib/server/http";
import { one, q, log } from "@/lib/server/db";
import { confirmBooking } from "@/lib/server/bookings";
import { cardCurrencies, cardEnabled, cardTakes } from "@/lib/server/cardConfig";

/*
 * Visa and Mastercard through Modem Pay (https://docs.modempay.com), NRIF's payment provider in The Gambia.
 * We create a payment intent for the booking's exact amount, limited to cards, and send the payer to Modem Pay's
 * checkout page. Card details are typed there, never here. Each intent carries a callback_url, so Modem Pay tells us
 * about that payment directly (signed with a hash of our secret key, so no dashboard webhook is needed). We never take
 * the browser's or the callback's word for it: the payment is checked with Modem Pay's verify endpoint before the
 * booking is confirmed. The pending page, the callback and the daily job all run the same check.
 *
 * Env: MODEMPAY_SECRET_KEY (sk_live_… or sk_test_…), MODEMPAY_CURRENCIES (default GMD),
 *      MODEMPAY_WEBHOOK_SECRET (optional: the account webhook's signing secret, if one is set up in the dashboard).
 */

export { cardEnabled, cardCurrencies, cardTakes };
const API = "https://api.modempay.com/v1";

type ApiError = { message?: string; error?: string; status?: boolean };

async function modem<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${process.env.MODEMPAY_SECRET_KEY}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  const data = (await res.json().catch(() => ({}))) as T & ApiError;
  if (!res.ok || data.status === false) throw new Error(`Modem Pay ${res.status}: ${data.message ?? data.error ?? "error"}`);
  return data;
}

type Intent = {
  payment_intent_id?: string;
  id?: string;
  intent_secret?: string;
  payment_link?: string;
  amount?: number;
  currency?: string;
  status?: string;
  metadata?: Record<string, unknown>;
};
/**
 * Create wraps the intent in { status: true, message, data }; verify returns the intent itself, whose status is a
 * string such as "successful". Checked against the live API on 2026-11-19.
 */
const unwrap = (r: Intent & { data?: Intent }) => (typeof r.status === "string" || !r.data || typeof r.data !== "object" ? r : r.data);

type Booking = { id: string; reference: string; total: string | number; currency: string; status: string; email: string; phone: string | null };

/** Opens a Modem Pay card checkout for the whole booking. Each try is its own order, RFI-XXXX-C1, -C2 and so on. */
export async function startCardPayment(b: Booking, opts: { back: string; site: string }) {
  if (!cardEnabled()) throw new HttpError(503, "Card payments are not switched on yet. Choose another way to pay.");
  if (!cardTakes(b.currency)) throw new HttpError(400, `Card payments are taken in ${cardCurrencies().join(" or ")} only. Choose another way to pay.`);
  if (b.status !== "pending") throw new HttpError(409, "This booking is not waiting for payment");

  const tries = (await one<{ n: number }>("select count(*)::int as n from card_payments where booking_id = $1", [b.id]))!.n;
  if (tries >= 10) throw new HttpError(429, "Too many card attempts on this booking. Contact NRIF and we will help.");
  const orderId = `${b.reference}-C${tries + 1}`;
  const total = Number(b.total);

  const created = await modem<Intent & { data?: Intent }>("POST", "/payments", {
    data: {
      amount: total,
      currency: b.currency,
      title: "Run for Independence 2027",
      description: `Booking ${b.reference}`,
      customer_email: b.email,
      payment_methods: ["card"],
      metadata: { booking_reference: b.reference, order_id: orderId },
      return_url: `${opts.back}&card=${encodeURIComponent(orderId)}`,
      cancel_url: `${opts.back}&card=cancelled`,
      // Modem Pay only calls public HTTPS addresses. On a local machine the pending page and the daily job still settle it.
      ...(/^https:\/\/(?!localhost|127\.)/.test(opts.site) ? { callback_url: `${opts.site}/api/webhooks/modempay` } : {}),
    },
  }).catch((e) => {
    console.error("modempay create", b.reference, e);
    throw new HttpError(502, "The card page is not available right now. Try again in a few minutes, or choose another way to pay.");
  });
  const intent = unwrap(created);
  const intentId = intent.payment_intent_id ?? intent.id ?? null;
  if (!intent.payment_link || !intent.intent_secret) throw new HttpError(502, "The card page did not open. Try again, or choose another way to pay.");

  // session_id holds Modem Pay's intent id, success_indicator its intent_secret (used to verify; never sent to browsers).
  await one(
    `insert into card_payments (order_id, booking_id, session_id, success_indicator, amount, currency)
     values ($1, $2, $3, $4, $5, $6) returning order_id`,
    [orderId, b.id, intentId, intent.intent_secret, total, b.currency],
  );
  await log("card", `${b.reference}: card checkout ${orderId} opened for ${b.currency} ${total}.`, { bookingId: b.id });
  return { orderId, url: intent.payment_link };
}

export type CardOutcome = "paid" | "declined" | "waiting";

/**
 * Asks Modem Pay about one order and, if it was paid in full, records a receipt and confirms the booking.
 * Safe to run any number of times: the receipt is unique per order and confirm_booking returns the same bibs.
 */
export async function settleCardOrder(orderId: string): Promise<CardOutcome> {
  const row = await one<{ order_id: string; booking_id: string; session_id: string | null; success_indicator: string; amount: string; currency: string; status: string }>(
    "select order_id, booking_id, session_id, success_indicator, amount, currency, status from card_payments where order_id = $1",
    [orderId],
  );
  if (!row) return "waiting";
  if (row.status === "paid") return "paid";

  const intent = unwrap(await modem<Intent & { data?: Intent }>("GET", `/payments/verify?intent_secret=${encodeURIComponent(row.success_indicator)}`));
  const status = (intent.status ?? "").toLowerCase();
  const amount = Number(intent.amount ?? 0);
  if (status !== "successful" || amount + 0.005 < Number(row.amount) || (intent.currency && intent.currency !== row.currency)) {
    await q("update card_payments set result = $2, checked_at = now() where order_id = $1", [orderId, status || "unknown"]);
    return ["failed", "cancelled", "expired"].includes(status) ? "declined" : "waiting";
  }

  const b = await one<{ id: string; reference: string; status: string; total: string; currency: string }>("select id, reference, status, total, currency from bookings where id = $1", [row.booking_id]);
  const receipt = await one<{ id: string }>(
    `insert into receipts (method, amount, currency, reference_given, external_id, payer, note, auto, created_by)
     values ('card', $1, $2, $3, $4, 'Card (Modem Pay)', $5, true, 'modempay')
     on conflict (external_id) do nothing returning id`,
    [amount, row.currency, b?.reference ?? null, `modem:${row.session_id ?? orderId}`, `Order ${orderId}`],
  );
  const receiptId = receipt?.id ?? (await one<{ id: string }>("select id from receipts where external_id = $1", [`modem:${row.session_id ?? orderId}`]))?.id ?? null;
  await q("update card_payments set status = 'paid', result = 'successful', receipt_id = $2, checked_at = now() where order_id = $1", [orderId, receiptId]);

  // Card money is taken on the spot, so a payment that lands just after the hold ran out still gets its place.
  if (b && (b.status === "pending" || b.status === "released") && b.currency === row.currency && amount + 0.005 >= Number(b.total)) {
    await confirmBooking(b.id, receiptId, "Card (Modem Pay)", true);
  } else if (receipt) {
    await log("receipt", `Card payment ${orderId} of ${row.currency} ${amount} for ${b?.reference ?? "an unknown booking"} needs checking by hand.`);
  }
  return "paid";
}

/** Checks the booking's recent card orders, newest first. Used when the payer comes back from Modem Pay. */
export async function settleBookingCards(bookingId: string): Promise<CardOutcome> {
  const rows = await q<{ order_id: string }>(
    "select order_id from card_payments where booking_id = $1 and created_at > now() - interval '7 days' order by created_at desc limit 3",
    [bookingId],
  );
  let outcome: CardOutcome = "waiting";
  for (const r of rows) {
    const o = await settleCardOrder(r.order_id);
    if (o === "paid") return "paid";
    if (outcome === "waiting" && o === "declined") outcome = "declined";
  }
  return outcome;
}

/** The daily sweep: any open order from the last week the payer never came back from. */
export async function settleOpenCards() {
  if (!cardEnabled()) return 0;
  const rows = await q<{ order_id: string }>("select order_id from card_payments where status = 'open' and created_at > now() - interval '7 days' order by created_at limit 100");
  let paid = 0;
  for (const r of rows) {
    try {
      if ((await settleCardOrder(r.order_id)) === "paid") paid++;
    } catch (e) {
      console.error("card sweep", r.order_id, e);
    }
  }
  return paid;
}

/** The order a Modem Pay event is about, from its intent id or our own order id in metadata. */
export async function orderForEvent(payload: { payment_intent_id?: string; metadata?: { order_id?: string } }) {
  if (payload.metadata?.order_id) return payload.metadata.order_id;
  if (!payload.payment_intent_id) return null;
  return (await one<{ order_id: string }>("select order_id from card_payments where session_id = $1", [payload.payment_intent_id]))?.order_id ?? null;
}

/**
 * x-modem-signature is an HMAC-SHA512 of the raw body. Per-payment callbacks are signed with sha256(secret key) as
 * lowercase hex; the account webhook (if NRIF sets one up) with its own signing secret.
 */
export function signatureValid(raw: string, header: string | null) {
  if (!header) return false;
  const keys = [
    process.env.MODEMPAY_SECRET_KEY && createHash("sha256").update(process.env.MODEMPAY_SECRET_KEY).digest("hex"),
    process.env.MODEMPAY_WEBHOOK_SECRET,
  ].filter(Boolean) as string[];
  const got = header.trim();
  return keys.some((k) => {
    const mac = createHmac("sha512", k).update(raw).digest();
    return [mac.toString("hex"), mac.toString("base64")].some((exp) => exp.length === got.length && timingSafeEqual(Buffer.from(exp), Buffer.from(got)));
  });
}
