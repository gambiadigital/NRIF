import "server-only";
import { RUN } from "@/lib/data";

/*
 * The designed HTML email. Every email has the same frame: the NRIF and Run4Independence logos (always together), the
 * flag stripe, a photo, a headline, the template's own words (staff edit those in Admin → Messages), then a panel built
 * from the booking itself: the reference and amount to pay, the bib "tickets" with race-day details, or the virtual
 * e-bib and run window. A big button opens the booking, and NRIF's footer closes it.
 *
 * Email clients are not browsers: Gmail and Outlook need tables, inline styles and PNG/JPEG images at absolute URLs.
 * Images live in public/email (made from the brand files with sharp). Fonts fall back to Arial/Helvetica everywhere.
 */

export type EmailPerson = { name: string; bib: string | null; event: string; kind: string; start: string };
export type EmailData = {
  templateId: string;
  /** The template's words, already filled in. Blank lines start new paragraphs. */
  text: string;
  vars: Record<string, string>;
  people: EmailPerson[];
  /** Full https link to the booking. */
  link: string;
  site: string;
  contact: { email?: string; phone?: string; whatsapp?: string };
};

const C = { navy: "#0b1b3a", forest: "#135f40", ember: "#d7141a", royal: "#1f3c99", paper: "#f6f4ef", page: "#f3f2ee", line: "#e2ddd2", muted: "#5d6577", faint: "#8b91a0", white: "#ffffff" };
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const HEAVY = "'Arial Black', 'Helvetica Neue', Arial, sans-serif";
const MONO = "'Courier New', Courier, monospace";

type Kind = "payment" | "bibs" | "virtual" | "plain";
const DESIGN: Record<string, { kind: Kind; headline: string; button: string; hero: string }> = {
  pending: { kind: "payment", headline: "Your place is held, {first}", button: "See how to pay", hero: "hero-held" },
  reminder3: { kind: "payment", headline: "Your place is still held", button: "Pay now", hero: "hero-held" },
  confirm: { kind: "bibs", headline: "You're in, {first}!", button: "Open my booking", hero: "hero-in" },
  "confirm-virtual": { kind: "virtual", headline: "You're in, {first}!", button: "Open my booking", hero: "hero-virtual" },
  "race-7": { kind: "bibs", headline: "7 days to go", button: "See the race-day plan", hero: "hero-raceday" },
  "race-1": { kind: "bibs", headline: "See you tomorrow, {first}", button: "Open my booking", hero: "hero-raceday" },
  "virtual-open": { kind: "virtual", headline: "Your run window is open", button: "Upload my run", hero: "hero-virtual" },
};

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const fill = (t: string, v: Record<string, string>) => t.replace(/\{(\w+)\}/g, (m, k: string) => v[k] ?? m);

