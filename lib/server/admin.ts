import "server-only";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, cookieOptions, seal } from "./session";

export const ADMIN_HOURS = 12;

export async function startAdminSession(admin: { id: string; name: string }) {
  const value = await seal({ kind: "admin", sub: admin.id, name: admin.name, exp: Date.now() + ADMIN_HOURS * 3600_000 });
  (await cookies()).set(ADMIN_COOKIE, value, cookieOptions(ADMIN_HOURS * 3600));
}

/** CSV with every cell quoted, so names with commas and leading = signs are safe in spreadsheets. */
export function csv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]!);
  const cell = (v: unknown) => {
    let s = v === null || v === undefined ? "" : String(v);
    if (/^[=+\-@]/.test(s)) s = "'" + s;
    return `"${s.replace(/"/g, '""')}"`;
  };
  return [cols.map(cell).join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\r\n");
}

/**
 * SQL condition that leaves out what hidden accounts (the developer's) did, for the team-facing activity and audit
 * views. `alias` is the activity table's alias in the query.
 */
export const visibleActor = (alias: string) => `${alias}.actor not in (select name from admins where hidden)`;
