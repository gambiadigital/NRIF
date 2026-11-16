"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Copy, Printer } from "@phosphor-icons/react";
import { AdminTitle, Panel, Empty } from "@/components/admin/Shell";
import { Field, Select, TextInput } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
import { R4ILogo, NrifLockup, FlagBars } from "@/components/brand";
import { RUN } from "@/lib/data";
import { useAdmin } from "@/lib/admin-client";

const SOURCES = ["instagram", "facebook", "tiktok", "x", "whatsapp", "poster", "radio", "school", "email"];

/** Frame 01 from NRIF's side: make a tagged link or a poster QR, and see which channels bring people in. */
export default function Campaigns() {
  const { data } = useAdmin<{ rows: { source: string; bookings: number; paid: number; entries: number }[]; referrals: { bib: string; bookings: number }[] }>("/api/admin/campaigns");
  const [src, setSrc] = useState("poster");
  const [label, setLabel] = useState("");
  const [origin, setOrigin] = useState("https://nrif.vercel.app");
  useEffect(() => {
    const t = setTimeout(() => setOrigin(window.location.origin), 0);
    return () => clearTimeout(t);
  }, []);
  const url = `${origin}/?src=${src}${label ? `-${label}` : ""}`;
  const max = Math.max(1, ...(data?.rows.map((r) => r.entries) ?? [1]));

  return (
    <div className="mx-auto max-w-7xl">
      <div className="no-print">
        <AdminTitle title="Campaign links" sub="Every post, poster and QR code carries a source tag. Bookings remember it." />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_26rem]">
        <div className="no-print space-y-4">
          <Panel title="Make a link">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Source tag">
                <Select value={src} onChange={setSrc} options={SOURCES.map((s) => ({ value: s, label: s }))} />
              </Field>
              <Field label="Place or campaign" optional hint="For posters in different places, e.g. westfield">
                <TextInput value={label} onChange={(e) => setLabel(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20))} className="font-mono" />
              </Field>
            </div>
            <div className="mt-5 flex items-center gap-2 rounded-2xl border border-line bg-paper p-1.5 pl-4">
              <span className="min-w-0 flex-1 truncate font-mono text-sm text-navy">{url}</span>
              <Button
                size="sm"
                variant="ink"
                icon={<Copy weight="bold" className="size-4" />}
                onClick={() => {
                  navigator.clipboard?.writeText(url).catch(() => {});
                  toast.success("Link copied");
                }}
              >
                Copy
              </Button>
            </div>
          </Panel>
          <Panel title="Results by source tag">
            {data?.rows.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[32rem] text-left text-sm">
                  <thead>
                    <tr className="font-label text-muted [&>th]:py-2">
                      <th>Source</th>
                      <th>Bookings</th>
                      <th>Paid</th>
                      <th>Paid entries</th>
                      <th className="w-40" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((c) => (
                      <tr key={c.source} className="border-t border-line [&>td]:py-3">
                        <td>
                          <span className="rounded-md bg-sand px-1.5 py-0.5 font-mono text-xs text-navy">?src={c.source}</span>
                        </td>
                        <td className="tabular text-muted">{c.bookings}</td>
                        <td className="tabular text-muted">{c.paid}</td>
                        <td className="font-semibold tabular text-navy">{c.entries}</td>
                        <td>
                          <div className="h-2 overflow-hidden rounded-full bg-sand">
                            <div className="h-full rounded-full bg-forest" style={{ width: `${(c.entries / max) * 100}%` }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty>No bookings yet.</Empty>
            )}
            {!!data?.referrals.length && (
              <p className="mt-4 text-sm text-muted">
                Top share links: {data.referrals.map((r) => `bib ${r.bib} (${r.bookings})`).join(", ")}
              </p>
            )}
          </Panel>
        </div>

        <div>
          <div className="@container relative mx-auto aspect-[1/1.414] w-full max-w-md overflow-hidden rounded-xl bg-navy text-white shadow-pop print:max-w-none print:rounded-none print:shadow-none">
            <Image src="/media/start-line.webp" alt="" fill sizes="450px" className="object-cover opacity-45" />
            <div className="absolute inset-0 bg-gradient-to-b from-navy/70 via-navy/40 to-navy" />
            <div className="relative flex h-full flex-col p-[7cqw]">
              <div className="flex items-center justify-between">
                <NrifLockup white className="h-[9cqw]" />
                <FlagBars />
              </div>
              <R4ILogo reverse className="mt-[10cqw] w-[78cqw]" />
              <p className="mt-[6cqw] font-race text-[9cqw] text-white">{RUN.tagline}</p>
              <p className="mt-[2cqw] text-[3.6cqw] text-white/85">
                {RUN.dateLong}
                <br />
                {RUN.venue}, {RUN.venueArea}
              </p>
              <p className="mt-[2cqw] text-[3.2cqw] text-white/65">21K · 10K · 5K · 1.965K Heritage walk · Virtual</p>
              <div className="mt-auto flex items-end justify-between gap-[4cqw]">
                <div className="rounded-[2cqw] bg-white p-[2.4cqw]">
                  <QRCodeSVG value={url} size={160} fgColor="#0b1b3a" className="block size-[30cqw]" />
                </div>
                <div className="text-right">
                  <p className="font-race text-[7cqw]">Scan to register</p>
                  <p className="mt-[1cqw] font-mono text-[3cqw] text-white/60">?src={src}{label ? `-${label}` : ""}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="no-print mt-4 flex justify-center">
            <Button variant="ink" icon={<Printer weight="bold" className="size-4" />} onClick={() => window.print()}>
              Print this poster
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
