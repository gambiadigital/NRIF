"use client";

import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { EnvelopeSimple } from "@phosphor-icons/react";
import type { Booking } from "@/lib/store";
import { eventById, RUN } from "@/lib/data";
import { RACE_PLAN } from "@/lib/messages";
import { Bib } from "./Bib";

/** The confirmation email: everything the text could not fit, and the QR for race-pack collection. */
export function EmailPreview({ b }: { b: Booking }) {
  const lead = b.participants[0]!;
  const ev = eventById(lead.eventId);
  const bib = b.bibs[lead.id] ?? "1047";
  const virtual = ev.kind === "virtual";
  const names = b.participants.map((p) => p.fullName.split(" ")[0]);
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-line bg-white shadow-lift">
      <div className="flex items-center gap-3 border-b border-line bg-paper px-5 py-3.5">
        <EnvelopeSimple weight="bold" className="size-5 text-muted" />
        <span className="font-label text-muted">Email</span>
        <span className="ml-auto text-xs text-faint">Inbox · 14:36</span>
      </div>
      <div className="px-6 py-5">
        <p className="text-xl font-bold text-navy">
          You&apos;re in: {ev.name}, {virtual ? "e-bib" : "bib"} {bib}
        </p>
        <p className="mt-1 text-sm text-muted">From NRIF Run for Independence &lt;run@nrif.gm&gt;</p>
      </div>
      <div className="mx-4 mb-4 overflow-hidden rounded-2xl bg-paper">
        <div className="flex items-center justify-between bg-forest px-5 py-4">
          <Image src="/brand/nrif-horizontal-white.svg" alt="NRIF" width={480} height={158} unoptimized className="h-9 w-auto" />
          <Image src="/brand/run4independence-reverse.png" alt="Run4Independence" width={1324} height={501} className="h-9 w-auto" />
        </div>
        <div className="p-5">
          <p className="text-[0.9375rem] text-navy">
            Hello {lead.fullName.split(" ")[0]}, thank you for running for Gambian research. Here is everything you need{names.length > 1 ? ` for ${names.join(", ")}` : ""}.
          </p>
          <div className="mt-4 grid gap-4 rounded-2xl bg-white p-4 sm:grid-cols-[1fr_auto]">
            <dl className="grid grid-cols-[5rem_1fr] gap-y-1.5 text-sm">
              {[
                ["Name", lead.fullName],
                ["Event", ev.name],
                ["Date", virtual ? `Any day, ${RUN.virtualWindow} Jan` : RUN.dateShort],
                ["Start", virtual ? "Your choice" : ev.start],
                [virtual ? "E-bib" : "Bib", [bib, ...b.participants.slice(1).map((p) => b.bibs[p.id])].filter(Boolean).join(", ")],
                ["Venue", virtual ? "Anywhere" : `${RUN.venue}, ${RUN.venueArea}`],
              ].map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-muted">{k}</dt>
                  <dd className="font-semibold text-navy">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-col items-center gap-1.5">
              {virtual ? (
                <div className="w-36">
                  <Bib number={bib} eventId={lead.eventId} flat />
                </div>
              ) : (
                <>
                  <QRCodeSVG value={`R4I:${b.reference}:${bib}`} size={112} fgColor="#0b1b3a" />
                  <span className="text-[0.6875rem] text-muted">Show at race-pack collection</span>
                </>
              )}
            </div>
          </div>
          {!virtual ? (
            <>
              <p className="mt-5 font-label text-muted">Race-day plan</p>
              <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 rounded-2xl bg-white p-4 text-sm sm:grid-cols-3">
                {RACE_PLAN.map((r) => (
                  <span key={r.t} className="flex gap-2">
                    <span className="font-mono font-semibold text-navy">{r.t}</span>
                    <span className="text-muted">
                      {r.l}
                      {r.l.startsWith(ev.distance) ? " (you)" : r.l === "Heritage walk" && names.length > 1 ? ` (${names.slice(1).join(", ")})` : ""}
                    </span>
                  </span>
                ))}
              </div>
              <p className="mt-5 font-label text-muted">Race-pack collection</p>
              <p className="mt-2 rounded-2xl bg-white p-4 text-sm text-navy">
                {RUN.racePacks}, {RUN.venue}. Collect {names.length > 1 ? `all ${names.length} bibs` : "your bib"} with this QR code.
              </p>
            </>
          ) : (
            <>
              <p className="mt-5 font-label text-muted">How it works</p>
              <ol className="mt-2 space-y-1.5 rounded-2xl bg-white p-4 text-sm text-navy">
                <li>1. Run or walk {ev.distance} any day from 23 to 31 January.</li>
                <li>2. Record it with Strava, Pacer or any GPS app.</li>
                <li>3. Upload a screenshot or link by {RUN.virtualUploadBy}.</li>
                <li>4. Your e-certificate arrives once we check it.</li>
              </ol>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
