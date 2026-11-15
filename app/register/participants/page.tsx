"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { PencilSimple, ShieldCheck, UserPlus, Footprints, UsersThree, Check, Trash, WarningCircle, Student, Buildings, Trophy } from "@phosphor-icons/react";
import { EVENTS, RELATIONSHIPS, SHIRT_SIZES, eventById } from "@/lib/data";
import { api } from "@/lib/client";
import { useBooking, lead, newParticipant, entryPrice, fmt, type Participant } from "@/lib/store";
import { raceDayAge, initials } from "@/lib/format";
import { Field, TextInput, DateField, Select, ChipGroup, Badge, Checkbox, PhoneField, RadioDot } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { StepFooter, StepTitle, SectionCard } from "@/components/register/Shell";
import { cn } from "@/lib/cn";

const AVATAR = ["bg-forest text-white", "bg-sun text-navy", "bg-cobalt text-white", "bg-ember text-white", "bg-navy text-white"];

export default function Participants() {
  const b = useBooking();
  const router = useRouter();
  const me = lead(b);
  const [editing, setEditing] = useState<Participant | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [code, setCode] = useState(b.teamCode);
  const [team, setTeam] = useState<{ name: string; kind: string; members: number } | null>(null);
  const [teamState, setTeamState] = useState<"idle" | "checking" | "ok" | "unknown">(b.teamCode ? "ok" : "idle");

  async function checkTeam() {
    const c = code.trim();
    if (!c) {
      b.patch({ teamCode: "" });
      setTeamState("idle");
      return;
    }
    setTeamState("checking");
    try {
      const t = await api<{ code: string; name: string; kind: string; members: number }>(`/api/teams/${encodeURIComponent(c)}`);
      setTeam(t);
      b.patch({ teamCode: t.code });
      setTeamState("ok");
    } catch {
      b.patch({ teamCode: "" });
      setTeamState("unknown");
    }
  }

  return (
    <div>
      <StepTitle title="Who is running?" sub="One booking holds the whole family, and one payment covers everyone." />

      <ul className="space-y-3">
        <AnimatePresence initial={false}>
          {b.participants.map((p, i) => {
            const age = raceDayAge(p.dob);
            const minor = age !== null && age < 18;
            const ev = eventById(p.eventId);
            return (
              <motion.li
                key={p.id}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-[1.25rem] border border-line bg-white shadow-card"
              >
                <div className="flex items-center gap-4 p-4 sm:p-5">
                  <span className={cn("grid size-12 shrink-0 place-items-center rounded-full text-sm font-bold", AVATAR[i % AVATAR.length])}>{initials(p.fullName) || "?"}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-navy">{p.fullName || "Name to add"}</span>
                      {p.isLead && <Badge tone="forest">You</Badge>}
                      {minor && <Badge tone="sun">Under 18</Badge>}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted">
                      {age !== null ? `Age ${age}` : "Date of birth to add"} · {ev.name}
                    </p>
                  </div>
                  <span className="hidden text-sm font-semibold text-navy tabular sm:block">{fmt(b, entryPrice(b, p.eventId))}</span>
                  <button
                    onClick={() => {
                      setIsNew(false);
                      setEditing({ ...p });
                    }}
                    className="grid size-10 place-items-center rounded-full text-muted hover:bg-sand hover:text-navy"
                    aria-label={`Edit ${p.fullName}`}
                  >
                    <PencilSimple weight="bold" className="size-[1.1rem]" />
                  </button>
                </div>
                {minor && (
                  <div className="flex items-center gap-2 border-t border-dashed border-line px-5 py-3 text-[0.8125rem] text-muted">
                    <ShieldCheck weight="fill" className="size-4 text-forest" />
                    Guardian: <b className="text-navy">{p.guardianIsLead ? `${me.fullName || "You"} (you)` : p.guardian.name || "to add"}</b>
                  </div>
                )}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      <Button
        variant="outline"
        size="lg"
        block
        className="mt-3 border-dashed"
        icon={<UserPlus weight="bold" className="size-5" />}
        onClick={() => {
          setIsNew(true);
          setEditing(newParticipant(b.residence === "abroad" ? "5k-virtual" : "heritage"));
        }}
      >
        Add another participant
      </Button>

      <div className="mt-8 space-y-4">
        <SectionCard title="Team code" icon={<UsersThree weight="bold" className="size-4" />} aside={<span className="text-xs text-muted">Optional</span>}>
          <p className="mb-3 text-sm text-muted">Schools, companies and clubs share a code so their runners are grouped together.</p>
          <div className="flex gap-2">
            <TextInput
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="School or company code"
              className="font-mono uppercase tracking-wider"
              onKeyDown={(e) => e.key === "Enter" && checkTeam()}
            />
            <Button variant="ink" size="lg" className="h-12 shrink-0" onClick={checkTeam} disabled={teamState === "checking"}>
              {teamState === "checking" ? "Checking" : "Check"}
            </Button>
          </div>
          <AnimatePresence mode="wait">
            {teamState === "ok" && b.teamCode ? (
              <motion.div key="ok" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 flex items-center gap-3 rounded-2xl bg-forest-50 p-3 ring-1 ring-forest/15">
                <span className="grid size-10 place-items-center rounded-xl bg-forest text-white">
                  {team?.kind === "school" ? <Student weight="fill" className="size-5" /> : team?.kind === "club" ? <Trophy weight="fill" className="size-5" /> : <Buildings weight="fill" className="size-5" />}
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-bold text-navy">{team?.name ?? b.teamCode}</span>
                  <span className="block text-xs text-muted">{team ? `${team.members} ${team.members === 1 ? "runner" : "runners"} so far · ` : ""}everyone in this booking joins</span>
                </span>
                <Check weight="bold" className="size-5 text-forest" />
              </motion.div>
            ) : teamState === "unknown" ? (
              <motion.p key="no" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-3 flex items-center gap-1.5 text-sm font-medium text-ember">
                <WarningCircle weight="fill" className="size-4" /> We do not recognise that code. Check it with your organiser.
              </motion.p>
            ) : null}
          </AnimatePresence>
        </SectionCard>

        <Checkbox checked={b.steps} onChange={(v) => b.patch({ steps: v })} className="p-5 shadow-card">
          <span className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sun text-navy">
              <Footprints weight="fill" className="size-5" />
            </span>
            <span>
              <b>Join the steps challenge.</b> Get a code that friends and family can give to, from anywhere. Every step you log grows the Endowment Fund.
            </span>
          </span>
        </Checkbox>
      </div>

      <StepFooter back="/register/details">
        <Button size="lg" arrow onClick={() => router.push("/register/waiver")}>
          Continue with {b.participants.length} {b.participants.length === 1 ? "entry" : "entries"}
        </Button>
      </StepFooter>

      <ParticipantEditor
        key={editing?.id ?? "none"}
        value={editing}
        isNew={isNew}
        leadName={me.fullName}
        onClose={() => setEditing(null)}
        onSave={(p) => {
          if (isNew) b.addParticipant(p);
          else b.patchParticipant(p.id, p);
          setEditing(null);
        }}
        onRemove={(id) => {
          b.removeParticipant(id);
          setEditing(null);
        }}
      />
    </div>
  );
}

function ParticipantEditor({
  value,
  isNew,
  leadName,
  onClose,
  onSave,
  onRemove,
}: {
  value: Participant | null;
  isNew: boolean;
  leadName: string;
  onClose: () => void;
  onSave: (p: Participant) => void;
  onRemove: (id: string) => void;
}) {
  const [p, setP] = useState<Participant | null>(value);
  const [tried, setTried] = useState(false);
  if (!p) return null;
  const age = raceDayAge(p.dob);
  const minor = age !== null && age < 18;
  const ev = eventById(p.eventId);
  const tooYoung = age !== null && age < ev.minAge;
  const first = p.fullName.split(" ")[0] || "They";
  const set = (x: Partial<Participant>) => setP({ ...p, ...x });
  const errs = {
    name: !p.fullName.trim() && "Enter their full name",
    dob: (!p.dob || age === null) && "Enter a date of birth",
    guardian: minor && !p.guardianIsLead && (!p.guardian.name.trim() || p.guardian.phone.digits.length < 7) && "Add the guardian's name and phone",
    size: !p.shirt && "Choose a size",
  };
  const ok = !tooYoung && Object.values(errs).every((e) => !e);

  return (
    <Sheet
      open={!!value}
      onOpenChange={(o) => !o && onClose()}
      title={isNew ? "Add a participant" : `Edit ${p.fullName || "participant"}`}
      description={isNew ? "They join your booking and your payment." : undefined}
      footer={
        <div className="flex items-center gap-3">
          {!isNew && !p.isLead && (
            <Button variant="ghost" className="text-ember hover:bg-ember-50" icon={<Trash weight="bold" className="size-4" />} onClick={() => onRemove(p.id)}>
              Remove
            </Button>
          )}
          <Button
            className="ml-auto"
            size="lg"
            onClick={() => {
              setTried(true);
              if (ok) onSave({ ...p, bibName: p.bibName || p.fullName.split(" ")[0]!.toUpperCase().slice(0, 10) });
            }}
          >
            {isNew ? "Add to booking" : "Save changes"}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full name" required error={tried ? errs.name || undefined : undefined} className="sm:col-span-2">
          <TextInput value={p.fullName} onChange={(e) => set({ fullName: e.target.value })} placeholder="Awa Jallow" autoFocus />
        </Field>
        <Field label="Date of birth" required error={tried ? errs.dob || undefined : undefined}>
          <DateField value={p.dob} onChange={(v) => set({ dob: v })} />
        </Field>
        <Field label="Gender">
          <Select value={p.gender} onChange={(v) => set({ gender: v as "Female" | "Male" })} options={[{ value: "Female", label: "Female" }, { value: "Male", label: "Male" }]} />
        </Field>
        <Field label="Event" required className="sm:col-span-2" error={tooYoung ? `${first} will be ${age} on race day. The ${ev.name} is for ${ev.ageLabel}.` : undefined}>
          <Select
            value={p.eventId}
            onChange={(v) => set({ eventId: v as Participant["eventId"] })}
            options={EVENTS.map((e) => ({ value: e.id, label: e.name, hint: `${e.ageLabel} · ${e.kind === "virtual" ? "Run anywhere" : e.blurb}` }))}
            invalid={tooYoung}
          />
        </Field>
      </div>

      <AnimatePresence initial={false}>
        {minor && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-5 rounded-2xl border-2 border-cobalt/25 bg-cobalt-50/50 p-4">
              <p className="flex items-center gap-2 font-bold text-cobalt">
                <ShieldCheck weight="fill" className="size-5" /> Parent or guardian
              </p>
              <p className="mt-1 text-sm text-muted">
                {first} is under 18, so a guardian accepts the waiver for them at the next step.
              </p>
              <div className="mt-3 grid gap-2">
                {[true, false].map((isLead) => (
                  <button
                    key={String(isLead)}
                    onClick={() => set({ guardianIsLead: isLead })}
                    className={cn("flex items-center gap-3 rounded-xl border bg-white p-3 text-left text-sm transition-colors", p.guardianIsLead === isLead ? "border-forest" : "border-line")}
                  >
                    <RadioDot checked={p.guardianIsLead === isLead} />
                    <span className="font-semibold text-navy">{isLead ? `${leadName || "Me"} (you)` : "Someone else"}</span>
                  </button>
                ))}
              </div>
              <AnimatePresence initial={false}>
                {!p.guardianIsLead && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="grid grid-cols-1 gap-3 pt-4 sm:grid-cols-2">
                      <Field label="Guardian's name" required>
                        <TextInput value={p.guardian.name} onChange={(e) => set({ guardian: { ...p.guardian, name: e.target.value } })} />
                      </Field>
                      <Field label="Relationship">
                        <Select value={p.guardian.relation} onChange={(v) => set({ guardian: { ...p.guardian, relation: v } })} options={RELATIONSHIPS.map((r) => ({ value: r, label: r }))} />
                      </Field>
                      <Field label="Guardian's phone" required className="sm:col-span-2" error={tried ? errs.guardian || undefined : undefined}>
                        <PhoneField value={p.guardian.phone} onChange={(v) => set({ guardian: { ...p.guardian, phone: v } })} />
                      </Field>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_11rem]">
        <Field label="T-shirt size" required error={tried ? errs.size || undefined : undefined}>
          <ChipGroup value={p.shirt || null} onChange={(v) => set({ shirt: v })} options={SHIRT_SIZES.map((s) => ({ value: s, label: s }))} />
        </Field>
        <Field label="Name on bib">
          <TextInput
            value={p.bibName}
            maxLength={10}
            onChange={(e) => set({ bibName: e.target.value.toUpperCase().replace(/[^A-Z' -]/g, "") })}
            placeholder={p.fullName.split(" ")[0]?.toUpperCase() || "NAME"}
            className="font-mono uppercase tracking-[0.12em]"
          />
        </Field>
      </div>
    </Sheet>
  );
}
