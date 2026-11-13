"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Footprints, HandHeart, ShareNetwork, Heart, CheckCircle } from "@phosphor-icons/react";
import { SiteHeader } from "@/components/site/Header";
import { Button } from "@/components/ui/button";
import { ChipGroup, PhoneField, TextInput } from "@/components/ui/fields";
import { Sheet } from "@/components/ui/sheet";
import { CountUp } from "@/components/ui/motion";
import { celebrate } from "@/lib/celebrate";

const SUPPORTERS = [
  { n: "Ebrima J.", a: 1000, m: "Go sister, all the way to Bakau.", t: "2 h" },
  { n: "Mariama C.", a: 500, m: "For the girls in science.", t: "5 h" },
  { n: "A friend in Atlanta", a: 1300, m: "", t: "1 day" },
  { n: "Ousman S.", a: 250, m: "Every step counts.", t: "1 day" },
  { n: "Isatou B.", a: 300, m: "", t: "2 days" },
  { n: "Lamin T.", a: 650, m: "Running the virtual one from London, see you on the map.", t: "3 days" },
];

/** The public page behind a steps-challenge code: friends give to the runner, the fund gets every dalasi. */
export function StepsPage({ code }: { code: string }) {
  const [raised, setRaised] = useState(6850);
  const [count, setCount] = useState(14);
  const [give, setGive] = useState(false);
  const [amount, setAmount] = useState<number>(250);
  const [done, setDone] = useState(false);
  const goal = 10000;
  const pct = Math.min(100, (raised / goal) * 100);

  return (
    <>
      <SiteHeader />
      <main className="pt-[var(--header-h)]">
        <section className="relative overflow-hidden bg-sun">
          <Footprints weight="fill" className="absolute -right-10 -top-10 size-72 rotate-12 text-white/25" />
          <div className="relative mx-auto grid max-w-6xl items-end gap-8 px-4 pt-12 sm:px-6 lg:grid-cols-[1fr_22rem]">
            <div className="pb-12">
              <p className="flex items-center gap-2 font-label text-navy">
                <Footprints weight="fill" className="size-4" /> Steps challenge · {code}
              </p>
              <h1 className="mt-4 font-race text-[clamp(2.8rem,8vw,5.6rem)] text-navy">Fatou is walking for Gambian research</h1>
              <p className="mt-4 max-w-xl text-lg text-navy/75">
                Fatou runs the 10K on 30 January and walks the Heritage walk with Awa and Musa. Every step she logs, and every dalasi you give, goes to NRIF&apos;s Endowment Fund.
              </p>
            </div>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} className="relative mx-auto h-[22rem] w-full max-w-[18rem] lg:h-[26rem]">
              <Image src="/media/runner-woman.webp" alt="Fatou running" fill sizes="300px" className="object-contain object-bottom drop-shadow-[0_20px_30px_rgb(11_27_58/0.25)]" priority />
            </motion.div>
          </div>
        </section>

        <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-32 pt-10 sm:px-6 lg:grid-cols-[1fr_22rem]">
          <div>
            <div className="rounded-[1.75rem] border border-line bg-white p-6 shadow-card sm:p-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <motion.p key={raised} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-bib text-[3.6rem] leading-none text-forest">
                    GMD {raised.toLocaleString("en-GB")}
                  </motion.p>
                  <p className="mt-1 text-muted">
                    raised of GMD {goal.toLocaleString("en-GB")} by {count} supporters
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bib text-[2.4rem] leading-none text-navy">
                    <CountUp to={146880} />
                  </p>
                  <p className="text-sm text-muted">steps logged</p>
                </div>
              </div>
              <div className="mt-6 h-4 overflow-hidden rounded-full bg-sand">
                <motion.div animate={{ width: `${pct}%` }} initial={{ width: 0 }} transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }} className="relative h-full overflow-hidden rounded-full bg-forest">
                  <span className="absolute inset-y-0 w-1/3 animate-shine bg-white/30" />
                </motion.div>
              </div>
              <div className="mt-6 grid grid-cols-7 gap-1.5">
                {[8200, 11400, 6900, 14200, 9800, 12600, 15100].map((s, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <div className="flex h-24 w-full items-end overflow-hidden rounded-lg bg-paper">
                      <motion.div initial={{ height: 0 }} whileInView={{ height: `${(s / 16000) * 100}%` }} viewport={{ once: true }} transition={{ delay: i * 0.06, duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="w-full rounded-lg bg-sun" />
                    </div>
                    <span className="text-[0.6875rem] text-muted">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}</span>
                  </div>
                ))}
              </div>
            </div>

            <h2 className="mb-4 mt-10 text-xl font-bold text-navy">Supporters</h2>
            <ul className="space-y-2">
              <AnimatePresence initial={false}>
                {done && (
                  <motion.li initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex items-start gap-4 rounded-2xl bg-forest-50 p-4 ring-1 ring-forest/15">
                    <Heart weight="fill" className="mt-0.5 size-5 text-ember" />
                    <span className="flex-1">
                      <span className="font-semibold text-navy">You</span>
                      <span className="block text-sm text-muted">Just now</span>
                    </span>
                    <span className="font-bold text-forest">GMD {amount.toLocaleString("en-GB")}</span>
                  </motion.li>
                )}
              </AnimatePresence>
              {SUPPORTERS.map((s) => (
                <li key={s.n} className="flex items-start gap-4 rounded-2xl border border-line bg-white p-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sand text-sm font-bold text-navy">{s.n[0]}</span>
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold text-navy">{s.n}</span> <span className="text-sm text-faint">· {s.t}</span>
                    {s.m && <span className="mt-0.5 block text-sm text-muted">{s.m}</span>}
                  </span>
                  <span className="font-bold text-navy tabular">GMD {s.a.toLocaleString("en-GB")}</span>
                </li>
              ))}
            </ul>
          </div>

          <aside className="lg:pt-0">
            <div className="sticky top-24 space-y-3 rounded-[1.75rem] bg-navy p-6 text-white">
              <HandHeart weight="duotone" className="size-9 text-sun" />
              <p className="text-xl font-bold">Back Fatou&apos;s steps</p>
              <p className="text-sm text-white/65">Pay with Wave or Yonna at home, or Remitly from abroad.</p>
              <Button variant="sun" size="lg" block onClick={() => setGive(true)}>
                Give to {code}
              </Button>
              <Button variant="glass" size="lg" block icon={<ShareNetwork weight="bold" className="size-5" />} onClick={() => toast.success("Link copied", { description: `run4independence.gm/steps/${code}` })}>
                Share this page
              </Button>
            </div>
          </aside>
        </div>
      </main>

      <Sheet
        open={give}
        onOpenChange={setGive}
        title={`Give to ${code}`}
        description="Every dalasi goes to the Endowment Fund."
        footer={
          <Button
            block
            size="lg"
            onClick={() => {
              setGive(false);
              setDone(true);
              setRaised((r) => r + amount);
              setCount((c) => c + 1);
              setTimeout(celebrate, 250);
              toast.success("Thank you", { description: `GMD ${amount.toLocaleString("en-GB")} for Fatou's steps.`, icon: <CheckCircle weight="fill" className="size-5 text-forest" /> });
            }}
          >
            Give GMD {amount.toLocaleString("en-GB")} with Wave
          </Button>
        }
      >
        <div className="space-y-5">
          <ChipGroup value={amount} onChange={setAmount} options={[100, 250, 500, 1000, 2500].map((v) => ({ value: v, label: `GMD ${v.toLocaleString("en-GB")}` }))} />
          <TextInput placeholder="Your name (or leave blank to give quietly)" />
          <TextInput placeholder="A message for Fatou" />
          <GivePhone />
        </div>
      </Sheet>
    </>
  );
}

function GivePhone() {
  const [p, setP] = useState({ iso: "GM", digits: "" });
  return <PhoneField value={p} onChange={setP} />;
}
