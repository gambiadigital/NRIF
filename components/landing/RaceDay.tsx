"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { Drop, FirstAid, Package, Backpack, MapPin } from "@phosphor-icons/react";
import { RUN, TIMELINE } from "@/lib/data";
import { Reveal, RiseLines } from "@/components/ui/motion";
import { cn } from "@/lib/cn";

/* Illustrative routes over a drawn Bakau coast. Marked as a draft until NRIF confirms the course. */
const ROUTES = {
  "21k": {
    label: "21K",
    color: "#D7141A",
    d: "M372 306 C372 270 380 240 392 214 C404 186 404 168 388 156 C356 142 300 150 252 148 C196 146 150 156 104 160 C70 163 46 166 30 176 C18 186 30 200 52 200 C96 200 142 196 188 192 C230 188 262 196 284 214 C306 232 318 262 336 286 C346 300 358 308 372 306",
    km: "21.1 km",
  },
  "10k": {
    label: "10K",
    color: "#1F3C99",
    d: "M372 306 C372 270 380 240 392 214 C404 186 404 168 388 156 C356 142 300 150 252 150 C220 150 196 156 186 168 C178 182 196 192 222 192 C252 192 276 204 296 228 C314 252 328 282 346 298 C354 305 364 308 372 306",
    km: "10 km",
  },
  "5k": {
    label: "5K",
    color: "#135F40",
    d: "M372 306 C372 276 378 252 392 230 C402 212 420 204 446 210 C474 218 486 244 476 270 C466 296 440 312 410 316 C394 318 380 314 372 306",
    km: "5 km",
  },
  heritage: {
    label: "Walk",
    color: "#0b1b3a",
    d: "M372 306 C366 290 372 276 388 272 C406 268 420 282 418 298 C416 314 398 322 384 318 C376 316 372 312 372 306",
    km: "1.965 km",
  },
} as const;
type RouteKey = keyof typeof ROUTES;

