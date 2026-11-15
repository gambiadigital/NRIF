"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "./client";

/* The booking as the participant's own screens see it (see publicBooking in lib/server/bookings.ts). */
export type ClientParticipant = {
  id: string;
  fullName: string;
  firstName: string;
  eventId: string;
  bib: string | null;
  bibName: string | null;
  shirt: string | null;
  age: number | null;
  isLead: boolean;
  guardian: string | null;
};

export type ClientBooking = {
  reference: string;
  status: "pending" | "paid" | "released" | "cancelled";
  residence: "gambia" | "abroad";
  city: string | null;
  town: string | null;
  currency: string;
  total: number;
  donation: number;
  payMethod: string;
  holdUntil: string;
  paidAt: string | null;
  claimedAt: string | null;
  createdAt: string;
  steps: boolean;
  stepsCode: string | null;
  teamCode: string | null;
  phoneIso: string;
  phoneTail: string;
  participants: ClientParticipant[];
  results?: { id: string; participant_id: string; status: string; run_date: string; distance_km: number; duration_seconds: number; review_note: string | null }[];
  stepsTotal?: number;
  stepsWeek?: { day: string; steps: number }[];
  stepsRaised?: number;
  stepsSupporters?: number;
  transfers?: { participant_id: string; new_name: string; status: string }[];
  kitLocked?: boolean;
};

/** Loads a booking by reference + key, or by the My entry cookie when those are absent. Optionally polls. */
export function useBookingData(ref: string | null, key: string | null, pollMs = 0) {
  const [data, setData] = useState<ClientBooking | null>(null);
  const [error, setError] = useState<{ status: number; message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const d = ref && key ? await api<ClientBooking>(`/api/entry?ref=${encodeURIComponent(ref)}&k=${encodeURIComponent(key)}`) : await api<ClientBooking>("/api/entry");
      setData(d);
      setError(null);
    } catch (e) {
      setError({ status: (e as { status?: number }).status ?? 500, message: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }, [ref, key]);

  useEffect(() => {
    const first = setTimeout(load, 0);
    if (!pollMs) return () => clearTimeout(first);
    const t = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, pollMs);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [load, pollMs]);

  return { data, error, loading, reload: load };
}

export function formatHold(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
}
