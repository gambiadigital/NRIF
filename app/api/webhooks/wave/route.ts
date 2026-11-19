import { connection } from "next/server";
import { one, log } from "@/lib/server/db";
import { confirmBooking } from "@/lib/server/bookings";
import { verifyWaveSignature } from "@/lib/server/wave";

/*
 * Wave Checkout webhook. Records every completed payment as a receipt (idempotent on Wave's session id), and if its
 * client_reference is a pending booking and the amount covers the total, confirms it and issues bibs.
 */
export async function POST(req: Request) {
  await connection();
  const raw = await req.text();
  if (!verifyWaveSignature(raw, req.headers.get("wave-signature"))) return new Response("bad signature", { status: 401 });

  const event = JSON.parse(raw) as { type?: string; data?: { id?: string; amount?: string; currency?: string; client_reference?: string; payment_status?: string; checkout_status?: string } };
  const d = event.data ?? {};
  if (event.type !== "checkout.session.completed" || d.payment_status !== "succeeded" || !d.id) return Response.json({ ignored: true });

  const receipt = await one<{ id: string }>(
    `insert into receipts (method, amount, currency, reference_given, external_id, payer, auto, created_by)
     values ('wave', $1, $2, $3, $4, 'Wave checkout', true, 'wave-webhook')
     on conflict (external_id) do nothing returning id`,
    [Number(d.amount ?? 0), d.currency ?? "GMD", d.client_reference ?? null, d.id],
  );
  if (!receipt) return Response.json({ duplicate: true });

  const b = d.client_reference ? await one<{ id: string; total: string; status: string; currency: string }>("select id, total, status, currency from bookings where reference = $1", [d.client_reference]) : null;
  if (b && b.status === "pending" && b.currency === "GMD" && Number(d.amount) >= Number(b.total)) {
    await confirmBooking(b.id, receipt.id, "Wave", true);
  } else {
    await log("receipt", `Wave payment ${d.id} of GMD ${d.amount} for ${d.client_reference ?? "no reference"} needs checking by hand.`);
  }
  return Response.json({ ok: true });
}
