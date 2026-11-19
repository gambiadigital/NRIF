"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { EnvelopeSimple, Clock, CheckCircle, PaperPlaneTilt, WarningCircle, HourglassMedium, Info, CircleNotch, ArrowCounterClockwise } from "@phosphor-icons/react";
import { AdminTitle, Panel, Empty, SearchBox, Tabs, Toolbar } from "@/components/admin/Shell";
import { Badge, Switch } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client";
import { useAdmin, when } from "@/lib/admin-client";
import { emailFooter, render, subjectFor } from "@/lib/messages";
import { cn } from "@/lib/cn";

type Template = { id: string; name: string; when_label: string; body: string; enabled: boolean };
type Log = { id: number; to_addr: string; template: string; subject: string | null; status: string; error: string | null; created_at: string; sent_at: string | null; reference: string | null };
type Outbox = { log: Log[]; counts: { queued: number; sent: number; failed: number } | null; providers: { email: boolean } };

// Sample values so the preview reads like a real email.
const SAMPLE: Record<string, string> = { first: "Fatoumata", event: "5 km Run", bib: "4047", bibs: "4047, 7012, 7013", start: "07:30", link: "run4independence.nrif.gm/b/7Q4K-a8Kd2f3x", hold: "Sun 25 Jan, 23:59", amount: "GMD 300", ref: "RFI-7Q4K" };
const STATUS = {
  queued: { l: "Waiting", tone: "neutral" as const, icon: HourglassMedium, c: "text-faint" },
  sent: { l: "Sent", tone: "forest" as const, icon: CheckCircle, c: "text-forest" },
  failed: { l: "Failed", tone: "ember" as const, icon: WarningCircle, c: "text-ember" },
};
const PAGE = 50;
type Filter = "all" | "queued" | "sent" | "failed";

export default function AdminMessages() {
  const t = useAdmin<{ templates: Template[] }>("/api/admin/templates");
  const m = useAdmin<Outbox>("/api/admin/messages");
  const [tab, setTab] = useState<"templates" | "outbox">("templates");
  const [status, setStatus] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [sending, setSending] = useState(false);
  const c = m.data?.counts;
  const p = m.data?.providers;
  const queued = m.data?.counts?.queued ?? 0;

  async function sendNow() {
    setSending(true);
    try {
      const r = await api<{ sent: number }>("/api/admin/messages", { method: "POST" });
      toast.success(r.sent ? `${r.sent} ${r.sent === 1 ? "email" : "emails"} sent` : "Nothing was sent", { description: r.sent ? undefined : "Either nothing is waiting, or a send failed: see the outbox." });
      await m.reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <AdminTitle
        title="Messages"
        sub="Participants hear from NRIF by email. Each email comes from one of the templates below, and the outbox lists every one, sent or waiting."
        actions={
          <Button variant="line" disabled={!p?.email || sending || !queued} icon={sending ? <CircleNotch weight="bold" className="size-4 animate-spin" /> : <PaperPlaneTilt weight="fill" className="size-4" />} onClick={sendNow}>
            Send waiting emails{queued ? ` (${queued})` : ""}
          </Button>
        }
      />

      {p && (
        <div className={cn("mb-2 flex items-start gap-3 rounded-2xl p-4 text-sm text-navy ring-1", p.email ? "bg-forest-50 ring-forest/15" : "bg-cobalt-50 ring-cobalt/15")}>
          {p.email ? <CheckCircle weight="fill" className="mt-0.5 size-5 shrink-0 text-forest" /> : <Info weight="fill" className="mt-0.5 size-5 shrink-0 text-cobalt" />}
          <span>
            {p.email ? (
              <>
                <b>Email is connected.</b> Emails go out as soon as they are queued. Texts are off: everything goes by email.
              </>
            ) : (
              <>
                <b>Email is not connected yet.</b> {queued} {queued === 1 ? "email is" : "emails are"} waiting and go out once it is. Participants still see everything on screen and in My entry. Texts are off: everything goes by email.
              </>
            )}
          </span>
        </div>
      )}

      <Toolbar>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { v: "templates", l: "Templates", n: t.data?.templates.length },
              { v: "outbox", l: "Outbox", n: m.data?.log.length },
            ]}
          />
          {tab === "outbox" && (
            <>
              <Tabs
                value={status}
                onChange={setStatus}
                tabs={[
                  { v: "all", l: "All" },
                  { v: "queued", l: "Waiting", n: c?.queued ?? 0 },
                  { v: "sent", l: "Sent", n: c?.sent ?? 0 },
                  { v: "failed", l: "Failed", n: c?.failed ?? 0 },
                ]}
              />
              <SearchBox value={q} onChange={setQ} placeholder="Email address, reference or subject" className="w-full @4xl:ml-auto @4xl:w-80" />
            </>
          )}
        </div>
      </Toolbar>

      {tab === "templates" ? <Templates list={t.data?.templates ?? null} reload={t.reload} /> : <OutboxList key={status + "|" + q} data={m.data} status={status} q={q} names={Object.fromEntries((t.data?.templates ?? []).map((x) => [x.id, x.name]))} />}
    </div>
  );
}

