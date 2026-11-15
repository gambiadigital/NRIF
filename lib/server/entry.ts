import "server-only";
import { cookies } from "next/headers";
import { q, one } from "./db";
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
  const steps = await one<{ total: number }>("select coalesce(sum(steps), 0)::int as total from step_logs where booking_id = $1", [b.id]);
  const week = await q<{ day: string; steps: number }>(
    "select to_char(day, 'YYYY-MM-DD') as day, steps from step_logs where booking_id = $1 and day > current_date - 7 order by day",
    [b.id],
  );
  const raised = b.steps_code
    ? await one<{ v: string; n: number }>("select coalesce(sum(amount) filter (where status = 'paid'), 0) as v, count(*) filter (where status = 'paid')::int as n from step_pledges where steps_code = $1", [b.steps_code])
    : null;
  const transfers = ids.length ? await q<{ participant_id: string; new_name: string; status: string }>("select participant_id, new_name, status from transfer_requests where participant_id = any($1) order by created_at desc", [ids]) : [];
  return publicBooking(b, people, {
    results: results.map((r) => ({ ...r, distance_km: Number(r.distance_km) })),
    stepsTotal: steps?.total ?? 0,
    stepsWeek: week,
    stepsRaised: Number(raised?.v ?? 0),
    stepsSupporters: raised?.n ?? 0,
    transfers,
    kitLocked: Date.now() >= KIT_LOCK.getTime(),
  });
}
