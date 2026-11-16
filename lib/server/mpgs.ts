import "server-only";
import { timingSafeEqual } from "node:crypto";
import { HttpError } from "@/lib/server/http";
import { one, q, log } from "@/lib/server/db";
import { confirmBooking } from "@/lib/server/bookings";
import { cardCurrencies, cardEnabled, cardTakes } from "@/lib/server/cardConfig";

/*
 * Visa and Mastercard through the Mastercard Payment Gateway (MPGS), Hosted Checkout, API version 100.
 * The card details are typed on Mastercard's own page, never on ours: we open a checkout session for the booking's exact
 * amount, the browser goes to the gateway, and the gateway sends it back to the pending page. We never trust the
 * browser's word for the result. The gateway's own record of the order (Retrieve Order) decides whether it is paid.
 * The same check runs from three places: the pending page when the payer comes back, the gateway's webhook, and the
 * daily job, so a payment is caught even if the payer closes the tab.
 *
 * Env: MPGS_MERCHANT_ID (the test profile starts with TEST), MPGS_API_PASSWORD, MPGS_GATEWAY (default the test gateway
 * mtf.gateway.mastercard.com; the bank gives the live host), MPGS_CURRENCIES (default GMD), MPGS_WEBHOOK_SECRET.
 */

const VERSION = "100";
/** The gateway's base URL. A bare host gets https; a full URL is used as given (a local stand-in during tests). */
const base = () => {
  const g = (process.env.MPGS_GATEWAY || "mtf.gateway.mastercard.com").replace(/\/$/, "");
  return /^https?:\/\//.test(g) ? g : `https://${g}`;
};
const merchant = () => process.env.MPGS_MERCHANT_ID ?? "";

export { cardEnabled, cardCurrencies, cardTakes };
export const cardScript = () => `${base()}/static/checkout/checkout.min.js`;

type GatewayError = { result?: string; error?: { cause?: string; explanation?: string; field?: string } };