function Templates({ list, reload }: { list: Template[] | null; reload: () => Promise<void> }) {
  const [active, setActive] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  const cur = list?.find((x) => x.id === (active ?? list[0]?.id));
  const body = cur ? drafts[cur.id] ?? cur.body : "";
  const dirty = !!cur && body !== cur.body;

  async function patch(id: string, v: Partial<Template>, done: string) {
    try {
      await api("/api/admin/templates", { method: "PATCH", json: { id, ...v } });
      toast.success(done);
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  function insert(token: string) {
    if (!cur) return;
    const el = area.current;
    const at = el?.selectionStart ?? body.length;
    const end = el?.selectionEnd ?? at;
    setDrafts((d) => ({ ...d, [cur.id]: body.slice(0, at) + token + body.slice(end) }));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(at + token.length, at + token.length);
    });
  }

  if (!list) return <div className="h-80 animate-pulse rounded-[1.25rem] bg-white/70" />;
  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[19rem_1fr]">
      <Panel className="p-2">
        <ul className="space-y-1">
          {list.map((x) => (
            <li key={x.id}>
              <div className={cn("flex items-center gap-3 rounded-xl p-3 transition-colors", cur?.id === x.id ? "bg-forest-50" : "hover:bg-paper")}>
                <button onClick={() => setActive(x.id)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
                  <EnvelopeSimple weight={cur?.id === x.id ? "fill" : "duotone"} className="mt-0.5 size-5 shrink-0 text-forest" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-navy">
                      {x.name}
                      {drafts[x.id] !== undefined && drafts[x.id] !== x.body && <span className="ml-1.5 text-ember">•</span>}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <Clock className="size-3 shrink-0" /> <span className="truncate">{x.when_label}</span>
                    </span>
                  </span>
                </button>
                <Switch checked={x.enabled} onChange={(v) => patch(x.id, { enabled: v }, v ? `${x.name} is on` : `${x.name} is off`)} label={`Send ${x.name}`} />
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      {cur && (
        <Panel>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-bold text-navy">{cur.name}</h2>
              <p className="text-sm text-muted">Sent {cur.when_label.charAt(0).toLowerCase() + cur.when_label.slice(1)}</p>
            </div>
            <Badge tone={cur.enabled ? "forest" : "neutral"}>{cur.enabled ? "On" : "Off"}</Badge>
          </div>

          <label className="font-label text-muted" htmlFor="tpl-body">
            Message
          </label>
          <textarea
            id="tpl-body"
            ref={area}
            value={body}
            onChange={(e) => setDrafts((d) => ({ ...d, [cur.id]: e.target.value }))}
            rows={5}
            className="mt-2 w-full resize-y rounded-xl border border-line bg-paper p-4 font-mono text-sm leading-relaxed text-navy outline-none focus:border-forest focus:bg-white"
          />
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs text-muted">Insert:</span>
            {Object.keys(SAMPLE).map((k) => (
              <button key={k} onClick={() => insert(`{${k}}`)} className="rounded-md bg-sand px-2 py-1 font-mono text-xs text-navy hover:bg-line">
                {`{${k}}`}
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              disabled={!dirty || saving}
              icon={saving ? <CircleNotch weight="bold" className="size-4 animate-spin" /> : undefined}
              onClick={async () => {
                setSaving(true);
                await patch(cur.id, { body }, `${cur.name} saved`);
                setDrafts((d) => {
                  const n = { ...d };
                  delete n[cur.id];
                  return n;
                });
                setSaving(false);
              }}
            >
              {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
            </Button>
            {dirty && (
              <Button
                variant="line"
                icon={<ArrowCounterClockwise weight="bold" className="size-4" />}
                onClick={() =>
                  setDrafts((d) => {
                    const n = { ...d };
                    delete n[cur.id];
                    return n;
                  })
                }
              >
                Discard
              </Button>
            )}
          </div>

          <p className="mt-6 font-label text-muted">Preview</p>
          <div className="mt-2 overflow-hidden rounded-2xl border border-line">
            <div className="space-y-1 border-b border-line bg-paper px-4 py-3 text-sm">
              <p className="truncate">
                <span className="inline-block w-16 text-muted">To</span>
                <span className="text-navy">fatoumata@example.com</span>
              </p>
              <p className="truncate">
                <span className="inline-block w-16 text-muted">Subject</span>
                <b className="text-navy">{subjectFor(cur.id, SAMPLE)}</b>
              </p>
            </div>
            <div className="h-1.5 flag-rule" />
            <div className="whitespace-pre-line break-words bg-white px-4 py-4 text-sm leading-relaxed text-navy">{`${render(body, SAMPLE)}\n\n${emailFooter(SAMPLE.link!)}`}</div>
          </div>
        </Panel>
      )}
    </div>
  );
}

function OutboxList({ data, status, q, names }: { data: Outbox | null; status: Filter; q: string; names: Record<string, string> }) {
  const [shown, setShown] = useState(PAGE);
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (data?.log ?? []).filter((l) => (status === "all" || l.status === status) && (!t || `${l.to_addr} ${l.reference ?? ""} ${l.subject ?? ""} ${names[l.template] ?? l.template}`.toLowerCase().includes(t)));
  }, [data, status, q, names]);
  if (!data) return <div className="h-80 animate-pulse rounded-[1.25rem] bg-white/70" />;
  return (
    <>
      {rows.length === 0 ? (
        <Empty>{q || status !== "all" ? "No emails match." : "No emails yet. They appear here as people book."}</Empty>
      ) : (
        <>
          <ul className="divide-y divide-line overflow-hidden rounded-[1.25rem] border border-line bg-white">
            {rows.slice(0, shown).map((l) => {
              const s = STATUS[l.status as keyof typeof STATUS] ?? STATUS.queued;
              return (
                <li key={l.id} className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
                  <s.icon weight="fill" className={cn("mt-0.5 size-5 shrink-0", s.c)} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-navy">{l.subject || names[l.template] || l.template}</p>
                        <p className="truncate text-xs text-muted">
                          {names[l.template] ?? l.template} · {l.to_addr}
                          {l.reference && <span className="font-mono"> · {l.reference}</span>}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
                        <Badge tone={s.tone}>{s.l}</Badge>
                        <span className="whitespace-nowrap font-mono text-xs text-faint">{when(l.sent_at ?? l.created_at)}</span>
                      </div>
                    </div>
                    {l.error && <p className="mt-1 break-words text-xs text-ember">{l.error}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
          {rows.length > shown && (
            <div className="mt-4 text-center">
              <Button variant="line" onClick={() => setShown((n) => n + PAGE)}>
                Show more ({rows.length - shown} left)
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}
