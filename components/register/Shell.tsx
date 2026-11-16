"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { X, Lock, Tag, Check } from "@phosphor-icons/react";
import { CoBrand } from "@/components/brand";
import { Badge } from "@/components/ui/fields";
import { useBooking, lineItems, total, fmt } from "@/lib/store";
import { initials } from "@/lib/format";
import { cn } from "@/lib/cn";

export const STEPS = [
  { href: "/register", label: "Choose your event", short: "Event" },
  { href: "/register/details", label: "Your details", short: "Details" },
  { href: "/register/participants", label: "Who is running?", short: "People" },
  { href: "/register/waiver", label: "Health and safety", short: "Waiver" },
  { href: "/register/payment", label: "Payment", short: "Pay" },
];

const AVATAR = ["bg-forest text-white", "bg-royal text-white", "bg-cobalt text-white", "bg-ember text-white", "bg-navy text-white"];

export function RegisterShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const idx = STEPS.findIndex((s) => s.href === pathname);
  const inFlow = idx >= 0;
  const step = inFlow ? idx : STEPS.length;

  return (
    <div className="min-h-dvh bg-paper">
      <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="shrink-0" aria-label="Run for Independence home">
            <CoBrand />
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-1.5 text-[0.8125rem] text-muted md:flex">
              <Lock weight="fill" className="size-3.5 text-forest" />
              Saved as you go
            </span>
            <Link href="/" className="flex h-9 items-center gap-1.5 rounded-full px-3 text-[0.8125rem] font-semibold text-navy hover:bg-sand">
              <X weight="bold" className="size-4" />
              <span className="hidden sm:inline">Save and exit</span>
            </Link>
          </div>
        </div>
        {inFlow && (
          <div className="mx-auto max-w-6xl px-4 pb-3 sm:px-6">
            <div className="flex items-center justify-between pb-2 text-[0.75rem]">
              <span className="font-label text-forest">
                Step {step + 1} of {STEPS.length}
              </span>
              <span className="font-semibold text-muted">{STEPS[step]!.label}</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {STEPS.map((s, i) => (
                <Link key={s.href} href={s.href} aria-label={s.label} className="group relative -my-2.5 flex h-6 items-center">
                  <span className="relative h-1.5 w-full overflow-hidden rounded-full bg-sand">
                  <motion.span
                    initial={false}
                    animate={{ width: i < step ? "100%" : i === step ? "55%" : "0%" }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className={cn("absolute inset-y-0 left-0 rounded-full", i < step ? "bg-forest" : "bg-forest-400")}
                  />
                  </span>
                </Link>
              ))}
            </div>
            <div className="mt-2 hidden grid-cols-5 gap-1.5 md:grid">
              {STEPS.map((s, i) => (
                <Link key={s.href} href={s.href} className={cn("flex items-center gap-1 text-[0.75rem] font-medium transition-colors", i <= step ? "text-navy" : "text-faint", "hover:text-forest")}>
                  {i < step && <Check weight="bold" className="size-3 text-forest" />}
                  {s.short}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      <div className="mx-auto grid grid-cols-1 max-w-6xl gap-10 px-4 pb-40 pt-8 sm:px-6 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_21rem] lg:pb-24">
        <AnimatePresence mode="wait" initial={false}>
          <motion.main key={pathname} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }} className="min-w-0">
            {children}
          </motion.main>
        </AnimatePresence>
        {inFlow && <Summary />}
      </div>
    </div>
  );
}

function Summary() {
  const b = useBooking();
  const items = lineItems(b);
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-36 space-y-4">
        <div className="overflow-hidden rounded-[1.5rem] border border-line bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <p className="font-bold text-navy">Your booking</p>
            {b.residence === "abroad" && <Badge tone="cobalt">Suggested</Badge>}
          </div>
          <ul className="divide-y divide-line">
            <AnimatePresence initial={false}>
              {items.map((it, i) => (
                <motion.li key={it.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-3 px-5 py-3.5">
                  <span className={cn("grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold", AVATAR[i % AVATAR.length])}>{initials(it.name) || "?"}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-navy">{it.name}</span>
                    <span className="block truncate text-xs text-muted">{it.event.name}</span>
                  </span>
                  <span className="text-sm font-semibold text-navy tabular">{fmt(b, it.amount)}</span>
                </motion.li>
              ))}
            </AnimatePresence>
            {b.donation > 0 && (
              <li className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm">
                <span className="text-muted">Donation to the fund</span>
                <span className="font-semibold text-navy tabular">{fmt(b, b.donation)}</span>
              </li>
            )}
          </ul>
          <div className="flex items-baseline justify-between bg-paper px-5 py-4">
            <span className="text-sm font-semibold text-navy">Total</span>
            <motion.span key={total(b)} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-bib text-[2rem] text-navy">
              {fmt(b, total(b))}
            </motion.span>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-[1.25rem] border border-line bg-white p-4">
          <span className="relative size-12 shrink-0 overflow-hidden rounded-2xl bg-sand">
            <Image src="/media/research-lab.webp" alt="" fill sizes="48px" className="object-cover" />
          </span>
          <p className="text-[0.8125rem] leading-snug text-muted">
            Every entry grows NRIF&apos;s <b className="text-navy">Endowment Fund</b> for Gambian research and innovation.
          </p>
        </div>

        {b.source && b.source !== "direct" && (
          <p className="flex items-center gap-1.5 px-1 text-[0.8125rem] text-muted">
            <Tag weight="bold" className="size-3.5 shrink-0" />
            Came from <span className="truncate rounded-md bg-sand px-1.5 py-0.5 font-mono text-[0.75rem] text-navy">{b.source}</span>
          </p>
        )}
      </div>
    </aside>
  );
}

/** The step's main action: inline on desktop, a sticky bar with the running total on phones. */
export function StepFooter({ children, back, note }: { children: ReactNode; back?: string; note?: ReactNode }) {
  const b = useBooking();
  const count = b.participants.length;
  return (
    <>
      <div className="mt-10 hidden items-center justify-between gap-4 lg:flex">
        {back ? (
          <Link href={back} className="text-sm font-semibold text-muted hover:text-navy">
            ← Back
          </Link>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-4">
          {note && <span className="text-sm text-muted">{note}</span>}
          {children}
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-4">
          <div className="shrink-0">
            <p className="text-xs text-muted">
              {count} {count === 1 ? "entry" : "entries"}
              {b.donation > 0 && " + donation"}
            </p>
            <p className="font-bib text-[1.6rem] leading-none text-navy">{fmt(b, total(b))}</p>
          </div>
          <div className="ml-auto min-w-0 flex-1 [&>*]:w-full">{children}</div>
        </div>
      </div>
    </>
  );
}

export function StepTitle({ eyebrow, title, sub }: { eyebrow?: ReactNode; title: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-8">
      {eyebrow && <p className="mb-3 font-label text-forest">{eyebrow}</p>}
      <h1 className="font-race text-[clamp(2.4rem,6vw,3.6rem)] text-navy">{title}</h1>
      {sub && <p className="mt-3 max-w-xl text-[1.0625rem] text-muted">{sub}</p>}
    </div>
  );
}

export function SectionCard({ children, className, title, icon, tone, aside }: { children: ReactNode; className?: string; title?: ReactNode; icon?: ReactNode; tone?: "ember" | "forest" | "cobalt"; aside?: ReactNode }) {
  return (
    <section className={cn("rounded-[1.5rem] border border-line bg-white p-5 shadow-card sm:p-7", tone === "ember" && "border-ember/20", className)}>
      {title && (
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className={cn("flex items-center gap-2 font-label", tone === "ember" ? "text-ember" : tone === "cobalt" ? "text-cobalt" : "text-navy")}>
            {icon}
            {title}
          </h2>
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}
