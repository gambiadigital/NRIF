import { z } from "zod";
import { one, log } from "@/lib/server/db";
import { HttpError, body, json, route } from "@/lib/server/http";
import { startAdminSession } from "@/lib/server/admin";
import { checkEmailCode, normaliseEmail, sendEmailCode } from "@/lib/server/emailCode";

const In = z.object({
  token: z.string().min(8),
  name: z.string().trim().min(2).max(60),
  email: z.email(),
  code: z.string().trim().optional(),
});

/** Whether the console still needs its first account. */
export const GET = route(async () => {
  const n = await one<{ n: number }>("select count(*)::int as n from admins");
  return json({ needsSetup: (n?.n ?? 0) === 0 });
});

/*
 * Creates the first admin, in two calls: the setup code and an email (we send a code to it), then the same again
 * with that code. Works only while there are no admins at all.
 */
export const POST = route(async (req: Request) => {
  const input = await body(req, In);
  const expected = process.env.ADMIN_SETUP_TOKEN;
  if (!expected || input.token !== expected) throw new HttpError(403, "That setup code is not right");
  const existing = await one<{ n: number }>("select count(*)::int as n from admins");
  if ((existing?.n ?? 0) > 0) throw new HttpError(409, "The console already has an admin. Sign in instead.");
  const email = normaliseEmail(input.email);

  if (!input.code) {
    await sendEmailCode(email, "setup");
    return json({ codeSent: true });
  }

  const verified = await checkEmailCode(email, input.code);
  const created = await one<{ id: string; name: string }>(
    `insert into admins (email, name, password_hash, role)
     select $1, $2, '', 'owner' where not exists (select 1 from admins) returning id, name`,
    [verified, input.name],
  );
  if (!created) throw new HttpError(409, "The console already has an admin. Sign in instead.");
  await log("admin", `${input.name} created the first admin account.`, { actor: input.name });
  await startAdminSession(created);
  return json({ ok: true }, 201);
});
