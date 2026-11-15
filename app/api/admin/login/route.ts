import { z } from "zod";
import { one, q } from "@/lib/server/db";
import { HttpError, body, json, route } from "@/lib/server/http";
import { verifyPassword } from "@/lib/server/password";
import { startAdminSession } from "@/lib/server/admin";

const In = z.object({ email: z.email(), password: z.string().min(1).max(200) });

export const POST = route(async (req: Request) => {
  const { email, password } = await body(req, In);
  const a = await one<{ id: string; name: string; password_hash: string }>("select id, name, password_hash from admins where lower(email) = lower($1)", [email]);
  // Same work and the same answer whether or not the email exists.
  const ok = await verifyPassword(password, a?.password_hash ?? "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
  if (!a || !ok) throw new HttpError(401, "That email and password do not match");
  await q("update admins set last_login_at = now() where id = $1", [a.id]);
  await startAdminSession(a);
  return json({ ok: true, name: a.name });
});
