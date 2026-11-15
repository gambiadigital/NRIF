import { z } from "zod";
import { q, one, log } from "@/lib/server/db";
import { HttpError, body, json, requireAdmin, route } from "@/lib/server/http";

export const GET = route(async () => {
  await requireAdmin();
  const rows = await q(
    `select t.code, t.name, t.kind, t.created_at,
            (select count(*)::int from participants p join bookings b on b.id = p.booking_id where b.team_code = t.code and b.status = 'paid') as members
       from teams t order by members desc, t.name`,
  );
  return json({ teams: rows });
});

const In = z.object({
  code: z.string().trim().min(3).max(20).regex(/^[A-Z0-9-]+$/i, "Letters, numbers and dashes only"),
  name: z.string().trim().min(2).max(80),
  kind: z.enum(["school", "company", "club"]),
});

export const POST = route(async (req: Request) => {
  const admin = await requireAdmin();
  const v = await body(req, In);
  const t = await one("insert into teams (code, name, kind) values (upper($1), $2, $3) on conflict (code) do nothing returning code", [v.code, v.name, v.kind]);
  if (!t) throw new HttpError(409, "That code is already taken");
  await log("team", `${admin.name} added team ${v.code.toUpperCase()} (${v.name}).`, { actor: admin.name });
  return json({ ok: true }, 201);
});

export const DELETE = route(async (req: Request) => {
  const admin = await requireAdmin();
  const { code } = await body(req, z.object({ code: z.string() }));
  const used = await one<{ n: number }>("select count(*)::int as n from bookings where team_code = $1", [code]);
  if ((used?.n ?? 0) > 0) throw new HttpError(409, "Bookings already use this code, so it stays");
  await q("delete from teams where code = $1", [code]);
  await log("team", `${admin.name} removed team ${code}.`, { actor: admin.name });
  return json({ ok: true });
});
