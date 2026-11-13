"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Check, HourglassMedium, WarningCircle, Lightning, HandPointing, BellRinging, MagnifyingGlass, Wallet, Bank, GlobeHemisphereWest, ArrowsClockwise } from "@phosphor-icons/react";
import { AdminTitle, Panel } from "@/components/admin/Shell";
import { Badge, RadioDot } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { ACTIVITY, EVENTS, PAYMENTS, type PaymentRow } from "@/lib/data";
import { padBib } from "@/lib/format";
import { cn } from "@/lib/cn";

const SOURCES = [
  { label: "Wave", icon: Wallet, n: 1412 },
  { label: "Yonna", icon: Wallet, n: 688 },
  { label: "Bank transfer", icon: Bank, n: 341 },
  { label: "Remitly / ACE", icon: GlobeHemisphereWest, n: 609 },
];

const FILTERS = [
  { v: "all", l: "All" },
  { v: "matched", l: "Matched" },
  { v: "waiting", l: "Waiting" },
  { v: "unmatched", l: "Unmatched" },
] as const;

function StatusBadge({ r }: { r: PaymentRow }) {
  if (r.status === "auto") return <Badge tone="forest" icon={<Lightning weight="fill" className="size-3" />}>Auto-matched</Badge>;
  if (r.status === "matched") return <Badge tone="forest" icon={<Check weight="bold" className="size-3" />}>Matched</Badge>;
  if (r.status === "waiting") return <Badge tone="sun" icon={<HourglassMedium weight="fill" className="size-3" />}>Waiting, day {r.day} of 5</Badge>;
  return <Badge tone="ember" icon={<WarningCircle weight="fill" className="size-3" />}>Unmatched</Badge>;
}

