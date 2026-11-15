import { z } from "zod";
import { one, log } from "@/lib/server/db";
import { HttpError, body, json, route } from "@/lib/server/http";
import { startEntrySession } from "@/lib/server/entry";

const In = z.object({ reference: z.string().trim().min(4).max(12), digits: z.string().regex(/^\d{6,12}$/, "Enter the phone number you booked with") });

/** My entry sign-in: the booking reference plus the phone number it was made with. */
export const POST = route(async (req: Request) => {
  const { reference, digits } = await body(req, In);
  const ref = reference.toUpperCase().startsWith("RFI-") ? reference.toUpperCase() : `RFI-${reference.toUpperCase()}`;
  const b = await one<{ id: string; reference: string }>("select id, reference from bookings where reference = $1 and right(phone, 7) = right($2, 7)", [ref, digits]);
  if (!b) throw new HttpError(404, "That reference and phone number do not match a booking");
  await startEntrySession(b.id);
  await log("signin", `${b.reference} signed in to My entry.`, { actor: "participant", bookingId: b.id });
  return json({ ok: true });
});
