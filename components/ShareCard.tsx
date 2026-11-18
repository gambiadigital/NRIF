"use client";

import { forwardRef, useRef, useState } from "react";
import { toast } from "sonner";
import { toPng } from "html-to-image";
import { FacebookLogo, InstagramLogo, TiktokLogo, XLogo, WhatsappLogo, LinkSimple, DownloadSimple, Check } from "@phosphor-icons/react";
import { Swoosh } from "./brand";
import { Sheet } from "./ui/sheet";
import { cn } from "@/lib/cn";

/** The card people post: big claim, their name and bib, the logo's three swooshes. */
export const ShareCard = forwardRef<HTMLDivElement, { distance: string; name: string; bib: string; virtual?: boolean; className?: string }>(function ShareCard(
  { distance, name, bib, virtual, className },
  ref,
) {
  return (
    <div ref={ref} className={cn("relative aspect-[1.2/1] w-full overflow-hidden rounded-[1.5rem] bg-cobalt p-[7%] text-white", className)}>
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_100%_0%,rgb(75_84_176/0.9),transparent_60%)]" />
      <Swoosh className="absolute -bottom-[14%] -right-[10%] w-[78%] opacity-95" />
      <div className="relative flex h-full flex-col">
        <p className="font-label !text-[0.65rem] text-white/80">Run for Independence 2027</p>
        <p className="mt-[4%] max-w-[86%] font-race text-[clamp(1.7rem,5.4vw,2.6rem)] leading-[0.92]">
          I&apos;m running the {distance}
          {virtual ? " virtual" : ""} for NRIF&apos;s Endowment Fund. Join me.
        </p>
        <p className="mt-auto text-sm font-semibold text-white/85">
          {name} · bib {bib}
        </p>
      </div>
    </div>
  );
});

export function ShareSheet({ open, onOpenChange, distance, name, bib, virtual }: { open: boolean; onOpenChange: (v: boolean) => void; distance: string; name: string; bib: string; virtual?: boolean }) {
  const card = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  // The site's own address (www.nrif.gm once the platform moves there), so referral links always land on sign-up.
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://nrif.vercel.app").replace(/^https?:\/\//, "").replace(/\/$/, "");
  const link = `${site}/?ref=${bib}`;
  const nets = [
    { icon: FacebookLogo, label: "Facebook", c: "text-[#1877F2]", src: "facebook" },
    { icon: InstagramLogo, label: "Instagram", c: "text-[#E1306C]", src: "instagram" },
    { icon: TiktokLogo, label: "TikTok", c: "text-navy", src: "tiktok" },
    { icon: XLogo, label: "X", c: "text-navy", src: "x" },
    { icon: WhatsappLogo, label: "WhatsApp", c: "text-[#25D366]", src: "whatsapp" },
  ];

  async function download() {
    if (!card.current) return;
    try {
      const url = await toPng(card.current, { pixelRatio: 2, cacheBust: true });
      const a = document.createElement("a");
      a.href = url;
      a.download = `run4independence-${bib}.png`;
      a.click();
    } catch {
      toast.error("Could not make the image on this device");
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Share your run" description="Your link carries your referral tag, so NRIF can see who you brought along.">
      <ShareCard ref={card} distance={distance} name={name} bib={bib} virtual={virtual} />
      <div className="mt-5 grid grid-cols-5 gap-2">
        {nets.map((n) => (
          <button key={n.label} onClick={() => toast(`Opening ${n.label}`, { description: `${link}&src=${n.src}` })} className="flex flex-col items-center gap-1.5 rounded-2xl border border-line bg-white py-3 text-xs font-semibold text-navy transition-colors hover:bg-paper">
            <n.icon weight="fill" className={cn("size-6", n.c)} />
            {n.label}
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-2xl border border-line bg-paper p-1.5 pl-4">
        <LinkSimple weight="bold" className="size-4 text-faint" />
        <span className="flex-1 truncate font-mono text-sm text-navy">{link}</span>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(`https://${link}`).catch(() => {});
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          }}
          className="flex h-10 items-center gap-1.5 rounded-xl bg-navy px-4 text-sm font-semibold text-white"
        >
          {copied ? <Check weight="bold" className="size-4" /> : null}
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
      <button onClick={download} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-forest hover:bg-forest-50">
        <DownloadSimple weight="bold" className="size-4" /> Save the image
      </button>
    </Sheet>
  );
}
