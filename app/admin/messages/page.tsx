"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { ChatText, EnvelopeSimple, Clock, CheckCircle, PaperPlaneTilt, WarningCircle } from "@phosphor-icons/react";
import { AdminTitle, Panel } from "@/components/admin/Shell";
import { Badge, Switch } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const TEMPLATES = [
  { id: "confirm", name: "Confirmation", when: "When a payment is matched", channel: "SMS + email", text: "Run for Independence: You're in, {first}. {event}, bib {bib}. Sat 30 Jan, {start} start, Independence Stadium. Day plan and race pack: {link}", on: true },
  { id: "pending", name: "Pending reminder", when: "Day 3 of a 5-day hold", channel: "SMS", text: "Your Run for Independence place is held until {hold}. Send {amount} with reference {ref}. Already paid? Reply PAID.", on: true },
  { id: "d7", name: "7 days to go", when: "Sat 23 Jan, 09:00", channel: "SMS + email", text: "7 days to go. Collect race packs for bibs {bibs} on Thu 28 or Fri 29 Jan, 10:00-17:00. Show the QR code in your email.", on: true },
  { id: "d1", name: "Tomorrow", when: "Fri 29 Jan, 18:00", channel: "SMS", text: "Tomorrow. Gates open 05:30, {event} starts {start}. Bring water and your bib. See you at Independence Stadium.", on: true },
  { id: "virtual", name: "Virtual window opens", when: "Sat 23 Jan, 07:00", channel: "SMS", text: "The run window is open, {first}. Run your {event} any day to 31 Jan and upload a screenshot or link: {link}", on: true },
];

// How long each placeholder becomes once filled, so the counter shows the real length.
const FILL: Record<string, string> = { "{first}": "Fatou", "{event}": "10K", "{bib}": "1047", "{start}": "07:00", "{link}": "rfi.gm/e/7Q4K", "{hold}": "Sun 25 Oct", "{amount}": "GMD 300", "{ref}": "RFI-3H2P", "{bibs}": "1047, 7012, 7013" };
const filled = (t: string) => Object.entries(FILL).reduce((s, [k, v]) => s.split(k).join(v), t);

const LOG = [
  { t: "15:14", to: "+220 87 •• 2219", what: "Confirmation", ok: true },
  { t: "15:02", to: "+44 7911 •• 456", what: "Confirmation", ok: true },
  { t: "14:36", to: "+220 87 •• 2345", what: "Confirmation", ok: true },
  { t: "14:10", to: "+220 77 •• 9921", what: "Pending reminder", ok: true },
  { t: "13:51", to: "+220 99 •• 1180", what: "Confirmation", ok: false },
];

export default function AdminMessages() {
  const [tpls, setTpls] = useState(TEMPLATES);
  const [active, setActive] = useState("confirm");
  const cur = tpls.find((t) => t.id === active)!;
  const len = filled(cur.text).length;

  return (
    <div className="mx-auto max-w-7xl">
      <AdminTitle title="Messages" sub="Texts stay under 160 characters with the link, so they arrive as one message on every network." />
      <div className="grid gap-4 xl:grid-cols-[20rem_1fr_20rem]">
        <Panel className="p-2">
          {tpls.map((t) => (
            <button key={t.id} onClick={() => setActive(t.id)} className={cn("flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors", active === t.id ? "bg-forest-50" : "hover:bg-paper")}>
              {t.channel.includes("email") ? <EnvelopeSimple weight="duotone" className="mt-0.5 size-5 text-forest" /> : <ChatText weight="duotone" className="mt-0.5 size-5 text-forest" />}
              <span className="flex-1">
                <span className="block text-sm font-bold text-navy">{t.name}</span>
                <span className="flex items-center gap-1 text-xs text-muted">
                  <Clock className="size-3" /> {t.when}
                </span>
              </span>
              <span onClick={(e) => e.stopPropagation()}>
                <Switch checked={t.on} onChange={(v) => setTpls((x) => x.map((y) => (y.id === t.id ? { ...y, on: v } : y)))} label={`Send ${t.name}`} />
              </span>
            </button>
          ))}
        </Panel>

        <Panel title={cur.name} aside={<Badge tone="cobalt">{cur.channel}</Badge>}>
          <textarea
            value={cur.text}
            onChange={(e) => setTpls((x) => x.map((y) => (y.id === cur.id ? { ...y, text: e.target.value } : y)))}
            rows={5}
            className="w-full resize-none rounded-xl border border-line bg-paper p-4 font-mono text-sm leading-relaxed text-navy outline-none focus:border-forest focus:bg-white"
          />
          <div className="mt-3 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-sand">
              <motion.div animate={{ width: `${Math.min(100, (len / 160) * 100)}%` }} className={cn("h-full rounded-full", len > 160 ? "bg-ember" : len > 140 ? "bg-sun" : "bg-forest")} />
            </div>
            <span className={cn("font-mono text-sm font-semibold", len > 160 ? "text-ember" : "text-navy")}>{len}/160</span>
          </div>
          {len > 160 && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-ember">
              <WarningCircle weight="fill" className="size-4" /> This would send as two texts. Shorten it.
            </p>
          )}
          <p className="mt-5 font-label text-muted">Preview with Fatou&apos;s booking</p>
          <div className="mt-2 max-w-sm rounded-[1.25rem] rounded-bl-md bg-[#eceef1] px-4 py-3 text-sm leading-snug text-navy">{filled(cur.text)}</div>
          <div className="mt-5 flex flex-wrap gap-2">
            {Object.keys(FILL).map((k) => (
              <span key={k} className="rounded-md bg-sand px-2 py-1 font-mono text-xs text-muted">
                {k}
              </span>
            ))}
          </div>
          <div className="mt-6 flex gap-2">
            <Button icon={<PaperPlaneTilt weight="fill" className="size-4" />} onClick={() => toast.success("Test sent to your phone")}>
              Send me a test
            </Button>
            <Button variant="line" onClick={() => toast.success("Template saved")}>
              Save
            </Button>
          </div>
        </Panel>

        <Panel title="Sent today" aside={<span className="text-xs text-muted">2,318 this week</span>}>
          <ul className="space-y-3">
            {LOG.map((l) => (
              <li key={l.t} className="flex items-start gap-3 text-sm">
                {l.ok ? <CheckCircle weight="fill" className="mt-0.5 size-4 shrink-0 text-forest" /> : <WarningCircle weight="fill" className="mt-0.5 size-4 shrink-0 text-ember" />}
                <span className="flex-1">
                  <span className="block font-semibold text-navy">{l.what}</span>
                  <span className="block font-mono text-xs text-muted">{l.to}</span>
                  {!l.ok && <button className="text-xs font-semibold text-ember hover:underline" onClick={() => toast.success("Resent")}>Not delivered · resend</button>}
                </span>
                <span className="font-mono text-xs text-faint">{l.t}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
