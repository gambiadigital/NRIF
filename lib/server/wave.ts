import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/*
 * Wave, two ways.
 * Today NRIF has a Wave merchant payment link (WAVE_PAYMENT_LINK): payers open it in the Wave app, type the amount and
 * the booking reference, and staff match the payment in the admin console.
 * When NRIF receives Wave Checkout API keys, set WAVE_API_KEY and WAVE_WEBHOOK_SECRET: each booking then gets its own
 * checkout session with the exact amount, and the webhook confirms the booking and issues bibs automatically.
 * The API path follows Wave's published Checkout API and is untested until those keys exist.
 */

export const waveLink = () => process.env.WAVE_PAYMENT_LINK || "https://pay.wave.com/m/M_gm_CedMPBz-cNJ4/c/gm/";
export const waveCheckoutEnabled = () => !!process.env.WAVE_API_KEY;

export async function createWaveCheckout(opts: { amount: number; reference: string; successUrl: string; errorUrl: string }) {
  const res = await fetch("https://api.wave.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WAVE_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `${opts.reference}-${opts.amount}`,
    },
    body: JSON.stringify({
      amount: String(Math.round(opts.amount)),
      currency: "GMD",
      client_reference: opts.reference,
      success_url: opts.successUrl,
      error_url: opts.errorUrl,
    }),
  });
  if (!res.ok) throw new Error(`Wave checkout ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { id: string; wave_launch_url: string };
  return { id: data.id, url: data.wave_launch_url };
}

/** Wave-Signature: t=<timestamp>,v1=<hex hmac of timestamp + raw body>. Rejects anything older than five minutes. */
export function verifyWaveSignature(raw: string, header: string | null) {
  const secret = process.env.WAVE_WEBHOOK_SECRET;
  if (!secret || !header) return false;
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.trim().split("=") as [string, string]));
  const t = parts.t;
  const sigs = header
    .split(",")
    .map((kv) => kv.trim())
    .filter((kv) => kv.startsWith("v1="))
    .map((kv) => kv.slice(3));
  if (!t || !sigs.length || Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const expected = createHmac("sha256", secret).update(t + raw).digest();
  return sigs.some((s) => {
    const got = Buffer.from(s, "hex");
    return got.length === expected.length && timingSafeEqual(got, expected);
  });
}
