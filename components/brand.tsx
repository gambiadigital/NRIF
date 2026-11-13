import Image from "next/image";
import { cn } from "@/lib/cn";

/** The Run4Independence mark. `reverse` turns the navy wordmark white for dark grounds. */
export function R4ILogo({ reverse, className, priority }: { reverse?: boolean; className?: string; priority?: boolean }) {
  return (
    <Image
      src={reverse ? "/brand/run4independence-reverse.png" : "/brand/run4independence.png"}
      alt="Run4Independence"
      width={1324}
      height={501}
      priority={priority}
      className={cn("h-auto w-36 select-none", className)}
      draggable={false}
    />
  );
}

/** The NRIF tree and name, side by side. */
export function NrifLockup({ white, className }: { white?: boolean; className?: string }) {
  return (
    <Image
      src={white ? "/brand/nrif-horizontal-white.svg" : "/brand/nrif-horizontal.svg"}
      alt="National Research & Innovation Fund"
      width={480}
      height={158}
      unoptimized
      className={cn("h-9 w-auto select-none", className)}
      draggable={false}
    />
  );
}

export function NrifStacked({ white, className }: { white?: boolean; className?: string }) {
  return (
    <Image
      src={white ? "/brand/nrif-stacked-white.svg" : "/brand/nrif-stacked.svg"}
      alt="National Research & Innovation Fund"
      width={386}
      height={361}
      unoptimized
      className={cn("h-auto w-40 select-none", className)}
      draggable={false}
    />
  );
}

export function NrifSeal({ className }: { className?: string }) {
  return (
    <Image src="/brand/nrif-seal.svg" alt="NRIF seal" width={417} height={417} unoptimized className={cn("size-28 select-none", className)} draggable={false} />
  );
}

/** Red, blue and green bars with white gaps, the stripe under the logo. */
export function FlagBars({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)} aria-hidden>
      <span className="h-1 w-6 -skew-x-[24deg] rounded-[1px] bg-ember" />
      <span className="h-1 w-6 -skew-x-[24deg] rounded-[1px] bg-royal" />
      <span className="h-1 w-6 -skew-x-[24deg] rounded-[1px] bg-forest" />
    </span>
  );
}

/** The three swooshes from the logo, used as a large decorative arc. */
export function Swoosh({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 320" fill="none" className={className} aria-hidden>
      <path d="M590 8C380 30 120 110 40 210c-38 48 4 92 120 98" stroke="#D7141A" strokeWidth="16" strokeLinecap="round" />
      <path d="M590 40C400 62 170 130 92 218c-34 40 0 76 92 82" stroke="#1F3C99" strokeWidth="16" strokeLinecap="round" />
      <path d="M590 72C420 94 220 152 146 226c-28 30-2 58 64 64" stroke="#135F40" strokeWidth="16" strokeLinecap="round" />
    </svg>
  );
}
