import "server-only";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/*
 * Neon over HTTP: one round trip per query, no connection pool to manage on Vercel. Anything that must happen
 * atomically lives in a Postgres function (see confirm_booking in db/schema.sql) so it is still one call.
 */
let client: NeonQueryFunction<false, false> | null = null;

export function sql() {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    client = neon(url);
  }
  return client;
}

/** Plain parameterised query: q("select * from x where id = $1", [id]). */
export async function q<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  return (await sql().query(text, params)) as T[];
}

export async function one<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T | null> {
  const rows = await q<T>(text, params);
  return rows[0] ?? null;
}

export async function log(kind: string, text: string, opts: { actor?: string; bookingId?: string | null } = {}) {
  await q("insert into activity (actor, kind, text, booking_id) values ($1, $2, $3, $4)", [opts.actor ?? "system", kind, text, opts.bookingId ?? null]);
}

export async function settings(keys?: string[]) {
  const rows = keys?.length
    ? await q<{ key: string; value: string }>("select key, value from settings where key = any($1)", [keys])
    : await q<{ key: string; value: string }>("select key, value from settings");
  return Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, string>;
}
