"use client";

import { useEffect, type ReactNode } from "react";
import { MotionConfig } from "motion/react";
import { Toaster } from "sonner";
import { useBooking } from "@/lib/store";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    // The booking lives in sessionStorage so a refresh mid-flow keeps the form. Read it after mount, never on the server.
    void useBooking.persist.rehydrate();
  }, []);
  return (
    <MotionConfig reducedMotion="user">
      {children}
      <Toaster
        position="top-center"
        offset={20}
        toastOptions={{
          classNames: {
            toast: "!rounded-2xl !border-line !bg-white !text-navy !shadow-lift !font-sans",
            description: "!text-muted",
          },
        }}
      />
    </MotionConfig>
  );
}
