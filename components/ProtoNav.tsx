"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, CaretRight, MagnifyingGlass, SquaresFour, Stack, X } from "@phosphor-icons/react";
import { JOURNEYS, ALL_SCREENS, type Screen } from "@/lib/screens";
import { useBooking } from "@/lib/store";
import { PERSONAS } from "@/lib/data";
import { cn } from "@/lib/cn";
import { Segmented } from "./ui/fields";

/*
 * The prototype's own navigation, floating over every screen: jump to any screen, switch persona, step through the
 * storyboard with [ and ]. It is the one piece of chrome that will not ship, so it is navy and plainly labelled.
 */
export function ProtoNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const persona = useBooking((s) => s.persona);
  const load = useBooking((s) => s.load);

  const index = useMemo(() => ALL_SCREENS.findIndex((s) => s.href.split("?")[0] === pathname), [pathname]);

  function go(s: Screen) {
    if (s.persona && s.persona !== persona) load(s.persona);
    setOpen(false);
    router.push(s.href);
  }

  useEffect(() => {
    // Persona from the address bar (?as=lamin), so shared prototype links open on the right person.
    const as = new URLSearchParams(window.location.search).get("as");
    if ((as === "lamin" || as === "fatou" || as === "blank") && as !== useBooking.getState().persona) useBooking.getState().load(as);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "]" || e.key === "[") {
        const i = index < 0 ? 0 : index + (e.key === "]" ? 1 : -1);
        const s = ALL_SCREENS[(i + ALL_SCREENS.length) % ALL_SCREENS.length]!;
        go(s);
      }
      if (e.key === "\\") setOpen((o) => !o);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, persona]);

  const filtered = JOURNEYS.map((j) => ({
    ...j,
    screens: j.screens.filter((s) => !q || `${s.title} ${s.note} ${j.title}`.toLowerCase().includes(q.toLowerCase())),
  })).filter((j) => j.screens.length);

  const prev = ALL_SCREENS[((index < 0 ? 0 : index) - 1 + ALL_SCREENS.length) % ALL_SCREENS.length]!;
  const next = ALL_SCREENS[((index < 0 ? -1 : index) + 1) % ALL_SCREENS.length]!;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <div className="no-print fixed bottom-[6.25rem] left-3 z-[70] flex items-center gap-1 rounded-full bg-navy/95 p-1 text-white shadow-pop ring-1 ring-white/10 backdrop-blur-md lg:bottom-5 lg:left-5">
        <button onClick={() => go(prev)} aria-label="Previous screen" className="hidden size-9 sm:grid place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white">
          <ArrowLeft weight="bold" className="size-4" />
        </button>
        <Dialog.Trigger className="flex h-9 items-center gap-2 rounded-full bg-white/10 px-3.5 text-[0.8125rem] font-semibold hover:bg-white/15">
          <Stack weight="fill" className="size-4 text-sun" />
          <span className="hidden sm:inline">Prototype</span>
          <span className="tabular text-white/60">{index < 0 ? "–" : index + 1}/{ALL_SCREENS.length}</span>
        </Dialog.Trigger>
        <button onClick={() => go(next)} aria-label="Next screen" className="hidden size-9 sm:grid place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white">
          <ArrowRight weight="bold" className="size-4" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] bg-navy/40 backdrop-blur-[2px]" />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <motion.div
                initial={{ x: "-104%" }}
                animate={{ x: 0 }}
                exit={{ x: "-104%" }}
                transition={{ type: "spring", stiffness: 380, damping: 38 }}
                className="fixed inset-y-2 left-2 z-[95] flex w-[min(26rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-[1.5rem] bg-white shadow-pop"
              >
                <div className="flex items-start justify-between gap-4 border-b border-line px-5 pb-4 pt-5">
                  <div>
                    <Dialog.Title className="font-race text-[1.75rem] text-navy">Prototype map</Dialog.Title>
                    <Dialog.Description className="mt-1 text-sm text-muted">Every screen in the storyboard. Press [ and ] to step through.</Dialog.Description>
                  </div>
                  <Dialog.Close className="grid size-9 place-items-center rounded-full bg-sand text-navy hover:bg-line">
                    <X weight="bold" className="size-4" />
                  </Dialog.Close>
                </div>
                <div className="space-y-3 border-b border-line px-5 py-4">
                  <p className="font-label text-muted">Viewing as</p>
                  <Segmented
                    value={persona}
                    onChange={(v) => load(v)}
                    options={[
                      { value: "fatou", label: PERSONAS.fatou.first },
                      { value: "lamin", label: PERSONAS.lamin.first },
                      { value: "blank", label: "Blank form" },
                    ]}
                  />
                  <div className="relative">
                    <MagnifyingGlass className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" />
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Find a screen"
                      className="h-11 w-full rounded-xl border border-line bg-paper pl-10 pr-3 text-sm outline-none focus:border-forest"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-3 py-3">
                  {filtered.map((j) => (
                    <div key={j.id} className="mb-3">
                      <div className="flex items-baseline justify-between px-2 pb-1.5 pt-2">
                        <span className="text-[0.8125rem] font-bold text-navy">{j.title}</span>
                        <span className="text-xs text-faint">{j.who}</span>
                      </div>
                      {j.screens.map((s) => {
                        const on = s.href.split("?")[0] === pathname;
                        return (
                          <button
                            key={s.href + s.title}
                            onClick={() => go(s)}
                            className={cn("group flex w-full items-center gap-3 rounded-2xl px-2.5 py-2.5 text-left transition-colors", on ? "bg-forest-50" : "hover:bg-paper")}
                          >
                            <span
                              className={cn(
                                "grid size-9 shrink-0 place-items-center rounded-xl font-mono text-[0.6875rem] font-bold",
                                on ? "bg-forest text-white" : "bg-sand text-muted",
                              )}
                            >
                              {s.frame ?? "··"}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-navy">{s.title}</span>
                              <span className="block truncate text-xs text-muted">{s.note}</span>
                            </span>
                            <CaretRight weight="bold" className="size-3.5 text-faint transition-transform group-hover:translate-x-0.5" />
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
                <div className="border-t border-line p-3">
                  <Link href="/flow" onClick={() => setOpen(false)} className="flex items-center justify-center gap-2 rounded-2xl bg-navy py-3 text-sm font-semibold text-white hover:bg-navy-800">
                    <SquaresFour weight="fill" className="size-4 text-sun" />
                    Open the storyboard map
                  </Link>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