/** Frame 09: incoming payments meet pending references. Anything the platform cannot place waits here for a person. */
export default function Payments() {
  const [rows, setRows] = useState<PaymentRow[]>(PAYMENTS);
  const [log, setLog] = useState(ACTIVITY);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["v"]>("all");
  const [matching, setMatching] = useState<PaymentRow | null>(null);
  const [pick, setPick] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const counts = {
    all: rows.length,
    matched: rows.filter((r) => r.status === "auto" || r.status === "matched").length,
    waiting: rows.filter((r) => r.status === "waiting").length,
    unmatched: rows.filter((r) => r.status === "unmatched").length,
  };
  const shown = rows.filter((r) => (filter === "all" ? true : filter === "matched" ? r.status === "auto" || r.status === "matched" : r.status === filter));
  const candidates = useMemo(() => rows.filter((r) => r.status === "waiting" && (!q || `${r.ref} ${r.entry}`.toLowerCase().includes(q.toLowerCase()))), [rows, q]);

  function confirmMatch() {
    if (!matching || !pick) return;
    const target = rows.find((r) => r.ref === pick)!;
    const bib = target.event.startsWith("5K") ? "4102" : "1049";
    setRows((rs) =>
      rs
        .filter((r) => r !== matching)
        .map((r) => (r.ref === pick ? { ...r, status: "matched", bibs: bib, received: matching.received, via: matching.via } : r)),
    );
    setLog((l) => [{ t: new Date().toTimeString().slice(0, 5), text: `${pick} matched by hand to a ${matching.via} receipt of ${matching.amount}. Bib ${bib} issued. SMS and email sent.` }, ...l]);
    toast.success(`${pick} matched`, { description: `Bib ${bib} issued to ${target.entry}. Text and email sent.` });
    setMatching(null);
    setPick(null);
  }

  return (
    <div className="mx-auto max-w-7xl">
      <AdminTitle
        title="Payment matching"
        sub="Wave reports itself. Yonna, bank transfers and Remitly or ACE are matched by reference code."
        actions={
          <Button variant="line" icon={<ArrowsClockwise weight="bold" className="size-4" />} onClick={() => toast("Fetched 3 new receipts from Yonna")}>
            Fetch receipts
          </Button>
        }
      />

      {/* where the money comes from */}
      <div className="relative mb-6 overflow-hidden rounded-[1.25rem] border border-line bg-white px-5 pb-5 pt-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SOURCES.map((s) => (
            <div key={s.label} className="relative z-10 flex items-center gap-3 rounded-2xl border border-line bg-paper px-4 py-3">
              <s.icon weight="duotone" className="size-6 text-navy" />
              <span>
                <span className="block text-sm font-bold text-navy">{s.label}</span>
                <span className="block text-xs text-muted">{s.n.toLocaleString("en-GB")} payments</span>
              </span>
            </div>
          ))}
        </div>
        <svg viewBox="0 0 800 70" preserveAspectRatio="none" className="hidden h-14 w-full sm:block" aria-hidden>
          {[100, 300, 500, 700].map((x) => (
            <path key={x} d={`M${x} 0 C${x} 40, 400 30, 400 66`} fill="none" stroke="#f2b233" strokeWidth="3" strokeDasharray="6 8" className="[animation:dash_1.2s_linear_infinite]" />
          ))}
          <circle cx="400" cy="64" r="6" fill="#f2b233" stroke="white" strokeWidth="3" />
        </svg>
        <style>{`@keyframes dash { to { stroke-dashoffset: -28; } }`}</style>
      </div>

      <div className="grid gap-4 2xl:grid-cols-[1fr_18rem]">
        <Panel className="p-0">
          <div className="flex flex-wrap items-center gap-2 border-b border-line p-4">
            {FILTERS.map((f) => (
              <button
                key={f.v}
                onClick={() => setFilter(f.v)}
                className={cn("flex h-9 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors", filter === f.v ? "bg-forest text-white" : "bg-sand text-navy hover:bg-line")}
              >
                {f.l}
                <span className={cn("rounded-full px-1.5 text-xs", filter === f.v ? "bg-white/20" : "bg-white")}>{counts[f.v]}</span>
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] text-left text-sm">
              <thead>
                <tr className="font-label text-muted [&>th]:px-4 [&>th]:py-3">
                  <th>Reference</th>
                  <th>Paid via</th>
                  <th>Amount</th>
                  <th>Entry</th>
                  <th>Status</th>
                  <th>Bib</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {shown.map((r) => (
                    <motion.tr
                      layout
                      key={r.ref + r.amount + r.via}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={cn("border-t border-line [&>td]:px-4 [&>td]:py-3.5", r.status === "unmatched" && "bg-ember-50/40")}
                    >
                      <td className="font-mono font-semibold text-navy">{r.ref}</td>
                      <td className="whitespace-nowrap text-muted">{r.via}</td>
                      <td className="whitespace-nowrap font-semibold text-navy tabular">{r.amount}</td>
                      <td>
                        <span className="block font-medium text-navy">
                          {r.entry}
                          {r.people > 1 && <span className="text-muted"> +{r.people - 1}</span>}
                        </span>
                        <span className="text-xs text-muted">{r.event}</span>
                      </td>
                      <td>
                        <StatusBadge r={r} />
                      </td>
                      <td className="font-mono text-[0.8125rem] font-semibold text-cobalt">{r.bibs ?? "—"}</td>
                      <td className="text-right">
                        {r.status === "unmatched" ? (
                          <button onClick={() => setMatching(r)} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-navy/20 px-3 font-mono text-xs font-semibold text-navy hover:bg-navy hover:text-white">
                            <HandPointing weight="bold" className="size-3.5" /> Match by hand
                          </button>
                        ) : r.status === "waiting" ? (
                          <button onClick={() => toast.success(`Reminder sent for ${r.ref}`, { description: `${r.entry} gets a text with the reference.` })} className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-muted hover:bg-sand hover:text-navy">
                            <BellRinging weight="bold" className="size-3.5" /> Remind
                          </button>
                        ) : (
                          <span className="text-xs text-faint">{r.received}</span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-1 2xl:content-start">
          <Panel title="Bib ranges">
            <ul className="space-y-2 font-mono text-sm">
              {EVENTS.filter((e) => e.kind === "in-person").map((e) => (
                <li key={e.id} className="flex justify-between">
                  <span className="font-sans font-semibold text-navy">{e.distance}</span>
                  <span className="text-muted">
                    {padBib(e.bibRange[0])}–{padBib(e.bibRange[1])}
                  </span>
                </li>
              ))}
              <li className="flex justify-between">
                <span className="font-sans font-semibold text-navy">Virtual</span>
                <span className="text-muted">V + range</span>
              </li>
            </ul>
          </Panel>
          <Panel title="Activity">
            <ol className="space-y-3">
              <AnimatePresence initial={false}>
                {log.slice(0, 7).map((a) => (
                  <motion.li key={a.t + a.text} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex gap-3 text-[0.8125rem]">
                    <span className="w-10 shrink-0 font-mono text-xs font-semibold text-muted">{a.t}</span>
                    <span className="text-navy">{a.text}</span>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ol>
          </Panel>
        </div>
      </div>

      <Sheet
        open={!!matching}
        onOpenChange={(o) => !o && (setMatching(null), setPick(null))}
        title="Match a receipt by hand"
        description={matching ? `${matching.via} · ${matching.amount} · received ${matching.received} · no reference given` : undefined}
        wide
        footer={
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted">{pick ? `Matching to ${pick}` : "Choose the entry this money belongs to"}</span>
            <Button size="lg" disabled={!pick} onClick={confirmMatch}>
              Match and issue bib
            </Button>
          </div>
        }
      >
        <div className="rounded-2xl bg-paper p-4 text-sm">
          <p className="font-label text-muted">Receipt</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ["From", "+220 87 64 •• 21"],
              ["Amount", matching?.amount ?? ""],
              ["Note", "“for my 5k”"],
              ["Time", matching?.received ?? ""],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-xs text-muted">{k}</p>
                <p className="font-semibold text-navy">{v}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative mt-4">
          <MagnifyingGlass className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search pending entries" className="h-11 w-full rounded-xl border border-line pl-10 pr-3 text-sm outline-none focus:border-forest" />
        </div>
        <ul className="mt-3 space-y-2">
          {candidates.map((c) => {
            const likely = matching && c.amount.replace(/\D/g, "") === matching.amount.replace(/\D/g, "");
            return (
              <li key={c.ref}>
                <button onClick={() => setPick(c.ref)} className={cn("flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors", pick === c.ref ? "border-forest bg-forest-50/50" : "border-line hover:bg-paper")}>
                  <RadioDot checked={pick === c.ref} />
                  <span className="w-24 font-mono text-sm font-semibold text-navy">{c.ref}</span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-navy">{c.entry}</span>
                    <span className="block text-xs text-muted">
                      {c.event} · day {c.day} of 5
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-navy">{c.amount}</span>
                  {likely && <Badge tone="forest">Same amount</Badge>}
                </button>
              </li>
            );
          })}
        </ul>
      </Sheet>
    </div>
  );
}