/** Paragraphs from plain text: links become links, nothing else is added. */
function paragraphs(text: string) {
  return esc(text.trim())
    .split(/\n{2,}/)
    .map((p) =>
      p
        .replace(/\n/g, "<br>")
        // A reference or an amount never breaks across lines, and the reference stands out.
        .replace(/\bRFI-[A-Z0-9]{4}\b/g, (r) => `<b style="white-space:nowrap;font-family:${MONO};letter-spacing:1px">${r}</b>`)
        .replace(/\b(?:GMD|GBP|USD|EUR|SEK) [\d,.]+|[£$€][\d,.]+/g, (m) => `<span style="white-space:nowrap">${m}</span>`)
        .replace(/\b(https?:\/\/[^\s<]+|run4independence\.nrif\.gm\/[^\s<]*)/g, (u) => `<a href="${u.startsWith("http") ? u : `https://${u}`}" style="color:${C.forest};font-weight:bold;text-decoration:underline">${u.replace(/^https?:\/\//, "")}</a>`),
    )
    .map((p) => `<p style="margin:0 0 16px;font-family:${SANS};font-size:16px;line-height:1.6;color:${C.navy}">${p}</p>`)
    .join("");
}

const label = (t: string, color: string = C.muted) =>
  `<p style="margin:0 0 6px;font-family:${SANS};font-size:11px;line-height:1.2;letter-spacing:1.6px;text-transform:uppercase;font-weight:bold;color:${color}">${esc(t)}</p>`;

/** Two to four label/value pairs in a grid of two columns. */
function facts(rows: [string, string][]) {
  const cells = rows.map(
    ([k, v], i) => `<td class="stack${i === 1 ? " sep" : ""}" width="50%" valign="top" style="padding:14px 16px;${i > 1 ? `border-top:1px solid ${C.line}` : ""}">${label(k)}<p style="margin:0;font-family:${SANS};font-size:16px;line-height:1.35;font-weight:bold;color:${C.navy}">${esc(v)}</p></td>`,
  );
  let out = "";
  for (let i = 0; i < cells.length; i += 2) out += `<tr>${cells[i]}${cells[i + 1] ?? `<td class="stack" width="50%"></td>`}</tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;background:${C.white};border:1px solid ${C.line};border-radius:14px">${out}</table>`;
}

function paymentPanel(v: Record<string, string>) {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.paper};border:1px solid ${C.line};border-radius:16px">
  <tr><td style="padding:22px 24px 20px">
    ${label("Your reference")}
    <p style="margin:0;font-family:${MONO};font-size:34px;line-height:1.1;font-weight:bold;letter-spacing:3px;color:${C.navy}">${esc(v.ref ?? "")}</p>
    <p style="margin:8px 0 0;font-family:${SANS};font-size:14px;line-height:1.5;color:${C.muted}">Quote it with your payment so NRIF can match the money to your booking.</p>
  </td></tr>
  <tr><td style="padding:0">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td class="stack" width="50%" valign="top" style="padding:16px 24px;border-top:1px solid ${C.line}">${label("Amount to pay")}<p style="margin:0;font-family:${HEAVY};font-size:22px;line-height:1.2;color:${C.forest}">${esc(v.amount ?? "")}</p></td>
      <td class="stack" width="50%" valign="top" style="padding:16px 24px;border-top:1px solid ${C.line}">${label("Place held until")}<p style="margin:0;font-family:${SANS};font-size:17px;line-height:1.3;font-weight:bold;color:${C.navy}">${esc(v.hold ?? "")}</p></td>
    </tr></table>
  </td></tr>
</table>
<p style="margin:14px 0 0;font-family:${SANS};font-size:14px;line-height:1.55;color:${C.muted}">Pay with Wave, Yonna, Ecobank or a Visa or Mastercard card. Your booking page shows each way, step by step. Your bib number arrives by email as soon as NRIF confirms the payment.</p>`;
}

/** One "ticket" per runner: the bib number on navy, the name and event beside it. */
function tickets(people: EmailPerson[], virtual: boolean) {
  return people
    .map(
      (p) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 10px;border:1px solid ${C.line};border-radius:14px;border-collapse:separate;background:${C.white}">
  <tr>
    <td class="bibcell" width="132" align="center" valign="middle" style="background:${C.navy};border-radius:13px 0 0 13px;padding:16px 8px">
      ${label(virtual ? "E-bib" : "Bib", "#9fb0d0")}
      <p class="bibnum" style="margin:0;font-family:${HEAVY};font-size:32px;line-height:1;color:${C.white};letter-spacing:1px">${esc(p.bib ?? "····")}</p>
    </td>
    <td valign="middle" style="padding:14px 18px">
      <p style="margin:0 0 4px;font-family:${SANS};font-size:17px;line-height:1.3;font-weight:bold;color:${C.navy}">${esc(p.name)}</p>
      <p style="margin:0;font-family:${SANS};font-size:14px;line-height:1.4;color:${C.muted}">${esc(p.event)}${!virtual && p.start ? ` · starts ${esc(p.start)}` : ""}</p>
    </td>
  </tr>
</table>`,
    )
    .join("");
}

function panel(kind: Kind, d: EmailData) {
  if (kind === "payment") return paymentPanel(d.vars);
  if (kind === "bibs") {
    const people = d.people.filter((p) => p.kind !== "virtual");
    const starts = [...new Set(people.map((p) => p.start).filter((t) => /^\d/.test(t)))].join(" and ") || RUN.start;
    return `${tickets(people.length ? people : d.people, false)}<div style="height:6px"></div>${facts([
      ["Race day", RUN.dateLong],
      ["Gates open", RUN.gatesOpen],
      ["Start", starts],
      ["Where", `${RUN.venue}, ${RUN.venueArea}`],
    ])}`;
  }
  if (kind === "virtual") {
    const people = d.people.filter((p) => p.kind === "virtual");
    return `${tickets(people.length ? people : d.people, true)}<div style="height:6px"></div>${facts([
      ["Run window", RUN.virtualWindow],
      ["Upload by", RUN.virtualUploadBy],
      ["Distance", "5 or 10 km"],
      ["Where", "Anywhere you like"],
    ])}`;
  }
  return "";
}

