import { NextResponse, type NextRequest } from "next/server";
import { connection } from "next/server";
import { bookingByPayToken } from "@/lib/server/bookings";

/** "Pay for me" links: /p/<token> → the pay-only view of that booking. */
export async function GET(req: NextRequest, ctx: RouteContext<"/p/[token]">) {
  await connection();
  const { token } = await ctx.params;
  const b = await bookingByPayToken(decodeURIComponent(token));
  if (!b) return NextResponse.redirect(new URL("/", req.url));
  return NextResponse.redirect(new URL(`/register/pending?ref=${b.reference}&t=${encodeURIComponent(b.pay_token!)}`, req.url));
}
