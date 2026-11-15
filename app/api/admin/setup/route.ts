import { z } from "zod";
import { one, log } from "@/lib/server/db";
import { HttpError, body, json, route } from "@/lib/server/http";
import { hashPassword } from "@/lib/server/password";
import { startAdminSession } from "@/lib/server/admin";

const In = z.object({
  token: z.string().min(8),
  name: z.string().trim().min(2).max(60),
  email: z.email(),
  password: z.string().min(10, "Use at least 10 characters").max(200),
});

/** Whether the console still needs its first account. */
export const GET = route(async () => {
  const n = await one<{ n: number }>("select count(*)::int as n from admins");
  return json({ needsSetup: (n?.n ?? 0) === 0 });
});

/** Creates the first admin. Needs ADMIN_SETUP_TOKEN, and only works while there are no admins at all. */
export const POST = route(async (req: Request) => {
  const input = await body(req, In);
  const expected = process.env.ADMIN_SETUP_TOKEN;
  if (!expected || input.token !== expected) throw new HttpError(403, "That setup code is not right");
  const created = await one<{ id: string; name: string }>(
    `insert into admins (email, name, password_hash, role)
     select $1, $2, $3, 'owner' where not exists (select 1 from admins) returning id, name`,
    [input.email.toLowerCase(), input.name, await hashPassword(input.password)],
  );
  if (!created) throw new HttpError(409, "The console already has an admin. Sign in instead.");
  await log("admin", `${input.name} created the first admin account.`, { actor: input.name });
  await startAdminSession(created);
  return json({ ok: true }, 201);
});
