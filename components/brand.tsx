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

/** The NRIF tree on its own, for tight spaces such as the phone header. */
export function NrifTree({ white, className }: { white?: boolean; className?: string }) {
  return (
    <Image
      src={white ? "/brand/nrif-tree-white.svg" : "/brand/nrif-tree.svg"}
      alt="National Research & Innovation Fund"
      width={155}
      height={162}
      unoptimized
      className={cn("h-9 w-auto select-none", className)}
      draggable={false}
    />
  );
}

/**
 * NRIF and Run4Independence together, split by a hairline: NRIF's ask is that the two marks always travel as a pair.
 * Phones get the tree alone so the pair fits beside the Sign up button at 360px; `nav` also uses the tree from 1024px
 * to 1280px, where the site header's links need the room.
 */
export function CoBrand({ reverse, priority, size = "md", nav, className }: { reverse?: boolean; priority?: boolean; size?: "md" | "lg"; nav?: boolean; className?: string }) {
  const lg = size === "lg";
  return (
    <span className={cn("flex items-center", lg ? "gap-4 sm:gap-5" : "gap-2.5 sm:gap-3.5", className)}>
      <NrifTree white={reverse} className={cn(lg ? "h-12" : "h-9", "sm:hidden", nav && "lg:block xl:hidden")} />
      <NrifLockup white={reverse} className={cn("hidden sm:block", nav && "lg:hidden xl:block", lg ? "h-12" : "h-9 xl:h-10")} />
      <span aria-hidden className={cn("w-px shrink-0", lg ? "h-12" : "h-8 sm:h-9", reverse ? "bg-white/30" : "bg-navy/15")} />
      <R4ILogo reverse={reverse} priority={priority} className={lg ? "w-40 sm:w-44" : "w-[6.5rem] sm:w-[8rem] xl:w-[8.5rem]"} />
    </span>
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
export function FlagBars({ className, small }: { className?: string; small?: boolean }) {
  const bar = cn("-skew-x-[24deg] rounded-[1px]", small ? "h-[3px] w-3" : "h-1 w-6");
  return (
    <span className={cn("inline-flex shrink-0 items-center", small ? "gap-[3px]" : "gap-1", className)} aria-hidden>
      <span className={cn(bar, "bg-ember")} />
      <span className={cn(bar, "bg-royal")} />
      <span className={cn(bar, "bg-forest")} />
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
