import { one } from "@/lib/server/db";
import { HttpError, json, requireAdmin, route } from "@/lib/server/http";
import { providers } from "@/lib/server/messages";
import { waveCheckoutEnabled } from "@/lib/server/wave";

export const GET = route(async () => {
  const s = await requireAdmin();
  const a = await one<{ id: string; name: string; email: string; role: string }>("select id, name, email, role from admins where id = $1", [s.sub]);
  if (!a) throw new HttpError(401, "Please sign in again");
  // Payments badge: bookings whose payer says the money is sent, so someone should look for it and confirm.
  const counts = await one<{ payments: number; virtual: number }>(
    `select (select count(*)::int from bookings where status = 'pending' and payer_claimed_at is not null) as payments,
            (select count(*)::int from virtual_results where status = 'submitted') as virtual`,
  );
  return json({ ...a, badges: counts, providers: providers(), waveCheckout: waveCheckoutEnabled() });
});
