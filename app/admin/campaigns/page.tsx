"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Copy, DownloadSimple, Plus } from "@phosphor-icons/react";
import { AdminTitle, Panel } from "@/components/admin/Shell";
import { Field, Select, TextInput } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
import { CHANNELS } from "@/lib/data";

const SOURCES = ["instagram", "facebook", "tiktok", "x", "poster", "whatsapp", "radio", "school"];

/** Frame 01, from NRIF's side: make a tagged link or a poster QR, and see which channels bring people in. */
export default function Campaigns() {
  const router = useRouter();
  const [src, setSrc] = useState("poster");
  const [label, setLabel] = useState("serrekunda-market");
  const url = `https://run4independence.gm/?src=${src}${label ? `&c=${label}` : ""}`;
  const totalEntries = CHANNELS.reduce((a, c) => a + c.entries, 0);

  return (
    <div className="mx-auto max-w-7xl">
      <AdminTitle title="Campaign links" sub="Every post, poster and QR code carries a source tag. Registrations remember it." />
      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <Panel title="Make a link">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Source tag">
              <Select value={src} onChange={setSrc} options={SOURCES.map((s) => ({ value: s, label: s }))} />
            </Field>
            <Field label="Campaign label" hint="Optional, for posters in different places">
              <TextInput value={label} onChange={(e) => setLabel(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} className="font-mono" />
            </Field>
          </div>
          <div className="mt-5 flex items-center gap-2 rounded-2xl border border-line bg-paper p-1.5 pl-4">
            <span className="flex-1 truncate font-mono text-sm text-navy">{url}</span>
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
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead>
                <tr className="font-label text-muted [&>th]:py-2">
                  <th>Source</th>
                  <th>Visits</th>
                  <th>Entries</th>
                  <th>Conversion</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                {CHANNELS.map((c) => {
                  const visits = Math.round(c.entries * (c.tag === "poster" ? 2.4 : c.tag === "referral" ? 1.9 : 4.6));
                  return (
                    <tr key={c.tag} className="border-t border-line [&>td]:py-3">
                      <td>
                        <span className="rounded-md bg-sand px-1.5 py-0.5 font-mono text-xs text-navy">?src={c.tag}</span>
                      </td>
                      <td className="tabular text-muted">{visits.toLocaleString("en-GB")}</td>
                      <td className="font-semibold tabular text-navy">{c.entries.toLocaleString("en-GB")}</td>
                      <td className="tabular text-navy">{((c.entries / visits) * 100).toFixed(1)}%</td>
                      <td className="w-40">
                        <div className="h-2 overflow-hidden rounded-full bg-sand">
                          <div className="h-full rounded-full" style={{ width: `${(c.entries / totalEntries) * 100 * 2.5}%`, background: c.color }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Poster QR">
          <div className="mx-auto w-fit rounded-3xl bg-white p-4 ring-1 ring-line">
            <QRCodeSVG value={url} size={220} fgColor="#0b1b3a" level="M" />
          </div>
          <p className="mt-4 text-center font-mono text-xs text-muted">?src={src}</p>
          <div className="mt-5 grid gap-2">
            <Button block icon={<DownloadSimple weight="bold" className="size-4" />} onClick={() => toast.success("QR code downloaded", { description: `qr-${src}.svg` })}>
              Download QR
            </Button>
            <Button block variant="line" icon={<Plus weight="bold" className="size-4" />} onClick={() => router.push("/campaign")}>
              Open the A4 poster
            </Button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
