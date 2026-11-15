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
    return () => clearTimeout(t);
  }, [load]);
  return { data, error, loading, reload: load };
}

export const when = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

export const hhmm = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

export const gmd = (n: number) => `GMD ${Math.round(n).toLocaleString("en-GB")}`;
