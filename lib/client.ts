"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { EVENTS, type RaceEvent } from "./data";

/* Fetch helpers and the few live hooks the public screens share. */

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const res = await fetch(path, {
    ...init,
    method: init?.method ?? (init?.json !== undefined ? "POST" : "GET"),
    headers: { ...(init?.json !== undefined ? { "Content-Type": "application/json" } : {}), ...init?.headers },
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new ApiError(res.status, data.error ?? "Something went wrong. Please try again.");
  return data;
}

/** A small cache so several components asking for the same thing make one request. */
const cache = new Map<string, { at: number; p: Promise<unknown> }>();
function cached<T>(path: string, ttl = 30_000): Promise<T> {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < ttl) return hit.p as Promise<T>;
  const p = api<T>(path).catch((e) => {
    cache.delete(path);
    throw e;
  });
  cache.set(path, { at: Date.now(), p });
  return p;
}

export function useApi<T>(path: string | null, ttl = 30_000) {
  const [state, setState] = useState<{ data: T | null; error: string | null; loading: boolean }>({ data: null, error: null, loading: !!path });
  useEffect(() => {
    if (!path) return;
    let live = true;
    cached<T>(path, ttl)
      .then((data) => live && setState({ data, error: null, loading: false }))
      .catch((e: Error) => live && setState({ data: null, error: e.message, loading: false }));
    return () => {
      live = false;
    };
  }, [path, ttl]);
  return state;
}

export function invalidate(prefix: string) {
  for (const k of cache.keys()) if (k.startsWith(prefix)) cache.delete(k);
}

/* ---------- live events: fees and start times from the database, merged into EVENTS ---------- */

type LiveEvent = { id: string; feeGMD: number; suggestedGBP: number; start: string; minAge: number; open: boolean };
let version = 0;
const listeners = new Set<() => void>();
let loading: Promise<void> | null = null;

function loadEvents() {
  if (loading) return loading;
  loading = api<{ events: LiveEvent[] }>("/api/events")
    .then(({ events }) => {
      for (const live of events) {
        const ev = EVENTS.find((e) => e.id === live.id) as (RaceEvent & { open?: boolean }) | undefined;
        if (!ev) continue;
        ev.feeGMD = live.feeGMD;
        ev.suggestedGBP = live.suggestedGBP;
        ev.start = live.start;
        ev.minAge = live.minAge;
        ev.open = live.open;
      }
      version++;
      listeners.forEach((l) => l());
    })
    .catch(() => {
      loading = null;
    });
  return loading;
}

/** Re-renders when live fees arrive. Until then the defaults in lib/data.ts show. */
export function useLiveEvents() {
  useEffect(() => {
    void loadEvents();
  }, []);
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => version,
    () => 0,
  );
  return EVENTS;
}

export type PublicSettings = Record<string, string> & { wave_link: string; wave_checkout: boolean; card_checkout: boolean; card_currencies: string };

/** Card is offered only when the gateway is set up and takes this booking's currency. */
export const cardFor = (s: PublicSettings | null | undefined, currency: string) => !!s?.card_checkout && (s.card_currencies ?? "").split(",").includes(currency);
export const useSettings = () => useApi<PublicSettings>("/api/settings/public", 300_000);

export type Stats = {
  raised: number;
  goal: number;
  entries: number;
  abroadEntries: number;
  cities: { city: string; n: number }[];
  teams: { code: string; name: string; kind: string; n: number }[];
};
export const useStats = () => useApi<Stats>("/api/stats", 60_000);
