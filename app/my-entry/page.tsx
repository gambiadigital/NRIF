"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Tabs } from "radix-ui";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { ArrowRight, EnvelopeSimple, ArrowsLeftRight, MapPin, CheckCircle, UserSwitch, SignOut, HourglassMedium } from "@phosphor-icons/react";
import { SiteHeader } from "@/components/site/Header";
import { Bib, BibNote } from "@/components/Bib";
import { FlagBars } from "@/components/brand";
import { Countdown } from "@/components/Countdown";
import { Button } from "@/components/ui/button";
import { CheckMark, TextInput, PhoneField, Field } from "@/components/ui/fields";
import { CodeInput } from "@/components/ui/CodeInput";
import { Sheet } from "@/components/ui/sheet";
import { RUN, TIMELINE, TIMELINE_NOTE, eventById } from "@/lib/data";
import { money } from "@/lib/format";
import { api } from "@/lib/client";
import { savedBookings } from "@/lib/store";
import { useBookingData, formatHold, type ClientBooking } from "@/lib/booking-client";
import { cn } from "@/lib/cn";

export default function MyEntryPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-dvh pt-[var(--header-h)]">
        <Suspense fallback={null}>
          <MyEntry />
        </Suspense>
      </main>
    </>
  );
}

function MyEntry() {
  const sp = useSearchParams();
  const { data, error, loading, reload } = useBookingData(sp.get("ref"), sp.get("k"));
  if (loading && !data) return <div className="mx-auto mt-20 h-64 max-w-3xl animate-pulse rounded-[2rem] bg-sand" />;
  if (!data || error) return <SignIn onDone={reload} />;
  return <Dashboard b={data} reload={reload} />;
}

function SignIn({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<"email" | "reference">("email");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [reference, setReference] = useState("");
  const [phone, setPhone] = useState({ iso: "GM", digits: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState<{ reference: string; key: string }[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setSaved(savedBookings()), 0);
    return () => clearTimeout(t);
  }, []);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const sendCode = () =>
    run(async () => {
      await api("/api/entry/code", { json: { email } });
      setSent(true);
      setCode("");
    });
  const verify = (c: string) =>
    run(async () => {
      await api("/api/entry/verify", { json: { email, code: c } });
      onDone();
    });
  const byReference = () =>
    run(async () => {
      await api("/api/entry/login", { json: { reference, digits: phone.digits } });
      onDone();
    });

  return (
    <div className="grid min-h-[calc(100dvh-var(--header-h))] grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <Image src="/media/finish.webp" alt="" fill sizes="50vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/30 to-transparent" />
        <div className="absolute bottom-10 left-10 right-10 text-white">
          <p className="flex items-center gap-2.5 font-label text-white"><FlagBars small />My entry</p>
          <p className="mt-3 font-race text-[4rem]">Your bibs, your day</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-4 py-16 sm:px-6">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {mode === "email" && !sent && (
              <motion.form
                key="email"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  void sendCode();
                }}
              >
                <h1 className="font-race text-[3.2rem] text-navy">Find your entry</h1>
                <p className="mt-2 text-muted">Enter the email you booked with. We&apos;ll send you a six-digit code; no password needed.</p>
                <div className="mt-8 space-y-4">
                  <Field label="Email" htmlFor="email">
                    <TextInput id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" leading={<EnvelopeSimple className="size-4" />} />
                  </Field>
                  {err && <p className="text-sm font-medium text-ember">{err}</p>}
                  <Button type="submit" size="lg" block arrow disabled={busy || !/^\S+@\S+\.\S+$/.test(email)}>
                    {busy ? "Sending…" : "Email me a code"}
                  </Button>
                </div>
              </motion.form>
            )}
            {mode === "email" && sent && (
              <motion.div key="code" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
                <span className="grid size-14 place-items-center rounded-2xl bg-forest-50 text-forest">
                  <EnvelopeSimple weight="duotone" className="size-7" />
                </span>
                <h1 className="mt-6 font-race text-[3.2rem] text-navy">Check your email</h1>
                <p className="mt-2 text-muted">
                  If <b className="text-navy">{email}</b> has a booking, a six-digit code is on its way. It works for 5 minutes. Check your spam folder too.
                </p>
                <div className="mt-8">
                  <CodeInput value={code} onChange={setCode} onComplete={(c) => void verify(c)} disabled={busy} />
                </div>
                {err && <p className="mt-4 text-sm font-medium text-ember">{err}</p>}
                <Button size="lg" block className="mt-6" disabled={busy || code.length < 6} onClick={() => void verify(code)}>
                  {busy ? "Checking…" : "Open my entry"}
                </Button>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <button
                    onClick={() => {
                      setSent(false);
                      setErr(null);
                    }}
                    className="py-2 font-semibold text-muted hover:text-navy"
                  >
                    Change email
                  </button>
                  <button onClick={() => void sendCode()} disabled={busy} className="py-2 font-semibold text-forest hover:underline">
                    Send a new code
                  </button>
                </div>
              </motion.div>
            )}
            {mode === "reference" && (
              <motion.form
                key="ref"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  void byReference();
                }}
              >
                <h1 className="font-race text-[3.2rem] text-navy">Use your reference</h1>
                <p className="mt-2 text-muted">The reference from your payment screen, and the phone number you booked with.</p>
                <div className="mt-8 space-y-4">
                  <Field label="Booking reference" htmlFor="ref">
                    <TextInput id="ref" value={reference} onChange={(e) => setReference(e.target.value.toUpperCase())} placeholder="RFI-7Q4K" className="font-mono uppercase tracking-wider" autoComplete="off" />
                  </Field>
                  <Field label="Phone number">
                    <PhoneField value={phone} onChange={setPhone} />
                  </Field>
                  {err && <p className="text-sm font-medium text-ember">{err}</p>}
                  <Button type="submit" size="lg" block arrow disabled={busy || reference.length < 4 || phone.digits.length < 7}>
                    {busy ? "Looking…" : "Open my entry"}
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
          <button
            onClick={() => {
              setMode(mode === "email" ? "reference" : "email");
              setErr(null);
            }}
            className="mt-6 py-2 text-sm font-semibold text-forest hover:underline"
          >
            {mode === "email" ? "No access to that email? Use your booking reference" : "Sign in with an email code instead"}
          </button>
          {saved.length > 0 && (
            <div className="mt-8">
              <p className="font-label text-muted">On this device</p>
              <div className="mt-3 space-y-2">
                {saved.map((s) => (
                  <Link key={s.reference} href={`/my-entry?ref=${s.reference}&k=${encodeURIComponent(s.key)}`} className="flex items-center justify-between rounded-2xl border border-line bg-white px-4 py-3 hover:bg-paper">
                    <span className="font-mono font-semibold text-navy">{s.reference}</span>
                    <ArrowRight weight="bold" className="size-4 text-faint" />
                  </Link>
                ))}
              </div>
            </div>
          )}
          <p className="mt-8 text-sm text-muted">
            No entry yet?{" "}
            <Link href="/register" className="font-semibold text-forest hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const TAB_LIST = [
  { v: "entries", l: "Entries" },
  { v: "day", l: "Race day" },
];

