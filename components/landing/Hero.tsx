"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import { CalendarBlank, MapPin, PersonSimpleRun, X, ArrowDown } from "@phosphor-icons/react";
import { RUN } from "@/lib/data";
import { api, useStats } from "@/lib/client";
import { useBooking } from "@/lib/store";
import { compactGMD } from "@/lib/format";
import { ButtonLink } from "@/components/ui/button";
import { Countdown } from "@/components/Countdown";
import { CountUp } from "@/components/ui/motion";
import { FlagBars } from "@/components/brand";

const EASE = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const videoY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const fade = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const [src, setSrc] = useState<string | null>(null);
  const [referrer, setReferrer] = useState<{ bib: string; first: string; event: string } | null>(null);
  const stats = useStats().data;
  const raised = stats?.raised ?? 0;
  const goal = stats?.goal ?? RUN.goal;

  useEffect(() => {
    // Where this visitor came from travels with their booking: ?src= for the channel, ?ref= for a runner's share link.
    const sp = new URLSearchParams(window.location.search);
    const src = sp.get("src")?.replace(/[^a-z0-9_-]/gi, "").slice(0, 40);
    const r = sp.get("ref")?.replace(/[^A-Z0-9]/gi, "").slice(0, 8);
    if (src || r) useBooking.getState().patch({ ...(src ? { source: src } : {}), ...(r ? { referral: r, source: src || "referral" } : {}) });
    if (r)
      api<{ first: string | null; event?: string }>(`/api/referral/${encodeURIComponent(r)}`)
        .then((x) => x.first && setReferrer({ bib: r, first: x.first, event: x.event ?? "" }))
        .catch(() => {});
    // Light on data: phones get the vertical cut, data-saver gets the still only.
    // Read after the first paint: the poster shows at once, the clip follows.
    const id = requestAnimationFrame(() => {
      const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
      if (conn?.saveData) return;
      setSrc(window.matchMedia("(max-width: 767px)").matches ? "/media/hero-tall.mp4" : "/media/hero-wide.mp4");
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <section ref={ref} className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-navy text-white">
      <motion.div style={{ y: videoY }} className="absolute inset-0 -z-10">
        <motion.div initial={{ scale: 1.12 }} animate={{ scale: 1 }} transition={{ duration: 2.4, ease: EASE }} className="absolute inset-0">
          <Image src="/media/hero-wide-poster.webp" alt="" fill priority sizes="100vw" className="hidden object-cover md:block" />
          <Image src="/media/hero-tall-poster.webp" alt="" fill priority sizes="100vw" className="object-cover md:hidden" />
          {src && (
            <video
              key={src}
              src={src}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              className="absolute inset-0 size-full object-cover"
              aria-hidden
            />
          )}
        </motion.div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(11_27_58/0.55)_0%,rgb(11_27_58/0.05)_28%,rgb(11_27_58/0.15)_55%,rgb(11_27_58/0.94)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(11_27_58/0.6)_0%,transparent_60%)]" />
        <div className="grain absolute inset-0" />
      </motion.div>

      <AnimatePresence>
        {referrer && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ delay: 1, duration: 0.6, ease: EASE }}
            className="absolute inset-x-0 top-[calc(var(--header-h)+0.75rem)] z-20 flex justify-center px-4"
          >
            <div className="flex items-center gap-3 rounded-full bg-white/95 py-1.5 pl-1.5 pr-2 text-navy shadow-pop backdrop-blur">
              <span className="grid size-9 place-items-center rounded-full bg-ember font-bold text-white">{referrer.first[0]}</span>
              <span className="text-[0.875rem] leading-tight">
                <b>
                  {referrer.first} is running the {referrer.event}.
                </b>{" "}
                <span className="text-muted">Bib {referrer.bib}. Join them.</span>
              </span>
              <button onClick={() => setReferrer(null)} aria-label="Dismiss" className="grid size-8 place-items-center rounded-full hover:bg-sand">
                <X weight="bold" className="size-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div style={{ opacity: fade }} className="relative mx-auto flex w-full max-w-[88rem] flex-1 flex-col justify-end px-4 pb-10 pt-32 sm:px-6 sm:pb-14 lg:px-10">
        <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8, ease: EASE }}
              className="mb-5 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 py-1.5 pl-3 pr-4 backdrop-blur-md"
            >
              <FlagBars />
              <span className="font-label text-white/90">NRIF Endowment Fund Run · {RUN.edition}</span>
            </motion.div>
            <h1 className="font-race text-[min(14.4vw,3.6rem)] text-white sm:text-[clamp(3.5rem,11.4vw,11rem)]">
              {["Run for", "Independence"].map((l, i) => (
                <span key={l} className="block overflow-hidden pb-[0.04em] pr-[0.1em]">
                  <motion.span className="block" initial={{ y: "108%" }} animate={{ y: "0%" }} transition={{ duration: 1.1, delay: 0.35 + i * 0.1, ease: EASE }}>
                    {l}
                  </motion.span>
                </span>
              ))}
              {/* The logo's underline: red, blue and green with white gaps, drawn in after the words land. */}
              <motion.span
                aria-hidden
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, delay: 0.9, ease: EASE }}
                className="mt-[0.05em] block h-[0.07em] w-full max-w-[6.2em] origin-left -skew-x-[24deg] flag-rule"
              />
            </h1>
        </div>
        <div className="mt-6 grid grid-cols-1 items-end gap-8 lg:grid-cols-[1fr_auto] lg:gap-12">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75, duration: 0.9, ease: EASE }}
              className="max-w-xl text-[1.0625rem] leading-relaxed text-white/80 sm:text-lg"
            >
              <span className="font-semibold text-white">{RUN.tagline}.</span> Run, walk or join from anywhere in the world. Every entry grows the fund that backs
              Gambian research and innovation.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85, duration: 0.9, ease: EASE }}
              className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[0.9375rem] text-white/85"
            >
              {[
                { icon: CalendarBlank, bg: "bg-ember", t: RUN.dateShort },
                { icon: MapPin, bg: "bg-royal", t: `${RUN.venue}, ${RUN.venueArea}` },
                { icon: PersonSimpleRun, bg: "bg-forest", t: "5 km run, 1.965 km walk, virtual from abroad" },
              ].map((x) => (
                <span key={x.t} className="flex items-center gap-2">
                  <span className={`grid size-6 shrink-0 place-items-center rounded-full ${x.bg} ring-1 ring-white/25`}>
                    <x.icon weight="bold" className="size-3.5 text-white" />
                  </span>
                  {x.t}
                </span>
              ))}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.95, duration: 0.9, ease: EASE }}
              className="mt-7 flex flex-wrap gap-3"
            >
              <ButtonLink href="/register" variant="flag" size="xl" arrow className="animate-pulse-ring">
                Sign up
              </ButtonLink>
              <ButtonLink href="/#events" variant="glass" size="xl">
                See the events
              </ButtonLink>
            </motion.div>
          </div>

          <motion.aside
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.05, duration: 1, ease: EASE }}
            className="w-full rounded-[1.75rem] border border-white/15 bg-navy/45 p-5 shadow-pop backdrop-blur-xl sm:p-6 lg:w-[23rem]"
          >
            <p className="font-label text-white/60">The run starts in</p>
            <Countdown className="mt-3" />
            <div className="my-5 h-px bg-white/10" />
            {stats && stats.entries === 0 && raised === 0 ? (
              <div>
                <p className="font-label text-white/60">Registration is open</p>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-white/80">Be one of the first of {RUN.participantGoal.toLocaleString("en-GB")} on the start list. Every entry grows the fund for Gambian research.</p>
              </div>
            ) : (
              <>
            <div className="flex items-end justify-between">
              <div>
                <p className="font-label text-white/60">Raised for the fund</p>
                <p className="mt-1.5 font-bib text-[2.4rem] text-white">
                  <CountUp key={raised} to={raised} format={(n) => `GMD ${Math.round(n).toLocaleString("en-GB")}`} />
                </p>
              </div>
              <span className="mb-1.5 text-sm text-white/55">of {compactGMD(goal)}</span>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(1.5, Math.min(100, (raised / goal) * 100))}%` }}
                transition={{ delay: 1.4, duration: 1.6, ease: EASE }}
                className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-forest),var(--color-forest-400))]"
              />
            </div>
            <div className="mt-4 flex gap-4 text-[0.8125rem] text-white/70">
              <span>
                <b className="text-white">{(stats?.entries ?? 0).toLocaleString("en-GB")}</b> of {RUN.participantGoal.toLocaleString("en-GB")} entries
              </span>
              <span>
                <b className="text-white">
                  {stats?.cities.length ?? 0} of {RUN.citiesGoal}
                </b>{" "}
                cities abroad
              </span>
            </div>
              </>
            )}
          </motion.aside>
        </div>
      </motion.div>

      <motion.a
        href="#why"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-white/60 xl:flex"
        aria-label="Scroll to the story"
      >
        <span className="font-label">Scroll</span>
        <motion.span animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.8 }}>
          <ArrowDown className="size-4" />
        </motion.span>
      </motion.a>
    </section>
  );
}
