import { one } from "@/lib/server/db";
import { HttpError, requireAdmin, route } from "@/lib/server/http";

export const GET = route(async (_req: Request, ctx: RouteContext<"/api/admin/virtual/[id]/image">) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const r = await one<{ image: Buffer | Uint8Array | string | null; image_type: string | null }>("select image, image_type from virtual_results where id = $1", [id]);
  if (!r?.image) throw new HttpError(404, "No screenshot");
  // The HTTP driver returns bytea as a \x-prefixed hex string.
  const bytes = typeof r.image === "string" ? Buffer.from(r.image.replace(/^\\x/, ""), "hex") : Buffer.from(r.image);
  return new Response(new Uint8Array(bytes), { headers: { "Content-Type": r.image_type ?? "image/jpeg", "Cache-Control": "private, max-age=3600" } });
});
