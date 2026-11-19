import "server-only";

/** Whether card payments (Modem Pay) are on, and in which currencies. Kept apart so bookings.ts can use it without a cycle. */
export const cardEnabled = () => !!process.env.MODEMPAY_SECRET_KEY;
export const cardCurrencies = () =>
  (process.env.MODEMPAY_CURRENCIES || "GMD")
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);
export const cardTakes = (currency: string) => cardEnabled() && cardCurrencies().includes(currency.toUpperCase());
