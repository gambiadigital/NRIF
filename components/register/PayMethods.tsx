import Image from "next/image";
import { GlobeHemisphereWest } from "@phosphor-icons/react";
import type { PaymentMethodId } from "@/lib/data";
import { cn } from "@/lib/cn";

/* NRIF's payment routes, with the providers' own marks taken from NRIF's payment cards. */

export const ECOBANK_QR =
  "00020101021102164467686662548856041655431784163007215204739953032705802GM5925NATIONAL RESEARCH AND INN6006BANJUL62240308326033620708326033626304FA4A";

const LOGOS: Partial<Record<PaymentMethodId, { src: string; w: number; h: number; bg: string }>> = {
  wave: { src: "/pay/wave-logo.png", w: 278, h: 128, bg: "bg-[#1dc3f3]" },
  yonna: { src: "/pay/yonna-logo.png", w: 276, h: 120, bg: "bg-white" },
  ecobank: { src: "/pay/ecobank-logo.png", w: 328, h: 102, bg: "bg-white" },
};

/** The two card acceptance marks, drawn small enough to share one tile. */
function CardMarks() {
  return (
    <svg viewBox="0 0 72 44" className="size-full" role="img" aria-label="Visa and Mastercard">
      <text x="5" y="27.5" fontFamily="Arial, Helvetica, sans-serif" fontSize="14" fontWeight="900" fontStyle="italic" letterSpacing="-0.4" fill="#1a1f71">
        VISA
      </text>
      <circle cx="49.5" cy="22" r="8.2" fill="#eb001b" />
      <circle cx="59.5" cy="22" r="8.2" fill="#f79e1b" />
      <path d="M54.5 15.5a8.2 8.2 0 0 1 0 13 8.2 8.2 0 0 1 0-13z" fill="#ff5f00" />
    </svg>
  );
}

export function PayMark({ id, className }: { id: PaymentMethodId; className?: string }) {
  if (id === "card")
    return (
      <span className={cn("grid h-11 w-[4.5rem] shrink-0 place-items-center overflow-hidden rounded-xl bg-white ring-1 ring-line", className)}>
        <CardMarks />
      </span>
    );
  const logo = LOGOS[id];
  if (logo)
    return (
      <span className={cn("grid h-11 w-[4.5rem] shrink-0 place-items-center overflow-hidden rounded-xl ring-1 ring-line", logo.bg, className)}>
        <Image src={logo.src} alt={id} width={logo.w} height={logo.h} className="h-auto w-full object-contain" />
      </span>
    );
  return (
    <span className={cn("grid h-11 w-[4.5rem] shrink-0 place-items-center rounded-xl bg-cobalt text-white", className)}>
      <GlobeHemisphereWest weight="fill" className="size-6" />
    </span>
  );
}
