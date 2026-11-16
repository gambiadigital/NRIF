import "server-only";

/** Whether card payments are on, and in which currencies. Kept apart from mpgs.ts so bookings.ts can use it without a cycle. */
export const cardEnabled = () => !!(process.env.MPGS_MERCHANT_ID && process.env.MPGS_API_PASSWORD);
export const cardCurrencies = () =>
  (process.env.MPGS_CURRENCIES || "GMD")
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);
export const cardTakes = (currency: string) => cardEnabled() && cardCurrencies().includes(currency.toUpperCase());
