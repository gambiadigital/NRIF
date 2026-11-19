import { connection } from "next/server";
import { orderForEvent, settleCardOrder, signatureValid } from "@/lib/server/modempay";

/*
 * Modem Pay events for our card payments (each payment intent sets callback_url to this address). The signature is
 * checked on the raw body, and the event only tells us which order to look at: settleCardOrder then asks Modem Pay
 * itself whether it was paid, so a forged or replayed event can at most trigger a harmless re-check.
 */
export async function POST(req: Request) {
  await connection();
  const raw = await req.text();
  if (!signatureValid(raw, req.headers.get("x-modem-signature"))) return new Response("bad signature", { status: 401 });
  const body = JSON.parse(raw) as { event?: string; payload?: { payment_intent_id?: string; metadata?: { order_id?: string } } };
  if (!body.event?.startsWith("charge.") && !body.event?.startsWith("payment_intent.")) return Response.json({ ignored: true });
  const orderId = await orderForEvent(body.payload ?? {});
  if (!orderId) return Response.json({ ignored: true });
  try {
    return Response.json({ outcome: await settleCardOrder(orderId) });
  } catch (e) {
    console.error("modempay webhook", orderId, e);
    // A 500 makes Modem Pay retry (up to 3 more times, 10 minutes apart).
    return new Response("retry", { status: 500 });
  }
}
