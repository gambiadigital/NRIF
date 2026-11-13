import { Bank, GlobeHemisphereWest } from "@phosphor-icons/react";
import type { PaymentMethodId } from "@/lib/data";
import { cn } from "@/lib/cn";

/** Monogram tiles for the payment routes. Swap for the providers' approved marks when NRIF has them. */
export function PayMark({ id, className }: { id: PaymentMethodId; className?: string }) {
  const base = cn("grid size-11 shrink-0 place-items-center rounded-2xl text-white", className);
  if (id === "wave") return <span className={cn(base, "bg-[#1dc3f3] font-race text-[1.35rem] not-italic [font-variation-settings:'wdth'_100]")}>W</span>;
  if (id === "yonna") return <span className={cn(base, "bg-[#3b2a7a] font-race text-[1.35rem] not-italic [font-variation-settings:'wdth'_100]")}>Y</span>;
  if (id === "bank")
    return (
      <span className={cn(base, "bg-navy")}>
        <Bank weight="fill" className="size-5" />
      </span>
    );
  return (
    <span className={cn(base, "bg-cobalt")}>
      <GlobeHemisphereWest weight="fill" className="size-5" />
    </span>
  );
}
