import { NextResponse, type NextRequest } from "next/server";
import { connection } from "next/server";
import { one } from "@/lib/server/db";

/** Short links printed in emails: /b/7Q4K-a8Kd2f3x → the booking's own page. */
export async function GET(req: NextRequest, ctx: RouteContext<"/b/[code]">) {
  await connection();
  const { code } = await ctx.params;
  const m = decodeURIComponent(code).match(/^([2-9A-Z]{4})-([A-Za-z0-9_-]{8})$/);
  if (!m) return NextResponse.redirect(new URL("/my-entry", req.url));
  const b = await one<{ reference: string; access_key: string; status: string }>(
    "select reference, access_key, status from bookings where reference = $1 and left(access_key, 8) = $2",
    [`RFI-${m[1]!.toUpperCase()}`, m[2]],
  );
  if (!b) return NextResponse.redirect(new URL("/my-entry", req.url));
  const path = b.status === "paid" ? "/confirmation" : "/register/pending";
  return NextResponse.redirect(new URL(`${path}?ref=${b.reference}&k=${encodeURIComponent(b.access_key)}`, req.url));
}
