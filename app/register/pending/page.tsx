"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { HourglassMedium, Copy, Check, Bell, Money, CalendarX, PaperPlaneTilt, CheckCircle, Lightning } from "@phosphor-icons/react";
import { useBooking, total, fmt, lineItems } from "@/lib/store";
import { RUN } from "@/lib/data";
import { Button } from "@/components/ui/button";

/** Frame 08: a payment that cannot confirm itself. The place is held, the code is the whole story. */
export default function Pending() {
  const b = useBooking();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const items = lineItems(b);
  const abroad = b.residence === "abroad";
  const ref = b.reference || "RFI-7Q4K";

  const steps = abroad
    ? ["Choose The Gambia, then Yonna, in Remitly or ACE.", "Recipient: National Research and Innovation Fund.", `Put ${ref} in the reference box.`]
    : b.payMethod === "bank"
      ? ["Pay into NRIF, Trust Bank, account 1102 0049 1965.", "Use your phone number as your name.", `Put ${ref} in the reference.`]
      : ["Open Yonna and choose Pay a business.", "Recipient: NRIF Run for Independence.", `Put ${ref} in the reference box.`];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-4">
        <span className="relative grid size-14 place-items-center rounded-2xl bg-sun-100 text-[#a77208]">
          <motion.span animate={{ rotate: [0, 180, 180, 360] }} transition={{ duration: 3.2, repeat: Infinity, times: [0, 0.35, 0.6, 1], ease: "easeInOut" }}>
            <HourglassMedium weight="fill" className="size-7" />
          </motion.span>
        </span>
        <div>
          <h1 className="font-race text-[2.6rem] text-navy">Payment pending</h1>
          <p className="text-muted">
            {items.map((i) => i.event.name).join(", ")} · {items[0]?.name}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-sun-50 px-5 py-4 text-[0.9375rem] text-navy ring-1 ring-sun/40">
        Your place is held until <b>Sun 25 Oct, 23:59</b>. Send <b>{fmt(b, total(b))}</b> {abroad ? "with Remitly or ACE to NRIF's Yonna account in The Gambia" : `by ${b.payMethod === "bank" ? "bank transfer" : "Yonna"}`}.
      </div>

      <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-line bg-white shadow-card">
        <div className="p-6 sm:p-8">
          <p className="font-label text-muted">Your reference</p>
          <div className="relative mt-3 flex items-center justify-between gap-4 rounded-2xl border-2 border-dashed border-cobalt/60 bg-cobalt-50/40 px-5 py-5">
            <span className="font-mono text-[clamp(2rem,7vw,3.2rem)] font-bold tracking-[0.08em] text-cobalt">{ref}</span>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(ref).catch(() => {});
                setCopied(true);
                toast.success("Reference copied", { description: `Paste ${ref} into the reference box.` });
                setTimeout(() => setCopied(false), 1800);
              }}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-line bg-white px-4 text-sm font-semibold text-navy hover:bg-paper"
            >
              <AnimatePresence mode="wait" initial={false}>
                {copied ? (
                  <motion.span key="c" initial={{ scale: 0.6 }} animate={{ scale: 1 }}>
                    <Check weight="bold" className="size-4 text-forest" />
                  </motion.span>
                ) : (
                  <motion.span key="n" initial={{ scale: 0.6 }} animate={{ scale: 1 }}>
                    <Copy weight="bold" className="size-4" />
                  </motion.span>
                )}
              </AnimatePresence>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <ol className="mt-6 space-y-3">
            {steps.map((s, i) => (
              <li key={s} className="flex items-start gap-3 text-[0.9375rem] text-navy">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-cobalt text-xs font-bold text-white">{i + 1}</span>
                <span dangerouslySetInnerHTML={{ __html: s.replace(ref, `<b class="font-mono">${ref}</b>`) }} />
              </li>
            ))}
          </ol>
        </div>
        <div className="grid grid-cols-3 border-t border-line bg-paper text-center">
          {[
            { icon: Money, t: fmt(b, total(b)), s: abroad ? "to NRIF's Yonna" : "to NRIF" },
            { icon: CalendarX, t: `${RUN.holdDays} days`, s: "place held" },
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

      <p className="mt-4 text-sm text-muted">We will text and email your {abroad ? "e-bib" : "bib"} as soon as your payment is matched.</p>

      <AnimatePresence mode="wait">
        {!sent ? (
          <motion.div key="a" exit={{ opacity: 0 }} className="mt-6 grid gap-3 sm:grid-cols-2">
            <Button
              size="lg"
              icon={<PaperPlaneTilt weight="fill" className="size-5" />}
              onClick={() => {
                setSent(true);
                toast("Thanks, we are looking out for it", { description: "Transfers from abroad usually land within a day." });
              }}
            >
              I have sent it
            </Button>
            <Link href="/register/payment" className="flex h-[3.25rem] items-center justify-center rounded-full border border-forest/80 bg-white font-semibold text-forest hover:bg-forest-50">
              Pay another way
            </Link>
          </motion.div>
        ) : (
          <motion.div key="b" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-[1.5rem] border border-line bg-white p-5">
            <ol className="relative space-y-4">
              {[
                { t: "Entry saved", s: `Reference ${ref}`, done: true },
                { t: "You sent the money", s: "Just now", done: true },
                { t: "NRIF matches your payment", s: "Usually within a day", done: false },
                { t: `${abroad ? "E-bib" : "Bib"} by text and email`, s: "Straight after the match", done: false },
              ].map((x) => (
                <li key={x.t} className="flex items-start gap-3">
                  {x.done ? <CheckCircle weight="fill" className="size-6 text-forest" /> : <span className="mt-0.5 size-5 rounded-full border-2 border-line-strong" />}
                  <span>
                    <span className="block font-semibold text-navy">{x.t}</span>
                    <span className="block text-sm text-muted">{x.s}</span>
                  </span>
                </li>
              ))}
            </ol>
            <Button
              variant="ink"
              block
              size="lg"
              className="mt-5"
              icon={<Lightning weight="fill" className="size-5 text-sun" />}
              onClick={() => {
                b.patch({ status: "paid" });
                router.push(abroad ? "/confirmation/virtual" : "/confirmation");
              }}
            >
              Prototype: NRIF matches the payment
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
