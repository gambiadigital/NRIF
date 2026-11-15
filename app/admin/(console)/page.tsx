"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { TrendUp, Users, CurrencyCircleDollar, HourglassMedium, WarningCircle, ArrowRight, DownloadSimple } from "@phosphor-icons/react";
import { AdminTitle, Panel, Empty } from "@/components/admin/Shell";
import { AreaChart, BarList, Donut } from "@/components/admin/Charts";
import { CitiesMap } from "@/components/CitiesMap";
import { CountUp } from "@/components/ui/motion";
import { RUN } from "@/lib/data";
import { useAdmin, hhmm } from "@/lib/admin-client";
import { cn } from "@/lib/cn";

type Overview = {
  kpis: { entries: number; bookings: number; pending: number; pending_late: number; unmatched: number; raised: number; today: number; goal: number };
  daily: { day: string; n: number }[];
  byEvent: { id: string; name: string; n: number }[];
  bySource: { source: string; n: number }[];
  residence: { home: number; abroad: number; cities: number } | null;
  cities: { city: string; n: number }[];
  activity: { at: string; actor: string; text: string }[];
};

const EVENT_COLOURS: Record<string, string> = { "21k": "#d7141a", "10k": "#1f3c99", "5k": "#135f40", heritage: "#f2b233", "10k-virtual": "#2a3181", "5k-virtual": "#4b54b0" };
const SOURCE_COLOURS = ["#2a3181", "#1f3c99", "#135f40", "#0b1b3a", "#f2b233", "#5d6577", "#cfc8b9"];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function Overview() {
  const { data } = useAdmin<Overview>("/api/admin/overview");
  const me = useAdmin<{ name: string }>("/api/admin/me").data;
  const k = data?.kpis;
  const [clock, setClock] = useState<{ days: number; hello: string } | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setClock({ days: Math.max(0, Math.ceil((new Date(RUN.dateISO).getTime() - Date.now()) / 86400_000)), hello: greeting() }), 0);
    return () => clearTimeout(t);
  }, []);
  const days = clock?.days ?? 0;
  const kpis = [
    { label: "Paid entries", value: k?.entries ?? 0, delta: `${k?.today ?? 0} booked in the last day`, icon: Users, tone: "text-forest bg-forest-50", f: (n: number) => Math.round(n).toLocaleString("en-GB") },
    { label: "Raised for the fund", value: k?.raised ?? 0, delta: `${k ? ((k.raised / k.goal) * 100).toFixed(1) : 0}% of GMD ${((k?.goal ?? RUN.goal) / 1e6).toFixed(0)}m`, icon: CurrencyCircleDollar, tone: "text-[#a77208] bg-sun-50", f: (n: number) => `GMD ${Math.round(n).toLocaleString("en-GB")}` },
    { label: "Waiting for payment", value: k?.pending ?? 0, delta: `${k?.pending_late ?? 0} past day 3`, icon: HourglassMedium, tone: "text-cobalt bg-cobalt-50", f: (n: number) => String(Math.round(n)) },
    { label: "Unmatched receipts", value: k?.unmatched ?? 0, delta: "Need matching by hand", icon: WarningCircle, tone: "text-ember bg-ember-50", f: (n: number) => String(Math.round(n)) },
  ];
  const abroad = data?.residence?.abroad ?? 0;
  const home = data?.residence?.home ?? 0;

  return (
    <div className="mx-auto max-w-7xl">
      <AdminTitle
        title={`${clock?.hello ?? "Hello"}${me ? `, ${me.name.split(" ")[0]}` : ""}`}
        sub={`${RUN.name} ${RUN.edition} · ${RUN.dateShort} · ${days} days to go`}
        actions={
          <>
            <a href="/api/admin/entries?format=csv" className="flex h-11 items-center gap-2 rounded-full border border-line-strong bg-white px-5 text-[0.9375rem] font-semibold text-navy hover:bg-paper">
              <DownloadSimple weight="bold" className="size-4" /> Export entries
            </a>
            <Link href="/admin/payments" className="flex h-11 items-center gap-2 rounded-full bg-forest px-5 text-[0.9375rem] font-semibold text-white hover:bg-forest-700">
              Match payments <ArrowRight weight="bold" className="size-4" />
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((x, i) => (
          <motion.div key={x.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="rounded-[1.25rem] border border-line bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted">{x.label}</span>
              <span className={cn("grid size-9 place-items-center rounded-xl", x.tone)}>
                <x.icon weight="fill" className="size-5" />
              </span>
            </div>
            <p className="mt-3 font-bib text-[2.4rem] leading-none text-navy">
              <CountUp key={x.value} to={x.value} format={x.f} />
            </p>
            <p className="mt-2 flex items-center gap-1 text-[0.8125rem] text-muted">
              {i === 0 && <TrendUp weight="bold" className="size-3.5 text-forest" />}
              {x.delta}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Entries booked per day" aside={<span className="text-xs text-muted">Last 30 days</span>}>
          {data && <AreaChart data={data.daily.map((d) => d.n)} labels={data.daily.map((d) => new Date(d.day).toLocaleDateString("en-GB", { day: "numeric", month: "short" }))} className="mt-2" />}
        </Panel>
        <Panel title="Where they live">
          <div className="flex flex-wrap items-center gap-6">
            <Donut parts={[{ value: home || (abroad ? 0 : 1), color: "#135f40" }, { value: abroad, color: "#2a3181" }]} label={home + abroad ? `${Math.round((abroad / (home + abroad)) * 100)}%` : "0%"} sub="abroad" />
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-forest" />
                The Gambia <b className="ml-auto pl-4 text-navy">{home.toLocaleString("en-GB")}</b>
              </li>
              <li className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-cobalt" />
                Abroad <b className="ml-auto pl-4 text-navy">{abroad.toLocaleString("en-GB")}</b>
              </li>
              <li className="text-muted">
                {data?.residence?.cities ?? 0} of {RUN.citiesGoal} cities counted
              </li>
            </ul>
          </div>
          <div className="mt-4 rounded-2xl bg-paper p-3">
            <CitiesMap tone="light" labels={false} counts={data?.cities} />
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Paid entries by event">
          {data && <BarList rows={data.byEvent.map((e) => ({ label: e.name, value: e.n, color: EVENT_COLOURS[e.id] ?? "#0b1b3a" }))} />}
        </Panel>
        <Panel title="Paid entries by source tag">
          {data && (data.bySource.length ? <BarList rows={data.bySource.map((c, i) => ({ label: c.source, value: c.n, color: SOURCE_COLOURS[i % SOURCE_COLOURS.length]!, sub: `?src=${c.source}` }))} /> : <Empty>No paid entries yet.</Empty>)}
        </Panel>
        <Panel title="Activity" aside={<Link href="/admin/payments" className="-my-1.5 rounded-full px-2.5 py-1.5 text-sm font-semibold text-forest hover:bg-forest-50">Payments</Link>}>
          {data && (data.activity.length ? (
            <ol className="space-y-3.5">
              {data.activity.map((a) => (
                <li key={a.at + a.text} className="flex gap-3 text-sm">
                  <span className="w-10 shrink-0 font-mono text-xs font-semibold text-muted">{hhmm(a.at)}</span>
                  <span className="text-navy">{a.text}</span>
                </li>
              ))}
            </ol>
          ) : <Empty>Nothing has happened yet.</Empty>)}
        </Panel>
      </div>
    </div>
  );
}
