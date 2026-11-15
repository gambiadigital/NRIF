import { z } from "zod";
import { one } from "@/lib/server/db";
import { body, json, route } from "@/lib/server/http";
import { normaliseEmail, sendEmailCode } from "@/lib/server/emailCode";

const In = z.object({ email: z.email("Enter your work email") });

/** Admin sign-in, step one: a code goes only to addresses with an admin account. Same answer either way. */
export const POST = route(async (req: Request) => {
  const email = normaliseEmail((await body(req, In)).email);
  const a = await one<{ id: string }>("select id from admins where lower(email) = $1", [email]);
  if (a) await sendEmailCode(email, "admin");
  return json({ ok: true });
});
