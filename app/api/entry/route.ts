import type { NextRequest } from "next/server";
import { q } from "@/lib/server/db";
import { entrySession, json, route } from "@/lib/server/http";
import { currentBooking, entryView } from "@/lib/server/entry";

export const GET = route(async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const b = await currentBooking(sp.get("ref"), sp.get("k"));
  const s = sp.get("ref") ? null : await entrySession();
  // Other bookings under the same verified email, so a parent who booked twice can move between them.
  const others = s?.email
    ? await q<{ reference: string; status: string; created_at: string }>(
        "select reference, status, created_at from bookings where lower(email) = $1 and id <> $2 and status in ('pending', 'paid') order by created_at desc",
        [s.email, b.id],
      )
    : [];
  return json({ ...(await entryView(b)), others, signedInEmail: s?.email ?? null });
});
