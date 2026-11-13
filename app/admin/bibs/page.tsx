"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Info } from "@phosphor-icons/react";
import { AdminTitle, Panel } from "@/components/admin/Shell";
import { Switch, TextInput } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
import { Bib } from "@/components/Bib";
import { EVENTS, type RaceEvent } from "@/lib/data";
import { padBib } from "@/lib/format";

const ISSUED: Record<string, number> = { "21k": 412, "10k": 1288, "5k": 806, heritage: 524, "10k-virtual": 268, "5k-virtual": 114 };

/** Bib ranges per distance. Virtual entries reuse the ranges with a V in front. */
export default function Bibs() {
  const [ranges, setRanges] = useState(Object.fromEntries(EVENTS.filter((e) => e.kind === "in-person").map((e) => [e.id, e.bibRange])) as Record<string, [number, number]>);
  const [vPrefix, setVPrefix] = useState(true);
  return (
    <div className="mx-auto max-w-6xl">
      <AdminTitle title="Bib ranges" sub="Each distance draws its numbers from its own range, in the order payments are matched." actions={<Button onClick={() => toast.success("Bib ranges saved")}>Save changes</Button>} />
      <div className="grid gap-4 lg:grid-cols-2">
        {EVENTS.filter((e) => e.kind === "in-person").map((e, i) => {
          const [lo, hi] = ranges[e.id]!;
          const size = hi - lo + 1;
          const used = ISSUED[e.id]! + (vPrefix ? (e.id === "10k" ? ISSUED["10k-virtual"]! : e.id === "5k" ? ISSUED["5k-virtual"]! : 0) : 0);
          const pct = Math.min(100, (used / size) * 100);
          return (
            <motion.div key={e.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Panel>
                <div className="grid gap-5 sm:grid-cols-[9rem_1fr]">
                  <Bib number={padBib(lo + ISSUED[e.id]!)} eventId={e.id as RaceEvent["id"]} flat />
                  <div>
                    <p className="font-bold text-navy">{e.name}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <TextInput value={padBib(lo)} onChange={(ev) => setRanges((r) => ({ ...r, [e.id]: [Number(ev.target.value) || 0, hi] }))} className="h-10 font-mono" />
                      <span className="text-muted">to</span>
                      <TextInput value={padBib(hi)} onChange={(ev) => setRanges((r) => ({ ...r, [e.id]: [lo, Number(ev.target.value) || 0] }))} className="h-10 font-mono" />
                    </div>
                    <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-sand">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} className="h-full rounded-full bg-forest" />
                    </div>
                    <p className="mt-2 flex justify-between text-xs text-muted">
                      <span>
                        {used.toLocaleString("en-GB")} of {size.toLocaleString("en-GB")} used
                      </span>
                      <span className="font-mono">next {padBib(lo + ISSUED[e.id]!)}</span>
                    </p>
                  </div>
                </div>
              </Panel>
            </motion.div>
          );
        })}
      </div>
      <Panel className="mt-4">
        <div className="flex flex-wrap items-center gap-5">
          <Switch checked={vPrefix} onChange={setVPrefix} label="V prefix for virtual" />
          <div className="flex-1">
            <p className="font-bold text-navy">Virtual entries use the same ranges with a V</p>
            <p className="text-sm text-muted">So 10K Virtual bibs run V1000 to V3999 and never clash with printed bibs.</p>
          </div>
          <div className="w-40">
            <Bib number="V1213" eventId="10k-virtual" flat />
          </div>
        </div>
      </Panel>
      <p className="mt-4 flex items-center gap-2 text-sm text-muted">
        <Info weight="fill" className="size-4" /> Ranges cannot shrink below a number already issued.
      </p>
    </div>
  );
}
