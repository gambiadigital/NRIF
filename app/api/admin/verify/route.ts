import { z } from "zod";
import { one, q } from "@/lib/server/db";
import { HttpError, body, json, route } from "@/lib/server/http";
import { checkEmailCode } from "@/lib/server/emailCode";
import { startAdminSession } from "@/lib/server/admin";

const In = z.object({ email: z.email(), code: z.string().trim() });

/** Admin sign-in, step two: check the code, then open the console. */
export const POST = route(async (req: Request) => {
  const { email, code } = await body(req, In);
  const verified = await checkEmailCode(email, code);
  const a = await one<{ id: string; name: string }>("select id, name from admins where lower(email) = $1", [verified]);
  if (!a) throw new HttpError(403, "That email does not have an admin account");
  await q("update admins set last_login_at = now() where id = $1", [a.id]);
  await startAdminSession(a);
  return json({ ok: true, name: a.name });
});
