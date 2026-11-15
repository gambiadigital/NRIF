import type { NextRequest } from "next/server";
import { json, route } from "@/lib/server/http";
import { currentBooking, entryView } from "@/lib/server/entry";

export const GET = route(async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const b = await currentBooking(sp.get("ref"), sp.get("k"));
  return json(await entryView(b));
});
