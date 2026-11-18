"use client";

import { FirstAid, MapTrifold } from "@phosphor-icons/react";
import { RUN, TIMELINE, TIMELINE_NOTE } from "@/lib/data";
import { Reveal, RiseLines } from "@/components/ui/motion";
import { cn } from "@/lib/cn";

/* The stadium on a drawn Bakau coast. NRIF will announce the route; until then only the start and finish show. */
function CourseMap() {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-line bg-[#f3efe4]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/80 bg-white/60 px-5 py-4 backdrop-blur">
        <div>
          <p className="text-[0.9375rem] font-bold text-navy">Course map</p>
          <p className="text-xs text-muted">Route will be announced soon</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-sand px-3 py-1.5 text-[0.8125rem] font-semibold text-navy">
          <MapTrifold weight="duotone" className="size-4" /> Coming soon
        </span>
      </div>
      <svg viewBox="0 0 520 360" className="block w-full" role="img" aria-label="Independence Stadium in Bakau, the start and finish. The route will be announced soon.">
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
      </svg>
      <div className="flex items-center gap-2 border-t border-line/80 bg-white/60 px-5 py-3 text-[0.8125rem] font-semibold text-navy">
        <span className="grid size-5 place-items-center rounded-full bg-navy text-[0.5rem] font-extrabold text-white">S/F</span>
        Start and finish at {RUN.venue}, {RUN.venueArea}
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
              <RiseLines lines={["Gates open", <span key="t" className="text-ember">{RUN.gatesOpen}</span>]} />
            </h2>
            <ol className="relative mt-10">
              <span className="absolute bottom-3 left-[4.35rem] top-3 w-px bg-line" aria-hidden />
              {TIMELINE.map((t, i) => (
                <Reveal as="li" key={t.time} delay={i * 0.06} className="relative flex items-start gap-6 py-3">
                  <span className="w-14 shrink-0 pt-0.5 text-right font-mono text-[0.9375rem] font-semibold text-navy tabular">{t.time}</span>
                  <span className={cn("relative z-10 mt-1.5 size-3 shrink-0 rounded-full ring-4 ring-paper", i === 1 ? "bg-ember" : "bg-navy")} />
                  <span>
                    <span className="block text-[1.0625rem] font-bold text-navy">{t.label}</span>
                    <span className="block text-sm text-muted">{t.note}</span>
                  </span>
                </Reveal>
              ))}
              <Reveal as="li" delay={TIMELINE.length * 0.06} className="relative flex items-start gap-6 py-3">
                <span className="w-14 shrink-0" />
                <span className="relative z-10 mt-1.5 size-3 shrink-0 rounded-full border-2 border-line-strong bg-paper ring-4 ring-paper" />
                <span className="block max-w-sm text-sm text-muted">{TIMELINE_NOTE}</span>
              </Reveal>
            </ol>
          </div>
          <div className="space-y-4">
            <Reveal>
              <CourseMap />
            </Reveal>
            <Reveal delay={0.05} className="flex items-center gap-4 rounded-[1.25rem] border border-line bg-white p-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-forest-50 text-forest">
                <FirstAid weight="duotone" className="size-6" />
              </span>
              <span>
                <span className="block font-semibold text-navy">Medics on the course</span>
                <span className="block text-sm text-muted">We ask everyone for an emergency contact</span>
              </span>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
