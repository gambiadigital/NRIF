import { one } from "@/lib/server/db";
import { HttpError, json, route } from "@/lib/server/http";

export const GET = route(async (_req: Request, ctx: RouteContext<"/api/teams/[code]">) => {
  const { code } = await ctx.params;
  const t = await one<{ code: string; name: string; kind: string; members: number }>(
    `select t.code, t.name, t.kind, (select count(*)::int from participants p join bookings b on b.id = p.booking_id where b.team_code = t.code and b.status = 'paid') as members
       from teams t where upper(t.code) = upper($1)`,
    [decodeURIComponent(code).slice(0, 24)],
  );
  if (!t) throw new HttpError(404, "We do not recognise that team code");
  return json(t);
});
