"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Footprints, HandHeart, ShareNetwork, Heart, Copy, WarningCircle } from "@phosphor-icons/react";
import { SiteHeader } from "@/components/site/Header";
import { Button } from "@/components/ui/button";
import { ChipGroup, TextInput, Field } from "@/components/ui/fields";
import { Sheet } from "@/components/ui/sheet";
import { PayMark } from "@/components/register/PayMethods";
import { api, useApi, useSettings, invalidate } from "@/lib/client";

type StepsData = {
  code: string;
  first: string;
  event: string;
  others: number;
  raised: number;
  pledged: number;
  supporters: number;
  list: { name: string | null; message: string | null; amount: number; status: string; created_at: string }[];
  steps: number;
  week: { day: string; steps: number }[];
};

const GOAL = 10_000;
const ago = (iso: string) => {
  const h = Math.round((Date.now() - new Date(iso).getTime()) / 3600_000);
  return h < 1 ? "just now" : h < 24 ? `${h} h` : `${Math.round(h / 24)} d`;
};

/** The public page behind a steps-challenge code: friends pledge, staff match the money, the fund grows. */
export function StepsPage({ code }: { code: string }) {
  const [nonce, setNonce] = useState(0);
  const { data, error, loading } = useApi<StepsData>(`/api/steps/${encodeURIComponent(code)}?n=${nonce}`, 0);
  const settings = useSettings().data;
  const [give, setGive] = useState(false);
  const [amount, setAmount] = useState<number>(250);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [pledge, setPledge] = useState<{ reference: string; amount: number } | null>(null);

  if (!data) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-xl px-4 pt-[calc(var(--header-h)+5rem)]">
          {loading ? (
            <div className="h-64 animate-pulse rounded-[2rem] bg-sand" />
          ) : (
            <div className="rounded-[1.75rem] border border-line bg-white p-8 text-center shadow-card">
              <WarningCircle weight="duotone" className="mx-auto size-12 text-sun-600" />
              <h1 className="mt-4 text-2xl font-bold text-navy">We could not find {code}</h1>
              <p className="mt-2 text-muted">{error ?? "Check the code with the runner."}</p>
              <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-full bg-forest px-6 font-semibold text-white">
                About the run
              </Link>
            </div>
          )}
        </main>
      </>
    );
  }

  const pct = Math.min(100, (data.raised / GOAL) * 100);
  const maxDay = Math.max(1, ...data.week.map((d) => d.steps));

  async function send() {
    setBusy(true);
    try {
      const p = await api<{ reference: string; amount: number }>(`/api/steps/${encodeURIComponent(code)}/pledge`, { json: { amount, name: name || undefined, message: message || undefined } });
      setPledge(p);
      invalidate(`/api/steps/${encodeURIComponent(code)}`);
      setNonce((n) => n + 1);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="pt-[var(--header-h)]">
        <section className="relative overflow-hidden bg-sun">
          <Footprints weight="fill" className="absolute -right-10 -top-10 size-72 rotate-12 text-white/25" />
          <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-end gap-8 px-4 pt-12 sm:px-6 lg:grid-cols-[1fr_22rem]">
            <div className="pb-12">
              <p className="flex items-center gap-2 font-label text-navy">
                <Footprints weight="fill" className="size-4" /> Steps challenge · {data.code}
              </p>
              <h1 className="mt-4 font-race text-[clamp(2.8rem,8vw,5.6rem)] text-navy">{data.first} is stepping up for Gambian research</h1>
              <p className="mt-4 max-w-xl text-lg text-navy/75">
                {data.first} is in the {data.event} on 30 January{data.others > 0 ? `, with ${data.others} more in the same booking` : ""}. Every gift goes to NRIF&apos;s Endowment Fund.
              </p>
            </div>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} className="relative mx-auto hidden h-[24rem] w-full max-w-[17rem] lg:block">
              <Image src="/media/runner-woman.webp" alt="" fill sizes="280px" className="object-contain object-bottom drop-shadow-[0_20px_30px_rgb(11_27_58/0.25)]" priority />
            </motion.div>
          </div>
        </section>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 pb-32 pt-10 sm:px-6 lg:grid-cols-[1fr_22rem]">
          <div>
            <div className="rounded-[1.75rem] border border-line bg-white p-6 shadow-card sm:p-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="font-bib text-[3.6rem] leading-none text-forest">GMD {data.raised.toLocaleString("en-GB")}</p>
                  <p className="mt-1 text-muted">
                    given by {data.supporters} {data.supporters === 1 ? "supporter" : "supporters"}
                    {data.pledged > 0 && ` · GMD ${data.pledged.toLocaleString("en-GB")} on its way`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bib text-[2.4rem] leading-none text-navy">{data.steps.toLocaleString("en-GB")}</p>
                  <p className="text-sm text-muted">steps logged</p>
                </div>
              </div>
              <div className="mt-6 h-4 overflow-hidden rounded-full bg-sand">
                <motion.div animate={{ width: `${Math.max(2, pct)}%` }} initial={{ width: 0 }} transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }} className="relative h-full overflow-hidden rounded-full bg-forest">
                  <span className="absolute inset-y-0 w-1/3 animate-shine bg-white/30" />
                </motion.div>
              </div>
              <p className="mt-2 text-sm text-muted">Towards GMD {GOAL.toLocaleString("en-GB")}</p>
              {data.week.length > 0 && (
                <div className="mt-6 grid grid-cols-7 gap-1.5">
                  {data.week.map((d, i) => (
                    <div key={d.day} className="flex flex-col items-center gap-1.5">
                      <div className="flex h-24 w-full items-end overflow-hidden rounded-lg bg-paper">
                        <motion.div initial={{ height: 0 }} animate={{ height: `${(d.steps / maxDay) * 100}%` }} transition={{ delay: i * 0.06, duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="w-full rounded-lg bg-sun" />
                      </div>
                      <span className="text-[0.6875rem] text-muted">{new Date(d.day).toLocaleDateString("en-GB", { weekday: "short" })}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <h2 className="mb-4 mt-10 text-xl font-bold text-navy">Supporters</h2>
            {data.list.length === 0 && <p className="rounded-2xl border border-dashed border-line p-6 text-center text-muted">Be the first to back {data.first}.</p>}
            <ul className="space-y-2">
              {data.list.map((s, i) => (
                <li key={i} className="flex items-start gap-4 rounded-2xl border border-line bg-white p-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sand text-sm font-bold text-navy">{(s.name || "A")[0]!.toUpperCase()}</span>
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold text-navy">{s.name || "A supporter"}</span> <span className="text-sm text-faint">· {ago(s.created_at)}</span>
                    {s.message && <span className="mt-0.5 block text-sm text-muted">{s.message}</span>}
                  </span>
                  <span className="text-right">
                    <span className="block font-bold text-navy tabular">GMD {s.amount.toLocaleString("en-GB")}</span>
                    {s.status !== "paid" && <span className="text-xs text-faint">on its way</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <aside>
            <div className="sticky top-24 space-y-3 rounded-[1.75rem] bg-navy p-6 text-white">
              <HandHeart weight="duotone" className="size-9 text-sun" />
              <p className="text-xl font-bold">Back {data.first}&apos;s steps</p>
              <p className="text-sm text-white/65">Pay with Wave or Yonna at home, or Remitly or ACE from abroad.</p>
              <Button variant="sun" size="lg" block onClick={() => setGive(true)}>
                Give to {data.code}
              </Button>
              <Button
                variant="glass"
                size="lg"
                block
                icon={<ShareNetwork weight="bold" className="size-5" />}
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href).catch(() => {});
                  toast.success("Link copied", { description: window.location.href });
                }}
              >
                Share this page
              </Button>
            </div>
          </aside>
        </div>
      </main>

      <Sheet
        open={give}
        onOpenChange={(o) => {
          setGive(o);
          if (!o) setPledge(null);
        }}
        title={pledge ? "Now send your gift" : `Give to ${data.code}`}
        description={pledge ? "Quote the reference so we can match it." : "Every dalasi goes to the Endowment Fund."}
        footer={
          pledge ? (
            <Button block size="lg" onClick={() => setGive(false)}>
              Done
            </Button>
          ) : (
            <Button block size="lg" disabled={busy} onClick={send}>
              {busy ? "One moment…" : `Give GMD ${amount.toLocaleString("en-GB")}`}
            </Button>
          )
        }
      >
        <AnimatePresence mode="wait">
          {!pledge ? (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              <ChipGroup value={amount} onChange={setAmount} options={[100, 250, 500, 1000, 2500].map((v) => ({ value: v, label: `GMD ${v.toLocaleString("en-GB")}` }))} />
              <Field label="Your name" optional hint="Leave blank to give quietly">
                <TextInput value={name} onChange={(e) => setName(e.target.value.slice(0, 60))} />
              </Field>
              <Field label={`A message for ${data.first}`} optional>
                <TextInput value={message} onChange={(e) => setMessage(e.target.value.slice(0, 200))} />
              </Field>
            </motion.div>
          ) : (
            <motion.div key="pay" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(pledge.reference).catch(() => {});
                  toast.success("Reference copied");
                }}
                className="flex w-full items-center justify-between rounded-2xl border-2 border-dashed border-cobalt/60 bg-cobalt-50/40 px-5 py-4"
              >
                <span className="font-mono text-3xl font-bold tracking-wider text-cobalt">{pledge.reference}</span>
                <Copy weight="bold" className="size-5 text-cobalt" />
              </button>
              <p className="text-sm text-muted">Send GMD {pledge.amount.toLocaleString("en-GB")} by any of these and put {pledge.reference} in the note:</p>
              {[
                { id: "wave" as const, t: "Wave", v: settings?.wave_number || "+220 83 379 6680", href: settings?.wave_link },
                { id: "yonna" as const, t: "Yonna", v: settings?.yonna_number || "+220 83 379 6680" },
                { id: "ecobank" as const, t: "Ecobank", v: `Account ${settings?.ecobank_account || "6240050636"}` },
              ].map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-2xl border border-line p-3">
                  <PayMark id={m.id} />
                  <span className="flex-1">
                    <span className="block font-semibold text-navy">{m.t}</span>
                    <span className="block text-sm text-muted">{m.v}</span>
                  </span>
                  {m.href && (
                    <a href={m.href} className="rounded-full bg-[#1dc3f3] px-3 py-2 text-sm font-semibold text-navy">
                      Open
                    </a>
                  )}
                </div>
              ))}
              <p className="flex items-center gap-2 text-sm text-forest">
                <Heart weight="fill" className="size-4" /> Your gift shows on this page now, and counts once NRIF matches it.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </Sheet>
    </>
  );
}
