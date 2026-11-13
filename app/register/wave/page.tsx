"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { DeviceMobile, CheckCircle, ArrowClockwise } from "@phosphor-icons/react";
import { useBooking, total, fmt } from "@/lib/store";
import { formatPhone, COUNTRY_CODES } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { PayMark } from "@/components/register/PayMethods";

type Stage = "sent" | "waiting" | "paid";

/** The instant path: a request lands in the Wave app, the person approves it, and the page moves on by itself. */
export default function WavePay() {
  const b = useBooking();
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("sent");
  const dial = COUNTRY_CODES.find((c) => c.iso === b.contact.phone.iso)?.dial ?? "+220";

  useEffect(() => {
    const t1 = setTimeout(() => setStage("waiting"), 1400);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (stage !== "paid") return;
    useBooking.getState().patch({ status: "paid", bibs: { ...useBooking.getState().bibs } });
    const t = setTimeout(() => router.push("/confirmation"), 1500);
    return () => clearTimeout(t);
  }, [stage, router]);

  return (
    <div className="mx-auto max-w-lg">
      <div className="overflow-hidden rounded-[1.75rem] border border-line bg-white shadow-lift">
        <div className="relative bg-[#1dc3f3] px-6 pb-10 pt-6 text-white">
          <div className="flex items-center gap-3">
            <PayMark id="wave" className="bg-white text-[#1dc3f3]" />
            <div>
              <p className="font-bold">Wave</p>
              <p className="text-sm text-white/85">Payment request from NRIF</p>
            </div>
          </div>
          <p className="mt-6 font-bib text-[3.6rem] leading-none">{fmt(b, total(b))}</p>
          <p className="mt-1 text-sm text-white/85">Run for Independence · {b.participants.length} entries · ref WV-88231</p>
        </div>

        <div className="-mt-5 rounded-t-[1.5rem] bg-white px-6 pb-6 pt-6">
          <AnimatePresence mode="wait">
            {stage !== "paid" ? (
              <motion.div key="wait" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex items-center gap-4">
                  <span className="relative grid size-14 shrink-0 place-items-center rounded-2xl bg-[#e8f8fd] text-[#0b9ccc]">
                    <DeviceMobile weight="duotone" className="size-7" />
                    {stage === "waiting" && <span className="absolute inset-0 animate-ping rounded-2xl bg-[#1dc3f3]/20" />}
                  </span>
                  <div>
                    <p className="font-bold text-navy">{stage === "sent" ? "Sending the request…" : "Open Wave and approve"}</p>
                    <p className="text-sm text-muted">
                      Sent to {dial} {formatPhone(b.contact.phone.digits, b.contact.phone.iso)}
                    </p>
                  </div>
                </div>
                <ol className="mt-6 space-y-3 text-[0.9375rem] text-navy">
                  {["Open the Wave app on your phone", "Tap the request from NRIF Run for Independence", "Check the amount and enter your PIN"].map((s, i) => (
                    <li key={s} className="flex items-center gap-3">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-sand text-xs font-bold">{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
                <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-sand">
                  <motion.div className="h-full w-1/3 rounded-full bg-[#1dc3f3]" animate={{ x: ["-100%", "300%"] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} />
                </div>
                <p className="mt-2 text-center text-xs text-muted">Waiting for Wave to confirm. This page updates by itself.</p>
                <Button block size="lg" className="mt-6 bg-[#1dc3f3] hover:bg-[#12b0de]" onClick={() => setStage("paid")} disabled={stage === "sent"}>
                  Simulate approval in Wave
                </Button>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <button onClick={() => setStage("sent")} className="flex items-center gap-1.5 font-semibold text-muted hover:text-navy">
                    <ArrowClockwise weight="bold" className="size-4" /> Send again
                  </button>
                  <Link href="/register/payment" className="font-semibold text-forest hover:underline">
                    Pay another way
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div key="paid" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-6 text-center">
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
                  <CheckCircle weight="fill" className="size-20 text-forest" />
                </motion.span>
                <p className="mt-4 text-xl font-bold text-navy">Payment received</p>
                <p className="mt-1 text-muted">Issuing your bib numbers…</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
