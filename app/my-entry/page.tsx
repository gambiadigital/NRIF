"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { Tabs } from "radix-ui";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { DeviceMobile, ArrowRight, LockSimple, ArrowsLeftRight, PencilSimple, Footprints, Package, MapPin, CheckCircle, ShareNetwork, UserSwitch, SignOut } from "@phosphor-icons/react";
import { SiteHeader } from "@/components/site/Header";
import { Bib } from "@/components/Bib";
import { Countdown } from "@/components/Countdown";
import { Button } from "@/components/ui/button";
import { ChipGroup, CheckMark, TextInput, PhoneField } from "@/components/ui/fields";
import { Sheet } from "@/components/ui/sheet";
import { useBooking, total, fmt } from "@/lib/store";
import { RUN, SHIRT_SIZES, TIMELINE, eventById } from "@/lib/data";
import { raceDayAge, formatPhone, COUNTRY_CODES } from "@/lib/format";
import { cn } from "@/lib/cn";

export default function MyEntry() {
  const [signedIn, setSignedIn] = useState(false);
  return (
    <>
      <SiteHeader />
      <main className="min-h-dvh pt-[var(--header-h)]">
        <AnimatePresence mode="wait">{signedIn ? <Dashboard key="d" onSignOut={() => setSignedIn(false)} /> : <SignIn key="s" onDone={() => setSignedIn(true)} />}</AnimatePresence>
      </main>
    </>
  );
}

function SignIn({ onDone }: { onDone: () => void }) {
  const b = useBooking();
  const [phone, setPhone] = useState(b.contact.phone);
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const dial = COUNTRY_CODES.find((c) => c.iso === phone.iso)?.dial;

  useEffect(() => {
    if (code.every((c) => c)) {
      const t = setTimeout(onDone, 450);
      return () => clearTimeout(t);
    }
  }, [code, onDone]);

  function autofill() {
    "196522".split("").forEach((d, i) =>
      setTimeout(() => {
        setCode((c) => c.map((x, j) => (j === i ? d : x)));
      }, 120 * (i + 1)),
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid min-h-[calc(100dvh-var(--header-h))] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <Image src="/media/finish.webp" alt="" fill sizes="50vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/30 to-transparent" />
        <div className="absolute bottom-10 left-10 right-10 text-white">
          <p className="font-label text-sun">My entry</p>
          <p className="mt-3 font-race text-[4rem]">Your bibs, your kit, your day</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-4 py-16 sm:px-6">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.div key="p" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h1 className="font-race text-[3.2rem] text-navy">Find your entry</h1>
                <p className="mt-2 text-muted">Enter the phone number you registered with. We text you a six-digit code; no password needed.</p>
                <div className="mt-8 space-y-4">
                  <PhoneField value={phone} onChange={setPhone} />
                  <Button size="lg" block arrow onClick={() => setSent(true)} disabled={phone.digits.length < 7}>
                    Text me a code
                  </Button>
                  <p className="text-center text-sm text-muted">
                    Or use your reference code, like <span className="font-mono text-navy">RFI-7Q4K</span>
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div key="c" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <span className="grid size-14 place-items-center rounded-2xl bg-forest-50 text-forest">
                  <DeviceMobile weight="duotone" className="size-7" />
                </span>
                <h1 className="mt-6 font-race text-[3.2rem] text-navy">Check your texts</h1>
                <p className="mt-2 text-muted">
                  We sent a code to {dial} {formatPhone(phone.digits, phone.iso).replace(/\d(?=[\d ]{4})/g, "•")}
                </p>
                <div className="mt-8 flex justify-between gap-2" onPaste={(e) => {
                  const d = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
                  if (d.length === 6) setCode(d);
                }}>
                  {code.map((c, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        refs.current[i] = el;
                      }}
                      value={c}
                      inputMode="numeric"
                      maxLength={1}
                      aria-label={`Digit ${i + 1}`}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "");
                        setCode((cur) => cur.map((x, j) => (j === i ? v : x)));
                        if (v && i < 5) refs.current[i + 1]?.focus();
                      }}
                      onKeyDown={(e) => e.key === "Backspace" && !c && i > 0 && refs.current[i - 1]?.focus()}
                      className={cn(
                        "h-16 w-full min-w-0 rounded-2xl border-2 bg-white text-center font-bib text-[2rem] text-navy outline-none transition-colors focus:border-forest",
                        c ? "border-forest/60" : "border-line",
                      )}
                    />
                  ))}
                </div>
                <Button variant="ink" block size="lg" className="mt-6" onClick={autofill}>
                  Prototype: fill the code
                </Button>
                <button onClick={() => setSent(false)} className="mt-4 w-full text-center text-sm font-semibold text-muted hover:text-navy">
                  Use a different number
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

