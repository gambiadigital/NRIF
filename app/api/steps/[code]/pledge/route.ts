import { randomInt } from "node:crypto";
import { z } from "zod";
import { one, log } from "@/lib/server/db";
import { HttpError, body, json, route } from "@/lib/server/http";

const In = z.object({
  amount: z.number().int().min(10, "The smallest gift is GMD 10").max(1_000_000),
  name: z.string().trim().max(60).optional(),
  message: z.string().trim().max(200).optional(),
  phone: z.string().max(20).optional(),
});

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** A gift to someone's steps code. It shows as pledged until staff match the money in the admin console. */
export const POST = route(async (req: Request, ctx: RouteContext<"/api/steps/[code]/pledge">) => {
  const { code } = await ctx.params;
  const b = await one<{ steps_code: string; id: string }>("select steps_code, id from bookings where status = 'paid' and upper(steps_code) = upper($1)", [decodeURIComponent(code).slice(0, 12)]);
  if (!b) throw new HttpError(404, "We could not find that steps challenge code");
  const input = await body(req, In);
  for (let i = 0; i < 6; i++) {
    const reference = "SP-" + Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
    const row = await one<{ reference: string }>(
      "insert into step_pledges (steps_code, name, message, amount, phone, reference) values ($1, $2, $3, $4, $5, $6) on conflict (reference) do nothing returning reference",
      [b.steps_code, input.name || null, input.message || null, input.amount, input.phone || null, reference],
    );
    if (row) {
      await log("pledge", `${reference}: GMD ${input.amount} pledged to ${b.steps_code}.`, { actor: "supporter", bookingId: b.id });
      return json({ reference: row.reference, amount: input.amount }, 201);
    }
  }
  throw new HttpError(500, "Could not create a reference. Please try again.");
});
