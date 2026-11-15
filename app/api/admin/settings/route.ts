import { z } from "zod";
import { q, settings, log } from "@/lib/server/db";
import { body, json, requireAdmin, route } from "@/lib/server/http";

const KEYS = [
  "contact_whatsapp",
  "contact_phone",
  "contact_email",
  "contact_office",
  "social_facebook",
  "social_instagram",
  "social_tiktok",
  "social_x",
  "fund_goal_gmd",
  "wave_number",
  "yonna_number",
  "ecobank_account",
  "ecobank_name",
] as const;

export const GET = route(async () => {
  await requireAdmin();
  return json(await settings([...KEYS]));
});

export const PATCH = route(async (req: Request) => {
  const admin = await requireAdmin();
  const v = await body(req, z.record(z.enum(KEYS), z.string().max(300)));
  for (const [k, val] of Object.entries(v)) {
    await q("insert into settings (key, value) values ($1, $2) on conflict (key) do update set value = excluded.value, updated_at = now()", [k, val.trim()]);
  }
  await log("settings", `${admin.name} updated ${Object.keys(v).join(", ")}.`, { actor: admin.name });
  return json({ ok: true });
});