function Dashboard({ b, reload }: { b: ClientBooking; reload: () => Promise<void> }) {
  const [tab, setTab] = useState("entries");
  const [transfer, setTransfer] = useState<string | null>(null);
  const lead = b.participants[0]!;
  const allVirtual = b.participants.every((p) => eventById(p.eventId).kind === "virtual");
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const tabs = TAB_LIST;
  const amount = money(b.total, b.currency as never, { decimals: b.currency !== "GMD" });

  async function signOut() {
    await api("/api/entry/logout", { method: "POST" }).catch(() => {});
    window.location.href = "/my-entry";
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-6xl px-4 pb-32 pt-10 sm:px-6">
      <div className="flex flex-col gap-6 rounded-[2rem] bg-navy p-6 text-white sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="flex items-center gap-2.5 font-label text-white"><FlagBars small />Booking {b.reference}</p>
          <h1 className="mt-3 font-race text-[clamp(2.6rem,6vw,4rem)]">Hello, {lead.firstName}</h1>
          <p className="mt-1 text-white/65">
            {b.participants.length} {b.participants.length === 1 ? "entry" : "entries"} · {amount} {b.status === "paid" ? "paid" : "to pay"}
          </p>
        </div>
        <div>
          <p className="mb-2 font-label text-white/55">{allVirtual ? "Run window opens in" : "The run starts in"}</p>
          <Countdown compact />
        </div>
      </div>

      {b.status !== "paid" && (
        <div className="mt-6 flex flex-col gap-4 rounded-[1.5rem] bg-cobalt-50 p-5 ring-1 ring-cobalt/15 sm:flex-row sm:items-center">
          <HourglassMedium weight="duotone" className="size-8 shrink-0 text-cobalt" />
          <div className="flex-1">
            <p className="font-bold text-navy">{b.status === "pending" ? "Waiting for your payment" : "This place was released"}</p>
            <p className="text-sm text-muted">{b.status === "pending" ? `Send ${amount} with reference ${b.reference} by ${formatHold(b.holdUntil)}. Bibs arrive once it is matched.` : "No payment arrived within the hold. Book again, or contact NRIF if you have paid."}</p>
          </div>
          {b.status === "pending" && (
            <Link href="/register/pending" className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-navy px-5 font-semibold text-white">
              How to pay <ArrowRight weight="bold" className="size-4" />
            </Link>
          )}
        </div>
      )}

      {!!b.others?.length && (
        <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted">Other bookings under {b.signedInEmail}:</span>
          {b.others.map((o) => (
            <button
              key={o.reference}
              onClick={async () => {
                try {
                  await api("/api/entry/switch", { json: { reference: o.reference } });
                  await reload();
                } catch (e) {
                  toast.error((e as Error).message);
                }
              }}
              className="rounded-full border border-line bg-white px-3 py-1.5 font-mono font-semibold text-navy hover:bg-paper"
            >
              {o.reference} <span className="font-sans font-normal text-muted">· {o.status}</span>
            </button>
          ))}
        </div>
      )}

      <Tabs.Root value={tab} onValueChange={setTab} className="mt-8">
        <Tabs.List className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line">
          {tabs.map((t) => (
            <Tabs.Trigger key={t.v} value={t.v} className={cn("relative shrink-0 px-4 pb-3 pt-1 text-[0.9375rem] font-semibold transition-colors", tab === t.v ? "text-navy" : "text-muted hover:text-navy")}>
              {t.l}
              {tab === t.v && <motion.span layoutId="tab-line" className="absolute inset-x-2 -bottom-px h-[3px] rounded-full bg-forest" />}
            </Tabs.Trigger>
          ))}
          <button onClick={signOut} className="ml-auto flex shrink-0 items-center gap-1.5 px-3 pb-3 text-sm font-semibold text-muted hover:text-navy">
            <SignOut weight="bold" className="size-4" /> Sign out
          </button>
        </Tabs.List>

        <Tabs.Content value="entries" className="pt-8 outline-none">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_20rem]">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {b.participants.map((p, i) => {
                const ev = eventById(p.eventId);
                const result = b.results?.find((r) => r.participant_id === p.id);
                const moving = b.transfers?.find((t) => t.participant_id === p.id && t.status === "requested");
                return (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="rounded-[1.5rem] border border-line bg-white p-4 shadow-card">
                    <Bib number={p.bib ?? "····"} eventId={p.eventId as never} flat />
                    <div className="mt-4 flex items-start justify-between gap-3 px-1">
                      <div>
                        <p className="font-bold text-navy">{p.fullName}</p>
                        <p className="text-sm text-muted">
                          {ev.name}
                          {p.age !== null && ` · age ${p.age}`}
                        </p>
                      </div>
                      <span className={cn("flex items-center gap-1 rounded-full px-2 py-1 text-[0.6875rem] font-bold uppercase tracking-wide", b.status === "paid" ? "bg-forest-50 text-forest" : "bg-cobalt-50 text-cobalt")}>
                        {b.status === "paid" ? <CheckCircle weight="fill" className="size-3.5" /> : <HourglassMedium weight="fill" className="size-3.5" />}
                        {b.status === "paid" ? "Paid" : "Pending"}
                      </span>
                    </div>
                    {moving && <p className="mt-3 px-1 text-sm text-cobalt">Transfer to {moving.new_name} requested</p>}
                    {ev.kind === "virtual" && result && (
                      <p className={cn("mt-3 px-1 text-sm", result.status === "approved" ? "text-forest" : result.status === "rejected" ? "text-ember" : "text-muted")}>
                        Run {result.status === "submitted" ? "sent, waiting to be checked" : result.status}
                        {result.review_note ? `: ${result.review_note}` : ""}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2 px-1">
                      {!b.kitLocked && !moving && (
                        <button onClick={() => setTransfer(p.id)} className="flex h-9 items-center gap-1.5 rounded-full bg-sand px-3 text-[0.8125rem] font-semibold text-navy hover:bg-line">
                          <UserSwitch weight="bold" className="size-3.5" /> Transfer
                        </button>
                      )}
                      {ev.kind === "virtual" && b.status === "paid" && (
                        <Link href={`/my-entry/upload?p=${p.id}`} className="flex h-9 items-center gap-1.5 rounded-full bg-cobalt-50 px-3 text-[0.8125rem] font-semibold text-cobalt hover:bg-cobalt-100">
                          Upload my run
                        </Link>
                      )}
                      {result?.status === "approved" && (
                        <Link href={`/certificate?p=${p.id}`} className="flex h-9 items-center gap-1.5 rounded-full bg-forest-50 px-3 text-[0.8125rem] font-semibold text-forest hover:bg-forest-100">
                          Certificate
                        </Link>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              {!allVirtual && <BibNote className="sm:col-span-2 max-w-none" />}
            </div>
            <div className="rounded-[1.5rem] border border-line bg-white p-6 text-center shadow-card">
              {allVirtual ? (
                <>
                  <p className="font-bold text-navy">Ready when you are</p>
                  <p className="mt-1 text-sm text-muted">Run any day, {RUN.virtualWindow}, then upload it here. Uploads open on 23 January.</p>
                </>
              ) : b.status === "paid" ? (
                <>
                  <p className="font-label text-muted">Your booking code</p>
                  <div className="mx-auto mt-4 w-fit rounded-2xl bg-white p-3 ring-1 ring-line">
                    <QRCodeSVG value={`R4I:${b.reference}`} size={176} fgColor="#0b1b3a" />
                  </div>
                  <p className="mt-4 font-mono text-sm font-semibold text-navy">{b.reference}</p>
                  <p className="mt-1 text-sm text-muted">
                    Show it when you collect {b.participants.length > 1 ? `all ${b.participants.length} bibs` : "your bib"}. We will tell you where and when before race day.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-bold text-navy">Your QR code arrives with your bibs</p>
                  <p className="mt-1 text-sm text-muted">You show it when you collect your bib.</p>
                </>
              )}
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="day" className="pt-8 outline-none">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-[1.5rem] border border-line bg-white p-6 shadow-card">
              <p className="font-label text-muted">{RUN.dateLong}</p>
              <ol className="mt-4 space-y-3">
                {TIMELINE.map((t) => {
                  const mine = t.label === "Start" && b.participants.some((p) => eventById(p.eventId).kind === "in-person");
                  return (
                    <li key={t.time} className={cn("flex items-center gap-4 rounded-xl px-3 py-2", mine && "bg-forest-50")}>
                      <span className="w-12 font-mono font-semibold text-navy">{t.time}</span>
                      <span className="flex-1 font-semibold text-navy">{t.label}</span>
                      {mine && <span className="text-xs font-bold uppercase tracking-wide text-forest">Yours</span>}
                    </li>
                  );
                })}
              </ol>
              <p className="mt-3 px-3 text-sm text-muted">{TIMELINE_NOTE}</p>
              <a href="https://maps.google.com/?q=Independence+Stadium+Bakau" target="_blank" rel="noreferrer" className="mt-5 flex items-center gap-2 py-2 text-sm font-semibold text-forest hover:underline">
                <MapPin weight="bold" className="size-4" /> Directions to {RUN.venue}
              </a>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-white p-6 shadow-card">
              <p className="font-bold text-navy">What to bring</p>
              <div className="mt-4 space-y-2">
                {[
                  { k: "bib", l: "Bib pinned on the front, with medical notes on the back" },
                  { k: "water", l: "A water bottle; there is water on the course" },
                  { k: "id", l: "Your booking QR code, from your email or this page" },
                  { k: "hat", l: "A hat and sun cream. It is warm by 08:00" },
                ].map((x) => (
                  <button key={x.k} onClick={() => setChecks((c) => ({ ...c, [x.k]: !c[x.k] }))} className="group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-paper">
                    <CheckMark checked={!!checks[x.k]} />
                    <span className={cn("text-[0.9375rem] transition-colors", checks[x.k] ? "text-muted line-through" : "text-navy")}>{x.l}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Tabs.Content>

      </Tabs.Root>

      <TransferSheet participantId={transfer} onClose={() => setTransfer(null)} onDone={reload} />
    </motion.div>
  );
}

function TransferSheet({ participantId, onClose, onDone }: { participantId: string | null; onClose: () => void; onDone: () => Promise<void> }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState({ iso: "GM", digits: "" });
  const [busy, setBusy] = useState(false);
  async function send() {
    setBusy(true);
    try {
      await api("/api/entry/transfer", { json: { participantId, newName: name, newPhone: phone } });
      toast.success("Transfer requested", { description: "NRIF will contact them to add their details and accept the waiver. The bib number stays the same." });
      onClose();
      setName("");
      setPhone({ iso: "GM", digits: "" });
      await onDone();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Sheet
      open={participantId !== null}
      onOpenChange={(o) => !o && onClose()}
      title="Transfer this entry"
      description="Free until Sat 9 Jan 2027. NRIF contacts the new runner to add their details and accept the waiver."
      footer={
        <Button block size="lg" icon={<ArrowsLeftRight weight="bold" className="size-5" />} disabled={busy || name.trim().length < 2 || phone.digits.length < 7} onClick={send}>
          {busy ? "Sending…" : "Request the transfer"}
        </Button>
      }
    >
      <AnimatePresence>
        <div className="space-y-4">
          <Field label="Their full name">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Their phone">
            <PhoneField value={phone} onChange={setPhone} />
          </Field>
        </div>
      </AnimatePresence>
    </Sheet>
  );
}
