import { z } from "zod";
import { one } from "@/lib/server/db";
import { HttpError, body, entrySession, json, route } from "@/lib/server/http";
import { startEntrySession } from "@/lib/server/entry";

const In = z.object({ reference: z.string().trim().min(4).max(12) });

/** Switch to another booking made with the same email. Only for sessions opened with an email code. */
export const POST = route(async (req: Request) => {
  const s = await entrySession();
  if (!s?.email) throw new HttpError(401, "Sign in with your email to switch bookings");
  const { reference } = await body(req, In);
  const b = await one<{ id: string }>("select id from bookings where reference = $1 and lower(email) = $2", [reference.toUpperCase(), s.email]);
  if (!b) throw new HttpError(404, "That booking is not under your email");
  await startEntrySession(b.id, s.email);
  return json({ ok: true });
});
