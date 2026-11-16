import { connection } from "next/server";
import { settleCardOrder, webhookAllowed } from "@/lib/server/mpgs";

/*
 * Mastercard Gateway webhook (set up in Merchant Administration > Webhook Notifications, pointed at this URL).
 * The body only tells us which order changed. We then ask the gateway for that order ourselves, so a forged
 * notification can at most trigger a harmless re-check.
 */
export async function POST(req: Request) {
  await connection();
  if (!webhookAllowed(req.headers.get("x-notification-secret"))) return new Response("not allowed", { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { order?: { id?: string } };
  const orderId = body.order?.id;
  if (!orderId) return Response.json({ ignored: true });
  try {
    return Response.json({ outcome: await settleCardOrder(orderId) });
  } catch (e) {
    console.error("mpgs webhook", orderId, e);
    // A 500 makes the gateway retry later, which is what we want if it or the database had a blip.
    return new Response("retry", { status: 500 });
  }
}
