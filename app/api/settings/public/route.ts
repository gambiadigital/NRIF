import { settings } from "@/lib/server/db";
import { json, route } from "@/lib/server/http";
import { waveCheckoutEnabled, waveLink } from "@/lib/server/wave";

const PUBLIC = [
  "contact_whatsapp",
  "contact_phone",
  "contact_email",
  "contact_office",
  "social_facebook",
  "social_instagram",
  "social_tiktok",
  "social_x",
  "wave_number",
  "yonna_number",
  "ecobank_account",
  "ecobank_name",
];

export const GET = route(async () => {
  const s = await settings(PUBLIC);
  return json({ ...s, wave_link: waveLink(), wave_checkout: waveCheckoutEnabled() });
});
