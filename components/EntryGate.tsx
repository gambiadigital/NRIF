"use client";

import Link from "next/link";
import { WarningCircle } from "@phosphor-icons/react";

/** What a participant screen shows while its booking loads, or when the link or sign-in doesn't open one. */
export function EntryGate({ loading, error }: { loading: boolean; error: { status: number; message: string } | null }) {
  if (loading || !error) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-16">
        <div className="mx-auto size-16 animate-pulse rounded-full bg-sand" />
        <div className="mx-auto h-14 w-2/3 animate-pulse rounded-2xl bg-sand" />
        <div className="mx-auto aspect-[1.42/1] w-full max-w-xl animate-pulse rounded-[2rem] bg-sand" />
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-xl px-4 py-20">
      <div className="rounded-[1.75rem] border border-line bg-white p-8 text-center shadow-card">
        <WarningCircle weight="duotone" className="mx-auto size-12 text-cobalt" />
        <h1 className="mt-4 text-2xl font-bold text-navy">{error.status === 401 ? "Sign in to see your entry" : "We could not open that booking"}</h1>
        <p className="mt-2 text-muted">{error.status === 401 ? "Use your booking reference and the phone number you booked with." : error.message}</p>
        <Link href="/my-entry" className="mt-6 inline-flex h-11 items-center rounded-full bg-forest px-6 font-semibold text-white hover:bg-forest-700">
          Find my entry
        </Link>
      </div>
    </div>
  );
}
