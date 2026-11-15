import { q, one } from "@/lib/server/db";
import { HttpError, json, route } from "@/lib/server/http";

/** A steps-challenge page: first name, event, money given (paid pledges), supporters and steps. */
export const GET = route(async (_req: Request, ctx: RouteContext<"/api/steps/[code]">) => {
  const { code } = await ctx.params;
  const b = await one<{ id: string; steps_code: string; first: string; event: string; others: number }>(
    `select b.id, b.steps_code, split_part(p.full_name, ' ', 1) as first, e.name as event,
            (select count(*)::int - 1 from participants x where x.booking_id = b.id) as others
       from bookings b join participants p on p.booking_id = b.id and p.is_lead join events e on e.id = p.event_id
      where b.status = 'paid' and upper(b.steps_code) = upper($1)`,
    [decodeURIComponent(code).slice(0, 12)],
  );
  if (!b) throw new HttpError(404, "We could not find that steps challenge code");
  const totals = await one<{ raised: string; supporters: number; pledged: string }>(
    "select coalesce(sum(amount) filter (where status = 'paid'), 0) as raised, count(*) filter (where status = 'paid')::int as supporters, coalesce(sum(amount) filter (where status = 'pledged'), 0) as pledged from step_pledges where steps_code = $1",
    [b.steps_code],
  );
  const supporters = await q<{ name: string | null; message: string | null; amount: string; status: string; created_at: string }>(
    "select name, message, amount, status, created_at from step_pledges where steps_code = $1 and status <> 'cancelled' order by created_at desc limit 30",
    [b.steps_code],
  );
  const steps = await one<{ total: number }>("select coalesce(sum(steps), 0)::int as total from step_logs where booking_id = $1", [b.id]);
  const week = await q<{ day: string; steps: number }>("select to_char(day, 'YYYY-MM-DD') as day, steps from step_logs where booking_id = $1 and day > current_date - 7 order by day", [b.id]);
  return json({
    code: b.steps_code,
    first: b.first,
    event: b.event,
    others: b.others,
    raised: Number(totals?.raised ?? 0),
    pledged: Number(totals?.pledged ?? 0),
    supporters: totals?.supporters ?? 0,
    list: supporters.map((s) => ({ ...s, amount: Number(s.amount) })),
    steps: steps?.total ?? 0,
    week,
  });
});
