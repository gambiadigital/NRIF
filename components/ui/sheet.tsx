"use client";

import type { ReactNode } from "react";
import { Dialog } from "radix-ui";
import { AnimatePresence, motion } from "motion/react";
import { X } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

/** A bottom sheet on phones, a centred panel from the tablet up. */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] bg-navy/45 backdrop-blur-[3px]" />
            </Dialog.Overlay>
            <div className="pointer-events-none fixed inset-0 z-[95] flex items-end justify-center sm:items-center sm:p-6">
              <Dialog.Content asChild forceMount>
                <motion.div
                  initial={{ y: "100%", opacity: 0.6 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "100%", opacity: 0 }}
                  transition={{ type: "spring", stiffness: 420, damping: 40 }}
                  className={cn(
                    "pointer-events-auto flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[1.75rem] bg-white shadow-pop sm:rounded-[1.75rem]",
                    wide ? "sm:max-w-3xl" : "sm:max-w-xl",
                  )}
                >
                  <div className="mx-auto mt-2.5 h-1.5 w-12 rounded-full bg-line sm:hidden" />
                  <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-4 sm:pt-6">
                    <div>
                      <Dialog.Title className="text-xl font-bold text-navy">{title}</Dialog.Title>
                      {description && <Dialog.Description className="mt-1 text-sm text-muted">{description}</Dialog.Description>}
                    </div>
                    <Dialog.Close className="grid size-9 shrink-0 place-items-center rounded-full bg-sand text-navy hover:bg-line" aria-label="Close">
                      <X weight="bold" className="size-4" />
                    </Dialog.Close>
                  </div>
                  <div className="flex-1 overflow-y-auto px-6 pb-6 pt-3">{children}</div>
                  {footer && <div className="border-t border-line bg-paper/60 px-6 py-4">{footer}</div>}
                </motion.div>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
