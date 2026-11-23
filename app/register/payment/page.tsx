"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { HandHeart, ShieldCheck, WarningCircle, CreditCard, CircleNotch, CheckCircle, Copy, PaperPlaneTilt, ArrowRight, Receipt } from "@phosphor-icons/react";
import { PAYMENT_METHODS, type Currency, type PaymentMethodId, type RaceEvent } from "@/lib/data";
import { useBooking, lineItems, total, fmt, DONATION_PRESETS, newParticipant, type PaidOrder, type Phone } from "@/lib/store";
import { api, cardFor, useSettings } from "@/lib/client";
import { Badge, Field, PhoneField, RadioDot, TextInput } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
import { StepFooter, StepTitle, SectionCard } from "@/components/register/Shell";
import { PayMark } from "@/components/register/PayMethods";
import { PayHow, PAYER_REF } from "@/components/register/PayHow";
import { cn } from "@/lib/cn";

/** What the server says about an order (see orderView in lib/server/orders.ts). */
type OrderView = {
  id: string;
  reference: string;
  residence: "gambia" | "abroad";
  city: string;
  currency: string;
  events: string[];
  donation: number;
  total: number;
  method: PaymentMethodId;
  status: "open" | "claimed" | "paid" | "used" | "cancelled";
  payerReference: string | null;
  booking: { reference: string; key: string; status: string } | null;
};

export default function PaymentPage() {
  return (
    <Suspense fallback={null}>
      <Payment />
    </Suspense>
  );
}

/*
 * Step 2, pay first. The person pays NRIF for the entries chosen at step 1, then either gives the reference from their
 * receipt (Wave, Yonna, Ecobank, Remitly/ACE) or pays by card on Modem Pay's page. Only then do the details steps open.
 * A link with ?order=…&t=… brings a payer back here to carry on, and Modem Pay sends card payers back with &card=….
 */
