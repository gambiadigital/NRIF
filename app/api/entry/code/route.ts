import { z } from "zod";
import { one } from "@/lib/server/db";
import { body, json, route } from "@/lib/server/http";
import { normaliseEmail, sendEmailCode } from "@/lib/server/emailCode";

const In = z.object({ email: z.email("Enter the email you booked with") });

/*
 * My entry, step one: email a sign-in code. Codes only go to addresses that have a booking, and the answer is the
 * same either way, so nobody can use this to find out who has entered.
 */
export const POST = route(async (req: Request) => {
  const email = normaliseEmail((await body(req, In)).email);
  const has = await one<{ n: number }>("select count(*)::int as n from bookings where lower(email) = $1 and status in ('pending', 'paid')", [email]);
  if ((has?.n ?? 0) > 0) await sendEmailCode(email, "entry");
  return json({ ok: true });
});
