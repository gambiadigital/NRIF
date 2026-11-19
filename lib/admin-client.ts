"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "./client";

/** Admin data: loads on mount, reloads on demand, and sends an expired session back to the sign-in page. */
export function useAdmin<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    if (!path) return;
    try {
      setData(await api<T>(path));
      setError(null);
    } catch (e) {
      if ((e as { status?: number }).status === 401) {
        window.location.href = `/admin/login?next=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [path]);
  useEffect(() => {
    const t = setTimeout(load, 0);
    window.addEventListener(CHANGED, load);
    return () => {
      clearTimeout(t);
      window.removeEventListener(CHANGED, load);
    };
  }, [load]);
  return { data, error, loading, reload: load };
}

const CHANGED = "r4i-admin-changed";
/** After an action that changes data: every admin view on screen reloads (the page, and the sidebar's badges). */
export function adminChanged() {
  window.dispatchEvent(new Event(CHANGED));
}

export const when = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

export const hhmm = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

export const gmd = (n: number) => `GMD ${Math.round(n).toLocaleString("en-GB")}`;

/** How a booking's status reads in the console: a paid booking is one that staff (or the card provider) confirmed. */
export const STATUS_LABEL: Record<string, string> = { paid: "Confirmed", pending: "Waiting", released: "Released", cancelled: "Cancelled" };
export const STATUS_TONE: Record<string, "forest" | "cobalt" | "neutral" | "ember"> = { paid: "forest", pending: "cobalt", released: "neutral", cancelled: "ember" };

/** "3 min ago", "5 h ago", or the date: for times that matter relative to now. */
export function ago(iso: string | null | undefined, now: number) {
  if (!iso) return "—";
  const m = Math.round((now - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  if (m < 60 * 24) return `${Math.round(m / 60)} h ago`;
  return when(iso);
}

/** The current time, ticking each minute, for "5 min ago" labels (Date.now() can't be called during render). */
export function useNow() {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const first = setTimeout(() => setNow(Date.now()), 0);
    const tick = setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      clearTimeout(first);
      clearInterval(tick);
    };
  }, []);
  return now;
}

/** "Thursday 19 November" style day headings for timelines. */
export const dayLabel = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
