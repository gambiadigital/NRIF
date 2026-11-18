"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { MagnifyingGlass, DownloadSimple, ShieldCheck, Camera, EnvelopeSimple, Tag, Phone, CaretRight, Copy, LinkSimple, UsersThree } from "@phosphor-icons/react";
import { AdminTitle, Panel, Empty } from "@/components/admin/Shell";
import { Badge, Select } from "@/components/ui/fields";
import { Sheet } from "@/components/ui/sheet";
import { Bib } from "@/components/Bib";
import { EVENTS } from "@/lib/data";
import { COUNTRY_CODES, money } from "@/lib/format";
import { useAdmin, when } from "@/lib/admin-client";
import { cn } from "@/lib/cn";

type Row = {
  id: string;
  booking_id: string;
  reference: string;
  status: string;
  bib: string | null;
  full_name: string;
  event: string;
  kind: string;
  age: number;
  gender: string | null;
  shirt: string | null;
  residence: string;
  lives_in: string | null;
  team_code: string | null;
  source: string | null;
  created_at: string;
};

type Detail = {
  booking: Record<string, string | number | boolean | null> & { link: string };
  people: { id: string; full_name: string; event_id: string; bib: string | null; bib_name: string | null; shirt: string | null; dob: string; guardian_is_lead: boolean; guardian_name: string | null; is_lead: boolean }[];
  messages: { channel: string; to_addr: string; template: string; status: string; created_at: string }[];
  activity: { at: string; actor: string; text: string }[];
  receipts: { method: string; amount: number; payer: string | null; received_at: string; matched_by: string | null }[];
  transfers: { id: string; new_name: string; new_phone: string; status: string; full_name: string }[];
};

const STATUS_TONE: Record<string, "forest" | "cobalt" | "neutral" | "ember"> = { paid: "forest", pending: "cobalt", released: "neutral", cancelled: "ember" };
const phone = (v: unknown) => {
  const [iso, digits] = String(v ?? "").split(":");
  return digits ? `${COUNTRY_CODES.find((c) => c.iso === iso)?.dial ?? ""} ${digits}` : String(v ?? "");
};

export default function Entries() {
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [ev, setEv] = useState("");
  const [st, setSt] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setTerm(q), 300);
    return () => clearTimeout(t);
  }, [q]);
  const qs = new URLSearchParams({ q: term, event: ev, status: st }).toString();
  const { data } = useAdmin<{ rows: Row[]; total: number }>(`/api/admin/entries?${qs}`);

  return (
    <div className="mx-auto max-w-7xl">
      <AdminTitle
        title="Entries"
        sub={data ? `${data.total.toLocaleString("en-GB")} ${data.total === 1 ? "participant" : "participants"}${term || ev || st ? " match" : ""}` : "Loading…"}
        actions={
          <a href={`/api/admin/entries?${qs}&format=csv`} className="flex h-11 items-center gap-2 rounded-full border border-line-strong bg-white px-5 text-[0.9375rem] font-semibold text-navy hover:bg-paper">
            <DownloadSimple weight="bold" className="size-4" /> Export CSV
          </a>
        }
      />
      <Panel className="p-0">
        <div className="grid grid-cols-1 gap-3 border-b border-line p-4 sm:grid-cols-[1fr_14rem_11rem]">
          <div className="relative">
            <MagnifyingGlass className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, bib, reference, phone, town or team" className="h-12 w-full rounded-xl border border-line bg-white pl-10 pr-3 text-[0.9375rem] outline-none focus:border-forest" />
          </div>
          <Select value={ev} onChange={setEv} options={[{ value: "", label: "All events" }, ...EVENTS.map((e) => ({ value: e.id, label: e.name }))]} />
          <Select value={st} onChange={setSt} options={[{ value: "", label: "Any status" }, { value: "paid", label: "Paid" }, { value: "pending", label: "Pending" }, { value: "released", label: "Released" }]} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead>
              <tr className="font-label text-muted [&>th]:px-4 [&>th]:py-3">
                <th>Bib</th>
                <th>Name</th>
                <th>Event</th>
                <th>Age</th>
                <th>Lives in</th>
                <th>Source</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data?.rows.map((e, i) => (
                <motion.tr key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i, 20) * 0.015 }} onClick={() => setOpen(e.booking_id)} className="cursor-pointer border-t border-line transition-colors hover:bg-paper [&>td]:px-4 [&>td]:py-3.5">
                  <td className="font-mono font-semibold text-cobalt">{e.bib ?? "—"}</td>
                  <td>
                    <span className="block font-semibold text-navy">{e.full_name}</span>
                    <span className="font-mono text-xs text-muted">{e.reference}</span>
                  </td>
                  <td className="text-navy">{e.event}</td>
                  <td className="text-muted">{e.age}</td>
                  <td className="text-muted">{e.lives_in}</td>
                  <td>
                    <span className="rounded-md bg-sand px-1.5 py-0.5 font-mono text-xs text-navy">{e.source ?? "direct"}</span>
                    {e.team_code && <span className="ml-1 rounded-md bg-forest-50 px-1.5 py-0.5 font-mono text-xs text-forest">{e.team_code}</span>}
                  </td>
                  <td>
                    <Badge tone={STATUS_TONE[e.status] ?? "neutral"}>{e.status}</Badge>
                  </td>
                  <td>
                    <CaretRight weight="bold" className="size-4 text-faint" />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {data && data.rows.length === 0 && (
            <div className="p-6">
              <Empty>{term || ev || st ? "No entries match." : "No entries yet. They appear here as people sign up."}</Empty>
            </div>
          )}
        </div>
      </Panel>
      <BookingDrawer id={open} onClose={() => setOpen(null)} />
    </div>
  );
}

function BookingDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data } = useAdmin<Detail>(id ? `/api/admin/bookings/${id}` : null);
  const d = id && data && String(data.booking.id) === id ? data : null;
  const b = d?.booking;
  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()} title={b ? String(b.reference) : "Booking"} description={b ? `${String(b.status)} · booked ${when(String(b.created_at))} · ${money(Number(b.total), String(b.currency) as never, { decimals: b.currency !== "GMD" })}` : "Loading…"} wide>
      {!d || !b ? (
        <div className="h-60 animate-pulse rounded-2xl bg-paper" />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {d.people.map((p) => (
              <div key={p.id} className="flex gap-3 rounded-2xl border border-line p-3">
                <div className="w-24 shrink-0">
                  <Bib number={p.bib ?? "····"} eventId={p.event_id as never} flat />
                </div>
                <div className="min-w-0 text-sm">
                  <p className="font-bold text-navy">{p.full_name}</p>
                  <p className="text-muted">{EVENTS.find((e) => e.id === p.event_id)?.name}</p>
                  <p className="text-muted">
                    Born {new Date(p.dob).toLocaleDateString("en-GB")}
                  </p>
                  {!p.is_lead && !p.guardian_is_lead && p.guardian_name && <p className="text-cobalt">Guardian: {p.guardian_name}</p>}
                </div>
              </div>
            ))}
          </div>

          <ul className="divide-y divide-line rounded-2xl border border-line text-sm">
            {[
              { icon: Phone, l: "Phone", v: phone(`${b.phone_iso}:${b.phone}`) },
              { icon: EnvelopeSimple, l: "Email", v: String(b.email) },
              { icon: ShieldCheck, l: "Emergency contact", v: `${b.emergency_name}${b.emergency_relation ? `, ${b.emergency_relation}` : ""} · ${phone(b.emergency_phone)}` },
              { icon: ShieldCheck, l: `Waiver ${b.waiver_version}`, v: `Accepted ${when(String(b.waiver_accepted_at))}${b.consent_guardian ? ", with guardian consent" : ""}` },
              { icon: Camera, l: "Photos and video", v: b.consent_photos ? "Yes" : "No" },
              { icon: EnvelopeSimple, l: "NRIF news", v: b.consent_news ? "Yes" : "No" },
              { icon: Tag, l: "Source", v: `?src=${b.source ?? "direct"}${b.referral ? ` · referred by bib ${b.referral}` : ""}` },
              { icon: UsersThree, l: "Team", v: String(b.team_code ?? "—") },
            ].map((x) => (
              <li key={x.l} className="flex items-start gap-3 p-3">
                <x.icon weight="duotone" className="mt-0.5 size-5 shrink-0 text-forest" />
                <span className="w-36 shrink-0 text-muted">{x.l}</span>
                <span className="min-w-0 flex-1 break-words font-semibold text-navy">{x.v}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => {
              navigator.clipboard?.writeText(d.booking.link).catch(() => {});
              toast.success("Booking link copied", { description: "It opens this booking for the participant, without signing in." });
            }}
            className="flex w-full items-center gap-3 rounded-2xl bg-paper p-3 text-left text-sm hover:bg-sand"
          >
            <LinkSimple weight="bold" className="size-4 text-muted" />
            <span className="min-w-0 flex-1 truncate font-mono text-navy">{d.booking.link}</span>
            <Copy weight="bold" className="size-4 text-muted" />
          </button>

          {d.transfers.length > 0 && (
            <div>
              <p className="mb-2 font-label text-muted">Transfer requests</p>
              {d.transfers.map((t) => (
                <p key={t.id} className="text-sm text-navy">
                  {t.full_name} → {t.new_name} ({phone(t.new_phone)}) · {t.status}
                </p>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 font-label text-muted">Messages</p>
              {d.messages.length ? (
                <ul className="space-y-1.5 text-sm">
                  {d.messages.map((m, i) => (
                    <li key={i} className="flex justify-between gap-2">
                      <span className="text-navy">
                        {m.template} · {m.channel}
                      </span>
                      <span className={cn("font-semibold", m.status === "sent" ? "text-forest" : m.status === "failed" ? "text-ember" : "text-muted")}>{m.status}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">None yet.</p>
              )}
            </div>
            <div>
              <p className="mb-2 font-label text-muted">History</p>
              <ul className="space-y-1.5 text-sm">
                {d.activity.map((a, i) => (
                  <li key={i} className="text-navy">
                    <span className="mr-2 font-mono text-xs text-muted">{when(a.at)}</span>
                    {a.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </Sheet>
  );
}
