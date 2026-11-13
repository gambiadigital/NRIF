"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowUpRight, Keyboard } from "@phosphor-icons/react";
import { JOURNEYS, ALL_SCREENS, type Screen } from "@/lib/screens";
import { useBooking } from "@/lib/store";
import { R4ILogo, NrifLockup, FlagBars } from "@/components/brand";
import { cn } from "@/lib/cn";

const TONE: Record<string, string> = {
  find: "bg-sun text-navy",
  register: "bg-forest text-white",
  confirm: "bg-forest text-white",
  abroad: "bg-cobalt text-white",
  admin: "bg-navy text-white",
  help: "bg-sand text-navy",
};

/** The storyboard, turned into a map of the prototype: each frame beside the screen that answers it. */
export default function Flow() {
  const router = useRouter();
  const load = useBooking((s) => s.load);
  const persona = useBooking((s) => s.persona);
  function go(s: Screen) {
    if (s.persona && s.persona !== persona) load(s.persona);
    router.push(s.href);
  }
  let n = 0;
  return (
    <main className="min-h-dvh bg-paper pb-32">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-5 sm:px-6">
          <NrifLockup className="h-9" />
          <span className="h-7 w-px bg-line" />
          <R4ILogo className="w-24" />
          <span className="ml-auto flex items-center gap-2 text-sm text-muted">
            <Keyboard weight="bold" className="size-4" /> Press <kbd className="rounded-md border border-line bg-paper px-1.5 font-mono text-xs">[</kbd>
            <kbd className="rounded-md border border-line bg-paper px-1.5 font-mono text-xs">]</kbd> on any screen to step through
          </span>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
        <FlagBars />
        <h1 className="mt-5 font-race text-[clamp(3rem,8vw,6rem)] text-navy">The registration storyboard, built</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          {ALL_SCREENS.length} screens across the participant&apos;s journey and the admin console. Each storyboard frame sits beside the screens that answer it. Names, fees and times are samples.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {[
            { img: "/storyboard/fatou.webp", n: "Fatou, Serrekunda", s: "10K, plus Awa and Musa on the Heritage walk", k: "fatou" as const },
            { img: "/storyboard/lamin.webp", n: "Lamin, London", s: "10K Virtual, paying from abroad", k: "lamin" as const },
          ].map((p) => (
            <button
              key={p.k}
              onClick={() => {
                load(p.k);
                router.push("/register");
              }}
              className="flex items-center gap-3 rounded-full border border-line bg-white py-1.5 pl-1.5 pr-5 text-left transition-shadow hover:shadow-card"
            >
              <Image src={p.img} alt="" width={44} height={44} className="size-11 rounded-full bg-sand object-cover" />
              <span>
                <span className="block text-sm font-bold text-navy">{p.n}</span>
                <span className="block text-xs text-muted">{p.s}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <div className="mx-auto mt-14 max-w-7xl space-y-14 px-4 sm:px-6">
        {JOURNEYS.map((j) => (
          <section key={j.id}>
            <div className="mb-5 flex items-baseline gap-3">
              <h2 className="text-2xl font-bold text-navy">{j.title}</h2>
              <span className="text-sm text-muted">{j.who}</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {j.screens.map((s) => {
                n++;
                return (
                  <motion.button
                    key={s.href + s.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    onClick={() => go(s)}
                    className="group overflow-hidden rounded-[1.5rem] border border-line bg-white text-left transition-shadow hover:shadow-lift"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-sand">
                      {s.frame ? (
                        <Image src={`/storyboard/frame-${s.frame}.webp`} alt={`Storyboard frame ${s.frame}`} fill sizes="(min-width: 1024px) 30vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgb(242_178_51/0.35),transparent_60%)]">
                          <span className="font-race text-[3.4rem] text-navy/15">{s.title.split(" ")[0]}</span>
                        </div>
                      )}
                      <span className={cn("absolute left-3 top-3 rounded-full px-2.5 py-1 font-mono text-[0.6875rem] font-bold", TONE[j.id])}>{s.frame ? `Frame ${s.frame}` : "New screen"}</span>
                      <span className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-white/90 font-mono text-xs font-bold text-navy">{n}</span>
                    </div>
                    <div className="flex items-start gap-3 p-4">
                      <div className="flex-1">
                        <p className="font-bold text-navy">{s.title}</p>
                        <p className="mt-0.5 text-sm text-muted">{s.note}</p>
                      </div>
                      <ArrowUpRight weight="bold" className="size-5 text-faint transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-forest" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
