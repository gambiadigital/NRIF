"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { CaretLeft, PaperPlaneRight } from "@phosphor-icons/react";
import { SiteHeader } from "@/components/site/Header";
import { Phone } from "@/components/Phone";
import { EmailPreview } from "@/components/EmailPreview";
import { Segmented } from "@/components/ui/fields";
import { useBooking } from "@/lib/store";
import { smsThread } from "@/lib/messages";
import { cn } from "@/lib/cn";

/** Frame 11: the short text and the full email, side by side, with the character counts NRIF must stay under. */
export default function Messages() {
  const b = useBooking();
  const thread = smsThread(b);
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-32 pt-[calc(var(--header-h)+2.5rem)] sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-label text-forest">What we send</p>
            <h1 className="mt-3 font-race text-[clamp(2.6rem,7vw,4.6rem)] text-navy">Text and email</h1>
            <p className="mt-2 max-w-lg text-muted">A short text with a link, a full email with the QR code, then reminders 7 days and 1 day before.</p>
          </div>
          <Segmented
            value={b.persona === "lamin" ? "lamin" : "fatou"}
            onChange={(v) => b.load(v)}
            options={[
              { value: "fatou", label: "Fatou, in person" },
              { value: "lamin", label: "Lamin, virtual" },
            ]}
            className="w-full max-w-sm"
          />
        </div>

        <div className="mt-12 grid items-start gap-10 lg:grid-cols-[22rem_1fr]">
          <Phone>
            <div className="flex items-center gap-3 border-b border-line px-4 pb-3 pt-1">
              <CaretLeft weight="bold" className="size-5 text-cobalt" />
              <span className="relative size-9 overflow-hidden rounded-full bg-white ring-1 ring-line">
                <Image src="/brand/nrif-seal.svg" alt="" fill unoptimized className="object-contain p-0.5" />
              </span>
              <div>
                <p className="text-sm font-bold text-navy">NRIF RUN</p>
                <p className="text-[0.6875rem] text-muted">Text message</p>
              </div>
            </div>
            <div className="h-[34rem] space-y-1 overflow-y-auto bg-white px-3 py-4">
              {thread.map((m, i) => (
                <motion.div key={m.text} initial={{ opacity: 0, y: 14, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.2 + i * 0.35, type: "spring", stiffness: 260, damping: 22 }}>
                  <p className="py-2 text-center text-[0.6875rem] font-semibold text-faint">{m.day}</p>
                  <div className="max-w-[85%] rounded-[1.25rem] rounded-bl-md bg-[#eceef1] px-3.5 py-2.5 text-[0.875rem] leading-snug text-navy">
                    {m.text.split(/(rfi\.gm\/\S+)/).map((part, j) =>
                      part.startsWith("rfi.gm") ? (
                        <span key={j} className="font-semibold text-cobalt underline">
                          {part}
                        </span>
                      ) : (
                        part
                      ),
                    )}
                  </div>
                  <p className={cn("mt-1 pl-2 text-[0.6875rem]", m.chars > 160 ? "font-bold text-ember" : "text-faint")}>
                    {m.note} · {m.chars} of 160 characters{m.text.includes("rfi.gm") ? ", link included" : ""}
                  </p>
                </motion.div>
              ))}
            </div>
            <div className="flex items-center gap-2 border-t border-line px-3 py-3">
              <span className="flex-1 rounded-full bg-[#eceef1] px-4 py-2 text-sm text-faint">Text message</span>
              <span className="grid size-9 place-items-center rounded-full bg-cobalt-50 text-cobalt">
                <PaperPlaneRight weight="fill" className="size-4" />
              </span>
            </div>
          </Phone>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            <EmailPreview b={b} />
          </motion.div>
        </div>
      </main>
    </>
  );
}
