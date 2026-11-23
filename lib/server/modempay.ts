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
type Order = { id: string; reference: string; total: string | number; currency: string; status: string };

/**
 * Opens one Modem Pay card checkout for an amount, limited to cards. Each try is its own order id, RFI-XXXX-C1, -C2
 * and so on, and belongs either to a booking (the older pay-after flow) or to a pay-first order.
 */
async function openCheckout(p: { reference: string; total: number; currency: string; email?: string; back: string; site: string; bookingId: string | null; payOrder: string | null }) {
  if (!cardEnabled()) throw new HttpError(503, "Card payments are not switched on yet. Choose another way to pay.");
  if (!cardTakes(p.currency)) throw new HttpError(400, `Card payments are taken in ${cardCurrencies().join(" or ")} only. Choose another way to pay.`);
  const tries = (
    await one<{ n: number }>("select count(*)::int as n from card_payments where (booking_id = $1 and $1 is not null) or (pay_order = $2 and $2 is not null)", [p.bookingId, p.payOrder])
  )!.n;
  if (tries >= 10) throw new HttpError(429, "Too many card attempts. Contact NRIF and we will help.");
  const orderId = `${p.reference}-C${tries + 1}`;

  const created = await modem<Intent & { data?: Intent }>("POST", "/payments", {
    data: {
      amount: p.total,
      currency: p.currency,
      title: "Run for Independence 2027",
      description: `Booking ${p.reference}`,
      ...(p.email ? { customer_email: p.email } : {}),
      payment_methods: ["card"],
      metadata: { booking_reference: p.reference, order_id: orderId },
      return_url: `${p.back}&card=${encodeURIComponent(orderId)}`,
      cancel_url: `${p.back}&card=cancelled`,
      // Modem Pay only calls public HTTPS addresses. On a local machine the return page and the daily job still settle it.
      ...(/^https:\/\/(?!localhost|127\.)/.test(p.site) ? { callback_url: `${p.site}/api/webhooks/modempay` } : {}),
    },
  }).catch((e) => {
    console.error("modempay create", p.reference, e);
    throw new HttpError(502, "The card page is not available right now. Try again in a few minutes, or choose another way to pay.");
  });
  const intent = unwrap(created);
  const intentId = intent.payment_intent_id ?? intent.id ?? null;
  if (!intent.payment_link || !intent.intent_secret) throw new HttpError(502, "The card page did not open. Try again, or choose another way to pay.");

  // session_id holds Modem Pay's intent id, success_indicator its intent_secret (used to verify; never sent to browsers).
  await one(
    `insert into card_payments (order_id, booking_id, pay_order, session_id, success_indicator, amount, currency)
     values ($1, $2, $3, $4, $5, $6, $7) returning order_id`,
    [orderId, p.bookingId, p.payOrder, intentId, intent.intent_secret, p.total, p.currency],
  );
  await log("card", `${p.reference}: card checkout ${orderId} opened for ${p.currency} ${p.total}.`, { bookingId: p.bookingId });
  return { orderId, url: intent.payment_link };
}

/** Card checkout for a booking made before pay-first (bookings still waiting from the older flow). */
export async function startCardPayment(b: Booking, opts: { back: string; site: string }) {
  if (b.status !== "pending") throw new HttpError(409, "This booking is not waiting for payment");
  return openCheckout({ reference: b.reference, total: Number(b.total), currency: b.currency, email: b.email, back: opts.back, site: opts.site, bookingId: b.id, payOrder: null });
}

/** Card checkout for a pay-first order: the payer pays, comes back, and only then fills in the details. */
export async function startOrderCard(o: Order, opts: { back: string; site: string }) {
  if (o.status !== "open") throw new HttpError(409, o.status === "paid" ? "This payment has already gone through" : "This payment is not waiting for a card");
  return openCheckout({ reference: o.reference, total: Number(o.total), currency: o.currency, back: opts.back, site: opts.site, bookingId: null, payOrder: o.id });
}

export type CardOutcome = "paid" | "declined" | "waiting";

/**
 * Asks Modem Pay about one card order and, if it was paid in full, records a receipt. A booking's payment confirms the
 * booking; a pay-first order's payment marks the order paid, and the booking is confirmed when its details come in.
 * Safe to run any number of times: the receipt is unique per order and confirm_booking returns the same bibs.
 */
export async function settleCardOrder(orderId: string): Promise<CardOutcome> {
  const row = await one<{ order_id: string; booking_id: string | null; pay_order: string | null; session_id: string | null; success_indicator: string; amount: string; currency: string; status: string }>(
    "select order_id, booking_id, pay_order, session_id, success_indicator, amount, currency, status from card_payments where order_id = $1",
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

  const order = row.pay_order ? await one<{ id: string; reference: string; status: string; booking_id: string | null }>("select id, reference, status, booking_id from orders where id = $1", [row.pay_order]) : null;
  const bookingId = row.booking_id ?? order?.booking_id ?? null;
  const b = bookingId ? await one<{ id: string; reference: string; status: string; total: string; currency: string }>("select id, reference, status, total, currency from bookings where id = $1", [bookingId]) : null;
  const receipt = await one<{ id: string }>(
    `insert into receipts (method, amount, currency, reference_given, external_id, payer, note, auto, created_by)
     values ('card', $1, $2, $3, $4, 'Card (Modem Pay)', $5, true, 'modempay')
     on conflict (external_id) do nothing returning id`,
    [amount, row.currency, b?.reference ?? order?.reference ?? null, `modem:${row.session_id ?? orderId}`, `Order ${orderId}`],
  );
  const receiptId = receipt?.id ?? (await one<{ id: string }>("select id from receipts where external_id = $1", [`modem:${row.session_id ?? orderId}`]))?.id ?? null;
  await q("update card_payments set status = 'paid', result = 'successful', receipt_id = $2, checked_at = now() where order_id = $1", [orderId, receiptId]);

  if (order && !b) {
    // Paid before the details: the order is ready for them. The booking is confirmed when it is created.
    await q("update orders set status = 'paid', paid_at = now() where id = $1 and status = 'open'", [order.id]);
    await log("card", `${order.reference}: card payment of ${row.currency} ${amount} received (${orderId}). Details to follow.`, { actor: "Card (Modem Pay)" });
    return "paid";
  }
  // Card money is taken on the spot, so a payment that lands just after the hold ran out still gets its place.
  if (b && (b.status === "pending" || b.status === "released") && b.currency === row.currency && amount + 0.005 >= Number(b.total)) {
    await confirmBooking(b.id, receiptId, "Card (Modem Pay)", true);
  } else if (receipt) {
    await log("receipt", `Card payment ${orderId} of ${row.currency} ${amount} for ${b?.reference ?? order?.reference ?? "an unknown booking"} needs checking by hand.`);
  }
  return "paid";
}

async function settleLatest(where: string, id: string): Promise<CardOutcome> {
  const rows = await q<{ order_id: string }>(`select order_id from card_payments where ${where} = $1 and created_at > now() - interval '7 days' order by created_at desc limit 3`, [id]);
  let outcome: CardOutcome = "waiting";
  for (const r of rows) {
    const o = await settleCardOrder(r.order_id);
    if (o === "paid") return "paid";
    if (outcome === "waiting" && o === "declined") outcome = "declined";
  }
  return outcome;
}

/** Checks the booking's recent card orders, newest first. Used when the payer comes back from Modem Pay. */
export const settleBookingCards = (bookingId: string) => settleLatest("booking_id", bookingId);

/** The same for a pay-first order. */
export const settleOrderCards = (payOrder: string) => settleLatest("pay_order", payOrder);

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
