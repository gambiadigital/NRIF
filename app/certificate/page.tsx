"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { DownloadSimple, Printer, ShareNetwork } from "@phosphor-icons/react";
import { SiteHeader } from "@/components/site/Header";
import { Button } from "@/components/ui/button";
import { Swoosh } from "@/components/brand";
import { useBooking } from "@/lib/store";
import { eventById } from "@/lib/data";

/** The virtual finisher's certificate: landscape, printable, with the time they uploaded. */
export default function CertificatePage() {
  const b = useBooking();
  const ref = useRef<HTMLDivElement>(null);
  const lead = b.participants[0]!;
  const ev = eventById(lead.eventId);
  const bib = b.bibs[lead.id] ?? "V1213";

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
          <div className="flex gap-2">
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

        <motion.div initial={{ opacity: 0, y: 30, rotateX: 12 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} style={{ perspective: 1200 }}>
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
                completed the <b className="text-navy">{ev.name}</b> of Run for Independence 2027 from <b className="text-navy">{b.contact.town || "abroad"}</b>, and grew NRIF&apos;s Endowment Fund for Gambian research and innovation.
              </p>
              <div className="mt-[3cqw] flex items-center gap-[5cqw]">
                {[
                  ["Distance", `${ev.km} km`],
                  ["Time", "52:41"],
                  ["Date", "24 Jan 2027"],
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
      </main>
    </>
  );
}
