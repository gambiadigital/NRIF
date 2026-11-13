"use client";

import Image from "next/image";
import Link from "next/link";
import { Accordion } from "radix-ui";
import { motion } from "motion/react";
import { Footprints, Plus, Student, Buildings, Trophy, WhatsappLogo, EnvelopeSimple, Phone, ArrowUpRight, TShirt, Medal, LockSimple } from "@phosphor-icons/react";
import { FAQS, RUN, TEAMS } from "@/lib/data";
import { Reveal, RiseLines, Marquee, Tilt } from "@/components/ui/motion";
import { ButtonLink } from "@/components/ui/button";
import { Countdown } from "@/components/Countdown";
import { Bib } from "@/components/Bib";

export function Challenge() {
  const teams = Object.entries(TEAMS).sort((a, b) => b[1].members - a[1].members);
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto grid max-w-[88rem] gap-4 px-4 sm:px-6 lg:grid-cols-2 lg:px-10">
        <Reveal className="relative flex flex-col overflow-hidden rounded-[2rem] bg-sun p-7 text-navy sm:p-10">
          <div className="relative z-10 max-w-md">
            <p className="font-label">The steps challenge</p>
            <h3 className="mt-4 font-race text-[clamp(2.6rem,5vw,4.4rem)]">Turn steps into research</h3>
            <p className="mt-4 text-[1.0625rem] leading-relaxed text-navy/75">
              Tick one box when you sign up and you get a code like <b className="font-mono">SC-1047</b>. Friends and family give to it, wherever they are. Every
              step you log grows the Endowment Fund.
            </p>
            <ButtonLink href="/steps/SC-1047" variant="ink" size="lg" arrow className="mt-7">
              See Fatou&apos;s page
            </ButtonLink>
          </div>
          <div className="relative z-10 mt-10 w-full max-w-[19rem] self-end sm:mt-auto sm:pt-10">
            <motion.div initial={{ rotate: 8, y: 40, opacity: 0 }} whileInView={{ rotate: -3, y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }} className="rounded-[2rem] bg-white p-5 shadow-pop">
              <div className="flex items-center gap-3">
                <span className="relative size-11 overflow-hidden rounded-full bg-forest-50">
                  <Image src="/media/runner-woman.webp" alt="" fill sizes="44px" className="object-cover object-top" />
                </span>
                <div>
                  <p className="font-semibold">Fatou Jallow</p>
                  <p className="text-xs text-muted">10K · SC-1047</p>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-5">
                <svg viewBox="0 0 80 80" className="size-24 -rotate-90">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#eeeae1" strokeWidth="9" />
                  <motion.circle cx="40" cy="40" r="32" fill="none" stroke="#135f40" strokeWidth="9" strokeLinecap="round" initial={{ pathLength: 0 }} whileInView={{ pathLength: 0.68 }} viewport={{ once: true }} transition={{ duration: 1.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }} />
                </svg>
                <div>
                  <p className="font-bib text-[2.2rem] leading-none">146,880</p>
                  <p className="text-xs text-muted">steps logged</p>
                  <p className="mt-2 text-sm font-bold text-forest">GMD 6,850 raised</p>
                </div>
              </div>
            </motion.div>
          </div>
          <Footprints weight="fill" className="absolute -left-6 -top-6 size-40 rotate-12 text-white/20" />
        </Reveal>

        <Reveal delay={0.08} className="relative overflow-hidden rounded-[2rem] bg-forest p-7 text-white sm:p-10">
          <p className="font-label text-white/70">Teams</p>
          <h3 className="mt-4 font-race text-[clamp(2.6rem,5vw,4.4rem)]">Run as a school or company</h3>
          <p className="mt-4 max-w-md text-[1.0625rem] leading-relaxed text-white/75">
            Your organiser shares a team code. Everyone who enters it is grouped together, and the biggest teams get a place on the stage at 10:00.
          </p>
          <ol className="mt-8 space-y-2">
            {teams.map(([code, t], i) => (
              <li key={code} className="flex items-center gap-4 rounded-2xl bg-white/[0.08] p-3 pr-4 ring-1 ring-white/10">
                <span className="grid size-10 place-items-center rounded-xl bg-white/10 font-bib text-xl">{i + 1}</span>
                <span className="grid size-9 place-items-center rounded-xl bg-white text-forest">
                  {t.kind === "school" ? <Student weight="fill" className="size-5" /> : t.kind === "club" ? <Trophy weight="fill" className="size-5" /> : <Buildings weight="fill" className="size-5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{t.name}</span>
                  <span className="block font-mono text-xs text-white/55">{code}</span>
                </span>
                <span className="text-right">
                  <span className="block font-bib text-2xl leading-none">{t.members}</span>
                  <span className="text-[0.6875rem] text-white/55">runners</span>
                </span>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}

export function Kit() {
  return (
    <section className="relative overflow-hidden bg-sand py-24 sm:py-32">
      <div className="mx-auto grid max-w-[88rem] items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-10">
        <div>
          <Reveal>
            <p className="font-label text-forest">Race kit</p>
          </Reveal>
          <h2 className="mt-5 font-race text-[clamp(2.8rem,7vw,6.2rem)] text-navy">
            <RiseLines lines={["Your name.", "Your number.", <span key="c" className="text-ember">Your colours.</span>]} />
          </h2>
          <div className="mt-10 space-y-3">
            {[
              { icon: TShirt, t: "A race T-shirt for every entry", d: "In-person runners collect it with their pack. Choose the size when you sign up." },
              { icon: Medal, t: "A medal at the finish", d: "Gold, on a ribbon in the flag's colours. Virtual runners get an e-certificate with their time." },
              { icon: LockSimple, t: `Kit locks on ${RUN.kitLock}`, d: "Change your size or the name on your bib from My entry until then." },
            ].map((x, i) => (
              <Reveal key={x.t} delay={i * 0.06} className="flex items-start gap-4 rounded-[1.25rem] bg-white p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-navy text-sun">
                  <x.icon weight="duotone" className="size-6" />
                </span>
                <span>
                  <span className="block font-semibold text-navy">{x.t}</span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-muted">{x.d}</span>
                </span>
              </Reveal>
            ))}
          </div>
        </div>
        <div className="relative mx-auto aspect-square w-full max-w-[36rem]">
          <div className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle,rgb(242_178_51/0.45),transparent_68%)]" />
          <motion.div initial={{ opacity: 0, y: 40, rotate: -10 }} whileInView={{ opacity: 1, y: 0, rotate: -6 }} viewport={{ once: true }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} className="absolute left-0 top-[6%] w-[64%]">
            <Image src="/media/tee.webp" alt="White race T-shirt with red, blue and green stripes" width={1000} height={1000} className="h-auto w-full drop-shadow-[0_30px_40px_rgb(11_27_58/0.25)]" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1.2, delay: 0.15, ease: [0.16, 1, 0.3, 1] }} className="absolute bottom-[4%] right-0 w-[48%]">
            <motion.div animate={{ rotate: [-3, 3, -3] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} style={{ transformOrigin: "50% 0%" }}>
              <Image src="/media/medal.webp" alt="Gold finisher's medal on a red, blue and green ribbon" width={1000} height={1000} className="h-auto w-full drop-shadow-[0_30px_40px_rgb(11_27_58/0.3)]" />
            </motion.div>
          </motion.div>
          <Tilt className="absolute bottom-[10%] left-[6%] w-[46%]">
            <motion.div initial={{ opacity: 0, rotate: 0 }} whileInView={{ opacity: 1, rotate: 4 }} viewport={{ once: true }} transition={{ duration: 1.1, delay: 0.3 }}>
              <Bib number="1047" eventId="10k" name="FATOU" />
            </motion.div>
          </Tilt>
        </div>
      </div>
    </section>
  );
}

const SHOTS = [
  { src: "/media/start-line.webp", cap: "The start, 06:30" },
  { src: "/media/water-station.webp", cap: "Water every 2.5 km" },
  { src: "/media/family-walk.webp", cap: "The Heritage walk" },
  { src: "/media/finish.webp", cap: "The finish" },
  { src: "/media/team.webp", cap: "Teams" },
  { src: "/media/aerial-coast.webp", cap: "The coast road" },
];

export function Gallery() {
  return (
    <section className="overflow-hidden pb-24 sm:pb-32">
      <Marquee className="py-2">
        {SHOTS.map((s) => (
          <figure key={s.src} className="relative mx-2 h-[15rem] w-[22rem] shrink-0 overflow-hidden rounded-[1.5rem] sm:h-[20rem] sm:w-[30rem]">
            <Image src={s.src} alt={s.cap} fill sizes="480px" className="object-cover" />
            <figcaption className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[0.8125rem] font-semibold text-navy backdrop-blur">{s.cap}</figcaption>
          </figure>
        ))}
      </Marquee>
    </section>
  );
}

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-16 bg-white py-24 sm:py-32">
      <div className="mx-auto grid max-w-[88rem] gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-10">
        <div>
          <Reveal>
            <p className="font-label text-forest">Questions</p>
          </Reveal>
          <h2 className="mt-5 font-race text-[clamp(2.8rem,7vw,5.4rem)] text-navy">
            <RiseLines lines={["Good to", "know"]} />
          </h2>
          <Reveal delay={0.1} className="mt-8 rounded-[1.5rem] bg-paper p-6">
            <p className="font-semibold text-navy">Still not sure?</p>
            <p className="mt-1 text-sm text-muted">The NRIF team answers within a working day.</p>
            <div className="mt-5 grid gap-2">
              {[
                { icon: WhatsappLogo, l: "WhatsApp", v: "+220 87 700 1965", c: "text-[#25D366]" },
                { icon: Phone, l: "Call", v: "+220 4 420 1965", c: "text-navy" },
                { icon: EnvelopeSimple, l: "Email", v: "run@nrif.gm", c: "text-navy" },
              ].map((x) => (
                <a key={x.l} href="#" className="flex items-center gap-3 rounded-2xl bg-white p-3 transition-colors hover:bg-sand">
                  <x.icon weight="fill" className={`size-5 ${x.c}`} />
                  <span className="text-sm text-muted">{x.l}</span>
                  <span className="ml-auto text-sm font-semibold text-navy">{x.v}</span>
                </a>
              ))}
            </div>
          </Reveal>
        </div>
        <Accordion.Root type="single" collapsible defaultValue="0" className="divide-y divide-line border-y border-line">
          {FAQS.slice(0, 7).map((f, i) => (
            <Accordion.Item key={f.q} value={String(i)}>
              <Accordion.Header>
                <Accordion.Trigger className="group flex w-full items-center justify-between gap-6 py-6 text-left">
                  <span className="text-lg font-semibold text-navy sm:text-xl">{f.q}</span>
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-paper text-navy transition-all duration-300 group-hover:bg-sand group-data-[state=open]:rotate-45 group-data-[state=open]:bg-navy group-data-[state=open]:text-white">
                    <Plus weight="bold" className="size-4" />
                  </span>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="overflow-hidden data-[state=closed]:animate-[collapse_.3s_ease-out] data-[state=open]:animate-[expand_.35s_cubic-bezier(.16,1,.3,1)]">
                <p className="max-w-2xl pb-6 text-[1.0625rem] leading-relaxed text-muted">{f.a}</p>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>
      <div className="mx-auto mt-10 max-w-[88rem] px-4 text-right sm:px-6 lg:px-10">
        <Link href="/help" className="inline-flex items-center gap-1.5 font-semibold text-forest hover:underline">
          All questions, the waiver and our policies <ArrowUpRight weight="bold" className="size-4" />
        </Link>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="relative isolate overflow-hidden bg-navy py-28 text-white sm:py-40">
      <video src="/media/aerial.mp4" poster="/media/aerial-poster.webp" autoPlay muted loop playsInline preload="none" className="absolute inset-0 -z-10 size-full object-cover" aria-hidden />
      <div className="absolute inset-0 -z-10 bg-navy/65" />
      <div className="mx-auto flex max-w-[88rem] flex-col items-center px-4 text-center sm:px-6 lg:px-10">
        <p className="font-label text-sun">{RUN.dateLong}</p>
        <h2 className="mt-6 font-race text-[clamp(3.2rem,11vw,10rem)]">
          <RiseLines lines={["See you at", "the start line"]} />
        </h2>
        <Countdown className="mt-10" />
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/register" variant="sun" size="xl" arrow>
            Sign up
          </ButtonLink>
          <ButtonLink href="/my-entry" variant="glass" size="xl">
            I have an entry
          </ButtonLink>
        </div>
      </div>
      {/* The three of them, coming in from the edges: every age, walking or running. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-0 hidden items-end justify-between px-[3vw] lg:flex">
        <motion.div initial={{ x: -80, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }} className="relative h-[17rem] w-[7.5rem] xl:h-[20rem] xl:w-[9rem]">
          <Image src="/media/walker-elder.webp" alt="" fill sizes="160px" className="object-contain object-bottom drop-shadow-[0_20px_30px_rgb(0_0_0/0.45)]" />
        </motion.div>
        <div className="flex items-end gap-2">
          <motion.div initial={{ x: 80, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }} className="relative h-[17rem] w-[10rem] xl:h-[20rem] xl:w-[12rem]">
            <Image src="/media/runner-woman.webp" alt="" fill sizes="200px" className="object-contain object-bottom drop-shadow-[0_20px_30px_rgb(0_0_0/0.45)]" />
          </motion.div>
          <motion.div initial={{ x: 120, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }} className="relative h-[18rem] w-[8rem] xl:h-[21rem] xl:w-[9rem]">
            <Image src="/media/runner-man.webp" alt="" fill sizes="160px" className="object-contain object-bottom drop-shadow-[0_20px_30px_rgb(0_0_0/0.45)]" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
