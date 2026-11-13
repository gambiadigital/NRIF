"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { List, X, ArrowUpRight, UserCircle } from "@phosphor-icons/react";
import { R4ILogo, FlagBars } from "@/components/brand";
import { ButtonLink } from "@/components/ui/button";
import { RUN } from "@/lib/data";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/#why", label: "Why we run" },
  { href: "/#events", label: "Events" },
  { href: "/#race-day", label: "Race day" },
  { href: "/#abroad", label: "From abroad" },
  { href: "/help", label: "Help" },
];

/** Floats over the hero in white, then settles onto paper with a hairline once the page moves. */
export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const [scrolled, setScrolled] = useState(!overlay);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!overlay) return;
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [overlay]);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  const light = overlay && !scrolled;

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-300",
          light ? "bg-gradient-to-b from-navy/55 to-transparent" : "bg-paper/85 shadow-[0_1px_0_var(--color-line)] backdrop-blur-xl",
        )}
      >
        <div className="mx-auto flex h-[var(--header-h)] max-w-[88rem] items-center gap-6 px-4 sm:px-6 lg:px-10">
          <Link href="/" aria-label="Run for Independence home" className="shrink-0">
            <R4ILogo reverse={light} priority className="w-[7.5rem] sm:w-[8.5rem]" />
          </Link>
          <nav className="ml-4 hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "rounded-full px-3.5 py-2 text-[0.875rem] font-semibold transition-colors",
                  light ? "text-white/85 hover:bg-white/10 hover:text-white" : "text-navy/75 hover:bg-navy/5 hover:text-navy",
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/my-entry"
              className={cn(
                "hidden h-10 items-center gap-2 rounded-full px-3.5 text-[0.875rem] font-semibold transition-colors sm:flex",
                light ? "text-white hover:bg-white/10" : "text-navy hover:bg-navy/5",
              )}
            >
              <UserCircle weight="bold" className="size-[1.15rem]" />
              My entry
            </Link>
            <ButtonLink href="/register" variant="sun" size="md" arrow className="h-10 px-4 text-[0.875rem]">
              Sign up
            </ButtonLink>
            <button
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className={cn("grid size-10 place-items-center rounded-full lg:hidden", light ? "text-white hover:bg-white/10" : "text-navy hover:bg-navy/5")}
            >
              <List weight="bold" className="size-5" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ clipPath: "circle(0% at 100% 0%)" }}
            animate={{ clipPath: "circle(150% at 100% 0%)" }}
            exit={{ clipPath: "circle(0% at 100% 0%)" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[60] flex flex-col bg-navy text-white"
          >
            <div className="flex h-[var(--header-h)] items-center justify-between px-4 sm:px-6">
              <R4ILogo reverse className="w-[7.5rem]" />
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="grid size-10 place-items-center rounded-full bg-white/10">
                <X weight="bold" className="size-5" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col justify-center gap-1 px-6">
              {[...NAV, { href: "/my-entry", label: "My entry" }].map((n, i) => (
                <motion.div key={n.href} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
                  <Link href={n.href} onClick={() => setOpen(false)} className="group flex items-center justify-between border-b border-white/10 py-3.5">
                    <span className="font-race text-[2.6rem] text-white transition-colors group-hover:text-sun">{n.label}</span>
                    <ArrowUpRight weight="bold" className="size-6 text-white/40" />
                  </Link>
                </motion.div>
              ))}
            </nav>
            <div className="space-y-4 px-6 pb-10">
              <FlagBars />
              <p className="text-sm text-white/60">
                {RUN.dateLong} · {RUN.venue}, {RUN.venueArea}
              </p>
              <ButtonLink href="/register" variant="sun" size="lg" block arrow onClick={() => setOpen(false)}>
                Sign up
              </ButtonLink>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
