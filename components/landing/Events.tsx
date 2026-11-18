"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Clock, GlobeHemisphereWest, House, Users } from "@phosphor-icons/react";
import { CURRENCIES, type Currency, type RaceEvent, type Residence } from "@/lib/data";
import { useLiveEvents } from "@/lib/client";
import { money, suggested } from "@/lib/format";
import { useBooking } from "@/lib/store";
import { Segmented, Badge } from "@/components/ui/fields";
import { Reveal, RiseLines } from "@/components/ui/motion";
import { cn } from "@/lib/cn";

const ACCENT: Record<RaceEvent["accent"], string> = {
  ember: "bg-ember",
  royal: "bg-royal",
  forest: "bg-forest",
  navy: "bg-navy",
  cobalt: "bg-cobalt",
};

export function Events() {
  const [res, setRes] = useState<Residence>("gambia");
  const [cur, setCur] = useState<Currency>("GBP");
  const router = useRouter();
  const EVENTS = useLiveEvents().filter((e) => e.open !== false);
  // The virtual run is for people who live abroad; they see it first, then the two events at home.
  const ordered = res === "abroad" ? [...EVENTS].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "virtual" ? -1 : 1)) : EVENTS.filter((e) => e.kind === "in-person");

  function choose(ev: RaceEvent) {
    const s = useBooking.getState();
    s.setResidence(res);
    if (res === "abroad") s.patch({ currency: cur });
    const after = useBooking.getState();
    after.patchParticipant(after.participants[0]!.id, { eventId: ev.id });
    router.push("/register");
  }

  return (
    <section id="events" className="relative scroll-mt-16 bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-[88rem] px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Reveal>
              <p className="font-label text-forest">Three ways to take part</p>
            </Reveal>
            <h2 className="mt-5 font-race text-[clamp(2.8rem,7vw,6.2rem)] text-navy">
              <RiseLines lines={["Pick your", "distance"]} />
            </h2>
            <Reveal delay={0.1}>
              <p className="mt-6 max-w-lg text-lg text-muted">
                At home, the 5 km run and the Heritage Walk. From abroad, the Diaspora Virtual Run for £15, wherever you live.
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.15} className="w-full max-w-md space-y-3">
            <Segmented
              value={res}
              onChange={setRes}
              options={[
                { value: "gambia", label: "I live in The Gambia", icon: <House weight="bold" className="size-4" /> },
                { value: "abroad", label: "I live abroad", icon: <GlobeHemisphereWest weight="bold" className="size-4" /> },
              ]}
            />
            <AnimatePresence initial={false}>
              {res === "abroad" && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-sm text-muted">Show amounts in</span>
                    {CURRENCIES.map((c) => (
                      <button
                        key={c.code}
                        onClick={() => setCur(c.code)}
                        className={cn(
                          "h-8 rounded-full px-3 text-sm font-semibold transition-colors",
                          cur === c.code ? "bg-navy text-white" : "bg-sand text-navy hover:bg-line",
                        )}
                      >
                        {c.code}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Reveal>
        </div>

        <motion.div layout className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {ordered.map((ev, i) => {
              const price = res === "gambia" ? money(ev.feeGMD) : money(suggested(ev.suggestedGBP, cur), cur);
              return (
                <motion.button
                  layout
                  key={ev.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: (i % 3) * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => choose(ev)}
                  className="group relative flex flex-col overflow-hidden rounded-[1.75rem] border border-line bg-paper text-left transition-[box-shadow,transform] duration-500 hover:-translate-y-1 hover:shadow-lift"
                >
                  <div className="relative aspect-[16/11] overflow-hidden">
                    <Image src={ev.image} alt="" fill sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.07]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/10 to-transparent" />
                    <div className="absolute left-4 top-4 flex gap-2">
                      <Badge tone={ev.minAge >= 18 ? "ember" : "white"} className={ev.minAge >= 18 ? "" : "backdrop-blur-md"}>
                        {ev.ageLabel}
                      </Badge>
                      {ev.kind === "virtual" && (
                        <Badge tone="cobalt" className="bg-white text-cobalt">
                          Virtual
                        </Badge>
                      )}
                    </div>
                    <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
                      <span className="font-race text-[4.6rem] text-white drop-shadow-[0_4px_24px_rgb(0_0_0/0.35)]">{ev.distance}</span>
                      <span className={cn("mb-3 h-1.5 w-12 -skew-x-[24deg] rounded-sm", ACCENT[ev.accent])} />
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-5 pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-bold text-navy">{ev.name}</p>
                        <p className="text-sm text-muted">{ev.blurb}</p>
                      </div>
                      <div className="text-right">
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.p
                            key={price}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25 }}
                            className="whitespace-nowrap text-lg font-bold text-navy tabular"
                          >
                            {price}
                          </motion.p>
                        </AnimatePresence>
                        <p className="text-xs text-faint">{res === "gambia" || cur === "GBP" ? "entry fee" : `about £${ev.suggestedGBP}`}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted">{ev.detail}</p>
                    <div className="mt-auto flex items-center justify-between pt-5">
                      <span className="flex items-center gap-3 text-[0.8125rem] font-medium text-navy/70">
                        <span className="flex items-center gap-1.5">
                          <Clock weight="bold" className="size-4" />
                          {ev.start}
                        </span>
                        {ev.id === "heritage" && (
                          <span className="flex items-center gap-1.5">
                            <Users weight="bold" className="size-4" />
                            Families
                          </span>
                        )}
                      </span>
                      <span className="grid size-10 place-items-center rounded-full bg-navy text-white transition-all duration-300 group-hover:w-24 group-hover:bg-forest">
                        <span className="flex items-center gap-1.5 text-sm font-semibold">
                          <span className="hidden group-hover:inline">Enter</span>
                          <ArrowRight weight="bold" className="size-4" />
                        </span>
                      </span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
            {res === "gambia" && (
              <motion.div
                layout
                key="abroad-note"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex flex-col justify-between gap-6 rounded-[1.75rem] border-2 border-dashed border-line-strong p-7"
              >
                <div>
                  <span className="grid size-12 place-items-center rounded-2xl bg-cobalt text-white">
                    <GlobeHemisphereWest weight="duotone" className="size-6" />
                  </span>
                  <p className="mt-5 text-xl font-bold text-navy">Live abroad?</p>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
                    The Diaspora Virtual Run is for entries from abroad: 5 or 10 km, any day from 23 to 31 January, wherever you are, for £15.
                  </p>
                </div>
                <button onClick={() => setRes("abroad")} className="flex h-11 w-fit items-center gap-2 rounded-full bg-navy px-5 text-sm font-semibold text-white hover:bg-navy-800">
                  I live abroad <ArrowRight weight="bold" className="size-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        
      </div>
    </section>
  );
}
