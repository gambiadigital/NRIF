import { z } from "zod";
import { q, one, log } from "@/lib/server/db";
import { HttpError, body, json, route } from "@/lib/server/http";
import { currentBooking, KIT_LOCK } from "@/lib/server/entry";

const In = z.object({
  participantId: z.uuid(),
  newName: z.string().trim().min(2, "Enter their full name").max(80),
  newPhone: z.object({ iso: z.string().length(2), digits: z.string().regex(/^\d{6,12}$/, "Enter their phone number") }),
});

/** A transfer request. Staff complete it once the new runner has given their details and accepted the waiver. */
export const POST = route(async (req: Request) => {
  const b = await currentBooking();
  if (Date.now() >= KIT_LOCK.getTime()) throw new HttpError(409, "Transfers closed on 9 January");
  const input = await body(req, In);
  const p = await one<{ full_name: string }>("select full_name from participants where id = $1 and booking_id = $2", [input.participantId, b.id]);
  if (!p) throw new HttpError(404, "Participant not found");
  await q("insert into transfer_requests (participant_id, new_name, new_phone) values ($1, $2, $3)", [input.participantId, input.newName, `${input.newPhone.iso}:${input.newPhone.digits}`]);
  await log("transfer", `${b.reference}: transfer of ${p.full_name}'s place to ${input.newName} requested.`, { actor: "participant", bookingId: b.id });
  return json({ ok: true });
});
