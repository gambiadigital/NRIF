"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, BellRinging, ArrowCounterClockwise, GearSix, PersonSimpleRun, Receipt, UserCircle, Robot, ClockCounterClockwise, CircleNotch, SignIn, type Icon } from "@phosphor-icons/react";
import { AdminTitle, Empty, SearchBox, Toolbar } from "@/components/admin/Shell";
import { Select } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client";
import { useAdmin, useNow, ago, hhmm, dayLabel } from "@/lib/admin-client";
import { initials } from "@/lib/format";
import { cn } from "@/lib/cn";

type Member = { id: string; name: string; email: string; role: string; last_login_at: string | null; confirmed: number; reminded: number; released: number; actions: number; last_action_at: string | null };
type Entry = { id: string; at: string; actor: string; kind: string; text: string; reference: string | null; booking_id: string | null };
type Data = { rows: Entry[]; more: boolean; team: Member[] };

const ACTIONS = [
  { value: "", label: "Every action" },
  { value: "confirm", label: "Payment confirmations" },
  { value: "remind", label: "Reminders" },
  { value: "release", label: "Releases" },
  { value: "settings", label: "Settings, events, team" },
  { value: "virtual", label: "Virtual run reviews" },
  { value: "payments", label: "Card and Wave" },
  { value: "bookings", label: "Bookings and sign-ins" },
];

/** How each kind of action looks in the timeline. */
const KIND: Record<string, { icon: Icon; tone: string; label: string }> = {
  confirm: { icon: CheckCircle, tone: "bg-forest-50 text-forest", label: "Confirmed" },
  revert: { icon: ArrowCounterClockwise, tone: "bg-ember-50 text-ember", label: "Undone" },
  remind: { icon: BellRinging, tone: "bg-cobalt-50 text-cobalt", label: "Reminder" },
  release: { icon: ArrowCounterClockwise, tone: "bg-ember-50 text-ember", label: "Released" },
  cancel: { icon: ArrowCounterClockwise, tone: "bg-ember-50 text-ember", label: "Cancelled" },
  extend: { icon: ClockCounterClockwise, tone: "bg-sand text-navy", label: "Hold" },
  admin: { icon: UserCircle, tone: "bg-sand text-navy", label: "Team" },
  settings: { icon: GearSix, tone: "bg-sand text-navy", label: "Settings" },
  event: { icon: GearSix, tone: "bg-sand text-navy", label: "Events" },
  team: { icon: GearSix, tone: "bg-sand text-navy", label: "Team codes" },
  template: { icon: GearSix, tone: "bg-sand text-navy", label: "Emails" },
  virtual: { icon: PersonSimpleRun, tone: "bg-cobalt-50 text-cobalt", label: "Virtual run" },
  card: { icon: Receipt, tone: "bg-sand text-navy", label: "Card" },
  wave: { icon: Receipt, tone: "bg-sand text-navy", label: "Wave" },
  signin: { icon: SignIn, tone: "bg-sand text-navy", label: "Sign-in" },
};
const kindOf = (k: string) => KIND[k] ?? { icon: ClockCounterClockwise, tone: "bg-sand text-navy", label: k.charAt(0).toUpperCase() + k.slice(1) };

