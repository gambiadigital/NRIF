"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { RUN } from "@/lib/data";
import { cn } from "@/lib/cn";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), mins: Math.floor((s % 3600) / 60), secs: s % 60 };
}

/** Time to the 10K gun. Rendered after mount so server and client never disagree about "now". */
export function Countdown({ tone = "dark", className, compact }: { tone?: "dark" | "light"; className?: string; compact?: boolean }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const t = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, []);
  const p = parts(now === null ? 0 : new Date(RUN.dateISO).getTime() - now);
  const cells = [
    { k: "days", v: p.days, l: "Days" },
    { k: "hours", v: p.hours, l: "Hours" },
    { k: "mins", v: p.mins, l: "Mins" },
    ...(compact ? [] : [{ k: "secs", v: p.secs, l: "Secs" }]),
  ];
  return (
    <div className={cn("flex items-start", compact ? "gap-3" : "gap-4 sm:gap-6", className)}>
      {cells.map((c, i) => (
        <div key={c.k} className="flex items-start">
          <div className="flex flex-col items-start">
            <span className={cn("relative block overflow-hidden font-bib tabular", compact ? "text-[2.1rem]" : "text-[2.6rem] sm:text-[3.4rem]", tone === "dark" ? "text-white" : "text-navy")}>
              <span className="invisible">{String(c.v).padStart(2, "0")}</span>
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                  key={now === null ? "x" : c.v}
                  initial={{ y: "-70%", opacity: 0 }}
                  animate={{ y: "0%", opacity: 1 }}
                  exit={{ y: "70%", opacity: 0 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0"
                >
                  {now === null ? "––" : String(c.v).padStart(2, "0")}
                </motion.span>
              </AnimatePresence>
            </span>
            <span className={cn("font-label mt-1", tone === "dark" ? "text-white/55" : "text-muted")}>{c.l}</span>
          </div>
          {i < cells.length - 1 && <span className={cn("ml-3 font-bib text-2xl sm:ml-5 sm:text-3xl", tone === "dark" ? "text-white/25" : "text-line-strong", compact && "ml-2.5 text-xl")}>:</span>}
        </div>
      ))}
    </div>
  );
}
