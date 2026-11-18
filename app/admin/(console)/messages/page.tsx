"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { ChatText, Clock, CheckCircle, PaperPlaneTilt, WarningCircle, HourglassMedium, Info } from "@phosphor-icons/react";
import { AdminTitle, Panel, Empty } from "@/components/admin/Shell";
import { Badge, Switch } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client";
import { useAdmin, when } from "@/lib/admin-client";
import { cn } from "@/lib/cn";

type Template = { id: string; name: string; channel: string; when_label: string; body: string; enabled: boolean };
type Log = { id: number; channel: string; to_addr: string; template: string; status: string; error: string | null; created_at: string; reference: string | null };

// Sample values so the counter shows the real length once a template is filled in.
const FILL: Record<string, string> = { "{first}": "Fatoumata", "{event}": "5 km Run", "{bib}": "4047", "{bibs}": "4047, 7012, 7013", "{start}": "07:30", "{link}": "nrif.vercel.app/b/7Q4K-a8Kd2f3x", "{hold}": "Sun 25 Oct, 23:59", "{amount}": "GMD 1,150", "{ref}": "RFI-7Q4K" };
const filled = (t: string) => Object.entries(FILL).reduce((s, [k, v]) => s.split(k).join(v), t);

export default function AdminMessages() {
  const t = useAdmin<{ templates: Template[] }>("/api/admin/templates");
  const m = useAdmin<{ log: Log[]; counts: { queued: number; sent: number; failed: number } | null; providers: { sms: boolean; email: boolean } }>("/api/admin/messages");
  const [active, setActive] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const list = t.data?.templates ?? [];
  const cur = list.find((x) => x.id === (active ?? list[0]?.id));
  const body = cur ? drafts[cur.id] ?? cur.body : "";
  const len = filled(body).length;
  const p = m.data?.providers;

  async function patch(id: string, v: Partial<Template>) {
    try {
      await api("/api/admin/templates", { method: "PATCH", json: { id, ...v } });
      toast.success("Saved");
      await t.reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <AdminTitle
        title="Messages"
        sub="Texts stay under 160 characters with the link, so they arrive as one message on every network."
        actions={
          <Button
            variant="line"
            icon={<PaperPlaneTilt weight="fill" className="size-4" />}
            onClick={async () => {
              const r = await api<{ sent: number }>("/api/admin/messages", { method: "POST" }).catch((e) => (toast.error(e.message), null));
              if (r) toast.success(`${r.sent} sent`);
              void m.reload();
            }}
          >
            Send queued now
          </Button>
        }
      />

      {p && (!p.sms || !p.email) && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl bg-cobalt-50 p-4 text-sm text-navy ring-1 ring-cobalt/15">
          <Info weight="fill" className="mt-0.5 size-5 shrink-0 text-cobalt" />
          <span>
            {!p.sms && !p.email ? "No SMS or email provider is connected yet, " : !p.sms ? "No SMS provider is connected yet, " : "No email provider is connected yet, "}
            so those messages wait in the queue ({m.data?.counts?.queued ?? 0} now). Participants still see everything on screen and in My entry. Connect Twilio for SMS and Resend for email in the deployment settings and the queue sends.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[19rem_1fr_20rem]">
        <Panel className="p-2">
          {list.map((x) => (
            <div key={x.id} role="button" tabIndex={0} onClick={() => setActive(x.id)} onKeyDown={(e) => e.key === "Enter" && setActive(x.id)} className={cn("flex w-full cursor-pointer items-start gap-3 rounded-xl p-3 text-left transition-colors", cur?.id === x.id ? "bg-forest-50" : "hover:bg-paper")}>
              <ChatText weight="duotone" className="mt-0.5 size-5 text-forest" />
              <span className="flex-1">
                <span className="block text-sm font-bold text-navy">{x.name}</span>
                <span className="flex items-center gap-1 text-xs text-muted">
                  <Clock className="size-3" /> {x.when_label}
                </span>
              </span>
              <span onClick={(e) => e.stopPropagation()}>
                <Switch checked={x.enabled} onChange={(v) => patch(x.id, { enabled: v })} label={`Send ${x.name}`} />
              </span>
            </div>
          ))}
        </Panel>

        <Panel title={cur?.name ?? "Template"} aside={<Badge tone="cobalt">SMS + email</Badge>}>
          {cur && (
            <>
              <textarea
                value={body}
                onChange={(e) => setDrafts((d) => ({ ...d, [cur.id]: e.target.value }))}
                rows={5}
                className="w-full resize-none rounded-xl border border-line bg-paper p-4 font-mono text-sm leading-relaxed text-navy outline-none focus:border-forest focus:bg-white"
              />
              <div className="mt-3 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-sand">
                  <motion.div animate={{ width: `${Math.min(100, (len / 160) * 100)}%` }} className={cn("h-full rounded-full", len > 160 ? "bg-ember" : len > 140 ? "bg-coral" : "bg-forest")} />
                </div>
                <span className={cn("font-mono text-sm font-semibold", len > 160 ? "text-ember" : "text-navy")}>{len}/160</span>
              </div>
              {len > 160 && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-ember">
                  <WarningCircle weight="fill" className="size-4" /> With long names this could send as two texts. Shorten it.
                </p>
              )}
              <p className="mt-5 font-label text-muted">Preview</p>
              <div className="mt-2 max-w-sm rounded-[1.25rem] rounded-bl-md bg-[#eceef1] px-4 py-3 text-sm leading-snug text-navy">{filled(body)}</div>
              <div className="mt-5 flex flex-wrap gap-2">
                {Object.keys(FILL).map((k) => (
                  <span key={k} className="rounded-md bg-sand px-2 py-1 font-mono text-xs text-muted">
                    {k}
                  </span>
                ))}
              </div>
              <div className="mt-6">
                <Button disabled={body === cur.body} onClick={() => patch(cur.id, { body })}>
                  Save
                </Button>
              </div>
            </>
          )}
        </Panel>

        <Panel title="Outbox" aside={<span className="text-xs text-muted">{m.data?.counts ? `${m.data.counts.sent} sent · ${m.data.counts.queued} queued` : ""}</span>}>
          {m.data?.log.length ? (
            <ul className="space-y-3">
              {m.data.log.slice(0, 40).map((l) => (
                <li key={l.id} className="flex items-start gap-3 text-sm">
                  {l.status === "sent" ? (
                    <CheckCircle weight="fill" className="mt-0.5 size-4 shrink-0 text-forest" />
                  ) : l.status === "failed" ? (
                    <WarningCircle weight="fill" className="mt-0.5 size-4 shrink-0 text-ember" />
                  ) : (
                    <HourglassMedium weight="fill" className="mt-0.5 size-4 shrink-0 text-faint" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-navy">
                      {l.template} · {l.channel}
                    </span>
                    <span className="block truncate font-mono text-xs text-muted">
                      {l.reference} · {l.to_addr}
                    </span>
                    {l.error && <span className="block truncate text-xs text-ember">{l.error}</span>}
                  </span>
                  <span className="whitespace-nowrap font-mono text-xs text-faint">{when(l.created_at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>No messages yet.</Empty>
          )}
        </Panel>
      </div>
    </div>
  );
}
