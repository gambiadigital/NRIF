"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  SquaresFour,
  ArrowsLeftRight,
  UsersThree,
  Hash,
  ChatCircleText,
  Megaphone,
  List,
  X,
  ArrowSquareOut,
  PersonSimpleRun,
  GearSix,
  SignOut,
  ClockCounterClockwise,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { NrifLockup } from "@/components/brand";
import { api } from "@/lib/client";
import { useAdmin } from "@/lib/admin-client";
import { initials } from "@/lib/format";
import { cn } from "@/lib/cn";

export type Me = { name: string; email: string; role: string; badges: { payments: number; virtual: number } | null; providers: { email: boolean }; waveCheckout: boolean };

const NAV = [
  { href: "/admin", label: "Overview", icon: SquaresFour },
  { href: "/admin/payments", label: "Payments", icon: ArrowsLeftRight, badge: "payments" as const },
  { href: "/admin/entries", label: "Entries", icon: UsersThree },
  { href: "/admin/virtual", label: "Virtual runs", icon: PersonSimpleRun, badge: "virtual" as const },
  { href: "/admin/events", label: "Events and bibs", icon: Hash },
  { href: "/admin/messages", label: "Messages", icon: ChatCircleText },
  { href: "/admin/campaigns", label: "Campaign links", icon: Megaphone },
  { href: "/admin/audit", label: "Audit", icon: ClockCounterClockwise },
  { href: "/admin/settings", label: "Settings", icon: GearSix },
];