function button(text: string, href: string) {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto">
  <tr><td align="center" bgcolor="${C.forest}" style="border-radius:999px;background:${C.forest}">
    <a href="${esc(href)}" target="_blank" style="display:inline-block;padding:16px 34px;font-family:${SANS};font-size:16px;font-weight:bold;line-height:1;color:${C.white};text-decoration:none;border-radius:999px">${esc(text)} &rarr;</a>
  </td></tr>
</table>`;
}

export function emailHtml(d: EmailData) {
  const design = DESIGN[d.templateId] ?? { kind: "plain" as Kind, headline: "Run for Independence", button: "Open my booking", hero: "hero-raceday" };
  const site = d.site.replace(/\/$/, "");
  const img = (f: string) => `${site}/email/${f}`;
  const headline = fill(design.headline, d.vars);
  const preheader = d.text.replace(/\s+/g, " ").trim().slice(0, 140);
  const contact = [d.contact.email, d.contact.phone || d.contact.whatsapp].filter(Boolean).map((x) => esc(x!)).join(" &nbsp;·&nbsp; ");
  const stripe = (c: string) => `<td width="33%" height="6" style="background:${c};font-size:0;line-height:0">&nbsp;</td>`;

  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${esc(headline)}</title>
<style>
  body { margin:0; padding:0; width:100% !important; -webkit-text-size-adjust:100%; }
  img { border:0; outline:none; text-decoration:none; display:block; }
  a { color:${C.forest}; }
  @media (max-width: 620px) {
    .wrap { padding:12px 8px !important; }
    .pad { padding-left:22px !important; padding-right:22px !important; }
    .h1 { font-size:26px !important; }
    .stack { display:block !important; width:100% !important; box-sizing:border-box; }
    .logo-r4i { width:112px !important; height:auto !important; }
    .logo-nrif { width:104px !important; height:auto !important; }
    .bibcell { width:104px !important; padding:14px 6px !important; }
    .bibnum { font-size:26px !important; }
    .sep { border-top:1px solid ${C.line} !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${C.page}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.page}">
<tr><td class="wrap" align="center" style="padding:28px 12px">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px">

    <!-- Logos: NRIF and Run4Independence always together -->
    <tr><td style="background:${C.white};border-radius:20px 20px 0 0;padding:22px 28px" class="pad">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td valign="middle"><img class="logo-nrif" src="${img("nrif.png")}" width="122" height="40" alt="National Research &amp; Innovation Fund" style="width:122px;height:40px"></td>
        <td valign="middle" style="padding:0 16px"><div style="width:1px;height:36px;background:${C.line}"></div></td>
        <td valign="middle"><img class="logo-r4i" src="${img("r4i.png")}" width="132" height="50" alt="Run for Independence" style="width:132px;height:50px"></td>
      </tr></table>
    </td></tr>

    <!-- Flag stripe -->
    <tr><td style="font-size:0;line-height:0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${stripe(C.ember)}${stripe(C.royal)}${stripe(C.forest)}</tr></table></td></tr>

    <!-- Photo -->
    <tr><td style="background:${C.navy};font-size:0;line-height:0"><img src="${img(`${design.hero}.jpg`)}" width="600" alt="" style="width:100%;max-width:600px;height:auto"></td></tr>

    <!-- Headline and words -->
    <tr><td class="pad" style="background:${C.white};padding:30px 40px 6px">
      ${label(design.kind === "virtual" ? `${RUN.name} · Virtual run, ${RUN.virtualWindow}` : `${RUN.name} · ${RUN.dateShort}`, C.ember)}
      <h1 class="h1" style="margin:4px 0 18px;font-family:${SANS};font-size:30px;line-height:1.15;font-weight:bold;letter-spacing:-0.5px;color:${C.navy}">${esc(headline)}</h1>
      ${paragraphs(d.text)}
    </td></tr>

    <!-- The booking's own details -->
    ${design.kind === "plain" ? "" : `<tr><td class="pad" style="background:${C.white};padding:6px 40px 8px">${panel(design.kind, d)}</td></tr>`}

    <!-- Button -->
    <tr><td class="pad" align="center" style="background:${C.white};padding:26px 40px 10px">${button(design.button, d.link)}</td></tr>
    <tr><td class="pad" align="center" style="background:${C.white};padding:6px 40px 32px;border-radius:0 0 20px 20px">
      <p style="margin:0;font-family:${SANS};font-size:13px;line-height:1.5;color:${C.faint}">Or open <a href="${esc(d.link)}" style="color:${C.muted};text-decoration:underline">${esc(d.link.replace(/^https?:\/\//, ""))}</a></p>
    </td></tr>

    <tr><td style="height:16px;font-size:0;line-height:0">&nbsp;</td></tr>

    <!-- Footer -->
    <tr><td class="pad" style="background:${C.navy};border-radius:20px;padding:26px 32px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td width="52" valign="top"><img src="${img("nrif-tree-white.png")}" width="40" height="42" alt="" style="width:40px;height:42px"></td>
        <td valign="top">
          <p style="margin:0 0 6px;font-family:${SANS};font-size:15px;line-height:1.3;font-weight:bold;color:${C.white}">National Research &amp; Innovation Fund</p>
          <p style="margin:0 0 10px;font-family:${SANS};font-size:13px;line-height:1.55;color:#b9c3d8">Run for Independence 2027 raises money for research and innovation in The Gambia. Thank you for running with us.</p>
          ${contact ? `<p style="margin:0 0 10px;font-family:${SANS};font-size:13px;line-height:1.5;color:${C.white}">${contact}</p>` : ""}
          <p style="margin:0;font-family:${SANS};font-size:12px;line-height:1.5;color:#8796b4">You are getting this email because of a booking at <a href="${esc(site)}" style="color:#b9c3d8;text-decoration:underline">${esc(site.replace(/^https?:\/\//, ""))}</a>. Reply to reach the NRIF team.</p>
        </td>
      </tr></table>
    </td></tr>

  </table>
</td></tr>
</table>
</body>
</html>`;
}
