"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { MagnifyingGlass, DownloadSimple, ShieldCheck, Camera, EnvelopeSimple, Tag, Phone, FileText, CaretRight } from "@phosphor-icons/react";
import { AdminTitle, Panel } from "@/components/admin/Shell";
import { Badge, Select } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Bib } from "@/components/Bib";
import { ENTRIES, EVENTS, RUN } from "@/lib/data";
import { cn } from "@/lib/cn";

type Entry = (typeof ENTRIES)[number];

const eventId = (name: string) => EVENTS.find((e) => e.name === name || e.distance === name)?.id ?? "10k";

export default function Entries() {
  const [q, setQ] = useState("");
  const [ev, setEv] = useState("all");
  const [st, setSt] = useState("all");
  const [open, setOpen] = useState<Entry | null>(null);
  const rows = useMemo(
    () =>
      ENTRIES.filter(
        (e) =>
          (!q || `${e.name} ${e.bib} ${e.town} ${e.team}`.toLowerCase().includes(q.toLowerCase())) &&
          (ev === "all" || e.event === ev) &&
          (st === "all" || e.status === st),
      ),
    [q, ev, st],
  );

  return (
    <div className="mx-auto max-w-7xl">
      <AdminTitle
        title="Entries"
        sub={`${RUN.entries.toLocaleString("en-GB")} participants in 2,184 bookings. Showing a sample.`}
        actions={
          <Button variant="line" icon={<DownloadSimple weight="bold" className="size-4" />}>
            Export CSV
          </Button>
        }
      />
      <Panel className="p-0">
        <div className="grid gap-3 border-b border-line p-4 sm:grid-cols-[1fr_14rem_11rem]">
          <div className="relative">
            <MagnifyingGlass className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, bib, town or team code" className="h-12 w-full rounded-xl border border-line bg-white pl-10 pr-3 text-[0.9375rem] outline-none focus:border-forest" />
          </div>
          <Select value={ev} onChange={setEv} options={[{ value: "all", label: "All events" }, ...EVENTS.map((e) => ({ value: e.name, label: e.name }))]} />
          <Select value={st} onChange={setSt} options={[{ value: "all", label: "Any status" }, { value: "Paid", label: "Paid" }, { value: "Pending", label: "Pending" }]} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[54rem] text-left text-sm">
            <thead>
              <tr className="font-label text-muted [&>th]:px-4 [&>th]:py-3">
                <th>Bib</th>
                <th>Name</th>
                <th>Event</th>
                <th>Category</th>
                <th>Lives in</th>
                <th>Source</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((e, i) => (
                <motion.tr key={e.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} onClick={() => setOpen(e)} className="cursor-pointer border-t border-line transition-colors hover:bg-paper [&>td]:px-4 [&>td]:py-3.5">
                  <td className="font-mono font-semibold text-cobalt">{e.bib}</td>
                  <td className="font-semibold text-navy">{e.name}</td>
                  <td className="text-navy">{e.event}</td>
                  <td className="text-muted">{e.cat}</td>
                  <td className="text-muted">{e.res === "The Gambia" ? e.town : e.res}</td>
                  <td>
                    <span className="rounded-md bg-sand px-1.5 py-0.5 font-mono text-xs text-navy">{e.src}</span>
                  </td>
                  <td>
                    <Badge tone={e.status === "Paid" ? "forest" : "sun"}>{e.status}</Badge>
                  </td>
                  <td>
                    <CaretRight weight="bold" className="size-4 text-faint" />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p className="p-10 text-center text-muted">No entries match.</p>}
        </div>
      </Panel>

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)} title={open?.name ?? ""} description={open ? `${open.event} · ${open.cat}` : undefined} wide>
        {open && (
          <div className="grid gap-6 sm:grid-cols-[13rem_1fr]">
            <div>
              {open.bib !== "—" ? <Bib number={open.bib} eventId={eventId(open.event) as never} name={open.name.split(" ")[0]!.toUpperCase()} flat /> : <div className="grid aspect-[1.42/1] place-items-center rounded-2xl border-2 border-dashed border-line text-sm text-muted">Bib after payment</div>}
              <p className="mt-3 text-center text-xs text-muted">T-shirt {open.size}</p>
            </div>
            <div className="space-y-4">
              <dl className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Age on race day", String(open.age)],
                  ["Lives in", open.res === "The Gambia" ? `${open.town}, The Gambia` : open.res],
                  ["Team", open.team],
                  ["Status", open.status],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-paper p-3">
                    <dt className="text-xs text-muted">{k}</dt>
                    <dd className="font-semibold text-navy">{v}</dd>
                  </div>
                ))}
              </dl>
              <ul className="divide-y divide-line rounded-2xl border border-line text-sm">
                {[
                  { icon: ShieldCheck, l: "Waiver v1.0 accepted", v: open.age < 18 ? "By guardian Fatou Jallow · 20 Oct 2026, 14:32" : "20 Oct 2026, 14:32" },
                  { icon: Camera, l: "Photo and video consent", v: "Yes" },
                  { icon: EnvelopeSimple, l: "NRIF news", v: "No" },
                  { icon: Phone, l: "Emergency contact", v: "Ebrima Jallow, brother · +220 87 765 4321" },
                  { icon: Tag, l: "Source tag", v: `?src=${open.src}` },
                  { icon: FileText, l: "Messages", v: "Confirmation SMS and email sent" },
                ].map((x) => (
                  <li key={x.l} className="flex items-start gap-3 p-3">
                    <x.icon weight="duotone" className="mt-0.5 size-5 shrink-0 text-forest" />
                    <span className="flex-1 text-muted">{x.l}</span>
                    <span className={cn("max-w-[55%] text-right font-semibold text-navy", x.l === "Source tag" && "font-mono")}>{x.v}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
