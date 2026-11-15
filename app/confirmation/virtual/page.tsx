"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { CalendarBlank, Pulse, UploadSimple, Certificate, DownloadSimple, ShareNetwork, MapPin, Clock, IdentificationCard, Medal, ShieldCheck } from "@phosphor-icons/react";
import { RUN, eventById } from "@/lib/data";
import { money } from "@/lib/format";
import { useBookingData } from "@/lib/booking-client";
import { EntryGate } from "@/components/EntryGate";
import { Bib } from "@/components/Bib";
import { Button } from "@/components/ui/button";
import { ShareSheet } from "@/components/ShareCard";
import { Tilt } from "@/components/ui/motion";
import { celebrate } from "@/lib/celebrate";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function VirtualConfirmationPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <VirtualConfirmation />
    </Suspense>
  );
}

/** Frame 12: the virtual confirmation. No venue or start time; a run window, apps, proof and an e-bib instead. */
function VirtualConfirmation() {
  const sp = useSearchParams();
  const ref = sp.get("ref");
  const key = sp.get("k");
  const router = useRouter();
  const { data: b, error, loading } = useBookingData(ref, key);
  const bibRef = useRef<HTMLDivElement>(null);
  const [share, setShare] = useState(false);

  useEffect(() => {
    if (!b) return;
    if (b.status !== "paid") router.replace(`/register/pending${ref && key ? `?ref=${ref}&k=${encodeURIComponent(key)}` : ""}`);
    else {
      const t = setTimeout(celebrate, 600);
      return () => clearTimeout(t);
    }
  }, [b, ref, key, router]);

  if (!b || b.status !== "paid") return <EntryGate loading={loading} error={error} />;
  const lead = b.participants.find((p) => eventById(p.eventId).kind === "virtual") ?? b.participants[0]!;
  const ev = eventById(lead.eventId);
  const bib = lead.bib ?? "";

  async function downloadBib() {
    if (!bibRef.current) return;
    try {
      const url = await toPng(bibRef.current, { pixelRatio: 3, cacheBust: true });
      const a = document.createElement("a");
      a.href = url;
      a.download = `e-bib-${bib}.png`;
      a.click();
      toast.success("E-bib saved", { description: "Print it, or pin it on your phone's lock screen." });
    } catch {
      toast.error("Could not make the image on this device");
    }
  }

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[40rem] bg-[radial-gradient(60%_60%_at_50%_0%,rgb(42_49_129/0.16),transparent_70%)]" />
      <div className="relative mx-auto grid grid-cols-1 max-w-6xl gap-12 px-4 pb-32 pt-10 sm:px-6 lg:grid-cols-[1fr_1fr] lg:pt-16">
        <div>
          <div className="flex items-center gap-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 380, damping: 16 }} className="grid size-14 place-items-center rounded-full bg-cobalt text-white">
              <svg viewBox="0 0 24 24" className="size-7" fill="none">
                <motion.path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3, duration: 0.5 }} />
              </svg>
            </motion.div>
            <div>
              <h1 className="font-race text-[clamp(2.6rem,7vw,4.6rem)] text-navy">You&apos;re in, {lead.fullName.split(" ")[0]}</h1>
              <p className="text-muted">
                {ev.name} · payment matched · {money(b.total, b.currency as never, { decimals: b.currency !== "GMD" })}
              </p>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, scale: 0.5, rotate: -12, y: 50 }} animate={{ opacity: 1, scale: 1, rotate: -2, y: 0 }} transition={{ type: "spring", stiffness: 160, damping: 14, delay: 0.4 }} className="mt-10">
            <Tilt max={6}>
              <div ref={bibRef} className="rounded-[2rem] bg-paper p-2">
                <Bib number={bib} eventId={lead.eventId as never} name={lead.bibName || undefined} qr={`R4I:${b.reference}:${bib}`} />
              </div>
            </Tilt>
          </motion.div>

          <ul className="mt-8 divide-y divide-line border-y border-line">
            {[
              { icon: CalendarBlank, t: <>Run any day, <b>{RUN.virtualWindow} Jan</b></>, s: "Wherever you are" },
              { icon: Pulse, t: <>Record it with <b>Strava, Pacer</b> or any GPS app</>, s: "A watch is fine too" },
              { icon: UploadSimple, t: <>Upload a screenshot or link by <b>{RUN.virtualUploadBy}</b></>, s: "We check every run" },
              { icon: Certificate, t: "E-certificate once your run is checked", s: "With your time and distance" },
            ].map((x, i) => (
              <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 + i * 0.07 }} className="flex items-center gap-4 py-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-cobalt-50 text-cobalt">
                  <x.icon weight="duotone" className="size-5" />
                </span>
                <span>
                  <span className="block text-navy">{x.t}</span>
                  <span className="block text-sm text-muted">{x.s}</span>
                </span>
              </motion.li>
            ))}
          </ul>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button variant="cobalt" size="lg" icon={<DownloadSimple weight="bold" className="size-5" />} onClick={downloadBib}>
              Download e-bib
            </Button>
            <Button variant="outline" size="lg" className="border-cobalt/70 text-cobalt hover:bg-cobalt-50" icon={<UploadSimple weight="bold" className="size-5" />} onClick={() => router.push("/my-entry/upload")}>
              Upload my run (opens 23 Jan)
            </Button>
          </div>
          <button onClick={() => setShare(true)} className="mt-2 flex items-center gap-2 py-2.5 text-left text-sm font-semibold text-cobalt hover:underline">
            <ShareNetwork weight="bold" className="size-4" /> Share that you are running from {b.city?.split(",")[0] || b.town || "abroad"}
          </button>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.8, ease: EASE }} className="lg:pt-28">
          <div className="overflow-hidden rounded-[1.75rem] border border-line bg-white shadow-card">
            <div className="grid grid-cols-[6.5rem_1fr_1fr] border-b border-line bg-paper px-5 py-4 text-sm font-bold">
              <span />
              <span className="flex items-center gap-2 text-navy">
                <span className="size-2.5 rounded-full bg-forest" /> In person
              </span>
              <span className="flex items-center gap-2 text-cobalt">
                <span className="size-2.5 rounded-full bg-cobalt" /> Virtual
              </span>
            </div>
            {[
              { k: "Where", icon: MapPin, a: `${RUN.venue}`, v: "Anywhere" },
              { k: "When", icon: Clock, a: "Sat 30 Jan, 07:00", v: `Any day, ${RUN.virtualWindow} Jan` },
              { k: "Bib", icon: IdentificationCard, a: "Printed, in race pack", v: "E-bib to download" },
              { k: "Proof", icon: ShieldCheck, a: "Crossing the finish", v: `Upload by ${RUN.virtualUploadBy}` },
              { k: "Reward", icon: Medal, a: "Medal at the finish", v: "E-certificate" },
            ].map((r) => (
              <div key={r.k} className="grid grid-cols-[6.5rem_1fr_1fr] items-start gap-2 border-b border-line px-5 py-4 last:border-0">
                <span className="flex items-center gap-1.5 font-label text-muted">
                  <r.icon weight="bold" className="size-3.5" />
                  {r.k}
                </span>
                <span className="text-[0.9375rem] font-semibold text-navy">{r.a}</span>
                <span className="text-[0.9375rem] font-semibold text-cobalt">{r.v}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 px-1 text-sm text-muted">Home for January after all? You can switch to the in-person 10K from My entry until {RUN.kitLock}.</p>
        </motion.div>
      </div>
      <ShareSheet open={share} onOpenChange={setShare} distance={ev.distance} name={lead.fullName.split(" ")[0]!} bib={bib} virtual />
    </div>
  );
}
