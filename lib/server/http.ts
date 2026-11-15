import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { ZodError, type ZodType } from "zod";
import { ADMIN_COOKIE, ENTRY_COOKIE, unseal, type AdminSession, type EntrySession } from "./session";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

/** Wraps a route handler: request-time only, typed errors become JSON, anything else is a logged 500. */
export function route<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A) => {
    await connection();
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status);
      if (e instanceof ZodError) return json({ error: e.issues[0]?.message ?? "Check the form and try again", issues: e.issues }, 400);
      console.error(e);
      return json({ error: "Something went wrong on our side. Please try again." }, 500);
    }
  };
}

export async function body<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError(400, "Expected a JSON body");
  }
  return schema.parse(raw);
}

export async function requireAdmin(): Promise<AdminSession> {
  const s = await unseal<AdminSession>((await cookies()).get(ADMIN_COOKIE)?.value, "admin");
  if (!s) throw new HttpError(401, "Please sign in again");
  return s;
}

export async function entrySession(): Promise<EntrySession | null> {
  return unseal<EntrySession>((await cookies()).get(ENTRY_COOKIE)?.value, "entry");
}