function CourseMap() {
  const [route, setRoute] = useState<RouteKey>("10k");
  const r = ROUTES[route];
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-line bg-[#f3efe4]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/80 bg-white/60 px-5 py-4 backdrop-blur">
        <div>
          <p className="text-[0.9375rem] font-bold text-navy">Course map</p>
          <p className="text-xs text-muted">Draft route, confirmed in December</p>
        </div>
        <div className="flex gap-1 rounded-full bg-sand p-1">
          {(Object.keys(ROUTES) as RouteKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setRoute(k)}
              className={cn("relative h-8 rounded-full px-3 text-[0.8125rem] font-bold transition-colors", route === k ? "text-white" : "text-muted hover:text-navy")}
            >
              {route === k && <motion.span layoutId="route-pill" className="absolute inset-0 rounded-full" style={{ background: ROUTES[k].color }} transition={{ type: "spring", stiffness: 500, damping: 36 }} />}
              <span className="relative">{ROUTES[k].label}</span>
            </button>
          ))}
        </div>
      </div>
      <svg viewBox="0 0 520 360" className="block w-full" role="img" aria-label={`Draft ${r.label} route from Independence Stadium along the Bakau coast`}>
        <defs>
          <pattern id="waves" width="22" height="10" patternUnits="userSpaceOnUse">
            <path d="M0 6 Q5.5 2 11 6 T22 6" fill="none" stroke="#9fc1d8" strokeWidth="1" opacity=".55" />
          </pattern>
          <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#bfd9ea" />
            <stop offset="1" stopColor="#d6e8f2" />
          </linearGradient>
        </defs>
        {/* Atlantic */}
        <path d="M0 0H520V96C470 112 430 128 396 128C352 128 320 118 270 120C214 122 168 136 120 140C76 144 36 140 0 150Z" fill="url(#sea)" />
        <path d="M0 0H520V96C470 112 430 128 396 128C352 128 320 118 270 120C214 122 168 136 120 140C76 144 36 140 0 150Z" fill="url(#waves)" />
        <path d="M0 150C36 140 76 144 120 140C168 136 214 122 270 120C320 118 352 128 396 128C430 128 470 112 520 96" fill="none" stroke="#e7d6a8" strokeWidth="9" opacity=".8" />
        {/* streets */}
        <g stroke="#ffffff" strokeWidth="5" strokeLinecap="round" opacity=".9" fill="none">
          <path d="M0 168C120 158 260 146 520 140" />
          <path d="M392 150V360" />
          <path d="M250 150C262 220 300 280 330 360" />
          <path d="M120 160C140 230 150 300 150 360" />
          <path d="M392 230H520" />
          <path d="M200 250C260 246 330 250 392 260" />
        </g>
        {/* green spaces */}
        <ellipse cx="460" cy="300" rx="44" ry="26" fill="#cfe3c8" />
        <ellipse cx="70" cy="260" rx="38" ry="22" fill="#cfe3c8" />
        {/* stadium */}
        <g transform="translate(372 306)">
          <ellipse rx="34" ry="22" fill="#fff" stroke="#cfc8b9" />
          <ellipse rx="22" ry="12" fill="#cfe3c8" stroke="#d34e3f" strokeWidth="2.5" />
        </g>
        <AnimatePresence mode="wait">
          <motion.g key={route}>
            <motion.path d={r.d} fill="none" stroke="white" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.6, ease: [0.65, 0, 0.35, 1] }} />
            <motion.path d={r.d} fill="none" stroke={r.color} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.6, ease: [0.65, 0, 0.35, 1] }} />
          </motion.g>
        </AnimatePresence>
        {/* labels */}
        <g fontFamily="var(--font-flex)" fontSize="11" fontWeight="700" fill="#0b1b3a">
          <text x="372" y="346" opacity=".7" textAnchor="middle">Independence Stadium</text>
          <text x="330" y="112" opacity=".55" fontWeight="600" fontStyle="italic" fill="#3b6b8c">Atlantic Ocean</text>
          <text x="410" y="176" opacity=".6">Bakau</text>
          <text x="196" y="178" opacity=".6">Fajara</text>
          <text x="26" y="224" opacity=".6">Cape Point</text>
        </g>
        <g transform="translate(372 306)">
          <circle r="11" fill="#0b1b3a" />
          <text textAnchor="middle" y="4" fontSize="9" fontWeight="800" fill="#ffffff" fontFamily="var(--font-flex)">
            S/F
          </text>
        </g>
        {route !== "heritage" &&
          [
            [392, 214],
            [252, 149],
          ].map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y})`}>
              <circle r="8" fill="#2a3181" />
              <path d="M0 -4.2C2 -1.6 3 0 3 1.4A3 3 0 0 1 -3 1.4C-3 0 -2 -1.6 0 -4.2Z" fill="white" />
            </g>
          ))}
      </svg>
      <div className="flex items-center justify-between border-t border-line/80 bg-white/60 px-5 py-3 text-[0.8125rem]">
        <span className="flex items-center gap-2 font-semibold text-navy">
          <span className="h-1.5 w-6 rounded-full" style={{ background: r.color }} />
          {r.label} · {r.km}
        </span>
        <span className="flex items-center gap-1.5 text-muted">
          <span className="grid size-4 place-items-center rounded-full bg-cobalt">
            <Drop weight="fill" className="size-2.5 text-white" />
          </span>
          Water
        </span>
      </div>
    </div>
  );
}

export function RaceDay() {
  return (
    <section id="race-day" className="relative scroll-mt-16 overflow-hidden py-24 sm:py-32">
      <div className="mx-auto max-w-[88rem] px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <Reveal>
              <p className="font-label text-forest">Race day · {RUN.dateLong}</p>
            </Reveal>
            <h2 className="mt-5 font-race text-[clamp(2.8rem,7vw,6.2rem)] text-navy">
              <RiseLines lines={["Gates open", <span key="t" className="text-ember">05:30</span>]} />
            </h2>
            <ol className="relative mt-10">
              <span className="absolute bottom-3 left-[4.35rem] top-3 w-px bg-line" aria-hidden />
              {TIMELINE.map((t, i) => (
                <Reveal as="li" key={t.time} delay={i * 0.06} className="relative flex items-start gap-6 py-3">
                  <span className="w-14 shrink-0 pt-0.5 text-right font-mono text-[0.9375rem] font-semibold text-navy tabular">{t.time}</span>
                  <span className={cn("relative z-10 mt-1.5 size-3 shrink-0 rounded-full ring-4 ring-paper", i === 2 ? "bg-ember" : "bg-navy")} />
                  <span>
                    <span className="block text-[1.0625rem] font-bold text-navy">{t.label}</span>
                    <span className="block text-sm text-muted">{t.note}</span>
                  </span>
                </Reveal>
              ))}
            </ol>
          </div>
          <div className="space-y-4">
            <Reveal>
              <CourseMap />
            </Reveal>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Reveal delay={0.05} className="relative overflow-hidden rounded-[1.5rem] bg-navy p-6 text-white">
                <Image src="/media/race-pack.webp" alt="" fill sizes="(min-width: 640px) 25vw, 100vw" className="object-cover opacity-35" />
                <div className="relative">
                  <Package weight="duotone" className="size-8 text-white" />
                  <p className="mt-6 text-lg font-bold">Race-pack collection</p>
                  <p className="mt-1 text-sm text-white/75">{RUN.racePacks} at {RUN.venue}. Show the QR code from your email.</p>
                </div>
              </Reveal>
              <div className="grid gap-4">
                {[
                  { icon: Backpack, t: "Bag drop on the track", d: "Free, from 05:30" },
                  { icon: FirstAid, t: "Medics on the course", d: "We ask everyone for an emergency contact" },
                  { icon: MapPin, t: "Getting there", d: "Shuttles from Serrekunda and Banjul" },
                ].map((x, i) => (
                  <Reveal key={x.t} delay={0.1 + i * 0.05} className="flex items-center gap-4 rounded-[1.25rem] border border-line bg-white p-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-forest-50 text-forest">
                      <x.icon weight="duotone" className="size-6" />
                    </span>
                    <span>
                      <span className="block font-semibold text-navy">{x.t}</span>
                      <span className="block text-sm text-muted">{x.d}</span>
                    </span>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
