import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, unseal, type AdminSession } from "@/lib/server/session";

/*
 * An optimistic gate for the admin console: no valid signed admin cookie, no page. Every admin API route checks the
 * session again on its own (requireAdmin), so this only keeps signed-out visitors from seeing an empty console.
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  const session = await unseal<AdminSession>(req.cookies.get(ADMIN_COOKIE)?.value, "admin");
  if (session) return NextResponse.next();
  const url = new URL("/admin/login", req.url);
  if (pathname !== "/admin") url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
