"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { HandHeart, Lightning, Hash, ShieldCheck } from "@phosphor-icons/react";
import { PAYMENT_METHODS, type PaymentMethodId } from "@/lib/data";
import { useBooking, lineItems, total, fmt, DONATION_PRESETS } from "@/lib/store";
import { Badge, RadioDot, TextInput } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
import { StepFooter, StepTitle, SectionCard } from "@/components/register/Shell";
import { PayMark } from "@/components/register/PayMethods";
import { cn } from "@/lib/cn";

export default function Payment() {
  const b = useBooking();
  const router = useRouter();
  const items = lineItems(b);
  const presets = DONATION_PRESETS[b.currency] ?? DONATION_PRESETS.GMD!;
  const [other, setOther] = useState(b.donation > 0 && !presets.includes(b.donation));
  const methods = (Object.keys(PAYMENT_METHODS) as PaymentMethodId[]).filter((k) => (b.residence === "gambia" ? PAYMENT_METHODS[k].home : k === "remit" || k === "bank"));
  const method = methods.includes(b.payMethod) ? b.payMethod : methods[0]!;
  const instant = PAYMENT_METHODS[method].mode === "instant";
  const sum = total(b);
  const [busy, setBusy] = useState(false);

  function pay() {
    setBusy(true);
    setTimeout(() => {
      if (instant) {
        b.patch({ payMethod: method, reference: "WV-88231" });
        router.push("/register/wave");
      } else {
        b.patch({ payMethod: method, status: "pending", reference: b.persona === "lamin" ? "RFI-7Q4K" : "RFI-3H2P" });
        router.push("/register/pending");
      }
    }, 650);
  }

  return (
    <div>
      <StepTitle title={`Pay for ${items.length} ${items.length === 1 ? "entry" : "entries"}`} sub="One payment covers everyone in this booking." />

      <SectionCard>
        <ul className="space-y-2.5">
          {items.map((it) => (
            <li key={it.id} className="flex items-baseline justify-between gap-4 text-[0.9375rem]">
              <span className="text-navy">
                {it.first} <span className="text-muted">· {it.event.name}</span>
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
          <span className="text-lg font-bold text-navy">Total</span>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={sum} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="font-bib text-[2.6rem] leading-none text-navy">
              {fmt(b, sum)}
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
              onClick={() => b.patch({ payMethod: k })}
              whileTap={{ scale: 0.99 }}
              className={cn(
                "flex w-full items-center gap-4 rounded-[1.25rem] border-2 bg-white p-4 text-left transition-[border-color,box-shadow,background-color]",
                on ? "border-forest bg-forest-50/40 shadow-[0_10px_30px_-18px_rgb(19_95_64/0.7)]" : "border-transparent shadow-card hover:border-line-strong",
              )}
            >
              <RadioDot checked={on} />
              <PayMark id={k} />
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-navy">{k === "bank" && b.residence === "abroad" ? "International bank transfer" : m.name}</span>
                <span className="block text-sm text-muted">{m.note}</span>
                <span className={cn("mt-1 flex items-center gap-1 text-xs font-bold sm:hidden", m.mode === "instant" ? "text-forest" : "text-[#9a6a06]")}>
                  {m.mode === "instant" ? <Lightning weight="fill" className="size-3" /> : <Hash weight="bold" className="size-3" />}
                  {m.mode === "instant" ? "Instant" : "Reference code"}
                </span>
              </span>
              {m.mode === "instant" ? (
                <Badge tone="forest" className="hidden sm:inline-flex" icon={<Lightning weight="fill" className="size-3" />}>
                  Instant
                </Badge>
              ) : (
                <Badge tone="sun" className="hidden sm:inline-flex" icon={<Hash weight="bold" className="size-3" />}>
                  Reference code
                </Badge>
              )}
            </motion.button>
          );
        })}
      </div>

      <p className="mt-5 flex items-start gap-2 text-[0.8125rem] text-muted">
        <ShieldCheck weight="fill" className="mt-0.5 size-4 shrink-0 text-forest" />
        {instant
          ? "You approve the payment in the Wave app. Your bib numbers appear here the moment it lands."
          : "You get a reference code to quote. Your place is held for 5 days while the payment reaches NRIF."}
      </p>

      <StepFooter back="/register/waiver" note="Sample fees">
        <Button size="lg" arrow={!busy} onClick={pay} disabled={busy}>
          {busy ? "One moment…" : instant ? `Pay ${fmt(b, sum)} with Wave` : "Get my reference code"}
        </Button>
      </StepFooter>
    </div>
  );
}
