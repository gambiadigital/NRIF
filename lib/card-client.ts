"use client";

import { api } from "@/lib/client";

/*
 * Mastercard Hosted Checkout in the browser: our server opens the session, then checkout.min.js (served by the gateway)
 * sends the payer to Mastercard's payment page. The card number is only ever typed there.
 */

type CheckoutApi = { configure: (c: { session: { id: string } }) => void; showPaymentPage: () => void };
declare global {
  interface Window {
    Checkout?: CheckoutApi;
    r4iCardError?: (e: unknown) => void;
  }
}

let loading: Promise<void> | null = null;
function loadCheckout(src: string) {
  if (window.Checkout) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.setAttribute("data-error", "r4iCardError");
    s.onload = () => (window.Checkout ? resolve() : reject(new Error("The card page did not load. Try again.")));
    s.onerror = () => {
      loading = null;
      s.remove();
      reject(new Error("We could not reach the card page. Check your connection and try again."));
    };
    document.head.appendChild(s);
  });
  return loading;
}

/** Opens a checkout for the whole booking and leaves for Mastercard's page. Resolves only if something went wrong. */
/** `auth` is the query that proves the right to pay: k=<access key> for the booker, t=<pay token> for someone paying for them. */
export async function payByCard(reference: string, auth: string, onError: (message: string) => void) {
  const r = await api<{ sessionId: string; script: string }>(`/api/bookings/${reference}/card?${auth}`, { method: "POST" });
  window.r4iCardError = (e) => {
    console.error("card checkout", e);
    onError("The card page could not open. Try again, or choose another way to pay.");
  };
  await loadCheckout(r.script);
  window.Checkout!.configure({ session: { id: r.sessionId } });
  window.Checkout!.showPaymentPage();
}