function Payment() {
  const b = useBooking();
  const router = useRouter();
  const sp = useSearchParams();
  const settings = useSettings().data;
  const items = lineItems(b);
  const presets = DONATION_PRESETS[b.currency] ?? DONATION_PRESETS.GMD!;
  const [other, setOther] = useState(b.donation > 0 && !presets.includes(b.donation));
  const cardOk = cardFor(settings, b.currency);
  const methods = (Object.keys(PAYMENT_METHODS) as PaymentMethodId[]).filter((k) => (b.residence === "gambia" ? PAYMENT_METHODS[k].home : PAYMENT_METHODS[k].abroad) && (k !== "card" || cardOk));
  const method = methods.includes(b.payMethod) ? b.payMethod : methods[0]!;
  const sum = total(b);
  const amount = fmt(b, sum);
  const [payRef, setPayRef] = useState("");
  const [from, setFrom] = useState<Phone>({ iso: b.contact.phone.iso || "GM", digits: "" });
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [openCard, setOpenCard] = useState<{ id: string; token: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const handled = useRef(false);

  /** Makes the browser's booking match the order the server has, then moves on. */
  function adopt(o: OrderView, token: string) {
    if (o.booking) {
      router.replace(o.booking.status === "paid" ? `/confirmation?ref=${o.booking.reference}&k=${encodeURIComponent(o.booking.key)}` : `/register/pending?ref=${o.booking.reference}&k=${encodeURIComponent(o.booking.key)}`);
      return;
    }
    if (o.status !== "claimed" && o.status !== "paid") return false;
    const s = useBooking.getState();
    const mine = s.participants.map((p) => p.eventId).sort().join("|") === [...o.events].sort().join("|");
    const order: PaidOrder = { id: o.id, token, reference: o.reference, status: o.status, method: o.method, total: o.total, payerReference: o.payerReference };
    s.patch({
      residence: o.residence,
      city: o.city,
      currency: o.currency as Currency,
      donation: o.donation,
      payMethod: o.method,
      order,
      // Same entries as this browser had: keep any names already typed. Otherwise rebuild them from the order.
      participants: mine
        ? s.participants
        : o.events.map((ev, i) => (i === 0 ? { ...newParticipant(ev as RaceEvent["id"], true), id: "lead" } : newParticipant(ev as RaceEvent["id"]))),
    });
    return true;
  }

  // Back from Modem Pay, or a "finish later" link: what does the server say about this order?
  useEffect(() => {
    const id = sp.get("order");
    const t = sp.get("t");
    const card = sp.get("card");
    if (!id || !t || handled.current) return;
    handled.current = true;
    window.history.replaceState(null, "", "/register/payment");
    (async () => {
      try {
        if (card && card !== "cancelled") {
          setChecking(true);
          for (let i = 0; i < 6; i++) {
            const r = await api<{ outcome: "paid" | "declined" | "waiting"; order: OrderView }>(`/api/orders/${id}/card/check?t=${encodeURIComponent(t)}`, { method: "POST" });
            if (r.outcome === "paid") {
              if (adopt(r.order, t)) {
                toast.success("Payment received", { description: "Now add everyone's names and details." });
                router.push("/register/details");
              }
              return;
            }
            if (r.outcome === "declined") {
              setOpenCard({ id, token: t });
              toast.error("Your card payment did not go through", { description: "Nothing was taken. Try again, or choose another way to pay." });
              return;
            }
            await new Promise((res) => setTimeout(res, 4000));
          }
          setOpenCard({ id, token: t });
          toast("We are waiting to hear from your bank", { description: "Check again in a minute. If the money was taken, it will show here." });
          return;
        }
        const o = await api<OrderView>(`/api/orders/${id}?t=${encodeURIComponent(t)}`);
        if (card === "cancelled") toast("Card payment cancelled", { description: "Nothing was taken. Pay by card again, or choose another way." });
        if (o.status === "open") setOpenCard({ id, token: t });
        else if (adopt(o, t)) router.push("/register/details");
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setChecking(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  const entries = () => {
    const s = useBooking.getState();
    return { residence: s.residence, city: s.city, currency: s.currency, events: s.participants.map((p) => p.eventId), donation: s.donation };
  };

  async function payByCard() {
    setBusy(true);
    setError(null);
    try {
      const r = openCard
        ? await api<{ url: string }>(`/api/orders/${openCard.id}/card?t=${encodeURIComponent(openCard.token)}`, { method: "POST" })
        : await api<{ url: string }>("/api/orders", { json: { ...entries(), method: "card" } });
      // The browser leaves for Modem Pay's page and comes back to this step.
      window.location.href = r.url;
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  const ref = method !== "card" ? PAYER_REF[method] : null;
  const valid = !!ref && payRef.trim().length >= 3 && (ref.from !== "required" || from.digits.length >= 7);

  async function claim() {
    setTried(true);
    if (!ref || !valid) return;
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ order: OrderView; token: string }>("/api/orders", {
        json: { ...entries(), method, payerReference: payRef.trim(), ...(ref.from && from.digits.length >= 7 ? { payerFrom: from } : {}) },
      });
      adopt(r.order, r.token);
      toast.success("Thank you", { description: "Now add everyone's names and details. NRIF checks the payment and your bibs follow by email." });
      router.push("/register/details");
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg);
      toast.error("We could not take that", { description: msg });
    } finally {
      setBusy(false);
    }
  }

  // Paid already: show it, and move on.
  if (b.order) return <PaidAlready />;

  return (
    <div>
      <StepTitle title={`Pay for ${items.length} ${items.length === 1 ? "entry" : "entries"}`} sub="Pay first, then add everyone's names and details. Your entries are booked once the payment is made." />

      <SectionCard>
        <ul className="space-y-2.5">
          {items.map((it) => (
            <li key={it.id} className="flex items-baseline justify-between gap-4 text-[0.9375rem]">
              <span className="text-navy">
                {it.name} <span className="text-muted">· {it.event.name}</span>
              </span>
              <span className="font-semibold text-navy tabular">{fmt(b, it.amount)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 border-t border-line pt-5">
          <p className="flex items-center gap-2 font-label text-navy">
            <HandHeart weight="fill" className="size-4 text-ember" /> Add a donation to the Endowment Fund
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[0, ...presets].map((v) => {
              const on = !other && b.donation === v;
              return (
                <button
                  key={v}
                  onClick={() => {
                    setOther(false);
                    b.patch({ donation: v });
                  }}
                  className={cn(
                    "h-11 rounded-full border px-4 text-[0.9375rem] font-semibold transition-all active:scale-95",
                    on ? "border-forest bg-forest text-white shadow-[0_6px_16px_-8px_rgb(19_95_64/0.8)]" : "border-line bg-white text-navy hover:border-line-strong",
                  )}
                >
                  {v === 0 ? "No thanks" : fmt(b, v).replace(".00", "")}
                </button>
              );
            })}
            <button
              onClick={() => setOther(true)}
              className={cn("h-11 rounded-full border px-4 text-[0.9375rem] font-semibold transition-all", other ? "border-forest bg-forest text-white" : "border-line bg-white text-navy hover:border-line-strong")}
            >
              Other
            </button>
          </div>
          <AnimatePresence initial={false}>
            {other && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="max-w-56 pt-3">
                  <TextInput
                    inputMode="numeric"
                    autoFocus
                    value={b.donation ? String(b.donation) : ""}
                    onChange={(e) => b.patch({ donation: Number(e.target.value.replace(/\D/g, "").slice(0, 7)) || 0 })}
                    leading={<span className="text-sm font-semibold text-muted">{b.currency === "GMD" ? "GMD" : b.currency}</span>}
                    className="pl-14 tabular"
                    placeholder="Amount"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-6 flex items-end justify-between border-t border-line pt-5">
          <span className="text-lg font-bold text-navy">To pay</span>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={sum} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="font-bib text-[2.6rem] leading-none text-navy">
              {amount}
            </motion.span>
          </AnimatePresence>
        </div>
      </SectionCard>

      <p className="mb-3 mt-8 font-label text-muted">Pay with</p>
      <div role="radiogroup" className="space-y-2.5">
        {methods.map((k) => {
          const m = PAYMENT_METHODS[k];
          const on = method === k;
          return (
            <motion.button
              layout
              key={k}
              role="radio"
              aria-checked={on}
              disabled={!!openCard && k !== "card"}
              onClick={() => {
                b.patch({ payMethod: k });
                setTried(false);
              }}
              whileTap={{ scale: 0.99 }}
              className={cn(
                "flex w-full items-center gap-4 rounded-[1.25rem] border-2 bg-white p-4 text-left transition-[border-color,box-shadow,background-color] disabled:opacity-50",
                on ? "border-forest bg-forest-50/40 shadow-[0_10px_30px_-18px_rgb(19_95_64/0.7)]" : "border-transparent shadow-card hover:border-line-strong",
              )}
            >
              <RadioDot checked={on} />
              <PayMark id={k} />
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-navy">{k === "ecobank" && b.residence === "abroad" ? "Ecobank, international transfer" : m.name}</span>
                <span className="block text-sm text-muted">{m.note}</span>
              </span>
              {k === "card" && (
                <Badge tone="forest" className="hidden sm:inline-flex">
                  Confirmed at once
                </Badge>
              )}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={method} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
          {method === "card" ? (
            <SectionCard className="mt-6" title="Pay by card" icon={<CreditCard weight="bold" className="size-4" />}>
              {checking ? (
                <p role="status" className="flex items-center gap-3 rounded-2xl bg-navy px-5 py-4 text-[0.9375rem] text-white">
                  <CircleNotch weight="bold" className="size-5 shrink-0 animate-spin" /> Checking your card payment with the bank…
                </p>
              ) : (
                <ol className="space-y-3 text-[0.9375rem] text-navy">
                  {[
                    <>Tap <b>Pay {amount} by card</b>.</>,
                    <>Enter your Visa or Mastercard, debit or credit, on Modem Pay&apos;s secure page.</>,
                    <>You come straight back here to add everyone&apos;s names. Your bibs arrive as soon as you finish.</>,
                  ].map((x, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-cobalt text-xs font-bold text-white">{i + 1}</span>
                      <span>{x}</span>
                    </li>
                  ))}
                </ol>
              )}
              <p className="mt-4 flex items-start gap-2 text-[0.8125rem] text-muted">
                <ShieldCheck weight="fill" className="mt-0.5 size-4 shrink-0 text-forest" />
                Your card details go straight to Modem Pay, NRIF&apos;s payment provider. NRIF never sees them.
              </p>
            </SectionCard>
          ) : (
            <>
              <SectionCard className="mt-6" title={`1. Pay ${amount}`} icon={<PayMark id={method} className="h-7 w-10 rounded-lg" />}>
                <PayHow method={method} amount={amount} abroad={b.residence === "abroad"} settings={settings} />
              </SectionCard>
              <SectionCard className="mt-4" title="2. Tell us about the payment" icon={<Receipt weight="bold" className="size-4" />}>
                <div className="grid grid-cols-1 gap-4">
                  <Field label={ref!.label} htmlFor="payref" required hint={ref!.hint} error={tried && payRef.trim().length < 3 ? "Enter the reference from your receipt or message" : undefined}>
                    <TextInput id="payref" value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder={ref!.placeholder} className="font-mono" autoComplete="off" maxLength={60} />
                  </Field>
                  {ref!.from && (
                    <Field label={ref!.fromLabel} htmlFor="payfrom" required={ref!.from === "required"} optional={ref!.from === "optional"} error={tried && ref!.from === "required" && from.digits.length < 7 ? "Enter the number you paid from" : undefined}>
                      <PhoneField id="payfrom" value={from} onChange={setFrom} />
                    </Field>
                  )}
                </div>
                <p className="mt-4 flex items-start gap-2 text-[0.8125rem] text-muted">
                  <ShieldCheck weight="fill" className="mt-0.5 size-4 shrink-0 text-forest" />
                  NRIF checks this against its account, then confirms your entries and emails your bib numbers, usually within a working day.
                </p>
              </SectionCard>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {error && (
        <p className="mt-4 flex items-start gap-2 rounded-2xl bg-ember-50 p-4 text-sm font-medium text-ember-600 ring-1 ring-ember/15">
          <WarningCircle weight="fill" className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}

      <StepFooter back="/register">
        {method === "card" ? (
          <Button size="lg" variant="ink" icon={busy ? <CircleNotch weight="bold" className="size-5 animate-spin" /> : <CreditCard weight="bold" className="size-5" />} onClick={payByCard} disabled={busy || checking || !cardOk}>
            {busy ? "Opening the card page…" : openCard ? `Try the card again` : `Pay ${amount} by card`}
          </Button>
        ) : (
          <Button size="lg" icon={busy ? <CircleNotch weight="bold" className="size-5 animate-spin" /> : <PaperPlaneTilt weight="fill" className="size-5" />} onClick={claim} disabled={busy}>
            {busy ? "Saving…" : "I have paid, continue"}
          </Button>
        )}
      </StepFooter>
    </div>
  );
}

/** The entries are paid for (or the payment is claimed): show it, give a way back, and carry on to the details. */
function PaidAlready() {
  const b = useBooking();
  const router = useRouter();
  const o = b.order!;
  const [copied, setCopied] = useState(false);
  const link = typeof window === "undefined" ? "" : `${window.location.origin}/register/payment?order=${o.id}&t=${encodeURIComponent(o.token)}`;
  return (
    <div>
      <StepTitle title={o.status === "paid" ? "Payment received" : "Thank you for paying"} sub="Now add everyone's names and details to finish your registration." />
      <SectionCard>
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-forest-50 text-forest">
            <CheckCircle weight="fill" className="size-7" />
          </span>
          <div className="min-w-0">
            <p className="font-bold text-navy">
              {fmt(b, o.total)} {o.status === "paid" ? "paid by card" : `by ${PAYMENT_METHODS[o.method].name}`}
            </p>
            <p className="text-sm text-muted">
              Your booking reference <b className="font-mono text-navy">{o.reference}</b>
              {o.payerReference ? (
                <>
                  {" "}
                  · your payment reference <b className="font-mono text-navy">{o.payerReference}</b>
                </>
              ) : null}
            </p>
          </div>
        </div>
        <div className="mt-5 rounded-2xl bg-paper p-4">
          <p className="text-sm font-semibold text-navy">Need to stop and finish later?</p>
          <p className="mt-1 text-sm text-muted">Keep this link. It brings you back here with your payment.</p>
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-white p-1.5 pl-3">
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-navy">{link.replace(/^https?:\/\//, "")}</span>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(link).catch(() => {});
                setCopied(true);
                toast.success("Link copied");
                setTimeout(() => setCopied(false), 1800);
              }}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-navy px-3 text-xs font-semibold text-white"
            >
              {copied ? <CheckCircle weight="fill" className="size-4" /> : <Copy weight="bold" className="size-4" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      </SectionCard>
      <StepFooter back="/register">
        <Button size="lg" icon={<ArrowRight weight="bold" className="size-5" />} onClick={() => router.push("/register/details")}>
          Add names and details
        </Button>
      </StepFooter>
    </div>
  );
}
