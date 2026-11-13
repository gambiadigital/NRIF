"use client";

import { motion } from "motion/react";
import { BANJUL, CITIES } from "@/lib/data";
import { LAND_DOTS, MAP } from "@/lib/worldDots";
import { cn } from "@/lib/cn";

const project = (lat: number, lng: number) => ({
  x: ((lng - MAP.lng0) / (MAP.lng1 - MAP.lng0)) * MAP.w,
  y: ((MAP.lat1 - lat) / (MAP.lat1 - MAP.lat0)) * MAP.h,
});

/** Banjul at the centre, an arc to every diaspora city that has entries. */
export function CitiesMap({ tone = "dark", className, labels = true }: { tone?: "dark" | "light"; className?: string; labels?: boolean }) {
  const home = project(BANJUL.lat, BANJUL.lng);
  const top = [...CITIES].sort((a, b) => b.count - a.count);
  const labelled = new Set(["London", "New York", "Atlanta", "Stockholm", "Dakar", "Barcelona", "Berlin", "Dubai", "Toronto", "Lagos"]);
  return (
    <svg viewBox={`0 0 ${MAP.w} ${MAP.h}`} className={cn("block w-full", className)} role="img" aria-label="Map of cities abroad with Run for Independence entries, linked to Banjul">
      <path d={LAND_DOTS} stroke={tone === "dark" ? "rgb(255 255 255 / 0.16)" : "rgb(11 27 58 / 0.14)"} strokeWidth="3.4" strokeLinecap="round" fill="none" />
      {top.map((c, i) => {
        const p = project(c.lat, c.lng);
        const mx = (home.x + p.x) / 2;
        const dist = Math.hypot(p.x - home.x, p.y - home.y);
        const my = (home.y + p.y) / 2 - dist * 0.32;
        return (
          <motion.path
            key={c.city}
            d={`M${home.x} ${home.y}Q${mx} ${my} ${p.x} ${p.y}`}
            fill="none"
            stroke={i % 3 === 0 ? "#F2B233" : i % 3 === 1 ? (tone === "dark" ? "#8fa2ff" : "#2a3181") : "#34b37a"}
            strokeWidth={1.4}
            strokeLinecap="round"
            opacity={0.85}
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 1.6, delay: 0.2 + i * 0.045, ease: [0.65, 0, 0.35, 1] }}
          />
        );
      })}
      {top.map((c, i) => {
        const p = project(c.lat, c.lng);
        const r = 2.4 + Math.sqrt(c.count) * 0.42;
        return (
          <motion.g key={c.city} initial={{ opacity: 0, scale: 0 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 1.2 + i * 0.045, type: "spring", stiffness: 300, damping: 18 }} style={{ transformOrigin: `${p.x}px ${p.y}px` }}>
            <circle cx={p.x} cy={p.y} r={r + 4} fill={tone === "dark" ? "rgb(255 255 255 / 0.08)" : "rgb(11 27 58 / 0.06)"} />
            <circle cx={p.x} cy={p.y} r={r} fill={tone === "dark" ? "#fff" : "#0b1b3a"} />
            {labels && labelled.has(c.city) && (
              <text x={p.x + r + 6} y={p.y + 4} fontSize="13" fontWeight="600" fill={tone === "dark" ? "rgb(255 255 255 / 0.75)" : "#0b1b3a"} fontFamily="var(--font-flex)">
                {c.city}
              </text>
            )}
          </motion.g>
        );
      })}
      <g>
        <circle cx={home.x} cy={home.y} r="16" fill="#F2B233" opacity=".18">
          <animate attributeName="r" values="10;26;10" dur="2.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values=".35;0;.35" dur="2.6s" repeatCount="indefinite" />
        </circle>
        <circle cx={home.x} cy={home.y} r="7" fill="#F2B233" stroke={tone === "dark" ? "#0b1b3a" : "#fff"} strokeWidth="2.5" />
        {labels && (
          <text x={home.x - 12} y={home.y + 26} fontSize="14" fontWeight="800" fill={tone === "dark" ? "#F2B233" : "#0b1b3a"} fontFamily="var(--font-flex)" textAnchor="end">
            Banjul
          </text>
        )}
      </g>
    </svg>
  );
}
