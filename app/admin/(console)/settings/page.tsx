"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash, UserPlus } from "@phosphor-icons/react";
import { AdminTitle, Panel, Empty } from "@/components/admin/Shell";
import { Field, Select, TextInput } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
import { api, invalidate } from "@/lib/client";
import { useAdmin, when } from "@/lib/admin-client";

const GROUPS = [
  {
    title: "Contact details",
    hint: "Shown on the landing page and in Help. Leave a field empty to hide it.",
    fields: [
      { k: "contact_whatsapp", l: "WhatsApp number", p: "+220 …" },
      { k: "contact_phone", l: "Phone number", p: "+220 …" },
      { k: "contact_email", l: "Email", p: "run@…" },
      { k: "contact_office", l: "Office address", p: "" },
    ],
  },
  {
    title: "Social links",
    hint: "Full links. Only the ones filled in show in the footer.",
    fields: [
      { k: "social_facebook", l: "Facebook", p: "https://facebook.com/…" },
      { k: "social_instagram", l: "Instagram", p: "https://instagram.com/…" },
      { k: "social_tiktok", l: "TikTok", p: "https://tiktok.com/@…" },
      { k: "social_x", l: "X", p: "https://x.com/…" },
    ],
  },
  {
    title: "Payment details",
    hint: "Shown on the payment screen. The Wave payment link itself is set in the deployment.",
    fields: [
      { k: "wave_number", l: "Wave number", p: "+220 83 379 6680" },
      { k: "yonna_number", l: "Yonna number", p: "+220 83 379 6680" },
      { k: "ecobank_account", l: "Ecobank account", p: "6240050636" },
      { k: "ecobank_name", l: "Ecobank account name", p: "" },
      { k: "fund_goal_gmd", l: "Run goal (GMD)", p: "20000000" },
    ],
  },
];

export default function Settings() {
  const s = useAdmin<Record<string, string>>("/api/admin/settings");
  const [vals, setVals] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!s.data) return;
    const t = setTimeout(() => setVals(s.data!), 0);
    return () => clearTimeout(t);
  }, [s.data]);
  const dirty = !!s.data && Object.keys(vals).some((k) => vals[k] !== s.data![k]);

  async function save() {
    setBusy(true);
    try {
      const changed = Object.fromEntries(Object.entries(vals).filter(([k, v]) => v !== s.data?.[k]));
      await api("/api/admin/settings", { method: "PATCH", json: changed });
      invalidate("/api/settings/public");
      invalidate("/api/stats");
      toast.success("Settings saved");
      await s.reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <AdminTitle title="Settings" actions={<Button disabled={!dirty || busy} onClick={save}>{busy ? "Saving…" : dirty ? "Save changes" : "Saved"}</Button>} />
      <div className="space-y-4">
        {GROUPS.map((g) => (
          <Panel key={g.title} title={g.title}>
            <p className="-mt-2 mb-4 text-sm text-muted">{g.hint}</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {g.fields.map((f) => (
                <Field key={f.k} label={f.l}>
                  <TextInput value={vals[f.k] ?? ""} placeholder={f.p} onChange={(e) => setVals((v) => ({ ...v, [f.k]: e.target.value }))} />
                </Field>
              ))}
            </div>
          </Panel>
        ))}
        <Teams />
        <Admins />
      </div>
    </div>
  );
}

function Teams() {
  const { data, reload } = useAdmin<{ teams: { code: string; name: string; kind: string; members: number }[] }>("/api/admin/teams");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [kind, setKind] = useState("school");
  async function add() {
    try {
      await api("/api/admin/teams", { json: { code, name, kind } });
      setCode("");
      setName("");
      toast.success("Team added", { description: `Share the code ${code.toUpperCase()} with them.` });
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  return (
    <Panel title="Team codes">
      <p className="-mt-2 mb-4 text-sm text-muted">Schools, companies and clubs enter their code at step 3 so their runners are grouped.</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[10rem_1fr_9rem_auto]">
        <TextInput value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""))} placeholder="CODE-2027" className="font-mono" />
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Team name" />
        <Select value={kind} onChange={setKind} options={[{ value: "school", label: "School" }, { value: "company", label: "Company" }, { value: "club", label: "Club" }]} />
        <Button className="h-12" icon={<Plus weight="bold" className="size-4" />} disabled={code.length < 3 || name.length < 2} onClick={add}>
          Add
        </Button>
      </div>
      <ul className="mt-4 divide-y divide-line">
        {data?.teams.map((t) => (
          <li key={t.code} className="flex items-center gap-3 py-3 text-sm">
            <span className="w-32 font-mono font-semibold text-navy">{t.code}</span>
            <span className="flex-1 text-navy">
              {t.name} <span className="text-muted">· {t.kind}</span>
            </span>
            <span className="text-muted">{t.members} paid</span>
            <button
              onClick={async () => {
                try {
                  await api("/api/admin/teams", { method: "DELETE", json: { code: t.code } });
                  await reload();
                } catch (e) {
                  toast.error((e as Error).message);
                }
              }}
              className="grid size-9 place-items-center rounded-full text-muted hover:bg-ember-50 hover:text-ember"
              aria-label={`Remove ${t.code}`}
            >
              <Trash weight="bold" className="size-4" />
            </button>
          </li>
        ))}
      </ul>
      {data && !data.teams.length && <Empty>No team codes yet.</Empty>}
    </Panel>
  );
}

function Admins() {
  const { data, reload } = useAdmin<{ admins: { id: string; name: string; email: string; role: string; last_login_at: string | null }[] }>("/api/admin/admins");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  async function add() {
    try {
      await api("/api/admin/admins", { json: { name, email, password } });
      setName("");
      setEmail("");
      setPassword("");
      toast.success("Admin added", { description: "Give them the password in person, and ask them to keep it private." });
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  return (
    <Panel title="Admin accounts">
      <ul className="divide-y divide-line">
        {data?.admins.map((a) => (
          <li key={a.id} className="flex items-center gap-3 py-3 text-sm">
            <span className="flex-1">
              <span className="block font-semibold text-navy">{a.name}</span>
              <span className="block text-muted">{a.email}</span>
            </span>
            <span className="text-muted">{a.role}</span>
            <span className="hidden text-muted sm:block">last in {when(a.last_login_at)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password, 10+ characters" autoComplete="new-password" />
        <Button className="h-12" icon={<UserPlus weight="bold" className="size-4" />} disabled={!name || !email || password.length < 10} onClick={add}>
          Add
        </Button>
      </div>
    </Panel>
  );
}