async function gateway<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  const auth = Buffer.from(`merchant.${merchant()}:${process.env.MPGS_API_PASSWORD}`).toString("base64");
  const res = await fetch(`${base()}/api/rest/version/${VERSION}/merchant/${encodeURIComponent(merchant())}${path}`, {
    method,
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  const data = (await res.json().catch(() => ({}))) as T & GatewayError;
  if (!res.ok || data.result === "ERROR") {
    const e = data.error ?? {};
    const err = new Error(`Card gateway ${res.status}: ${e.cause ?? "error"}${e.field ? ` (${e.field})` : ""} ${e.explanation ?? ""}`.trim()) as Error & { cause?: string; status?: number };
    err.cause = e.cause;
    err.status = res.status;
    throw err;
  }
  return data;
}

/** Amounts go to the gateway with two decimals, as ISO 4217 has them for GMD, GBP, USD, EUR and SEK. */
const amount = (n: number) => (Math.round(n * 100) / 100).toFixed(2);

type Booking = { id: string; reference: string; access_key: string; total: string | number; currency: string; status: string; email: string };

/** Opens a Hosted Checkout session for the whole booking. Each try is its own order, RFI-XXXX-C1, -C2 and so on. */
export async function startCardPayment(b: Booking, opts: { back: string }) {
  if (!cardEnabled()) throw new HttpError(503, "Card payments are not switched on yet. Choose another way to pay.");
  if (!cardTakes(b.currency)) throw new HttpError(400, `Card payments are taken in ${cardCurrencies().join(" or ")} only. Choose another way to pay.`);
  if (b.status !== "pending") throw new HttpError(409, "This booking is not waiting for payment");

  const tries = (await one<{ n: number }>("select count(*)::int as n from card_payments where booking_id = $1", [b.id]))!.n;
  if (tries >= 10) throw new HttpError(429, "Too many card attempts on this booking. Contact NRIF and we will help.");
  const orderId = `${b.reference}-C${tries + 1}`;
  const total = Number(b.total);
  const site = new URL(opts.back).origin;

  const s = await gateway<{ session: { id: string }; successIndicator: string }>("POST", "/session", {
    apiOperation: "INITIATE_CHECKOUT",
    interaction: {
      operation: "PURCHASE",
      merchant: { name: "NRIF Run for Independence", url: site },
      returnUrl: `${opts.back}&card=${encodeURIComponent(orderId)}`,
      cancelUrl: `${opts.back}&card=cancelled`,
      displayControl: { billingAddress: "HIDE", shipping: "HIDE" },
    },
    order: {
      id: orderId,
      reference: b.reference,
      amount: amount(total),
      currency: b.currency,
      description: `Run for Independence 2027, booking ${b.reference}`,
    },
    customer: { email: b.email },
  }).catch((e) => {
    console.error("card checkout", b.reference, e);
    throw new HttpError(502, "The card page is not available right now. Try again in a few minutes, or choose another way to pay.");
  });

  await one(
    `insert into card_payments (order_id, booking_id, session_id, success_indicator, amount, currency)
     values ($1, $2, $3, $4, $5, $6) returning order_id`,
    [orderId, b.id, s.session.id, s.successIndicator, total, b.currency],
  );
  await log("card", `${b.reference}: card checkout ${orderId} opened for ${b.currency} ${amount(total)}.`, { bookingId: b.id });
  return { orderId, sessionId: s.session.id, script: cardScript() };
}

type Order = {
  id: string;
  status?: string;
  result?: string;
  amount?: number;
  currency?: string;
  totalCapturedAmount?: number;
  sourceOfFunds?: { provided?: { card?: { brand?: string; number?: string; nameOnCard?: string } } };
  transaction?: { response?: { gatewayCode?: string }; result?: string }[];
};

async function retrieveOrder(orderId: string): Promise<Order | null> {
  try {
    return await gateway<Order>("GET", `/order/${encodeURIComponent(orderId)}`);
  } catch (e) {
    // The order only exists once the payer has submitted a card; before that the gateway answers 400 INVALID_REQUEST.
    // Wrong credentials are also INVALID_REQUEST but with 401, and must surface as an error, not as "not paid yet".
    const x = e as { cause?: string; status?: number };
    if (x.cause === "INVALID_REQUEST" && x.status !== 401) return null;
    throw e;
  }
}

export type CardOutcome = "paid" | "declined" | "waiting";

/**
 * Asks the gateway about one order and, if the money was captured, records a receipt and confirms the booking.
 * Safe to call any number of times: the receipt is unique on the order id and confirm_booking returns the same bibs.
 */
export async function settleCardOrder(orderId: string): Promise<CardOutcome> {
  const row = await one<{ order_id: string; booking_id: string; amount: string; currency: string; status: string }>(
    "select order_id, booking_id, amount, currency, status from card_payments where order_id = $1",
    [orderId],
  );
  if (!row) return "waiting";
  if (row.status === "paid") return "paid";

  const order = await retrieveOrder(orderId);
  if (!order) return "waiting";

  const captured = Number(order.totalCapturedAmount ?? 0);
  const lastCode = order.transaction?.at(-1)?.response?.gatewayCode ?? order.status ?? "";
  if (!(captured > 0 && captured + 0.005 >= Number(row.amount) && order.currency === row.currency)) {
    await q("update card_payments set result = $2, checked_at = now() where order_id = $1", [orderId, lastCode]);
    return order.result === "FAILURE" || /DECLINED|FAILED|EXPIRED|BLOCKED/.test(lastCode) ? "declined" : "waiting";
  }

  const card = order.sourceOfFunds?.provided?.card;
  const payer = card ? `${card.brand ?? "Card"} ${(card.number ?? "").slice(-4)}`.trim() : "Card";
  const b = await one<{ id: string; reference: string; status: string; total: string; currency: string }>("select id, reference, status, total, currency from bookings where id = $1", [row.booking_id]);
  const receipt = await one<{ id: string }>(
    `insert into receipts (method, amount, currency, reference_given, external_id, payer, note, auto, created_by)
     values ('card', $1, $2, $3, $4, $5, $6, true, 'card-gateway')
     on conflict (external_id) do nothing returning id`,
    [captured, order.currency, b?.reference ?? null, `mpgs:${orderId}`, payer, `Order ${orderId}`],
  );
  const receiptId = receipt?.id ?? (await one<{ id: string }>("select id from receipts where external_id = $1", [`mpgs:${orderId}`]))?.id ?? null;
  await q("update card_payments set status = 'paid', result = $2, receipt_id = $3, checked_at = now() where order_id = $1", [orderId, lastCode || "CAPTURED", receiptId]);

  // Card money is taken on the spot, so a payment that lands just after the hold ran out still gets its place.
  if (b && (b.status === "pending" || b.status === "released") && b.currency === order.currency && captured + 0.005 >= Number(b.total)) {
    await confirmBooking(b.id, receiptId, "Card", true);
  } else if (receipt) {
    await log("receipt", `Card payment ${orderId} of ${order.currency} ${captured} for ${b?.reference ?? "an unknown booking"} needs matching by hand.`);
  }
  return "paid";
}

/** Checks the booking's recent card orders, newest first. Used when the payer comes back from the gateway. */
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

/** Gateway webhooks carry X-Notification-Secret, the secret shown in Merchant Administration. */
export function webhookAllowed(header: string | null) {
  const secret = process.env.MPGS_WEBHOOK_SECRET;
  if (!secret || !header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}