const TAB_LIST = [
  { v: "entries", l: "Entries" },
  { v: "kit", l: "Kit" },
  { v: "day", l: "Race day" },
  { v: "steps", l: "Steps challenge" },
];

function Dashboard({ onSignOut }: { onSignOut: () => void }) {
  const b = useBooking();
  const [tab, setTab] = useState("entries");
  const [transfer, setTransfer] = useState<string | null>(null);
  const lead = b.participants[0]!;
  const virtual = eventById(lead.eventId).kind === "virtual";
  const [checks, setChecks] = useState<Record<string, boolean>>({ bib: true });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-auto max-w-6xl px-4 pb-32 pt-10 sm:px-6">
      <div className="flex flex-col gap-6 rounded-[2rem] bg-navy p-6 text-white sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-label text-sun">Booking {b.reference}</p>
          <h1 className="mt-3 font-race text-[clamp(2.6rem,6vw,4rem)]">Hello, {lead.fullName.split(" ")[0]}</h1>
          <p className="mt-1 text-white/65">
            {b.participants.length} {b.participants.length === 1 ? "entry" : "entries"} · {fmt(b, total(b))} paid · {b.contact.town}
          </p>
        </div>
        <div>
          <p className="mb-2 font-label text-white/55">{virtual ? "Run window opens in" : "The 10K starts in"}</p>
          <Countdown compact />
        </div>
      </div>

      <Tabs.Root value={tab} onValueChange={setTab} className="mt-8">
        <Tabs.List className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line">
          {TAB_LIST.map((t) => (
            <Tabs.Trigger key={t.v} value={t.v} className={cn("relative shrink-0 px-4 pb-3 pt-1 text-[0.9375rem] font-semibold transition-colors", tab === t.v ? "text-navy" : "text-muted hover:text-navy")}>
              {t.l}
              {tab === t.v && <motion.span layoutId="tab-line" className="absolute inset-x-2 -bottom-px h-[3px] rounded-full bg-forest" />}
            </Tabs.Trigger>
          ))}
          <button onClick={onSignOut} className="ml-auto flex shrink-0 items-center gap-1.5 px-3 pb-3 text-sm font-semibold text-muted hover:text-navy">
            <SignOut weight="bold" className="size-4" /> Sign out
          </button>
        </Tabs.List>

        <Tabs.Content value="entries" className="pt-8 outline-none">
          <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
            <div className="grid gap-4 sm:grid-cols-2">
              {b.participants.map((p, i) => {
                const ev = eventById(p.eventId);
                return (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="rounded-[1.5rem] border border-line bg-white p-4 shadow-card">
                    <Bib number={b.bibs[p.id] ?? "····"} eventId={p.eventId} name={p.bibName} flat />
                    <div className="mt-4 flex items-start justify-between gap-3 px-1">
                      <div>
                        <p className="font-bold text-navy">{p.fullName}</p>
                        <p className="text-sm text-muted">
                          {ev.name} · age {raceDayAge(p.dob)} · {p.shirt}
                        </p>
                      </div>
                      <span className="flex items-center gap-1 rounded-full bg-forest-50 px-2 py-1 text-[0.6875rem] font-bold uppercase tracking-wide text-forest">
                        <CheckCircle weight="fill" className="size-3.5" /> Paid
                      </span>
                    </div>
                    <div className="mt-4 flex gap-2 px-1">
                      <button onClick={() => setTab("kit")} className="flex h-9 items-center gap-1.5 rounded-full bg-sand px-3 text-[0.8125rem] font-semibold text-navy hover:bg-line">
                        <PencilSimple weight="bold" className="size-3.5" /> Kit
                      </button>
                      <button onClick={() => setTransfer(p.id)} className="flex h-9 items-center gap-1.5 rounded-full bg-sand px-3 text-[0.8125rem] font-semibold text-navy hover:bg-line">
                        <UserSwitch weight="bold" className="size-3.5" /> Transfer
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div className="rounded-[1.5rem] border border-line bg-white p-6 text-center shadow-card">
              {virtual ? (
                <>
                  <p className="font-bold text-navy">Ready when you are</p>
                  <p className="mt-1 text-sm text-muted">Run any day, {RUN.virtualWindow} Jan, then upload it here.</p>
                  <Link href="/my-entry/upload" className="mt-5 flex h-12 items-center justify-center gap-2 rounded-full bg-cobalt font-semibold text-white">
                    Upload my run <ArrowRight weight="bold" className="size-4" />
                  </Link>
                </>
              ) : (
                <>
                  <p className="font-label text-muted">Race-pack collection</p>
                  <div className="mx-auto mt-4 w-fit rounded-2xl bg-white p-3 ring-1 ring-line">
                    <QRCodeSVG value={`R4I:${b.reference}`} size={176} fgColor="#0b1b3a" />
                  </div>
                  <p className="mt-4 font-mono text-sm font-semibold text-navy">{b.reference}</p>
                  <p className="mt-1 text-sm text-muted">
                    {RUN.racePacksShort}, 10:00 to 17:00. Collects all {b.participants.length} packs.
                  </p>
                </>
              )}
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="kit" className="pt-8 outline-none">
          <div className="mb-5 flex items-center gap-3 rounded-2xl bg-sun-50 px-5 py-4 text-sm text-navy ring-1 ring-sun/40">
            <LockSimple weight="fill" className="size-5 text-[#a77208]" />
            <span>
              Sizes and bib names lock on <b>{RUN.kitLock}</b> so printing can start.
            </span>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {b.participants.map((p) => (
              <div key={p.id} className="grid gap-5 rounded-[1.5rem] border border-line bg-white p-5 shadow-card sm:grid-cols-[1fr_10rem]">
                <div className="space-y-4">
                  <p className="font-bold text-navy">{p.fullName}</p>
                  <ChipGroup value={p.shirt} onChange={(v) => b.patchParticipant(p.id, { shirt: v })} options={SHIRT_SIZES.map((s) => ({ value: s, label: s }))} />
                  <TextInput
                    value={p.bibName}
                    maxLength={10}
                    onChange={(e) => b.patchParticipant(p.id, { bibName: e.target.value.toUpperCase().replace(/[^A-Z' -]/g, "") })}
                    className="font-mono uppercase tracking-[0.12em]"
                  />
                </div>
                <Bib number={b.bibs[p.id] ?? "····"} eventId={p.eventId} name={p.bibName} flat className="self-center" />
              </div>
            ))}
          </div>
        </Tabs.Content>

        <Tabs.Content value="day" className="pt-8 outline-none">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[1.5rem] border border-line bg-white p-6 shadow-card">
              <p className="font-label text-muted">{RUN.dateLong}</p>
              <ol className="mt-4 space-y-3">
                {TIMELINE.map((t) => {
                  const mine = b.participants.some((p) => t.label.startsWith(eventById(p.eventId).distance) || (t.label === "Heritage walk" && p.eventId === "heritage"));
                  return (
                    <li key={t.time} className={cn("flex items-center gap-4 rounded-xl px-3 py-2", mine && "bg-forest-50")}>
                      <span className="w-12 font-mono font-semibold text-navy">{t.time}</span>
                      <span className="flex-1 font-semibold text-navy">{t.label}</span>
                      {mine && <span className="text-xs font-bold uppercase tracking-wide text-forest">Yours</span>}
                    </li>
                  );
                })}
              </ol>
              <a href="#" className="mt-5 flex items-center gap-2 text-sm font-semibold text-forest hover:underline">
                <MapPin weight="bold" className="size-4" /> Directions to {RUN.venue}
              </a>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-white p-6 shadow-card">
              <p className="font-bold text-navy">What to bring</p>
              <div className="mt-4 space-y-2">
                {[
                  { k: "bib", l: "Bib pinned on the front, with medical notes on the back" },
                  { k: "water", l: "A water bottle; there is water every 2.5 km" },
                  { k: "id", l: "ID for anyone collecting race packs" },
                  { k: "kids", l: "Snacks and a hat for the Heritage walk" },
                  { k: "sun", l: "Sun cream. It is warm by 08:00" },
                ].map((x) => (
                  <button key={x.k} onClick={() => setChecks((c) => ({ ...c, [x.k]: !c[x.k] }))} className="group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-paper">
                    <CheckMark checked={!!checks[x.k]} />
                    <span className={cn("text-[0.9375rem] transition-colors", checks[x.k] ? "text-muted line-through" : "text-navy")}>{x.l}</span>
                  </button>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-3 rounded-2xl bg-paper p-4 text-sm text-muted">
                <Package weight="duotone" className="size-6 text-forest" />
                Packs: {RUN.racePacks}
              </div>
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="steps" className="pt-8 outline-none">
          <div className="grid gap-6 rounded-[2rem] bg-sun p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="flex items-center gap-2 font-label text-navy">
                <Footprints weight="fill" className="size-4" /> Steps challenge · SC-1047
              </p>
              <p className="mt-3 font-bib text-[4rem] leading-none text-navy">GMD 6,850</p>
              <p className="text-navy/70">raised by 14 supporters, 146,880 steps logged</p>
              <div className="mt-5 h-3 max-w-md overflow-hidden rounded-full bg-white/50">
                <motion.div initial={{ width: 0 }} animate={{ width: "68%" }} transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }} className="h-full rounded-full bg-forest" />
              </div>
              <p className="mt-2 text-sm text-navy/70">68% of a GMD 10,000 goal</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="ink" size="lg" icon={<ShareNetwork weight="bold" className="size-5" />} onClick={() => toast.success("Link copied", { description: "run4independence.gm/steps/SC-1047" })}>
                Share my page
              </Button>
              <Link href="/steps/SC-1047" className="flex h-12 items-center justify-center rounded-full bg-white/60 px-6 font-semibold text-navy hover:bg-white">
                Open my page
              </Link>
            </div>
          </div>
        </Tabs.Content>
      </Tabs.Root>

      <Sheet
        open={transfer !== null}
        onOpenChange={(o) => !o && setTransfer(null)}
        title="Transfer this entry"
        description={`Free until ${RUN.kitLock}. The new runner gets a text to add their details and accept the waiver.`}
        footer={
          <Button
            block
            size="lg"
            icon={<ArrowsLeftRight weight="bold" className="size-5" />}
            onClick={() => {
              setTransfer(null);
              toast.success("Transfer started", { description: "We have texted them a link. The bib number stays the same." });
            }}
          >
            Send transfer link
          </Button>
        }
      >
        <TransferFields />
      </Sheet>
    </motion.div>
  );
}

function TransferFields() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState({ iso: "GM", digits: "" });
  return (
    <div className="space-y-4">
      <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Their full name" />
      <PhoneField value={phone} onChange={setPhone} />
    </div>
  );
}
