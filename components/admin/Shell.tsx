"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { SquaresFour, ArrowsLeftRight, UsersThree, Hash, ChatCircleText, Megaphone, MagnifyingGlass, Bell, List, X, ArrowSquareOut } from "@phosphor-icons/react";
import { NrifLockup } from "@/components/brand";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/admin", label: "Overview", icon: SquaresFour },
  { href: "/admin/payments", label: "Payments", icon: ArrowsLeftRight, badge: "4" },
  { href: "/admin/entries", label: "Entries", icon: UsersThree },
  { href: "/admin/bibs", label: "Bib ranges", icon: Hash },
  { href: "/admin/messages", label: "Messages", icon: ChatCircleText },
  { href: "/admin/campaigns", label: "Campaign links", icon: Megaphone },
];

function Nav({ onPick }: { onPick?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-1">
      {NAV.map((n) => {
        const on = n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
        return (
          <Link key={n.href} href={n.href} onClick={onPick} className={cn("relative flex h-11 items-center gap-3 rounded-xl px-3 text-[0.9375rem] font-semibold transition-colors", on ? "text-navy" : "text-white/70 hover:bg-white/5 hover:text-white")}>
            {on && <motion.span layoutId="admin-nav" className="absolute inset-0 rounded-xl bg-white" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
            <n.icon weight={on ? "fill" : "regular"} className={cn("relative size-5", on && "text-forest")} />
            <span className="relative">{n.label}</span>
            {n.badge && <span className={cn("relative ml-auto rounded-full px-2 py-0.5 text-[0.6875rem] font-bold", on ? "bg-ember text-white" : "bg-ember/90 text-white")}>{n.badge}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-dvh bg-[#f3f2ee] lg:pl-[16.5rem]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[16.5rem] flex-col bg-navy p-4 pb-20 lg:flex">
        <div className="px-2 pb-6 pt-2">
          <NrifLockup white className="h-10" />
          <p className="mt-3 font-label text-white/45">Run admin · 2027</p>
        </div>
        <Nav />
        <div className="mt-auto space-y-3">
          <Link href="/" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white/60 hover:text-white">
            <ArrowSquareOut weight="bold" className="size-4" /> View the public site
          </Link>
          <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
            <span className="grid size-9 place-items-center rounded-full bg-sun text-sm font-bold text-navy">MC</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">Mariama Ceesay</p>
              <p className="text-xs text-white/50">Payments officer</p>
            </div>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur-xl sm:px-6">
        <button onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-full hover:bg-sand lg:hidden" aria-label="Open menu">
          <List weight="bold" className="size-5" />
        </button>
        <div className="relative max-w-md flex-1">
          <MagnifyingGlass className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" />
          <input placeholder="Search references, names, bibs" className="h-10 w-full rounded-full border border-line bg-paper pl-10 pr-14 text-sm outline-none focus:border-forest focus:bg-white" />
          <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-line bg-white px-1.5 font-mono text-[0.6875rem] text-muted sm:block">Ctrl K</kbd>
        </div>
        <span className="ml-auto hidden items-center gap-2 rounded-full bg-forest-50 px-3 py-1.5 text-xs font-bold text-forest sm:flex">
          <span className="size-2 animate-pulse rounded-full bg-forest" /> Live
        </span>
        <button className="relative grid size-10 place-items-center rounded-full hover:bg-sand" aria-label="Notifications">
          <Bell weight="bold" className="size-5 text-navy" />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-ember ring-2 ring-white" />
        </button>
      </header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} className="fixed inset-0 z-50 bg-navy/40 lg:hidden" />
            <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", stiffness: 400, damping: 40 }} className="fixed inset-y-0 left-0 z-50 w-72 bg-navy p-4 lg:hidden">
              <div className="flex items-center justify-between px-2 pb-6 pt-2">
                <NrifLockup white className="h-9" />
                <button onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-full bg-white/10 text-white" aria-label="Close menu">
                  <X weight="bold" className="size-4" />
                </button>
              </div>
              <Nav onPick={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="px-4 pb-28 pt-8 sm:px-6 lg:px-10">{children}</main>
    </div>
  );
}

export function AdminTitle({ title, sub, actions }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[1.9rem] font-bold tracking-[-0.02em] text-navy">{title}</h1>
        {sub && <p className="mt-1 text-muted">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ children, className, title, aside }: { children: ReactNode; className?: string; title?: ReactNode; aside?: ReactNode }) {
  return (
    <section className={cn("rounded-[1.25rem] border border-line bg-white p-5", className)}>
      {title && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-bold text-navy">{title}</h2>
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}
