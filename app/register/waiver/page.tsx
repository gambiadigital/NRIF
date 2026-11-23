"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { FileText, LockSimple, CaretRight, ArrowsLeftRight, CircleNotch, WarningCircle } from "@phosphor-icons/react";
import { useBooking, minors, saveBooking } from "@/lib/store";
import { api } from "@/lib/client";
import { WAIVER, POLICY } from "@/lib/content";
import { Checkbox } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { StepFooter, StepTitle } from "@/components/register/Shell";

function list(names: string[]) {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export default function Waiver() {
  const b = useBooking();
  const router = useRouter();
  const kids = minors(b);
  const [tried, setTried] = useState(false);
  const [doc, setDoc] = useState<"waiver" | "policy" | null>(null);
  const ok = b.consents.waiver && (kids.length === 0 || b.consents.guardian);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Pay first, so this is the end: the registration goes in with the paid order and the person sees where it stands. */
  async function finish() {
    setTried(true);
    if (!ok) return;
    const s = useBooking.getState();
    if (!s.order) return router.push("/register/payment");
    setBusy(true);
    setError(null);
    try {
      const created = await api<{ reference: string; key: string; paid: boolean }>("/api/bookings", {
        json: {
          order: { id: s.order.id, token: s.order.token },
          residence: s.residence,
          city: s.city,
          currency: s.currency,
          participants: s.participants.map((p) => ({
            fullName: p.fullName,
            dob: p.dob,
            gender: p.gender,
            eventId: p.eventId,
            guardianIsLead: p.guardianIsLead,
            guardian: p.guardian,
          })),
          contact: s.contact,
          teamCode: s.teamCode,
          consents: { waiver: s.consents.waiver, guardian: s.consents.guardian, photos: s.consents.photos, news: s.consents.news },
          donation: s.donation,
          source: s.source,
          referral: s.referral,
        },
      });
      saveBooking(created);
      s.reset();
      const q = `ref=${created.reference}&k=${encodeURIComponent(created.key)}`;
      router.push(created.paid ? `/confirmation?${q}` : `/register/pending?${q}`);
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg);
      toast.error("We could not finish your registration", { description: msg });
      setBusy(false);
    }
  }

  return (
    <div>
      <StepTitle title="Before you run" sub="Health, safety and how we use photos. Two boxes are required; the rest are up to you." />

      <div className="rounded-[1.5rem] border border-line bg-white p-5 shadow-card sm:p-6">
        <div className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-forest-50 text-forest">
            <FileText weight="duotone" className="size-6" />
          </span>
          <div>
            <p className="text-[1.0625rem] leading-relaxed text-navy">{WAIVER.summary}</p>
            <button onClick={() => setDoc("waiver")} className="mt-2 text-sm font-semibold text-forest underline-offset-4 hover:underline">
              Read the full health disclaimer and waiver
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        <Checkbox checked={b.consents.waiver} onChange={(v) => b.setConsent("waiver", v)} tag="required" invalid={tried && !b.consents.waiver}>
          I accept the health disclaimer and liability waiver
        </Checkbox>
        {kids.length > 0 && (
          <Checkbox checked={b.consents.guardian} onChange={(v) => b.setConsent("guardian", v)} tag="required" invalid={tried && !b.consents.guardian}>
            As their guardian, I accept the waiver for {list(kids.map((k) => k.fullName.split(" ")[0]!))}
          </Checkbox>
        )}
        <Checkbox checked={b.consents.photos} onChange={(v) => b.setConsent("photos", v)} tag="optional">
          NRIF may use race-day photos and video of {kids.length ? "us" : "me"}
        </Checkbox>
        <Checkbox checked={b.consents.news} onChange={(v) => b.setConsent("news", v)} tag="optional">
          Send me NRIF news and event updates
        </Checkbox>
      </div>

      <button onClick={() => setDoc("policy")} className="mt-4 flex w-full items-center gap-4 rounded-[1.25rem] border border-line bg-white p-4 text-left transition-colors hover:border-line-strong">
        <span className="grid size-10 place-items-center rounded-xl bg-sand text-navy">
          <ArrowsLeftRight weight="bold" className="size-5" />
        </span>
        <span className="flex-1">
          <span className="block font-semibold text-navy">Refund and transfer policy</span>
          <span className="block text-sm text-muted">Give your place to someone else free until 9 January</span>
        </span>
        <CaretRight weight="bold" className="size-4 text-faint" />
      </button>

      <AnimatePresence>
        {b.consents.waiver && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 flex items-center gap-2 text-[0.8125rem] text-muted">
            <LockSimple weight="fill" className="size-4 text-forest" />
            Saved with your entry: waiver {WAIVER.version}, accepted {b.consents.acceptedAt || "just now"}
          </motion.p>
        )}
      </AnimatePresence>

      {error && (
        <p className="mt-4 flex items-start gap-2 rounded-2xl bg-ember-50 p-4 text-sm font-medium text-ember-600 ring-1 ring-ember/15">
          <WarningCircle weight="fill" className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}

      <StepFooter back="/register/participants">
        <Button size="lg" arrow={!busy} icon={busy ? <CircleNotch weight="bold" className="size-5 animate-spin" /> : undefined} onClick={finish} disabled={busy}>
          {busy ? "Finishing…" : "Finish registration"}
        </Button>
      </StepFooter>

      <Sheet
        open={doc !== null}
        onOpenChange={(o) => !o && setDoc(null)}
        title={doc === "policy" ? "Refund and transfer policy" : "Health disclaimer and waiver"}
        description={doc === "policy" ? `Version ${POLICY.version}` : `Version ${WAIVER.version}, published ${WAIVER.published}`}
        wide
        footer={
          <Button
            block
            size="lg"
            onClick={() => {
              if (doc === "waiver") b.setConsent("waiver", true);
              setDoc(null);
            }}
          >
            {doc === "waiver" ? "I accept" : "Close"}
          </Button>
        }
      >
        <div className="space-y-5">
          {(doc === "policy" ? POLICY.sections : WAIVER.sections).map((s) => (
            <div key={s.h}>
              <p className="font-bold text-navy">{s.h}</p>
              <p className="mt-1 leading-relaxed text-muted">{s.p}</p>
            </div>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
