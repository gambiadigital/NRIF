"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Flask, Plant, Lightbulb, ArrowUpRight } from "@phosphor-icons/react";
import { RUN } from "@/lib/data";
import { Marquee, Reveal, CountUp, RiseLines } from "@/components/ui/motion";
import { NrifStacked } from "@/components/brand";

export function Ticker() {
  const items = ["21K Half marathon", "10K", "5K", "1.965K Heritage walk", "10K Virtual", "5K Virtual", "62 Cities, One Gambia", "One Day, One Nation"];
  return (
    <div className="relative z-10 -mt-px overflow-hidden bg-navy py-4 text-white">
      <Marquee>
        {items.map((t) => (
          <span key={t} className="flex items-center">
            <span className="px-6 font-race text-[1.6rem] text-white/90 sm:text-[2rem]">{t}</span>
            <span className="flex gap-1" aria-hidden>
              <span className="size-2 -skew-x-[24deg] bg-ember" />
              <span className="size-2 -skew-x-[24deg] bg-royal" />
              <span className="size-2 -skew-x-[24deg] bg-forest" />
            </span>
          </span>
        ))}
      </Marquee>
    </div>
  );
}

const PILLARS = [
  { icon: Flask, title: "Research grants", text: "Seed money for Gambian scientists working on health, food and climate." },
  { icon: Plant, title: "Young innovators", text: "Fellowships and labs for students who want to build here, not leave." },
  { icon: Lightbulb, title: "A fund that lasts", text: "The Endowment invests every dalasi and spends only what it earns." },
];

export function WhyWeRun() {
  const pct = (RUN.raised / RUN.goal) * 100;
  return (
    <section id="why" className="relative scroll-mt-16 overflow-hidden py-24 sm:py-32">
      <div className="mx-auto max-w-[88rem] px-4 sm:px-6 lg:px-10">
        <div className="grid gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-20">
          <div>
            <Reveal>
              <p className="font-label text-forest">Why we run</p>
            </Reveal>
            <h2 className="mt-5 font-race text-[clamp(2.8rem,7vw,6.2rem)] text-navy">
              <RiseLines lines={["Every step", "grows the fund", <span key="x" className="text-forest">for Gambian ideas</span>]} />
            </h2>
            <Reveal delay={0.1}>
              <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted">
                The National Research &amp; Innovation Fund backs Gambian researchers and innovators. Every entry fee and every donation goes into its
                Endowment Fund, so the money keeps working long after the last runner crosses the line.
              </p>
            </Reveal>
            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {PILLARS.map((p, i) => (
                <Reveal key={p.title} delay={0.1 + i * 0.08} className="rounded-[1.25rem] border border-line bg-white p-5">
                  <p.icon weight="duotone" className="size-7 text-forest" />
                  <p className="mt-4 font-semibold text-navy">{p.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.text}</p>
                </Reveal>
              ))}
            </div>
          </div>

          <div className="relative">
            <Reveal className="relative aspect-[4/5] overflow-hidden rounded-[2rem] sm:aspect-[5/5] lg:aspect-[4/5]">
              <motion.div initial={{ scale: 1.15 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }} className="absolute inset-0">
                <Image src="/media/research-lab.webp" alt="Two Gambian researchers studying a seedling in a laboratory" fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
              </motion.div>
              <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-transparent to-transparent" />
              <div className="absolute left-5 top-5 rounded-2xl bg-white/90 p-3 backdrop-blur">
                <NrifStacked className="w-24" />
              </div>
            </Reveal>
            <Reveal delay={0.2} className="relative -mt-28 ml-auto mr-4 w-[min(24rem,92%)] rounded-[1.5rem] bg-white p-6 shadow-pop sm:mr-[-1.5rem]">
              <div className="flex items-baseline justify-between">
                <p className="font-label text-muted">Run goal</p>
                <p className="text-sm font-semibold text-navy">GMD {RUN.goal.toLocaleString("en-GB")}</p>
              </div>
              <p className="mt-3 font-bib text-[3.2rem] text-forest">
                <CountUp to={RUN.raised} format={(n) => `GMD ${Math.round(n).toLocaleString("en-GB")}`} />
              </p>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-sand">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${pct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
                  className="relative h-full overflow-hidden rounded-full bg-forest"
                >
                  <span className="absolute inset-y-0 w-1/3 animate-shine bg-white/30" />
                </motion.div>
              </div>
              <p className="mt-3 flex items-center justify-between text-[0.8125rem] text-muted">
                <span>Live total, updated as entries come in</span>
                <span className="font-semibold text-navy">{pct.toFixed(0)}%</span>
              </p>
            </Reveal>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-2 gap-px overflow-hidden rounded-[1.75rem] border border-line bg-line lg:grid-cols-4">
          {[
            { v: RUN.entries, l: "Runners and walkers so far", f: (n: number) => Math.round(n).toLocaleString("en-GB") },
            { v: 6, l: "Ways to take part", f: (n: number) => String(Math.round(n)) },
            { v: RUN.citiesCounted, l: `Cities abroad, of ${RUN.citiesGoal}`, f: (n: number) => String(Math.round(n)) },
            { v: 1965, l: "Metres in the Heritage walk", f: (n: number) => Math.round(n).toLocaleString("en-GB") },
          ].map((s) => (
            <div key={s.l} className="bg-white p-6 sm:p-8">
              <p className="font-bib text-[clamp(2.8rem,6vw,4.6rem)] text-navy">
                <CountUp to={s.v} format={s.f} />
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
                {s.l}
                <ArrowUpRight className="size-3.5 text-faint" />
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
