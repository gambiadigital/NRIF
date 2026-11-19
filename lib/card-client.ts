"use client";

import { api } from "@/lib/client";

/*
 * Card payments through Modem Pay: our server opens a payment intent for the booking and returns Modem Pay's checkout
 * link; the browser goes there and comes back to the pending page, which then asks our server what happened.
 * The card number is only ever typed on Modem Pay's page.
 */

/** `auth` is the query that proves the right to pay: k=<access key> for the booker, t=<pay token> for someone paying for them. */
export async function payByCard(reference: string, auth: string, onError: (message: string) => void) {
  try {
    const r = await api<{ url: string }>(`/api/bookings/${reference}/card?${auth}`, { method: "POST" });
    window.location.href = r.url;
  } catch (e) {
    onError((e as Error).message);
  }
}
