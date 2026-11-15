"use client";

import { FacebookLogo, InstagramLogo, TiktokLogo, XLogo } from "@phosphor-icons/react";
import { useSettings } from "@/lib/client";

/** NRIF's social links from Admin → Settings; only the ones filled in show. */
export function FooterSocials() {
  const s = useSettings().data;
  const links = [
    { href: s?.social_facebook, icon: FacebookLogo, label: "Facebook" },
    { href: s?.social_instagram, icon: InstagramLogo, label: "Instagram" },
    { href: s?.social_tiktok, icon: TiktokLogo, label: "TikTok" },
    { href: s?.social_x, icon: XLogo, label: "X" },
  ].filter((l) => l.href);
  if (!links.length) return null;
  return (
    <div className="flex gap-2">
      {links.map((l) => (
        <a key={l.label} href={l.href} target="_blank" rel="noreferrer" aria-label={`NRIF on ${l.label}`} className="grid size-10 place-items-center rounded-full bg-white/8 ring-1 ring-white/10 transition-colors hover:bg-white/15">
          <l.icon weight="fill" className="size-[1.1rem]" />
        </a>
      ))}
    </div>
  );
}
