import { cookies } from "next/headers";
import { json, route } from "@/lib/server/http";
import { ADMIN_COOKIE } from "@/lib/server/session";

export const POST = route(async () => {
  (await cookies()).delete(ADMIN_COOKIE);
  return json({ ok: true });
});
