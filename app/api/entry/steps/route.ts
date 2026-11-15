import { z } from "zod";
import { q } from "@/lib/server/db";
import { HttpError, body, json, route } from "@/lib/server/http";
import { currentBooking } from "@/lib/server/entry";

const In = z.object({ day: z.iso.date(), steps: z.number().int().min(0).max(200000) });

/** Log a day's steps for the steps challenge. One figure per day; logging again replaces it. */
export const POST = route(async (req: Request) => {
  const b = await currentBooking();
  if (!b.steps_code) throw new HttpError(409, "This booking is not in the steps challenge");
  const { day, steps } = await body(req, In);
  if (new Date(day).getTime() > Date.now() + 86400_000) throw new HttpError(400, "That day has not happened yet");
  await q("insert into step_logs (booking_id, day, steps) values ($1, $2, $3) on conflict (booking_id, day) do update set steps = excluded.steps", [b.id, day, steps]);
  return json({ ok: true });
});
