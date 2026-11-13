import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** A plain phone frame for previews of texts and screens. */
export function Phone({ children, className, dark }: { children: ReactNode; className?: string; dark?: boolean }) {
  return (
    <div className={cn("relative mx-auto w-full max-w-[22rem] rounded-[3rem] bg-[#11151c] p-2.5 shadow-pop ring-1 ring-black/40", className)}>
      <div className={cn("relative overflow-hidden rounded-[2.4rem]", dark ? "bg-navy" : "bg-white")}>
        <div className="absolute left-1/2 top-2.5 z-20 h-6 w-24 -translate-x-1/2 rounded-full bg-[#11151c]" />
        <div className="flex h-11 items-end justify-between px-7 pb-1 text-[0.75rem] font-semibold text-navy">
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <span className="flex items-end gap-[2px]">
              {[4, 6, 8, 10].map((h) => (
                <span key={h} className="w-[3px] rounded-sm bg-navy" style={{ height: h }} />
              ))}
            </span>
            <span className="ml-1 h-2.5 w-5 rounded-[3px] border border-navy/70 p-[1px]">
              <span className="block h-full w-3/4 rounded-[1px] bg-navy" />
            </span>
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
