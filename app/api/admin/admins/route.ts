import { z } from "zod";
import { q, one, log } from "@/lib/server/db";
import { HttpError, body, json, requireAdmin, route } from "@/lib/server/http";
import { hashPassword } from "@/lib/server/password";

export const GET = route(async () => {
  await requireAdmin();
  // Hidden accounts (the developer's) can sign in but are not listed for the team.
  return json({ admins: await q("select id, name, email, role, created_at, last_login_at from admins where not hidden order by created_at") });
});

const In = z.object({ name: z.string().trim().min(2).max(60), email: z.email(), password: z.string().min(10, "Use at least 10 characters").max(200).optional() });

/** Adds a colleague. They sign in with a code sent to their email; a password is optional, as a fallback. */
export const POST = route(async (req: Request) => {
  const admin = await requireAdmin();
  const v = await body(req, In);
  const a = await one("insert into admins (email, name, password_hash) values ($1, $2, $3) on conflict do nothing returning id", [v.email.toLowerCase(), v.name, v.password ? await hashPassword(v.password) : ""]);
  if (!a) throw new HttpError(409, "There is already an admin with that email");
  await log("admin", `${admin.name} added ${v.name} as an admin.`, { actor: admin.name });
  return json({ ok: true }, 201);
});
