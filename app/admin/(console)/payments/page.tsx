"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, HourglassMedium, WarningCircle, Lightning, HandPointing, BellRinging, MagnifyingGlass, Plus, ArrowsClockwise, Trash, Clock, CheckCircle, PaperPlaneTilt, Footprints } from "@phosphor-icons/react";
import { AdminTitle, Panel, Empty } from "@/components/admin/Shell";
import { Badge, RadioDot, Field, TextInput, Select } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { PayMark } from "@/components/register/PayMethods";
import { api } from "@/lib/client";
import { useAdmin, when, hhmm, gmd } from "@/lib/admin-client";
import { money } from "@/lib/format";
import { cn } from "@/lib/cn";

type Receipt = { id: string; method: string; amount: number; currency: string; payer: string | null; note: string | null; reference_given: string | null; status: string; auto: boolean; matched_by: string | null; received_at: string; booking_reference: string | null; bibs: string | null; lead: string | null };
type Pending = { id: string; reference: string; total: number; currency: string; pay_method: string; created_at: string; hold_until: string; payer_claimed_at: string | null; residence: string; city: string | null; day: number; expired: boolean; lead: string; people: number; events: string };
type Pledge = { id: string; reference: string; amount: number; name: string | null; steps_code: string; created_at: string };
type Data = { receipts: Receipt[]; pending: Pending[]; pledges: Pledge[]; activity: { at: string; actor: string; text: string }[] };

const METHODS = [
  { value: "wave", label: "Wave" },
  { value: "yonna", label: "Yonna" },
  { value: "ecobank", label: "Ecobank" },
  { value: "remit", label: "Remitly or ACE" },
  { value: "card", label: "Visa or Mastercard" },
  { value: "cash", label: "Cash" },
  { value: "other", label: "Other" },
];

const amt = (n: number, c: string) => money(n, c as never, { decimals: c !== "GMD" });

