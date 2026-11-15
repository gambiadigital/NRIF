"use client";

import { Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion } from "motion/react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { DownloadSimple, Printer, ShareNetwork } from "@phosphor-icons/react";
import { SiteHeader } from "@/components/site/Header";
import { Button } from "@/components/ui/button";
import { Swoosh } from "@/components/brand";
import { useBookingData, type ClientBooking } from "@/lib/booking-client";
import { EntryGate } from "@/components/EntryGate";
import { eventById } from "@/lib/data";

/** The virtual finisher's certificate: landscape, printable, with the time they uploaded. */
export default function CertificatePage() {
  return (
    <Suspense fallback={null}>
      <CertificateGate />
    </Suspense>
  );
}

function CertificateGate() {
  const sp = useSearchParams();
  const { data, error, loading } = useBookingData(null, null);
  const p = data?.participants.find((x) => x.id === sp.get("p")) ?? data?.participants.find((x) => data.results?.some((r) => r.participant_id === x.id && r.status === "approved"));
  const result = p && data?.results?.find((r) => r.participant_id === p.id && r.status === "approved");
  if (!data || !p || !result)
    return (
      <>
        <div className="no-print">
          <SiteHeader />
        </div>
        <div className="pt-[var(--header-h)]">
          <EntryGate loading={loading} error={data ? { status: 409, message: "Your certificate appears here once your virtual run has been checked and approved." } : error} />
        </div>
      </>
    );
  return <Certificate b={data} participantId={p.id} result={result} />;
}

const hms = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
};

function Certificate({ b, participantId, result }: { b: ClientBooking; participantId: string; result: NonNullable<ClientBooking["results"]>[number] }) {
  const ref = useRef<HTMLDivElement>(null);
  const lead = b.participants.find((x) => x.id === participantId)!;
  const ev = eventById(lead.eventId);
  const bib = lead.bib ?? "";
  const place = b.city?.split(",")[0] || b.town || "abroad";

  async function save() {
    if (!ref.current) return;
    try {
      const url = await toPng(ref.current, { pixelRatio: 2.5, cacheBust: true });
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificate-${bib}.png`;
      a.click();
    } catch {
      toast.error("Could not make the image on this device");
    }
  }

  return (
    <>
      <div className="no-print">
        <SiteHeader />
      </div>
      <main className="mx-auto max-w-5xl px-4 pb-32 pt-[calc(var(--header-h)+2.5rem)] sm:px-6 print:p-0">
        <div className="no-print mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-label text-cobalt">E-certificate</p>
            <h1 className="mt-3 font-race text-[clamp(2.4rem,6vw,3.8rem)] text-navy">Well run, {lead.fullName.split(" ")[0]}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="line" icon={<Printer weight="bold" className="size-4" />} onClick={() => window.print()}>
              Print
            </Button>
            <Button variant="line" icon={<ShareNetwork weight="bold" className="size-4" />} onClick={() => toast.success("Link copied")}>
              Share
            </Button>
            <Button variant="cobalt" icon={<DownloadSimple weight="bold" className="size-4" />} onClick={save}>
              Download
            </Button>
          </div>
        </div>

        <p className="no-print mb-3 text-sm text-muted sm:hidden">Swipe to see the whole certificate, or download it.</p>
        <div className="no-scrollbar -mx-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:overflow-visible sm:px-0 sm:pb-0">
        <motion.div className="min-w-[40rem] sm:min-w-0" initial={{ opacity: 0, y: 30, rotateX: 12 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} style={{ perspective: 1200 }}>
          <div ref={ref} className="@container relative aspect-[1.414/1] w-full overflow-hidden rounded-[1.25rem] bg-white shadow-pop ring-1 ring-line">
            <div className="absolute inset-[2.2cqw] rounded-[0.8cqw] border-[0.25cqw] border-sun/70" />
            <div className="absolute inset-[2.9cqw] rounded-[0.6cqw] border border-sun/40" />
            <Swoosh className="absolute -right-[10cqw] -top-[7cqw] w-[38cqw] rotate-180 opacity-90" />
            <div className="relative flex h-full flex-col items-center px-[10cqw] pt-[6cqw] text-center">
              <div className="flex items-center gap-[2cqw]">
                <Image src="/brand/nrif-horizontal.svg" alt="NRIF" width={480} height={158} unoptimized className="h-[5cqw] w-auto" />
                <span className="h-[4cqw] w-px bg-line" />
                <Image src="/brand/run4independence.png" alt="Run4Independence" width={1324} height={501} className="h-[5cqw] w-auto" />
              </div>
              <p className="mt-[4cqw] font-label !text-[1.25cqw] text-muted">Certificate of completion</p>
              <p className="mt-[1.6cqw] text-[1.8cqw] text-muted">This certifies that</p>
              <p className="mt-[1cqw] font-race text-[7cqw] text-navy">{lead.fullName}</p>
              <p className="mt-[1.4cqw] max-w-[60cqw] text-[1.8cqw] leading-relaxed text-muted">
                completed the <b className="text-navy">{ev.name}</b> of Run for Independence 2027 from <b className="text-navy">{place}</b>, and grew NRIF&apos;s Endowment Fund for Gambian research and innovation.
              </p>
              <div className="mt-[3cqw] flex items-center gap-[5cqw]">
                {[
                  ["Distance", `${result.distance_km} km`],
                  ["Time", hms(result.duration_seconds)],
                  ["Date", new Date(result.run_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })],
                  ["E-bib", bib],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="font-bib text-[4cqw] text-cobalt">{v}</p>
                    <p className="font-label !text-[1cqw] text-muted">{k}</p>
                  </div>
                ))}
              </div>
              <div className="mt-auto flex w-full items-end justify-between pb-[5cqw]">
                <div className="w-[22cqw] border-t border-navy/30 pt-[0.8cqw] text-left text-[1.2cqw] text-muted">Executive Director, NRIF</div>
                <Image src="/brand/nrif-seal.svg" alt="" width={417} height={417} unoptimized className="size-[11cqw]" />
                <div className="w-[22cqw] border-t border-navy/30 pt-[0.8cqw] text-right text-[1.2cqw] text-muted">Race Director</div>
              </div>
            </div>
          </div>
        </motion.div>
        </div>
      </main>
    </>
  );
}
