import { one } from "@/lib/server/db";
import { json, route } from "@/lib/server/http";

/** For the "Fatou is running the 5 km. Join her." banner: first name and event only. */
export const GET = route(async (_req: Request, ctx: RouteContext<"/api/referral/[bib]">) => {
  const { bib } = await ctx.params;
  const r = await one<{ first: string; event: string }>(
    `select split_part(p.full_name, ' ', 1) as first, e.name as event
       from participants p join bookings b on b.id = p.booking_id join events e on e.id = p.event_id
      where b.status = 'paid' and upper(p.bib) = upper($1)`,
    [decodeURIComponent(bib).slice(0, 8)],
  );
  return json(r ?? { first: null });
});