const isOn = (href: string, pathname: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

function Nav({ me, onPick }: { me: Me | null; onPick?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-1">
      {NAV.map((n) => {
        const on = isOn(n.href, pathname);
        const count = n.badge ? me?.badges?.[n.badge] ?? 0 : 0;
        return (
          <Link key={n.href} href={n.href} onClick={onPick} className={cn("relative flex h-11 items-center gap-3 rounded-xl px-3 text-[0.9375rem] font-semibold transition-colors", on ? "text-navy" : "text-white/70 hover:bg-white/5 hover:text-white")}>
            {on && <motion.span layoutId="admin-nav" className="absolute inset-0 rounded-xl bg-white" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
            <n.icon weight={on ? "fill" : "regular"} className={cn("relative size-5", on && "text-forest")} />
            <span className="relative">{n.label}</span>
            {count > 0 && <span className="relative ml-auto rounded-full bg-ember px-2 py-0.5 text-[0.6875rem] font-bold text-white">{count}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

async function signOut() {
  await api("/api/admin/logout", { method: "POST" }).catch(() => {});
  window.location.href = "/admin/login";
}

function Who({ me }: { me: Me | null }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ember text-sm font-bold text-white">{me ? initials(me.name) : ""}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{me?.name ?? "…"}</p>
        <p className="truncate text-xs text-white/50">{me?.email}</p>
      </div>
      <button onClick={signOut} className="grid size-9 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white" aria-label="Sign out">
        <SignOut weight="bold" className="size-4" />
      </button>
    </div>
  );
}

/** Search from anywhere in the console: it opens Entries filtered by what was typed. */
function QuickSearch({ className }: { className?: string }) {
  const router = useRouter();
  const [v, setV] = useState("");
  function go(e: FormEvent) {
    e.preventDefault();
    const term = v.trim();
    if (!term) return;
    router.push(`/admin/entries?q=${encodeURIComponent(term)}`);
    setV("");
  }
  return (
    <form onSubmit={go} role="search" className={cn("relative", className)}>
      <MagnifyingGlass weight="bold" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" />
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder="Find an entry: name, bib, reference, phone"
        aria-label="Find an entry"
        className="h-10 w-full rounded-full border border-line bg-paper pl-10 pr-4 text-sm text-navy outline-none transition-colors placeholder:text-faint focus:border-forest focus:bg-white"
      />
    </form>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const me = useAdmin<Me>("/api/admin/me").data;
  const pathname = usePathname();
  const here = NAV.find((n) => isOn(n.href, pathname));
  return (
    <div className="min-h-dvh bg-[#f3f2ee] lg:pl-[16.5rem]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[16.5rem] flex-col bg-navy p-4 lg:flex">
        <div className="px-2 pb-6 pt-2">
          <NrifLockup white className="h-10" />
          <p className="mt-3 font-label text-white/45">Run admin · 2027</p>
        </div>
        <Nav me={me} />
        <div className="mt-auto space-y-3">
          <Link href="/" target="_blank" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white/60 hover:text-white">
            <ArrowSquareOut weight="bold" className="size-4" /> View the public site
          </Link>
          <Who me={me} />
        </div>
      </aside>

      {/* The top bar: always in view. On phones it carries the menu; from the laptop up, where you are and a quick search. */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-10">
        <button onClick={() => setOpen(true)} className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-sand lg:hidden" aria-label="Open menu">
          <List weight="bold" className="size-5" />
        </button>
        <NrifLockup className="h-8 shrink-0 lg:hidden" />
        <p className="hidden items-center gap-2 text-sm font-semibold text-muted lg:flex">
          Run admin <span className="text-faint">/</span> <span className="text-navy">{here?.label ?? "Admin"}</span>
        </p>
        <QuickSearch className="ml-auto hidden w-full max-w-sm md:block" />
        <span className="ml-auto hidden size-9 shrink-0 place-items-center rounded-full bg-ember text-sm font-bold text-white sm:grid md:ml-0" title={me ? `${me.name} · ${me.email}` : undefined}>
          {me ? initials(me.name) : ""}
        </span>
      </header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} className="fixed inset-0 z-50 bg-navy/40 lg:hidden" />
            <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", stiffness: 400, damping: 40 }} className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-y-auto bg-navy p-4 lg:hidden">
              <div className="flex items-center justify-between px-2 pb-6 pt-2">
                <NrifLockup white className="h-9" />
                <button onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-full bg-white/10 text-white" aria-label="Close menu">
                  <X weight="bold" className="size-4" />
                </button>
              </div>
              <Nav me={me} onPick={() => setOpen(false)} />
              <div className="mt-auto pt-4">
                <Who me={me} />
              </div>
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
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[1.75rem] font-bold tracking-[-0.02em] text-navy sm:text-[1.9rem]">{title}</h1>
        {sub && <p className="mt-1 max-w-3xl text-muted">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/**
 * A page's search, tabs and filters. It sticks under the top bar while the list scrolls, edge to edge, so the controls
 * are always in reach.
 */
export function Toolbar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("@container sticky top-16 z-20 -mx-4 mb-4 border-b border-line/80 bg-[#f3f2ee]/90 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10", className)}>
      {children}
    </div>
  );
}

/** Pill tabs with counts, used in the sticky toolbars. */
export function Tabs<T extends string>({ value, onChange, tabs }: { value: T; onChange: (v: T) => void; tabs: { v: T; l: string; n?: number }[] }) {
  return (
    <div role="tablist" className="flex gap-1 rounded-full bg-white p-1 ring-1 ring-line">
      {tabs.map((t) => (
        <button
          key={t.v}
          role="tab"
          aria-selected={value === t.v}
          onClick={() => onChange(t.v)}
          className={cn(
            "relative flex h-9 min-w-0 flex-auto items-center justify-center gap-1 rounded-full px-2 text-[0.8125rem] font-semibold transition-colors sm:flex-none sm:gap-1.5 sm:px-4 sm:text-sm",
            value === t.v ? "text-white" : "text-navy hover:bg-paper",
          )}
        >
          {value === t.v && <motion.span layoutId={`tabs-${tabs.map((x) => x.v).join("-")}`} className="absolute inset-0 rounded-full bg-forest" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
          <span className="relative truncate">{t.l}</span>
          {t.n !== undefined && <span className={cn("relative shrink-0 rounded-full px-1.5 text-[0.6875rem] tabular sm:text-xs", value === t.v ? "bg-white/20" : "bg-sand")}>{t.n}</span>}
        </button>
      ))}
    </div>
  );
}

/** The search box used in toolbars. `field` makes it match the form selects beside it (taller, squarer). */
export function SearchBox({ value, onChange, placeholder, className, field }: { value: string; onChange: (v: string) => void; placeholder: string; className?: string; field?: boolean }) {
  return (
    <div className={cn("relative", className)}>
      <MagnifyingGlass weight="bold" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(
          "w-full border border-line bg-white pl-10 pr-10 text-[0.9375rem] text-navy outline-none transition-colors placeholder:text-faint focus:border-forest",
          field ? "h-12 rounded-xl" : "h-11 rounded-full",
        )}
      />
      {value && (
        <button onClick={() => onChange("")} className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-sand" aria-label="Clear search">
          <X weight="bold" className="size-3.5" />
        </button>
      )}
    </div>
  );
}

export function Panel({ children, className, title, aside }: { children: ReactNode; className?: string; title?: ReactNode; aside?: ReactNode }) {
  return (
    <section className={cn("min-w-0 rounded-[1.25rem] border border-line bg-white p-5", className)}>
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

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">{children}</p>;
}
