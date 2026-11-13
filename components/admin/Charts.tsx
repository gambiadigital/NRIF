"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";

/** Daily entries as a soft area with a hover read-out. */
export function AreaChart({ data, labels, className }: { data: number[]; labels: string[]; className?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640;
  const H = 200;
  const max = Math.max(...data) * 1.15;
  const x = (i: number) => (i / (data.length - 1)) * W;
  const y = (v: number) => H - (v / max) * H;
  const line = data.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join("");
  const area = `${line}L${W} ${H}L0 ${H}Z`;
  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox={`0 0 ${W} ${H + 24}`}
        className="block w-full overflow-visible"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setHover(Math.round(((e.clientX - r.left) / r.width) * (data.length - 1)));
        }}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#135f40" stopOpacity=".28" />
            <stop offset="1" stopColor="#135f40" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <line key={g} x1="0" x2={W} y1={H * g} y2={H * g} stroke="#e2ddd2" strokeDasharray="3 5" />
        ))}
        <motion.path d={area} fill="url(#area-fill)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.8 }} />
        <motion.path d={line} fill="none" stroke="#135f40" strokeWidth="2.5" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, ease: [0.65, 0, 0.35, 1] }} />
        {labels.map((l, i) =>
          i % 5 === 0 || i === labels.length - 1 ? (
            <text key={i} x={x(i)} y={H + 18} fontSize="11" fill="#8b91a0" textAnchor={i === 0 ? "start" : i === labels.length - 1 ? "end" : "middle"} fontFamily="var(--font-flex)">
              {l}
            </text>
          ) : null,
        )}
        {hover !== null && hover >= 0 && hover < data.length && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1="0" y2={H} stroke="#0b1b3a" strokeOpacity=".15" />
            <circle cx={x(hover)} cy={y(data[hover]!)} r="5" fill="#135f40" stroke="white" strokeWidth="2.5" />
          </g>
        )}
      </svg>
      {hover !== null && hover >= 0 && hover < data.length && (
        <div className="pointer-events-none absolute -top-2 rounded-xl bg-navy px-3 py-2 text-xs text-white shadow-lift" style={{ left: `clamp(0px, calc(${(hover / (data.length - 1)) * 100}% - 3rem), calc(100% - 6rem))` }}>
          <b className="text-sm">{data[hover]}</b> entries
          <span className="block text-white/60">{labels[hover]}</span>
        </div>
      )}
    </div>
  );
}

export function BarList({ rows, format = (n: number) => n.toLocaleString("en-GB") }: { rows: { label: string; value: number; color: string; sub?: string }[]; format?: (n: number) => string }) {
  const max = Math.max(...rows.map((r) => r.value));
  return (
    <ul className="space-y-3">
      {rows.map((r, i) => (
        <li key={r.label}>
          <div className="mb-1.5 flex items-baseline justify-between text-sm">
            <span className="font-medium text-navy">
              {r.label}
              {r.sub && <span className="ml-1.5 font-mono text-xs text-faint">{r.sub}</span>}
            </span>
            <span className="font-semibold text-navy tabular">{format(r.value)}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-sand">
            <motion.div initial={{ width: 0 }} animate={{ width: `${(r.value / max) * 100}%` }} transition={{ delay: 0.1 + i * 0.06, duration: 1, ease: [0.16, 1, 0.3, 1] }} className="h-full rounded-full" style={{ background: r.color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Donut({ parts, size = 150, label, sub }: { parts: { value: number; color: string }[]; size?: number; label: string; sub: string }) {
  const total = parts.reduce((a, p) => a + p.value, 0);
  const r = 15.9155;
  const pcts = parts.map((p) => (p.value / total) * 100);
  const starts = pcts.map((_, i) => pcts.slice(0, i).reduce((a, b) => a + b, 0));
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 42 42" className="size-full -rotate-90">
        <circle cx="21" cy="21" r={r} fill="none" stroke="#eeeae1" strokeWidth="5" />
        {parts.map((p, i) => {
          const pct = pcts[i]!;
          return (
            <motion.circle
              key={i}
              cx="21"
              cy="21"
              r={r}
              fill="none"
              stroke={p.color}
              strokeWidth="5"
              strokeDashoffset={-starts[i]!}
              initial={{ strokeDasharray: `0 100` }}
              animate={{ strokeDasharray: `${pct - 0.8} ${100 - pct + 0.8}` }}
              transition={{ delay: 0.2 + i * 0.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-bib text-[1.8rem] leading-none text-navy">{label}</span>
        <span className="text-[0.6875rem] text-muted">{sub}</span>
      </div>
    </div>
  );
}
