"use client";

import Image from "next/image";
import Link from "next/link";
import { Accordion } from "radix-ui";
import { motion } from "motion/react";
import { Plus, Student, Buildings, Trophy, ArrowUpRight } from "@phosphor-icons/react";
import { ContactList, useContacts } from "@/components/site/Contact";
import { FAQS, RUN } from "@/lib/data";
import { useStats } from "@/lib/client";
import { Reveal, RiseLines, Marquee } from "@/components/ui/motion";
import { ButtonLink } from "@/components/ui/button";
import { Countdown } from "@/components/Countdown";
import { FlagBars } from "@/components/brand";

export function Challenge() {
  const teams = useStats().data?.teams ?? [];
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-[88rem] px-4 sm:px-6 lg:px-10">
        <Reveal className="relative grid grid-cols-1 gap-8 overflow-hidden rounded-[2rem] bg-forest p-7 text-white sm:p-10 lg:grid-cols-2 lg:gap-14">
          <div>
          <p className="font-label text-white/70">Teams</p>
          <h3 className="mt-4 font-race text-[clamp(2.6rem,5vw,4.4rem)]">Run as a school or company</h3>
          <p className="mt-4 max-w-md text-[1.0625rem] leading-relaxed text-white/75">
            Your organiser shares a team code. Everyone who enters it is grouped together, and the biggest teams are recognised on the day.
          </p>
          </div>
          <ol className="space-y-2 lg:self-center">
            {teams.length === 0 && <li className="rounded-2xl bg-white/[0.08] p-4 text-sm text-white/70 ring-1 ring-white/10">Ask NRIF for a team code for your school, company or club.</li>}
            {teams.map((t, i) => (
              <li key={t.code} className="flex items-center gap-4 rounded-2xl bg-white/[0.08] p-3 pr-4 ring-1 ring-white/10">
                <span className="grid size-10 place-items-center rounded-xl bg-white/10 font-bib text-xl">{i + 1}</span>
                <span className="grid size-9 place-items-center rounded-xl bg-white text-forest">
                  {t.kind === "school" ? <Student weight="fill" className="size-5" /> : t.kind === "club" ? <Trophy weight="fill" className="size-5" /> : <Buildings weight="fill" className="size-5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{t.name}</span>
                  <span className="block font-mono text-xs text-white/55">{t.code}</span>
                </span>
                <span className="text-right">
                  <span className="block font-bib text-2xl leading-none">{t.n}</span>
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

const SHOTS = [
  { src: "/media/start-line.webp", cap: "The start, 07:30" },
  { src: "/media/water-station.webp", cap: "Water on the course" },
  { src: "/media/family-walk.webp", cap: "The Heritage Walk" },
  { src: "/media/finish.webp", cap: "The finish" },
  { src: "/media/team.webp", cap: "Teams" },
  { src: "/media/aerial-coast.webp", cap: "Bakau" },
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
      <div className="mx-auto grid grid-cols-1 max-w-[88rem] gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-10">
        <div>
          <Reveal>
            <p className="font-label text-forest">Questions</p>
          </Reveal>
          <h2 className="mt-5 font-race text-[clamp(2.8rem,7vw,5.4rem)] text-navy">
            <RiseLines lines={["Good to", "know"]} />
          </h2>
          <StillNotSure />
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
        <p className="flex items-center gap-2.5 font-label text-white"><FlagBars small />{RUN.dateLong}<FlagBars small /></p>
        <h2 className="mt-6 font-race text-[clamp(3.2rem,11vw,10rem)]">
          <RiseLines lines={["See you at", "the start line"]} />
        </h2>
        <Countdown className="mt-10" />
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/register" variant="flag" size="xl" arrow>
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

function StillNotSure() {
  const items = useContacts();
  if (!items.length) return null;
  return (
    <Reveal delay={0.1} className="mt-8 rounded-[1.5rem] bg-paper p-6">
      <p className="font-semibold text-navy">Still not sure?</p>
      <p className="mt-1 text-sm text-muted">Ask the NRIF team.</p>
      <ContactList className="mt-5" />
    </Reveal>
  );
}
