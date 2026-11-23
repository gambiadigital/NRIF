import type { NextRequest } from "next/server";
import { z } from "zod";
import { one } from "@/lib/server/db";
import { HttpError, body as readBody, json, requireAdmin, route } from "@/lib/server/http";
import { composeSample, providers, sendEmail, siteUrl } from "@/lib/server/messages";
import type { EmailPerson } from "@/lib/server/emailHtml";

/*
 * The designed email for a template, filled with a sample booking, exactly as participants get it. GET returns the
 * HTML for the preview in Admin → Messages (with ?body= for words not saved yet). POST sends that sample to an address,
 * so staff can see it in a real inbox.
 */

const SAMPLE_VARS: Record<string, string> = {
  first: "Fatoumata",
  event: "5 km Run",
  bib: "4047",
  bibs: "4047, 7012",
  start: "07:30",
  link: "run4independence.nrif.gm/b/7Q4K-a8Kd2f3x",
  hold: "Sun 25 Jan, 23:59",
  amount: "GMD 500",
  ref: "RFI-7Q4K",
  payref: "TX 8F3K2Q91",
  method: "Wave",
};
const PEOPLE: EmailPerson[] = [
  { name: "Fatoumata Jallow", bib: "4047", event: "5 km Run", kind: "in-person", start: "07:30" },
  { name: "Lamin Jallow", bib: "7012", event: "1.965 km Heritage Walk", kind: "in-person", start: "07:30" },
];
const VIRTUAL: EmailPerson[] = [{ name: "Fatoumata Jallow", bib: "V7012", event: "Diaspora Virtual Run", kind: "virtual", start: "Any day" }];

async function sample(id: string, draft?: string) {
  const t = await one<{ body: string }>("select body from templates where id = $1", [id]);
  if (!t) throw new HttpError(404, "No such template");
  const virtual = id === "confirm-virtual" || id === "virtual-open";
  const vars = virtual ? { ...SAMPLE_VARS, event: "Diaspora Virtual Run", bib: "V7012", bibs: "V7012", amount: "£15.00" } : SAMPLE_VARS;
  return composeSample(id, draft ?? t.body, vars, virtual ? VIRTUAL : PEOPLE, `${siteUrl()}/b/7Q4K-a8Kd2f3x`);
}

export const GET = route(async (req: NextRequest) => {
  await requireAdmin();
  const sp = req.nextUrl.searchParams;
  const mail = await sample(sp.get("id") ?? "", sp.get("body")?.slice(0, 600) || undefined);
  return new Response(mail.html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
});

const Send = z.object({ id: z.string().max(40), to: z.email(), body: z.string().min(10).max(600).optional() });

export const POST = route(async (req: Request) => {
  await requireAdmin();
  const v = await readBody(req, Send);
  if (!providers().email) throw new HttpError(409, "Email is not set up yet");
  const mail = await sample(v.id, v.body);
  try {
    await sendEmail(v.to, { ...mail, subject: `[Sample] ${mail.subject}` }, undefined);
  } catch (e) {
    throw new HttpError(502, (e as Error).message);
  }
  return json({ ok: true });
});
