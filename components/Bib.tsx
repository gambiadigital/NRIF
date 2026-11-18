import { QRCodeSVG } from "qrcode.react";
import { Info } from "@phosphor-icons/react/dist/ssr";
import { eventById, type RaceEvent } from "@/lib/data";
import { cn } from "@/lib/cn";

const BAND: Record<RaceEvent["accent"], { band: string; text: string }> = {
  ember: { band: "bg-ember", text: "text-ember" },
  royal: { band: "bg-royal", text: "text-royal" },
  forest: { band: "bg-forest", text: "text-forest" },
  navy: { band: "bg-navy", text: "text-navy" },
  cobalt: { band: "bg-cobalt", text: "text-cobalt" },
};

/**
 * A race bib that scales with its container (all type in container units), so the same component is the
 * 64px thumbnail in admin and the full-width pop-up on the confirmation screen.
 */
export function Bib({
  number,
  eventId,
  name,
  qr,
  className,
  flat,
}: {
  number: string;
  eventId: RaceEvent["id"];
  name?: string;
  qr?: string;
  className?: string;
  flat?: boolean;
}) {
  const ev = eventById(eventId);
  const tone = BAND[ev.accent];
  const label = ev.id === "virtual" ? "Virtual run" : ev.kind === "virtual" ? `${ev.distance} Virtual` : ev.id === "heritage" ? "Heritage Walk" : ev.id === "21k" ? "Half marathon" : ev.distance;
  return (
    <div className={cn("@container w-full", className)}>
      <div
        className={cn(
          "relative aspect-[1.42/1] w-full overflow-hidden rounded-[6cqw] bg-white text-navy",
          !flat && "shadow-[0_1px_0_rgb(11_27_58/0.05),0_2px_6px_rgb(11_27_58/0.08),0_30px_60px_-30px_rgb(11_27_58/0.45)] ring-1 ring-black/5",
        )}
      >
        {/* paper fibre */}
        <div className="absolute inset-0 opacity-[0.5] [background:repeating-linear-gradient(115deg,transparent_0_3px,rgb(11_27_58/0.012)_3px_4px)]" />
        <div className={cn("relative flex h-[19%] items-center justify-between px-[6cqw]", tone.band, "text-white")}>
          <span className="font-race text-[5.6cqw] not-italic tracking-[0.02em] [font-variation-settings:'wdth'_80]">Run for Independence</span>
          <span className="font-mono text-[3.6cqw] font-semibold opacity-80">2027</span>
        </div>
        {/* pin holes */}
        {["left-[3.5cqw] top-[24%]", "right-[3.5cqw] top-[24%]", "left-[3.5cqw] bottom-[6%]", "right-[3.5cqw] bottom-[6%]"].map((p) => (
          <span key={p} className={cn("absolute size-[2.6cqw] rounded-full bg-paper shadow-[inset_0_1px_2px_rgb(11_27_58/0.35)]", p)} />
        ))}
        <div className="relative flex h-[81%] flex-col items-center justify-center pb-[3cqw]">
          <span className="font-bib text-[31cqw] leading-none text-navy">{number}</span>
          <span className={cn("mt-[1.4cqw] font-race text-[6.4cqw]", tone.text)}>{label}</span>
          {name && <span className="absolute bottom-[5cqw] left-[9cqw] font-mono text-[3.4cqw] font-semibold tracking-[0.14em] text-muted">{name}</span>}
          {qr && (
            <span className="absolute bottom-[4cqw] right-[8cqw] rounded-[1.2cqw] bg-white p-[0.8cqw] ring-1 ring-line">
              <QRCodeSVG value={qr} size={64} level="M" className="block size-[10cqw]" fgColor="#0b1b3a" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/** NRIF's bibs are plain numbered bibs: the one on screen is only a picture for sharing. */
export function BibNote({ className }: { className?: string }) {
  return (
    <p className={cn("flex w-full max-w-xl items-start gap-2.5 rounded-2xl bg-cobalt-50 px-4 py-3 text-left text-sm text-navy ring-1 ring-cobalt/15", className)}>
      <Info weight="fill" className="mt-0.5 size-4 shrink-0 text-cobalt" />
      <span>
        The bib on this page is a picture for sharing. The bib you are given will look different, and NRIF does not print names on bibs.
      </span>
    </p>
  );
}
