"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { TrendUp, Users, CurrencyCircleDollar, HourglassMedium, WarningCircle, ArrowRight, DownloadSimple } from "@phosphor-icons/react";
import { AdminTitle, Panel } from "@/components/admin/Shell";
import { AreaChart, BarList, Donut } from "@/components/admin/Charts";
import { CitiesMap } from "@/components/CitiesMap";
import { CountUp } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";
import { ACTIVITY, CHANNELS, CITIES, DAILY_ENTRIES, RUN } from "@/lib/data";
import { cn } from "@/lib/cn";

const LABELS = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(Date.UTC(2026, 9, 15 + i));
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
});

const KPIS = [
  { label: "Entries", value: RUN.entries, delta: "+128 today", icon: Users, tone: "text-forest bg-forest-50", f: (n: number) => Math.round(n).toLocaleString("en-GB") },
  { label: "Raised for the fund", value: RUN.raised, delta: `${Math.round((RUN.raised / RUN.goal) * 100)}% of GMD 20m`, icon: CurrencyCircleDollar, tone: "text-[#a77208] bg-sun-50", f: (n: number) => `GMD ${(n / 1e6).toFixed(2)}m` },
  { label: "Pending payments", value: 37, delta: "5 on day 4 or 5", icon: HourglassMedium, tone: "text-cobalt bg-cobalt-50", f: (n: number) => String(Math.round(n)) },
  { label: "Unmatched receipts", value: 4, delta: "Need matching by hand", icon: WarningCircle, tone: "text-ember bg-ember-50", f: (n: number) => String(Math.round(n)) },
];

export default function Overview() {
  const abroad = CITIES.reduce((a, c) => a + c.count, 0);
  return (
    <div className="mx-auto max-w-7xl">
      <AdminTitle
        title="Good afternoon, Mariama"
        sub={`${RUN.name} ${RUN.edition} · ${RUN.dateShort} · 78 days to go`}
        actions={
          <>
            <Button variant="line" size="md" icon={<DownloadSimple weight="bold" className="size-4" />}>
              Export entries
            </Button>
            <Link href="/admin/payments" className="flex h-11 items-center gap-2 rounded-full bg-forest px-5 text-[0.9375rem] font-semibold text-white hover:bg-forest-700">
              Match payments <ArrowRight weight="bold" className="size-4" />
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="rounded-[1.25rem] border border-line bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted">{k.label}</span>
              <span className={cn("grid size-9 place-items-center rounded-xl", k.tone)}>
                <k.icon weight="fill" className="size-5" />
              </span>
            </div>
            <p className="mt-3 font-bib text-[2.6rem] leading-none text-navy">
              <CountUp to={k.value} format={k.f} />
            </p>
            <p className="mt-2 flex items-center gap-1 text-[0.8125rem] text-muted">
              {i === 0 && <TrendUp weight="bold" className="size-3.5 text-forest" />}
              {k.delta}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Entries per day" aside={<span className="text-xs text-muted">Last 30 days</span>}>
          <AreaChart data={DAILY_ENTRIES} labels={LABELS} className="mt-2" />
        </Panel>
        <Panel title="Where they live">
          <div className="flex items-center gap-6">
            <Donut parts={[{ value: RUN.entries - abroad, color: "#135f40" }, { value: abroad, color: "#2a3181" }]} label={`${Math.round((abroad / RUN.entries) * 100)}%`} sub="abroad" />
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-forest" />
                The Gambia <b className="ml-auto pl-4 text-navy">{(RUN.entries - abroad).toLocaleString("en-GB")}</b>
              </li>
              <li className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-cobalt" />
                Abroad <b className="ml-auto pl-4 text-navy">{abroad.toLocaleString("en-GB")}</b>
              </li>
              <li className="text-muted">
                {RUN.citiesCounted} of {RUN.citiesGoal} cities counted
              </li>
            </ul>
          </div>
          <div className="mt-4 rounded-2xl bg-paper p-3">
            <CitiesMap tone="light" labels={false} />
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="By event">
          <BarList
            rows={[
              { label: "10K", value: 1288, color: "#1f3c99" },
              { label: "5K", value: 806, color: "#135f40" },
              { label: "1.965K Heritage walk", value: 524, color: "#f2b233" },
              { label: "21K Half marathon", value: 412, color: "#d7141a" },
              { label: "10K Virtual", value: 268, color: "#2a3181" },
              { label: "5K Virtual", value: 114, color: "#4b54b0" },
            ]}
          />
        </Panel>
        <Panel title="Sign-ups by source tag">
          <BarList rows={CHANNELS.map((c) => ({ label: c.label, value: c.entries, color: c.color, sub: `?src=${c.tag}` }))} />
        </Panel>
        <Panel title="Activity" aside={<Link href="/admin/payments" className="text-sm font-semibold text-forest hover:underline">All</Link>}>
          <ol className="space-y-3.5">
            {ACTIVITY.map((a) => (
              <li key={a.t + a.text} className="flex gap-3 text-sm">
                <span className="w-10 shrink-0 font-mono text-xs font-semibold text-muted">{a.t}</span>
                <span className="text-navy">{a.text}</span>
              </li>
            ))}
          </ol>
        </Panel>
      </div>
    </div>
  );
}