export default function Audit() {
  const now = useNow();
  const [actor, setActor] = useState("");
  const [kind, setKind] = useState("");
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setTerm(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);
  const qs = new URLSearchParams({ actor, kind, q: term }).toString();
  const { data } = useAdmin<Data>(`/api/admin/audit?${qs}`);

  // Older pages are fetched on demand and appended; a new filter starts over.
  const [older, setOlder] = useState<{ qs: string; rows: Entry[]; more: boolean } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const extra = older?.qs === qs ? older : null;
  const rows = data ? [...data.rows, ...(extra?.rows ?? [])] : [];
  const more = extra ? extra.more : data?.more;

  async function loadMore() {
    const last = rows[rows.length - 1];
    if (!last) return;
    setLoadingMore(true);
    try {
      const r = await api<Data>(`/api/admin/audit?${qs}&before=${encodeURIComponent(last.at)}`);
      setOlder({ qs, rows: [...(extra?.rows ?? []), ...r.rows], more: r.more });
    } finally {
      setLoadingMore(false);
    }
  }

  const people = [
    { value: "", label: "Everyone" },
    { value: "staff", label: "Staff only" },
    ...(data?.team ?? []).map((m) => ({ value: m.name, label: m.name })),
    { value: "participants", label: "Participants" },
    { value: "system", label: "Automatic" },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <AdminTitle title="Audit" sub="What every member of the team has done, newest first: payment confirmations, reminders, releases and changes to settings." />

      <div className="mb-2 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {data?.team.map((m) => {
          const on = actor === m.name;
          return (
            <button
              key={m.id}
              onClick={() => setActor(on ? "" : m.name)}
              aria-pressed={on}
              className={cn("rounded-[1.25rem] border bg-white p-4 text-left transition-[border-color,box-shadow]", on ? "border-forest shadow-[0_0_0_3px_rgb(19_95_64/0.15)]" : "border-line hover:border-line-strong")}
            >
              <span className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-navy text-sm font-bold text-white">{initials(m.name)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold text-navy">{m.name}</span>
                  <span className="block truncate text-xs text-muted">
                    {m.role} · {m.last_action_at ? `last action ${ago(m.last_action_at, now)}` : "no actions yet"}
                  </span>
                </span>
              </span>
              <span className="mt-3 grid grid-cols-3 gap-2 text-center">
                {[
                  { n: m.confirmed, l: "confirmed" },
                  { n: m.reminded, l: "reminded" },
                  { n: m.released, l: "released" },
                ].map((x) => (
                  <span key={x.l} className="rounded-xl bg-paper py-2">
                    <span className="block font-bib text-xl leading-none text-navy">{x.n}</span>
                    <span className="mt-1 block text-[0.6875rem] font-semibold text-muted">{x.l}</span>
                  </span>
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <Toolbar>
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-2 @xl:gap-3 @3xl:grid-cols-[1fr_12rem_14rem]">
          <SearchBox field value={q} onChange={setQ} placeholder="Search: a reference, a name, a word" className="col-span-2 @3xl:col-span-1" />
          <Select value={actor} onChange={setActor} options={people} />
          <Select value={kind} onChange={setKind} options={ACTIONS} />
        </div>
      </Toolbar>

      {!data ? (
        <div className="h-72 animate-pulse rounded-[1.25rem] bg-white/70" />
      ) : rows.length === 0 ? (
        <Empty>{actor || kind || term ? "Nothing matches these filters." : "Nothing has happened yet."}</Empty>
      ) : (
        <div className="overflow-hidden rounded-[1.25rem] border border-line bg-white">
          {rows.map((a, i) => {
            const day = dayLabel(a.at);
            const newDay = i === 0 || dayLabel(rows[i - 1]!.at) !== day;
            const k = kindOf(a.kind);
            const staff = data.team.some((m) => m.name === a.actor);
            return (
              <div key={a.id}>
                {newDay && <p className={cn("bg-paper px-4 py-2 font-label text-muted sm:px-5", i > 0 && "border-t border-line")}>{day}</p>}
                <div className="flex gap-3 border-t border-line px-4 py-3.5 first:border-t-0 sm:gap-4 sm:px-5">
                  <span className="w-11 shrink-0 pt-0.5 font-mono text-xs font-semibold text-muted">{hhmm(a.at)}</span>
                  <span className={cn("grid size-8 shrink-0 place-items-center rounded-full", k.tone)}>
                    <k.icon weight="fill" className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                      <span className="inline-flex items-center gap-1 font-bold text-navy">
                        {!staff && (a.actor === "payer" || a.actor === "participant" ? <UserCircle weight="fill" className="size-4 text-faint" /> : <Robot weight="fill" className="size-4 text-faint" />)}
                        {staff ? a.actor : a.actor === "payer" || a.actor === "participant" ? "Participant" : a.actor === "system" ? "Automatic" : a.actor}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">{k.label}</span>
                    </p>
                    <p className="mt-0.5 break-words text-sm text-navy">{a.text}</p>
                    {a.reference && (
                      <Link href={`/admin/entries?q=${encodeURIComponent(a.reference)}`} className="mt-1 inline-block font-mono text-xs font-semibold text-forest hover:underline">
                        Open {a.reference}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {more && (
        <div className="mt-4 text-center">
          <Button variant="line" disabled={loadingMore} icon={loadingMore ? <CircleNotch weight="bold" className="size-4 animate-spin" /> : undefined} onClick={loadMore}>
            {loadingMore ? "Loading…" : "Show older"}
          </Button>
        </div>
      )}
    </div>
  );
}
