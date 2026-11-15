"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { HourglassMedium, Copy, Check, Bell, Money, CalendarX, PaperPlaneTilt, CheckCircle, ArrowSquareOut, WarningCircle, ArrowClockwise } from "@phosphor-icons/react";
import { PAYMENT_METHODS, eventById, type PaymentMethodId } from "@/lib/data";
import { money } from "@/lib/format";
import { api, useSettings } from "@/lib/client";
import { useBookingData, formatHold } from "@/lib/booking-client";
import { Button } from "@/components/ui/button";
import { PayMark, ECOBANK_QR } from "@/components/register/PayMethods";
import { cn } from "@/lib/cn";

export default function PendingPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Pending />
    </Suspense>
  );
}

function Loading() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="h-14 w-72 animate-pulse rounded-2xl bg-sand" />
      <div className="h-24 animate-pulse rounded-2xl bg-sand" />
      <div className="h-80 animate-pulse rounded-[1.75rem] bg-sand" />
    </div>
  );
}

/** Frame 08: the place is held, the reference is the whole story, and the page moves on by itself once NRIF matches the money. */
function Pending() {
  const sp = useSearchParams();
  const ref = sp.get("ref");
  const key = sp.get("k");
  const router = useRouter();
  const { data: b, error, loading, reload } = useBookingData(ref, key, 15_000);
  const settings = useSettings().data;
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<PaymentMethodId | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    if (b?.status === "paid") router.replace(ref && key ? `/confirmation?ref=${ref}&k=${encodeURIComponent(key)}` : "/confirmation");
  }, [b?.status, ref, key, router]);

  if (loading && !b) return <Loading />;
  if (error || !b) {
    return (
      <div className="mx-auto max-w-xl rounded-[1.75rem] border border-line bg-white p-8 text-center shadow-card">
        <WarningCircle weight="duotone" className="mx-auto size-12 text-ember" />
        <h1 className="mt-4 text-2xl font-bold text-navy">We could not open that booking</h1>
        <p className="mt-2 text-muted">{error?.message ?? "Check the link in your text or email."}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/my-entry" className="flex h-11 items-center rounded-full bg-forest px-5 font-semibold text-white">
            Find my entry
          </Link>
          <Link href="/register" className="flex h-11 items-center rounded-full border border-line bg-white px-5 font-semibold text-navy">
            Start a booking
          </Link>
        </div>
      </div>
    );
  }

  const abroad = b.residence === "abroad";
  const methods = (Object.keys(PAYMENT_METHODS) as PaymentMethodId[]).filter((k) => (abroad ? PAYMENT_METHODS[k].abroad : PAYMENT_METHODS[k].home));
  const active = tab ?? (methods.includes(b.payMethod as PaymentMethodId) ? (b.payMethod as PaymentMethodId) : methods[0]!);
  const amount = money(b.total, b.currency as never, { decimals: b.currency !== "GMD" });
  const waveNumber = settings?.wave_number || "+220 83 379 6680";
  const yonnaNumber = settings?.yonna_number || "+220 83 379 6680";
  const ecobankAccount = settings?.ecobank_account || "6240050636";
  const ecobankName = settings?.ecobank_name || "National Research and Innovation Fund";

  if (b.status === "released" || b.status === "cancelled") {
    return (
      <div className="mx-auto max-w-xl rounded-[1.75rem] border border-line bg-white p-8 text-center shadow-card">
        <CalendarX weight="duotone" className="mx-auto size-12 text-ember" />
        <h1 className="mt-4 text-2xl font-bold text-navy">This place was released</h1>
        <p className="mt-2 text-muted">
          We did not receive a payment for {b.reference} within the {abroad ? "hold" : "five days"}. If you have paid, contact NRIF with your reference and we will sort it out.
        </p>
        <Link href="/register" className="mt-6 inline-flex h-11 items-center rounded-full bg-forest px-5 font-semibold text-white">
          Book again
        </Link>
      </div>
    );
  }

  async function openWave() {
    setOpening(true);
    try {
      const r = await api<{ url: string; mode: string }>(`/api/bookings/${b!.reference}/wave?k=${encodeURIComponent(key ?? "")}`, { method: "POST" });
      window.location.href = r.url;
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setOpening(false);
    }
  }

  async function claim() {
    setClaiming(true);
    try {
      await api(`/api/bookings/${b!.reference}/claim?k=${encodeURIComponent(key ?? "")}`, { method: "POST" });
      await reload();
      toast("Thank you, we are looking out for it", { description: abroad ? "Transfers from abroad usually land within a day." : "We match payments every working day." });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setClaiming(false);
    }
  }

  const copy = () => {
    navigator.clipboard?.writeText(b.reference).catch(() => {});
    setCopied(true);
    toast.success("Reference copied", { description: `Put ${b.reference} in the reference or note box.` });
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-sun-100 text-[#a77208]">
          <motion.span animate={{ rotate: [0, 180, 180, 360] }} transition={{ duration: 3.2, repeat: Infinity, times: [0, 0.35, 0.6, 1], ease: "easeInOut" }}>
            <HourglassMedium weight="fill" className="size-7" />
          </motion.span>
        </span>
        <div className="min-w-0">
          <h1 className="font-race text-[clamp(2.2rem,7vw,2.8rem)] text-navy">Payment pending</h1>
          <p className="truncate text-muted">
            {b.participants.map((p) => eventById(p.eventId).name).join(", ")} · {b.participants[0]?.fullName}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-sun-50 px-5 py-4 text-[0.9375rem] text-navy ring-1 ring-sun/40">
        Your place is held until <b>{formatHold(b.holdUntil)}</b>. Send <b>{amount}</b> and quote your reference.
      </div>

      <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-line bg-white shadow-card">
        <div className="p-5 sm:p-8">
          <p className="font-label text-muted">Your reference</p>
          <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-cobalt/60 bg-cobalt-50/40 px-4 py-4 sm:px-5 sm:py-5">
            <span className="font-mono text-[clamp(1.9rem,8vw,3.2rem)] font-bold tracking-[0.06em] text-cobalt">{b.reference}</span>
            <button onClick={copy} className="flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-line bg-white px-4 text-sm font-semibold text-navy hover:bg-paper">
              {copied ? <Check weight="bold" className="size-4 text-forest" /> : <Copy weight="bold" className="size-4" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <p className="mb-3 mt-7 font-label text-muted">Pay with</p>
          <div role="tablist" className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {methods.map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={active === m}
                onClick={() => setTab(m)}
                className={cn("flex shrink-0 items-center gap-2.5 rounded-2xl border-2 p-1.5 pr-4 text-sm font-semibold transition-colors", active === m ? "border-forest bg-forest-50/50 text-navy" : "border-line bg-white text-muted hover:border-line-strong")}
              >
                <PayMark id={m} className="h-9 w-14" />
                {PAYMENT_METHODS[m].name}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="mt-5">
              {active === "wave" && (
                <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-[1fr_auto]">
                  <div>
                    <Steps
                      items={[
                        <>Tap <b>Open Wave</b>, or scan the code with the Wave app.</>,
                        <>Enter <b>{amount}</b>.</>,
                        <>Put <b className="font-mono">{b.reference}</b> in the note.</>,
                      ]}
                    />
                    <p className="mt-3 text-sm text-muted">
                      Or send it in Wave to <b className="text-navy">{waveNumber}</b>.
                    </p>
                    <Button block size="lg" className="mt-5 bg-[#1dc3f3] text-navy hover:bg-[#12b0de]" icon={<ArrowSquareOut weight="bold" className="size-5" />} onClick={openWave} disabled={opening}>
                      {opening ? "Opening Wave…" : `Open Wave and pay ${amount}`}
                    </Button>
                  </div>
                  <QrTile caption="Scan with the Wave app">
                    <QRCodeSVG value={settings?.wave_link || "https://pay.wave.com/m/M_gm_CedMPBz-cNJ4/mu/U_gm_PQs2KiZYy60h/c/gm/"} size={164} fgColor="#0b1b3a" level="M" />
                  </QrTile>
                </div>
              )}
              {active === "yonna" && (
                <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-[1fr_auto]">
                  <div>
                    <Steps
                      items={[
                        <>Scan the code in the Yonna app, or send to <b>{yonnaNumber}</b>.</>,
                        <>Enter <b>{amount}</b>.</>,
                        <>Put <b className="font-mono">{b.reference}</b> in the reference box.</>,
                      ]}
                    />
                  </div>
                  <QrTile caption="Scan with the Yonna app">
                    <Image src="/pay/yonna-qr.png" alt="Yonna QR code for NRIF" width={369} height={369} className="size-[164px]" />
                  </QrTile>
                </div>
              )}
              {active === "ecobank" && (
                <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-[1fr_auto]">
                  <div>
                    <Steps
                      items={[
                        abroad ? <>Send an international transfer to Ecobank Gambia.</> : <>Scan the code with the Ecobank app, or pay by transfer.</>,
                        <>
                          Account <b className="font-mono">{ecobankAccount}</b>, {ecobankName}.
                        </>,
                        <>Put <b className="font-mono">{b.reference}</b> in the reference.</>,
                      ]}
                    />
                    <p className="mt-3 text-sm text-muted">Amount: {amount}{abroad ? ", or its value in dalasi on arrival" : ""}.</p>
                  </div>
                  {!abroad && (
                    <QrTile caption="Scan with your banking app">
                      <QRCodeSVG value={ECOBANK_QR} size={164} fgColor="#0b1b3a" level="M" />
                    </QrTile>
                  )}
                </div>
              )}
              {active === "remit" && (
                <Steps
                  items={[
                    <>In Remitly or ACE, choose <b>The Gambia</b>, then mobile money: <b>Yonna</b> (or Wave).</>,
                    <>Send to <b>{yonnaNumber}</b>, recipient National Research and Innovation Fund.</>,
                    <>Put <b className="font-mono">{b.reference}</b> in the reference or message box.</>,
                  ]}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="grid grid-cols-3 border-t border-line bg-paper text-center">
          {[
            { icon: Money, t: amount, s: "to send" },
            { icon: CalendarX, t: "5 days", s: "place held" },
            { icon: Bell, t: "Day 3", s: "reminder text" },
          ].map((x, i) => (
            <div key={i} className="flex flex-col items-center gap-1 border-line px-2 py-4 [&:not(:last-child)]:border-r">
              <x.icon weight="duotone" className="size-5 text-cobalt" />
              <span className="text-sm font-bold text-navy">{x.t}</span>
              <span className="text-xs text-muted">{x.s}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-line bg-white p-5">
        <ol className="space-y-4">
          {[
            { t: "Place held", s: `Reference ${b.reference}`, done: true },
            { t: "You send the money", s: b.claimedAt ? "You told us it is on its way" : `By ${formatHold(b.holdUntil)}`, done: !!b.claimedAt },
            { t: "NRIF matches your payment", s: "Usually within a working day", done: false },
            { t: `${b.participants.every((p) => eventById(p.eventId).kind === "virtual") ? "E-bib" : "Bib numbers"} by text and email`, s: "Straight after the match. This page updates by itself.", done: false },
          ].map((x) => (
            <li key={x.t} className="flex items-start gap-3">
              {x.done ? <CheckCircle weight="fill" className="size-6 shrink-0 text-forest" /> : <span className="mt-0.5 size-5 shrink-0 rounded-full border-2 border-line-strong" />}
              <span>
                <span className="block font-semibold text-navy">{x.t}</span>
                <span className="block text-sm text-muted">{x.s}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {!b.claimedAt ? (
            <Button size="lg" icon={<PaperPlaneTilt weight="fill" className="size-5" />} onClick={claim} disabled={claiming}>
              I have sent it
            </Button>
          ) : (
            <Button size="lg" variant="line" icon={<ArrowClockwise weight="bold" className="size-5" />} onClick={() => reload()}>
              Check again
            </Button>
          )}
          <Link href="/my-entry" className="flex h-[3.25rem] items-center justify-center rounded-full border border-line bg-white font-semibold text-navy hover:bg-paper">
            My entry
          </Link>
        </div>
      </div>
      <p className="mt-4 text-center text-sm text-muted">Keep this page or the text we send. Your reference and phone number get you back in.</p>
    </div>
  );
}

function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="space-y-3">
      {items.map((s, i) => (
        <li key={i} className="flex items-start gap-3 text-[0.9375rem] text-navy">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-cobalt text-xs font-bold text-white">{i + 1}</span>
          <span>{s}</span>
        </li>
      ))}
    </ol>
  );
}

function QrTile({ children, caption }: { children: React.ReactNode; caption: string }) {
  return (
    <div className="mx-auto flex w-fit flex-col items-center gap-2">
      <div className="rounded-2xl bg-[#f0f0f0] p-3 ring-1 ring-line">{children}</div>
      <span className="text-xs text-muted">{caption}</span>
    </div>
  );
}
