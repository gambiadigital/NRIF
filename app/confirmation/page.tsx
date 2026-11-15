"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { toast } from "sonner";
import { ShareNetwork, CalendarPlus, ChatCircleText, Package, Footprints, Copy, CaretRight, UserCircle, CheckCircle } from "@phosphor-icons/react";
import { RUN, eventById } from "@/lib/data";
import { money } from "@/lib/format";
import { useBookingData } from "@/lib/booking-client";
import { EntryGate } from "@/components/EntryGate";
import { Bib } from "@/components/Bib";
import { Button } from "@/components/ui/button";
import { ShareCard, ShareSheet } from "@/components/ShareCard";
import { Tilt } from "@/components/ui/motion";
import { celebrate, downloadIcs } from "@/lib/celebrate";
import { cn } from "@/lib/cn";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <Confirmation />
    </Suspense>
  );
}

/** Frame 10: the bib pops up, the family's bibs fan out beneath it, and sharing is one tap away. */
function Confirmation() {
  const sp = useSearchParams();
  const ref = sp.get("ref");
  const key = sp.get("k");
  const router = useRouter();
  const { data: b, error, loading } = useBookingData(ref, key);
  const [share, setShare] = useState(false);
  const virtualOnly = !!b && b.participants.every((p) => eventById(p.eventId).kind === "virtual");

  useEffect(() => {
    if (!b) return;
    const q = ref && key ? `?ref=${ref}&k=${encodeURIComponent(key)}` : "";
    if (b.status !== "paid") router.replace(`/register/pending${q}`);
    else if (virtualOnly) router.replace(`/confirmation/virtual${q}`);
    else {
      const t = setTimeout(celebrate, 650);
      return () => clearTimeout(t);
    }
  }, [b, ref, key, router, virtualOnly]);

  if (!b || b.status !== "paid" || virtualOnly) return <EntryGate loading={loading} error={error} />;

  const lead = b.participants[0]!;
  const leadBib = lead.bib ?? "";
  const ev = eventById(lead.eventId);
  const others = b.participants.slice(1);
  const code = b.stepsCode;

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[38rem] bg-[radial-gradient(60%_60%_at_50%_0%,rgb(19_95_64/0.14),transparent_70%)]" />
      <div className="relative mx-auto grid grid-cols-1 max-w-6xl gap-10 px-4 pb-32 pt-10 sm:px-6 lg:grid-cols-[1fr_24rem] lg:pt-16">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 380, damping: 16, delay: 0.1 }} className="grid size-16 place-items-center rounded-full bg-forest text-white shadow-[0_12px_30px_-10px_rgb(19_95_64/0.8)]">
            <svg viewBox="0 0 24 24" className="size-8" fill="none">
              <motion.path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.35, duration: 0.5 }} />
            </svg>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.8, ease: EASE }} className="mt-6 font-race text-[clamp(3rem,9vw,5.6rem)] text-navy">
            You&apos;re in, {lead.fullName.split(" ")[0] || "runner"}
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="mt-2 text-lg text-muted">
            Payment received · {money(b.total, b.currency as never, { decimals: b.currency !== "GMD" })} · {b.reference}
          </motion.p>

          <div className="relative mt-10 w-full max-w-xl">
            <motion.div initial={{ opacity: 0, scale: 0.4, rotate: -14, y: 60 }} animate={{ opacity: 1, scale: 1, rotate: -2, y: 0 }} transition={{ type: "spring", stiffness: 160, damping: 14, delay: 0.55 }}>
              <Tilt max={6}>
                <Bib number={leadBib} eventId={lead.eventId as never} name={lead.bibName || undefined} qr={`R4I:${b.reference}:${leadBib}`} />
              </Tilt>
            </motion.div>
            {others.length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6">
                {others.map((p, i) => (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 40, rotate: i % 2 ? 10 : -10 }} animate={{ opacity: 1, y: 0, rotate: i % 2 ? 2.5 : -2.5 }} transition={{ type: "spring", stiffness: 160, damping: 16, delay: 1.1 + i * 0.15 }}>
                    <Bib number={p.bib ?? ""} eventId={p.eventId as never} name={p.bibName || undefined} />
                    <p className="mt-2 text-center text-sm font-semibold text-navy">
                      {p.fullName.split(" ")[0]} <span className="font-normal text-muted">· {eventById(p.eventId).name}</span>
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {code && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              onClick={() => {
                navigator.clipboard?.writeText(code).catch(() => {});
                toast.success("Steps challenge code copied", { description: `Share ${code} with friends and family.` });
              }}
              className="mt-8 flex items-center gap-3 rounded-full bg-cobalt-50 py-2 pl-2 pr-4 text-cobalt ring-1 ring-cobalt/15 transition-colors hover:bg-cobalt-100"
            >
              <span className="grid size-8 place-items-center rounded-full bg-sun text-navy">
                <Footprints weight="fill" className="size-4" />
              </span>
              <span className="text-sm font-semibold">Steps challenge code</span>
              <span className="font-mono text-sm font-bold">{code}</span>
              <Copy weight="bold" className="size-4" />
            </motion.button>
          )}

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6 }} className="mt-8 grid grid-cols-1 w-full max-w-xl gap-3 sm:grid-cols-2">
            <Button size="lg" icon={<ShareNetwork weight="bold" className="size-5" />} onClick={() => setShare(true)}>
              Share my run
            </Button>
            <Button
              variant="outline"
              size="lg"
              icon={<CalendarPlus weight="bold" className="size-5" />}
              onClick={() =>
                downloadIcs({
                  title: `Run for Independence: ${ev.name}`,
                  start: "20270130T053000Z",
                  end: "20270130T110000Z",
                  location: `${RUN.venue}, ${RUN.venueArea}`,
                  description: `Bib ${leadBib}. Gates open 05:30, ${ev.name} starts ${ev.start}.`,
                })
              }
            >
              Add to calendar
            </Button>
          </motion.div>

          <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.75 }} className="mt-8 w-full max-w-xl divide-y divide-line border-y border-line text-left">
            {[
              { href: "/my-entry", icon: ChatCircleText, t: "Confirmation by text and email", s: "With a QR code for race-pack collection" },
              { href: "/my-entry", icon: Package, t: `Race packs: ${RUN.racePacksShort}`, s: `10:00 to 17:00 at ${RUN.venue}.${b.participants.length > 1 ? ` One person can collect for all ${b.participants.length}.` : ""}` },
              { href: "/my-entry", icon: UserCircle, t: "Manage your entry", s: `Change sizes or bib names until ${RUN.kitLock}` },
            ].map((x) => (
              <li key={x.t}>
                <Link href={x.href} className="group flex items-center gap-4 py-4">
                  <x.icon weight="duotone" className="size-6 shrink-0 text-forest" />
                  <span className="flex-1">
                    <span className="block font-semibold text-navy">{x.t}</span>
                    <span className="block text-sm text-muted">{x.s}</span>
                  </span>
                  <CaretRight weight="bold" className="size-4 text-faint transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </motion.ul>
        </div>

        <motion.aside initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2, duration: 0.8, ease: EASE }} className="space-y-4 lg:pt-24">
          <div className="rounded-[1.75rem] border border-line bg-white p-4 shadow-card">
            <ShareCard distance={ev.distance} name={lead.fullName.split(" ")[0]!} bib={leadBib} />
            <div className="flex items-center justify-between px-1 pt-4">
              <span className="text-sm text-muted">Your share card</span>
              <button onClick={() => setShare(true)} className="-my-2 rounded-full px-3 py-2 text-sm font-semibold text-forest hover:bg-forest-50">
                Share
              </button>
            </div>
          </div>
          <div className="rounded-[1.75rem] border border-line bg-white p-6">
            <p className="font-label text-muted">What happens next</p>
            <ol className="mt-4 space-y-4">
              {[
                { t: "Now", s: "Your bibs are here and in My entry", done: true },
                { t: "Sat 9 Jan", s: "Kit and bib names lock for printing", done: false },
                { t: "Sat 23 Jan", s: "Reminder: 7 days to go", done: false },
                { t: RUN.racePacksShort, s: "Collect race packs with your QR code", done: false },
                { t: "Sat 30 Jan, 05:30", s: "Gates open at Independence Stadium", done: false },
              ].map((x) => (
                <li key={x.t} className="flex gap-3">
                  {x.done ? <CheckCircle weight="fill" className="mt-0.5 size-5 shrink-0 text-forest" /> : <span className={cn("mt-1 size-3.5 shrink-0 rounded-full border-2 border-line-strong")} />}
                  <span>
                    <span className="block text-sm font-bold text-navy">{x.t}</span>
                    <span className="block text-sm text-muted">{x.s}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </motion.aside>
      </div>
      <ShareSheet open={share} onOpenChange={setShare} distance={ev.distance} name={lead.fullName.split(" ")[0]!} bib={leadBib} />
    </div>
  );
}
