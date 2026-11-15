import { cookies } from "next/headers";
import { json, route } from "@/lib/server/http";
import { ENTRY_COOKIE } from "@/lib/server/session";

export const POST = route(async () => {
  (await cookies()).delete(ENTRY_COOKIE);
  return json({ ok: true });
});
