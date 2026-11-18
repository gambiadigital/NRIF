import "server-only";
import { cookies } from "next/headers";
import { q } from "./db";
import { HttpError, entrySession } from "./http";
import { bookingById, bookingByRef, participantsOf, publicBooking, type BookingRow } from "./bookings";
import { ENTRY_COOKIE, cookieOptions, seal } from "./session";

export const KIT_LOCK = new Date("2027-01-09T00:00:00Z");
export const VIRTUAL_OPEN = new Date("2027-01-23T00:00:00Z");
export const VIRTUAL_CLOSE = new Date("2027-02-03T00:00:00Z");
const ENTRY_DAYS = 30;

/** `email` is set when the person proved the address with a code, which lets them switch between its bookings. */
export async function startEntrySession(bookingId: string, email?: string) {
  const value = await seal({ kind: "entry", sub: bookingId, exp: Date.now() + ENTRY_DAYS * 86400_000, ...(email ? { email } : {}) });
  (await cookies()).set(ENTRY_COOKIE, value, cookieOptions(ENTRY_DAYS * 86400));
}

/** For the pay buttons: the access key from the payment link, or the My entry sign-in for this same booking. */
export async function payerBooking(ref: string, key: string): Promise<BookingRow> {
  const b = key ? await bookingByRef(ref, key) : await currentBooking().then((x) => (x.reference === ref.toUpperCase() ? x : null)).catch(() => null);
  if (!b) throw new HttpError(404, "We could not find that booking");
  return b;
}

/** The booking for this request: a valid reference + key in the URL, or the My entry cookie. */
export async function currentBooking(ref?: string | null, key?: string | null): Promise<BookingRow> {
  if (ref && key) {
    const b = await bookingByRef(ref, key);
    if (!b) throw new HttpError(404, "We could not find that booking");
    await startEntrySession(b.id);
    return b;
  }
  const s = await entrySession();
  if (!s) throw new HttpError(401, "Sign in to see your entry");
  const b = await bookingById(s.sub);
  if (!b) throw new HttpError(401, "Sign in to see your entry");
  return b;
}

export async function entryView(b: BookingRow) {
  const people = await participantsOf(b.id);
  const ids = people.map((p) => p.id);
  const results = ids.length
    ? await q<{ id: string; participant_id: string; status: string; run_date: string; distance_km: string; duration_seconds: number; review_note: string | null }>(
        `select distinct on (participant_id) id, participant_id, status, to_char(run_date, 'YYYY-MM-DD') as run_date, distance_km, duration_seconds, review_note
           from virtual_results where participant_id = any($1) order by participant_id, created_at desc`,
        [ids],
      )
    : [];
  const transfers = ids.length ? await q<{ participant_id: string; new_name: string; status: string }>("select participant_id, new_name, status from transfer_requests where participant_id = any($1) order by created_at desc", [ids]) : [];
  return publicBooking(b, people, {
    results: results.map((r) => ({ ...r, distance_km: Number(r.distance_km) })),
    transfers,
    // Transfers close on 9 January (the old kit deadline); the client still calls the flag kitLocked.
    kitLocked: Date.now() >= KIT_LOCK.getTime(),
  });
}
