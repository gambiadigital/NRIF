import { z } from "zod";
import { q, one, log } from "@/lib/server/db";
import { HttpError, body, json, route } from "@/lib/server/http";
import { currentBooking, VIRTUAL_CLOSE, VIRTUAL_OPEN } from "@/lib/server/entry";

const In = z
  .object({
    participantId: z.uuid(),
    runDate: z.iso.date(),
    distanceKm: z.number().min(0.5).max(60),
    duration: z.string().regex(/^(\d{1,2}:)?\d{1,2}:\d{2}$/, "Enter the time as h:mm:ss"),
    link: z.url().max(400).optional(),
    image: z.string().max(2_200_000).optional(),
  })
  .refine((v) => v.link || v.image, { message: "Add a screenshot or a link" });

const seconds = (t: string) => t.split(":").map(Number).reduce((a, n) => a * 60 + n, 0);

/** A virtual runner's proof. Screenshots arrive already resized in the browser and are stored with the result. */
export const POST = route(async (req: Request) => {
  const b = await currentBooking();
  if (b.status !== "paid") throw new HttpError(409, "Uploads open once your entry is paid");
  const input = await body(req, In);
  const early = process.env.ALLOW_EARLY_UPLOADS === "1";
  if (!early && Date.now() < VIRTUAL_OPEN.getTime()) throw new HttpError(409, "Uploads open on Saturday 23 January, when the run window starts");
  if (Date.now() > VIRTUAL_CLOSE.getTime()) throw new HttpError(409, "Uploads closed on 2 February");
  const p = await one<{ full_name: string; kind: string }>(
    "select p.full_name, e.kind from participants p join events e on e.id = p.event_id where p.id = $1 and p.booking_id = $2",
    [input.participantId, b.id],
  );
  if (!p) throw new HttpError(404, "Participant not found");
  if (p.kind !== "virtual") throw new HttpError(409, "Only virtual entries upload a run");

  let image: Buffer | null = null;
  let type: string | null = null;
  if (input.image) {
    const m = input.image.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
    if (!m) throw new HttpError(400, "That screenshot could not be read");
    type = m[1]!;
    image = Buffer.from(m[2]!, "base64");
    if (image.length > 1_600_000) throw new HttpError(413, "That screenshot is too large");
  }
  await q(
    "insert into virtual_results (participant_id, run_date, distance_km, duration_seconds, link, image, image_type) values ($1, $2, $3, $4, $5, $6, $7)",
    [input.participantId, input.runDate, input.distanceKm, seconds(input.duration), input.link ?? null, image, type],
  );
  await log("virtual", `${b.reference}: ${p.full_name} uploaded ${input.distanceKm} km in ${input.duration}.`, { actor: "participant", bookingId: b.id });
  return json({ ok: true }, 201);
});