export default function Payments() {
  const { data, reload } = useAdmin<Data>("/api/admin/payments");
  const unmatched = data?.receipts.filter((r) => r.status === "unmatched") ?? [];
  const matched = data?.receipts.filter((r) => r.status !== "unmatched") ?? [];
  const [tab, setTab] = useState<"unmatched" | "waiting" | "matched" | "pledges" | null>(null);
  const active = tab ?? (unmatched.length ? "unmatched" : "waiting");
  const [recording, setRecording] = useState(false);
  const [matching, setMatching] = useState<Receipt | null>(null);
  const [confirming, setConfirming] = useState<Pending | null>(null);

  async function act(p: Pending, action: "remind" | "extend" | "release") {
    try {
      await api(`/api/admin/bookings/${p.id}`, { json: { action } });
      toast.success(action === "remind" ? `Reminder queued for ${p.reference}` : action === "extend" ? `${p.reference} held 3 more days` : `${p.reference} released`);
      void reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const tabs = [
    { v: "unmatched" as const, l: "Unmatched receipts", n: unmatched.length },
    { v: "waiting" as const, l: "Waiting bookings", n: data?.pending.length ?? 0 },
    { v: "pledges" as const, l: "Steps pledges", n: data?.pledges.length ?? 0 },
    { v: "matched" as const, l: "Matched", n: matched.length },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <AdminTitle
        title="Payment matching"
        sub="Record money as it reaches NRIF's accounts and match it to a booking. Matching issues the bibs and sends the confirmation."
        actions={
          <>
            <Button variant="line" icon={<ArrowsClockwise weight="bold" className="size-4" />} onClick={() => reload()}>
              Refresh
            </Button>
            <Button icon={<Plus weight="bold" className="size-4" />} onClick={() => setRecording(true)}>
              Record a receipt
            </Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {(["wave", "card", "yonna", "ecobank", "remit"] as const).map((m) => (
          <div key={m} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3">
            <PayMark id={m} />
            <span className="min-w-0">
              <span className="block text-sm font-bold text-navy">{METHODS.find((x) => x.value === m)!.label}</span>
              <span className="block text-xs text-muted">{data?.receipts.filter((r) => r.method === m).length ?? 0} receipts</span>
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[1fr_20rem]">
        <Panel className="p-0">
          <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-line p-4">
            {tabs.map((t) => (
              <button key={t.v} onClick={() => setTab(t.v)} className={cn("flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors", active === t.v ? "bg-forest text-white" : "bg-sand text-navy hover:bg-line")}>
                {t.l}
                <span className={cn("rounded-full px-1.5 text-xs", active === t.v ? "bg-white/20" : "bg-white")}>{t.n}</span>
              </button>
            ))}
          </div>

          <div className="p-4">
            {!data && <div className="h-40 animate-pulse rounded-2xl bg-paper" />}

            {data && active === "unmatched" &&
              (unmatched.length ? (
                <ul className="space-y-2">
                  {unmatched.map((r) => (
                    <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-ember/20 bg-ember-50/40 p-3">
                      <PayMark id={(["wave", "yonna", "ecobank", "remit", "card"].includes(r.method) ? r.method : "remit") as never} />
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-navy">
                          {gmd(r.amount)} <span className="font-normal text-muted">by {r.method}</span>
                        </span>
                        <span className="block text-xs text-muted">
                          {when(r.received_at)} · {r.payer || "payer not noted"} · {r.reference_given ? <span className="font-mono">{r.reference_given}</span> : "no reference"}
                          {r.note && ` · ${r.note}`}
                        </span>
                      </span>
                      <Button size="sm" variant="ink" icon={<HandPointing weight="bold" className="size-3.5" />} onClick={() => setMatching(r)}>
                        Match
                      </Button>
                      <button
                        onClick={async () => {
                          try {
                            await api("/api/admin/match", { method: "DELETE", json: { receiptId: r.id } });
                            toast("Receipt set aside");
                            void reload();
                          } catch (e) {
                            toast.error((e as Error).message);
                          }
                        }}
                        className="grid size-9 place-items-center rounded-full text-muted hover:bg-white hover:text-ember"
                        aria-label="Set aside"
                      >
                        <Trash weight="bold" className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty>Every receipt is matched. Record new money with “Record a receipt”.</Empty>
              ))}

            {data && active === "waiting" &&
              (data.pending.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[54rem] text-left text-sm">
                    <thead>
                      <tr className="font-label text-muted [&>th]:px-3 [&>th]:py-2">
                        <th>Reference</th>
                        <th>Booking</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Hold</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.pending.map((p) => (
                        <tr key={p.id} className="border-t border-line [&>td]:px-3 [&>td]:py-3">
                          <td className="font-mono font-semibold text-navy">{p.reference}</td>
                          <td>
                            <span className="block font-medium text-navy">
                              {p.lead}
                              {p.people > 1 && <span className="text-muted"> +{p.people - 1}</span>}
                            </span>
                            <span className="block max-w-[16rem] truncate text-xs text-muted">
                              {p.events}
                              {p.city ? ` · ${p.city}` : ""}
                            </span>
                          </td>
                          <td className="whitespace-nowrap font-semibold text-navy tabular">{amt(p.total, p.currency)}</td>
                          <td className="whitespace-nowrap text-muted">{p.pay_method}</td>
                          <td>
                            {p.expired ? (
                              <Badge tone="ember">Hold ended</Badge>
                            ) : (
                              <Badge tone="cobalt" icon={<HourglassMedium weight="fill" className="size-3" />}>
                                Day {Math.min(p.day, 5)} of 5
                              </Badge>
                            )}
                            {p.payer_claimed_at && <span className="mt-1 flex items-center gap-1 text-xs font-semibold text-cobalt"><PaperPlaneTilt weight="fill" className="size-3" /> Says sent</span>}
                          </td>
                          <td className="whitespace-nowrap text-right">
                            <button onClick={() => setConfirming(p)} className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-xs font-semibold text-forest hover:bg-forest-50">
                              <CheckCircle weight="bold" className="size-3.5" /> Paid
                            </button>
                            <button onClick={() => act(p, "remind")} className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-xs font-semibold text-muted hover:bg-sand hover:text-navy">
                              <BellRinging weight="bold" className="size-3.5" /> Remind
                            </button>
                            <button onClick={() => act(p, "extend")} className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-xs font-semibold text-muted hover:bg-sand hover:text-navy">
                              <Clock weight="bold" className="size-3.5" /> +3 days
                            </button>
                            <button onClick={() => act(p, "release")} className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-xs font-semibold text-muted hover:bg-ember-50 hover:text-ember">
                              Release
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty>No bookings are waiting for payment.</Empty>
              ))}

            {data && active === "pledges" &&
              (data.pledges.length ? (
                <ul className="space-y-2">
                  {data.pledges.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 rounded-2xl border border-line p-3">
                      <span className="grid size-10 place-items-center rounded-xl bg-royal text-white">
                        <Footprints weight="fill" className="size-5" />
                      </span>
                      <span className="flex-1">
                        <span className="block font-semibold text-navy">
                          {gmd(p.amount)} to {p.steps_code}
                        </span>
                        <span className="block text-xs text-muted">
                          <span className="font-mono">{p.reference}</span> · {p.name || "anonymous"} · {when(p.created_at)}
                        </span>
                      </span>
                    </li>
                  ))}
                  <p className="pt-2 text-xs text-muted">Record the money as a receipt, then match it to the pledge.</p>
                </ul>
              ) : (
                <Empty>No steps pledges are waiting.</Empty>
              ))}

            {data && active === "matched" &&
              (matched.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[46rem] text-left text-sm">
                    <thead>
                      <tr className="font-label text-muted [&>th]:px-3 [&>th]:py-2">
                        <th>Received</th>
                        <th>Paid via</th>
                        <th>Amount</th>
                        <th>Booking</th>
                        <th>Status</th>
                        <th>Bibs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matched.map((r) => (
                        <tr key={r.id} className="border-t border-line [&>td]:px-3 [&>td]:py-3">
                          <td className="whitespace-nowrap text-muted">{when(r.received_at)}</td>
                          <td className="text-muted">{r.method}</td>
                          <td className="whitespace-nowrap font-semibold text-navy tabular">{gmd(r.amount)}</td>
                          <td>
                            <span className="block font-mono font-semibold text-navy">{r.booking_reference ?? "—"}</span>
                            <span className="text-xs text-muted">{r.lead ?? ""}</span>
                          </td>
                          <td>
                            {r.status === "ignored" ? (
                              <Badge tone="neutral">Set aside</Badge>
                            ) : r.auto ? (
                              <Badge tone="forest" icon={<Lightning weight="fill" className="size-3" />}>Auto-matched</Badge>
                            ) : (
                              <Badge tone="forest" icon={<Check weight="bold" className="size-3" />}>{r.matched_by ?? "Matched"}</Badge>
                            )}
                          </td>
                          <td className="font-mono text-[0.8125rem] font-semibold text-cobalt">{r.bibs ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty>Nothing matched yet.</Empty>
              ))}
          </div>
        </Panel>

        <Panel title="Activity">
          {data?.activity.length ? (
            <ol className="space-y-3">
              {data.activity.map((a) => (
                <li key={a.at + a.text} className="flex gap-3 text-[0.8125rem]">
                  <span className="w-10 shrink-0 font-mono text-xs font-semibold text-muted">{hhmm(a.at)}</span>
                  <span className="text-navy">{a.text}</span>
                </li>
              ))}
            </ol>
          ) : (
            <Empty>No activity yet.</Empty>
          )}
        </Panel>
      </div>

      <RecordSheet open={recording} onClose={() => setRecording(false)} onDone={reload} />
      <MatchSheet receipt={matching} data={data} onClose={() => setMatching(null)} onDone={reload} />
      <ConfirmSheet booking={confirming} onClose={() => setConfirming(null)} onDone={reload} />
    </div>
  );
}

function RecordSheet({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => Promise<void> }) {
  const [method, setMethod] = useState("wave");
  const [amount, setAmount] = useState("");
  const [payer, setPayer] = useState("");
  const [ref, setRef] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    try {
      const r = await api<{ matched: boolean }>("/api/admin/receipts", { json: { method, amount: Number(amount), payer: payer || undefined, referenceGiven: ref || undefined, note: note || undefined } });
      toast.success(r.matched ? "Recorded and matched. Bibs issued." : "Receipt recorded", { description: r.matched ? undefined : "Match it to a booking from Unmatched receipts." });
      setAmount("");
      setPayer("");
      setRef("");
      setNote("");
      onClose();
      await onDone();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Sheet
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Record a receipt"
      description="Money that has reached an NRIF account. If it quotes a waiting reference and covers the amount, it is matched straight away."
      footer={
        <Button block size="lg" disabled={busy || !Number(amount)} onClick={save}>
          {busy ? "Saving…" : "Record receipt"}
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Paid via">
          <Select value={method} onChange={setMethod} options={METHODS} />
        </Field>
        <Field label="Amount received (GMD)">
          <TextInput inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} className="tabular" />
        </Field>
        <Field label="Reference quoted" optional>
          <TextInput value={ref} onChange={(e) => setRef(e.target.value.toUpperCase())} placeholder="RFI-7Q4K" className="font-mono uppercase" />
        </Field>
        <Field label="Payer" optional>
          <TextInput value={payer} onChange={(e) => setPayer(e.target.value)} placeholder="Name or number" />
        </Field>
        <Field label="Note" optional className="sm:col-span-2">
          <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="Transaction ID, anything useful" />
        </Field>
      </div>
    </Sheet>
  );
}

function MatchSheet({ receipt, data, onClose, onDone }: { receipt: Receipt | null; data: Data | null; onClose: () => void; onDone: () => Promise<void> }) {
  const [q, setQ] = useState("");
  const [pick, setPick] = useState<{ kind: "booking" | "pledge"; id: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const rows = useMemo(() => {
    if (!data || !receipt) return [];
    const term = q.toLowerCase();
    const bookings = data.pending.map((p) => ({
      kind: "booking" as const,
      id: p.id,
      ref: p.reference,
      who: p.lead + (p.people > 1 ? ` +${p.people - 1}` : ""),
      what: p.events,
      amount: amt(p.total, p.currency),
      likely: p.reference === receipt.reference_given || (p.currency === "GMD" && Math.abs(p.total - receipt.amount) < 1),
    }));
    const pledges = data.pledges.map((p) => ({
      kind: "pledge" as const,
      id: p.id,
      ref: p.reference,
      who: p.name || "Anonymous",
      what: `Steps pledge to ${p.steps_code}`,
      amount: gmd(p.amount),
      likely: p.reference === receipt.reference_given || Math.abs(p.amount - receipt.amount) < 1,
    }));
    return [...bookings, ...pledges].filter((r) => !term || `${r.ref} ${r.who} ${r.what}`.toLowerCase().includes(term)).sort((a, b) => Number(b.likely) - Number(a.likely));
  }, [data, receipt, q]);

  async function confirm() {
    if (!receipt || !pick) return;
    setBusy(true);
    try {
      const r = await api<{ bibs?: string[] }>("/api/admin/match", { json: { receiptId: receipt.id, ...(pick.kind === "booking" ? { bookingId: pick.id } : { pledgeId: pick.id }) } });
      toast.success("Matched", { description: r.bibs?.length ? `Bibs ${r.bibs.join(", ")} issued. Confirmation queued.` : "Pledge marked as paid." });
      setPick(null);
      onClose();
      await onDone();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      open={!!receipt}
      onOpenChange={(o) => {
        if (!o) {
          setPick(null);
          onClose();
        }
      }}
      title="Match this receipt"
      description={receipt ? `${gmd(receipt.amount)} by ${receipt.method} · ${when(receipt.received_at)} · ${receipt.reference_given ?? "no reference"}` : undefined}
      wide
      footer={
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-muted">{pick ? "Matching issues bibs and queues the confirmation." : "Choose what this money is for"}</span>
          <Button size="lg" disabled={!pick || busy} onClick={confirm}>
            {busy ? "Matching…" : "Match"}
          </Button>
        </div>
      }
    >
      <div className="relative">
        <MagnifyingGlass className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search references and names" className="h-11 w-full rounded-xl border border-line pl-10 pr-3 text-sm outline-none focus:border-forest" />
      </div>
      <ul className="mt-3 space-y-2">
        {rows.length === 0 && <Empty>Nothing is waiting for payment.</Empty>}
        {rows.map((r) => (
          <li key={r.kind + r.id}>
            <button onClick={() => setPick({ kind: r.kind, id: r.id })} className={cn("flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors", pick?.id === r.id ? "border-forest bg-forest-50/50" : "border-line hover:bg-paper")}>
              <RadioDot checked={pick?.id === r.id} />
              <span className="w-24 shrink-0 font-mono text-sm font-semibold text-navy">{r.ref}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-navy">{r.who}</span>
                <span className="block truncate text-xs text-muted">{r.what}</span>
              </span>
              <span className="whitespace-nowrap text-sm font-semibold text-navy">{r.amount}</span>
              {r.likely && <Badge tone="forest">Likely</Badge>}
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

function ConfirmSheet({ booking, onClose, onDone }: { booking: Pending | null; onClose: () => void; onDone: () => Promise<void> }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  async function confirm() {
    if (!booking) return;
    setBusy(true);
    try {
      const r = await api<{ bibs: string[] }>(`/api/admin/bookings/${booking.id}`, { json: { action: "confirm", note: note || undefined } });
      toast.success(`${booking.reference} confirmed`, { description: `Bibs ${r.bibs.join(", ")} issued.` });
      setNote("");
      onClose();
      await onDone();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Sheet
      open={!!booking}
      onOpenChange={(o) => !o && onClose()}
      title={`Confirm ${booking?.reference ?? ""} as paid`}
      description="Without a receipt: for cash, or money you have seen arrive in an account. Prefer recording a receipt, so the fund total counts it."
      footer={
        <Button block size="lg" disabled={busy || note.trim().length < 3} onClick={confirm}>
          {busy ? "Confirming…" : "Confirm and issue bibs"}
        </Button>
      }
    >
      <div className="flex items-start gap-3 rounded-2xl bg-cobalt-50 p-4 text-sm text-navy ring-1 ring-cobalt/15">
        <WarningCircle weight="fill" className="mt-0.5 size-5 shrink-0 text-cobalt" />
        {booking ? `${booking.lead} · ${booking.events} · ${amt(booking.total, booking.currency)}` : ""}
      </div>
      <Field label="Why, for the record" className="mt-4">
        <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="Paid cash at the NRIF office" />
      </Field>
    </Sheet>
  );
}
