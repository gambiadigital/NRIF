import { body, json, route } from "@/lib/server/http";
import { BookingIn, createBooking } from "@/lib/server/bookings";

export const POST = route(async (req: Request) => {
  const input = await body(req, BookingIn);
  const created = await createBooking(input);
  return json(created, 201);
});
