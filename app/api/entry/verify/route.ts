import { z } from "zod";
import { one, log } from "@/lib/server/db";
import { HttpError, body, json, route } from "@/lib/server/http";
import { checkEmailCode } from "@/lib/server/emailCode";
import { startEntrySession } from "@/lib/server/entry";

const In = z.object({ email: z.email(), code: z.string().trim() });

/** My entry, step two: check the code, then open the most recent booking made with that email. */
export const POST = route(async (req: Request) => {
  const { email, code } = await body(req, In);
  const verified = await checkEmailCode(email, code);
  const b = await one<{ id: string; reference: string }>(
    "select id, reference from bookings where lower(email) = $1 and status in ('pending', 'paid') order by (status = 'paid') desc, created_at desc limit 1",
    [verified],
  );
  if (!b) throw new HttpError(404, "We could not find a booking for that email");
  await startEntrySession(b.id, verified);
  await log("signin", `${b.reference} signed in to My entry with an email code.`, { actor: "participant", bookingId: b.id });
  return json({ ok: true });
});
