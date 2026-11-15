import { z } from "zod";
import { q, log } from "@/lib/server/db";
import { body, json, requireAdmin, route } from "@/lib/server/http";

export const GET = route(async () => {
  await requireAdmin();
  return json({ templates: await q("select id, name, channel, when_label, body, enabled, updated_at from templates order by id") });
});

const In = z.object({ id: z.string(), body: z.string().min(10).max(600).optional(), enabled: z.boolean().optional() });

export const PATCH = route(async (req: Request) => {
  const admin = await requireAdmin();
  const v = await body(req, In);
  await q("update templates set body = coalesce($2, body), enabled = coalesce($3, enabled), updated_at = now() where id = $1", [v.id, v.body ?? null, v.enabled ?? null]);
  await log("template", `${admin.name} updated the ${v.id} message.`, { actor: admin.name });
  return json({ ok: true });
});
