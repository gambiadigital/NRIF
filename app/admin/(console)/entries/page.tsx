"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DownloadSimple, CaretRight, MapPin, Globe } from "@phosphor-icons/react";
import { AdminTitle, Empty, SearchBox, Toolbar } from "@/components/admin/Shell";
import { BookingDrawer } from "@/components/admin/BookingDrawer";
import { Badge, Select } from "@/components/ui/fields";
import { EVENTS } from "@/lib/data";
import { useAdmin, STATUS_LABEL, STATUS_TONE } from "@/lib/admin-client";
import { cn } from "@/lib/cn";

type Row = {
  id: string;
  booking_id: string;
  reference: string;
  status: string;
  bib: string | null;
  full_name: string;
  event: string;
  kind: "in-person" | "virtual";
  age: number;
  residence: string;
  lives_in: string | null;
  team_code: string | null;
  created_at: string;
};

/** Physical: on the day at Independence Stadium. Virtual: run anywhere and upload proof. */
function RaceType({ kind }: { kind: string }) {
  const virtual = kind === "virtual";
  return (
    <span className={cn("inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-xs font-semibold", virtual ? "bg-cobalt-50 text-cobalt" : "bg-forest-50 text-forest")}>
      {virtual ? <Globe weight="bold" className="size-3" /> : <MapPin weight="fill" className="size-3" />}
      {virtual ? "Virtual" : "Physical"}
    </span>
  );
}

export default function EntriesPage() {
  return (
    <Suspense fallback={null}>
      <EntriesFromUrl />
    </Suspense>
  );
}

/** The top bar's quick search lands here as ?q=…; a new search starts the page afresh. */
function EntriesFromUrl() {
  const q = useSearchParams().get("q") ?? "";
  return <Entries key={q} initial={q} />;
}

function Entries({ initial }: { initial: string }) {
  const [q, setQ] = useState(initial);
  const [term, setTerm] = useState(initial);
  const [ev, setEv] = useState("");
  const [st, setSt] = useState("");
  const [kind, setKind] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setTerm(q), 300);
    return () => clearTimeout(t);
  }, [q]);
  const qs = new URLSearchParams({ q: term, event: ev, status: st }).toString();
  const { data } = useAdmin<{ rows: Row[]; total: number }>(`/api/admin/entries?${qs}`);
  const rows = (data?.rows ?? []).filter((r) => !kind || r.kind === kind);
  const filtered = !!(term || ev || st || kind);

  return (
    <div className="mx-auto max-w-7xl">
      <AdminTitle
        title="Entries"
        sub={data ? `${(kind ? rows.length : data.total).toLocaleString("en-GB")} ${(kind ? rows.length : data.total) === 1 ? "participant" : "participants"}${filtered ? " match" : ""}` : "Loading…"}
        actions={
          <a href={`/api/admin/entries?${qs}&format=csv`} className="flex h-11 items-center gap-2 rounded-full border border-line-strong bg-white px-5 text-[0.9375rem] font-semibold text-navy hover:bg-paper">
            <DownloadSimple weight="bold" className="size-4" /> Export CSV
          </a>
        }
      />

      <Toolbar>
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2 @2xl:grid-cols-3 @2xl:gap-3 @4xl:grid-cols-[1fr_13rem_10rem_11rem]">
          <SearchBox field value={q} onChange={setQ} placeholder="Name, bib, reference, phone, town or team" className="col-span-2 @2xl:col-span-3 @4xl:col-span-1" />
          <Select value={ev} onChange={setEv} options={[{ value: "", label: "All events" }, ...EVENTS.map((e) => ({ value: e.id, label: e.name }))]} />
          <Select value={kind} onChange={setKind} options={[{ value: "", label: "Any race type" }, { value: "in-person", label: "Physical" }, { value: "virtual", label: "Virtual" }]} />
          <Select value={st} onChange={setSt} className="col-span-2 @2xl:col-span-1" options={[{ value: "", label: "Any status" }, { value: "paid", label: "Confirmed" }, { value: "pending", label: "Waiting for payment" }, { value: "released", label: "Released" }]} />
        </div>
      </Toolbar>

      {!data ? (
        <div className="h-64 animate-pulse rounded-[1.25rem] bg-white/70" />
      ) : rows.length === 0 ? (
        <Empty>{filtered ? "No entries match." : "No entries yet. They appear here as people sign up."}</Empty>
      ) : (
        <div className="overflow-hidden rounded-[1.25rem] border border-line bg-white">
          {/* Laptop and up: a table that fits the width. */}
          <table className="hidden w-full table-fixed text-left text-sm md:table">
            <thead>
              <tr className="font-label text-muted [&>th]:px-4 [&>th]:py-3">
                <th className="w-[5.5rem]">Bib</th>
                <th>Name</th>
                <th className="w-[22%]">Event</th>
                <th className="w-[3.5rem]">Age</th>
                <th className="hidden w-[16%] xl:table-cell">Lives in</th>
                <th className="w-[7.5rem]">Race type</th>
                <th className="w-[8rem]">Status</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} onClick={() => setOpen(e.booking_id)} className="cursor-pointer border-t border-line transition-colors hover:bg-paper [&>td]:px-4 [&>td]:py-3.5">
                  <td className="font-mono font-semibold text-cobalt">{e.bib ?? "—"}</td>
                  <td className="min-w-0">
                    <span className="block truncate font-semibold text-navy">{e.full_name}</span>
                    <span className="block truncate font-mono text-xs text-muted">
                      {e.reference}
                      {e.team_code && <span className="ml-2 rounded bg-forest-50 px-1.5 py-0.5 text-forest">{e.team_code}</span>}
                    </span>
                  </td>
                  <td className="truncate text-navy">{e.event}</td>
                  <td className="text-muted">{e.age}</td>
                  <td className="hidden truncate text-muted xl:table-cell">{e.lives_in}</td>
                  <td>
                    <RaceType kind={e.kind} />
                  </td>
                  <td>
                    <Badge tone={STATUS_TONE[e.status] ?? "neutral"}>{STATUS_LABEL[e.status] ?? e.status}</Badge>
                  </td>
                  <td>
                    <CaretRight weight="bold" className="size-4 text-faint" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Phones: one card per participant, nothing to scroll sideways. */}
          <ul className="divide-y divide-line md:hidden">
            {rows.map((e) => (
              <li key={e.id}>
                <button onClick={() => setOpen(e.booking_id)} className="flex w-full items-center gap-3 p-4 text-left active:bg-paper">
                  <span className="grid h-12 w-14 shrink-0 place-items-center rounded-xl bg-paper font-mono text-sm font-bold text-cobalt">{e.bib ?? "—"}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-navy">{e.full_name}</span>
                    <span className="block truncate text-xs text-muted">
                      {e.event} · {e.age} · <span className="font-mono">{e.reference}</span>
                    </span>
                    <span className="mt-1.5 flex flex-wrap gap-1.5">
                      <RaceType kind={e.kind} />
                      <Badge tone={STATUS_TONE[e.status] ?? "neutral"}>{STATUS_LABEL[e.status] ?? e.status}</Badge>
                    </span>
                  </span>
                  <CaretRight weight="bold" className="size-4 shrink-0 text-faint" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <BookingDrawer id={open} onClose={() => setOpen(null)} />
    </div>
  );
}
