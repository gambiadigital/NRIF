"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Info } from "@phosphor-icons/react";
import { AdminTitle, Panel } from "@/components/admin/Shell";
import { Field, Switch, TextInput } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
import { Bib } from "@/components/Bib";
import { api, invalidate } from "@/lib/client";
import { useAdmin } from "@/lib/admin-client";
import { padBib } from "@/lib/format";

type Ev = { id: string; name: string; kind: string; start_time: string; fee_gmd: number; suggested_gbp: number; bib_start: number; bib_end: number; bib_prefix: string; bib_next: number; open: boolean; min_age: number; issued: number };

/** Fees, start times and bib ranges. Virtual events use the same numbers as their in-person twin, with a V. */
export default function Events() {
  const { data, reload } = useAdmin<{ events: Ev[] }>("/api/admin/events");
  return (
    <div className="mx-auto max-w-6xl">
      <AdminTitle title="Events and bibs" sub="Fees, start times and bib ranges. Changes show on the public site straight away." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {data?.events.map((e, i) => (
          <motion.div key={e.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <EventCard e={e} onSaved={reload} />
          </motion.div>
        ))}
        {!data && [0, 1, 2, 3].map((i) => <div key={i} className="h-72 animate-pulse rounded-[1.25rem] bg-white" />)}
      </div>
      <p className="mt-4 flex items-center gap-2 text-sm text-muted">
        <Info weight="fill" className="size-4" /> Bibs are issued in order as payments are matched. A range can&apos;t shrink below a number already issued.
      </p>
    </div>
  );
}

function EventCard({ e, onSaved }: { e: Ev; onSaved: () => Promise<void> }) {
  const [fee, setFee] = useState(String(e.fee_gmd));
  const [gbp, setGbp] = useState(String(e.suggested_gbp));
  const [start, setStart] = useState(e.start_time);
  const [lo, setLo] = useState(String(e.bib_start));
  const [hi, setHi] = useState(String(e.bib_end));
  const [open, setOpen] = useState(e.open);
  const [busy, setBusy] = useState(false);
  const size = e.bib_end - e.bib_start + 1;
  const used = e.bib_next - e.bib_start;
  const dirty = fee !== String(e.fee_gmd) || gbp !== String(e.suggested_gbp) || start !== e.start_time || lo !== String(e.bib_start) || hi !== String(e.bib_end) || open !== e.open;

  async function save() {
    setBusy(true);
    try {
      await api("/api/admin/events", { method: "PATCH", json: { id: e.id, fee_gmd: Number(fee), suggested_gbp: Number(gbp), start_time: start, bib_start: Number(lo), bib_end: Number(hi), open } });
      invalidate("/api/events");
      toast.success(`${e.name} saved`);
      await onSaved();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-[9rem_1fr]">
        <div>
          <Bib number={`${e.bib_prefix}${padBib(e.bib_next)}`} eventId={e.id as never} flat />
          <p className="mt-2 text-center text-xs text-muted">next bib</p>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-bold text-navy">{e.name}</p>
            <label className="flex items-center gap-2 text-sm text-muted">
              {open ? "Open" : "Closed"}
              <Switch checked={open} onChange={setOpen} label={`${e.name} open for entries`} />
            </label>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Fee (GMD)">
              <TextInput value={fee} onChange={(x) => setFee(x.target.value.replace(/\D/g, ""))} className="h-10 tabular" />
            </Field>
            <Field label="Abroad (£)">
              <TextInput value={gbp} onChange={(x) => setGbp(x.target.value.replace(/\D/g, ""))} className="h-10 tabular" />
            </Field>
            <Field label="Start">
              <TextInput value={start} onChange={(x) => setStart(x.target.value.slice(0, 20))} className="h-10" />
            </Field>
          </div>
          <Field label={`Bib range${e.bib_prefix ? ` (with ${e.bib_prefix})` : ""}`}>
            <div className="flex items-center gap-2">
              <TextInput value={lo} onChange={(x) => setLo(x.target.value.replace(/\D/g, ""))} className="h-10 font-mono" disabled={used > 0} />
              <span className="text-muted">to</span>
              <TextInput value={hi} onChange={(x) => setHi(x.target.value.replace(/\D/g, ""))} className="h-10 font-mono" />
            </div>
          </Field>
          <div>
            <div className="h-2.5 overflow-hidden rounded-full bg-sand">
              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (used / size) * 100)}%` }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} className="h-full rounded-full bg-forest" />
            </div>
            <p className="mt-2 text-xs text-muted">
              {used.toLocaleString("en-GB")} of {size.toLocaleString("en-GB")} issued
            </p>
          </div>
          <Button size="md" variant={dirty ? "primary" : "line"} disabled={!dirty || busy} onClick={save}>
            {busy ? "Saving…" : dirty ? "Save changes" : "Saved"}
          </Button>
        </div>
      </div>
    </Panel>
  );
}
