"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { UploadSimple, LinkSimple, Image as ImageIcon, X, CheckCircle, Certificate, MagnifyingGlass, Timer, Path } from "@phosphor-icons/react";
import { SiteHeader } from "@/components/site/Header";
import { Button } from "@/components/ui/button";
import { Field, TextInput, Segmented } from "@/components/ui/fields";
import { useBooking } from "@/lib/store";
import { eventById, RUN } from "@/lib/data";
import { cn } from "@/lib/cn";

const DAYS = ["23", "24", "25", "26", "27", "28", "29", "30", "31"];
const WD = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Virtual runners send proof: a screenshot or a link, the day, the distance and the time. */
export default function Upload() {
  const b = useBooking();
  const lead = b.participants[0]!;
  const ev = eventById(lead.eventId);
  const [mode, setMode] = useState<"shot" | "link">("shot");
  const [file, setFile] = useState<{ url: string; name: string } | null>(null);
  const [link, setLink] = useState("");
  const [day, setDay] = useState("24");
  const [km, setKm] = useState(String(ev.km));
  const [time, setTime] = useState("00:52:41");
  const [drag, setDrag] = useState(false);
  const [stage, setStage] = useState<"form" | "checking" | "done">("form");
  const input = useRef<HTMLInputElement>(null);

  const hasProof = mode === "shot" ? !!file : /strava\.com|pacer|garmin|nike|\.app\.goo\.gl|https?:\/\//i.test(link);

  function take(f?: File | null) {
    if (!f || !f.type.startsWith("image/")) return;
    setFile({ url: URL.createObjectURL(f), name: f.name });
  }

  function submit() {
    setStage("checking");
    setTimeout(() => setStage("done"), 2600);
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 pb-32 pt-[calc(var(--header-h)+2.5rem)] sm:px-6">
        <p className="font-label text-cobalt">
          {ev.name} · e-bib {b.bibs[lead.id] ?? "V1213"}
        </p>
        <h1 className="mt-3 font-race text-[clamp(2.6rem,7vw,4.4rem)] text-navy">Upload my run</h1>
        <p className="mt-2 text-muted">
          Any day from {RUN.virtualWindow} January. Send it by {RUN.virtualUploadBy} and we check it within two days.
        </p>

        <AnimatePresence mode="wait">
          {stage === "form" && (
            <motion.div key="f" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-8 space-y-5">
              <Segmented
                value={mode}
                onChange={setMode}
                options={[
                  { value: "shot", label: "Screenshot", icon: <ImageIcon weight="bold" className="size-4" /> },
                  { value: "link", label: "Link", icon: <LinkSimple weight="bold" className="size-4" /> },
                ]}
                className="max-w-sm"
              />

              {mode === "shot" ? (
                file ? (
                  <div className="relative flex items-center gap-4 rounded-[1.5rem] border border-line bg-white p-4 shadow-card">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={file.url} alt="Your run screenshot" className="h-28 w-20 rounded-xl object-cover ring-1 ring-line" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-navy">{file.name}</p>
                      <p className="text-sm text-forest">Ready to send</p>
                    </div>
                    <button onClick={() => setFile(null)} className="grid size-9 place-items-center rounded-full bg-sand" aria-label="Remove">
                      <X weight="bold" className="size-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => input.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDrag(true);
                    }}
                    onDragLeave={() => setDrag(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDrag(false);
                      take(e.dataTransfer.files[0]);
                    }}
                    className={cn(
                      "flex w-full flex-col items-center justify-center gap-3 rounded-[1.5rem] border-2 border-dashed px-6 py-14 text-center transition-colors",
                      drag ? "border-cobalt bg-cobalt-50" : "border-line-strong bg-white hover:border-cobalt/60",
                    )}
                  >
                    <span className="grid size-14 place-items-center rounded-2xl bg-cobalt-50 text-cobalt">
                      <UploadSimple weight="bold" className="size-7" />
                    </span>
                    <span className="font-bold text-navy">Drop a screenshot here, or tap to choose</span>
                    <span className="text-sm text-muted">From Strava, Pacer, Nike Run Club or your watch. It should show the date, distance and time.</span>
                    <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => take(e.target.files?.[0])} />
                  </button>
                )
              ) : (
                <Field label="Activity link" hint="Make the activity public, or share it with run@nrif.gm">
                  <TextInput value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://www.strava.com/activities/…" leading={<LinkSimple className="size-4" />} />
                </Field>
              )}

              <Field label="Day you ran">
                <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                  {DAYS.map((d, i) => (
                    <button
                      key={d}
                      onClick={() => setDay(d)}
                      className={cn(
                        "flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border text-sm transition-all",
                        day === d ? "border-cobalt bg-cobalt text-white shadow-[0_8px_20px_-10px_rgb(42_49_129/0.8)]" : "border-line bg-white text-navy hover:border-line-strong",
                      )}
                    >
                      <span className={cn("text-[0.6875rem]", day === d ? "text-white/70" : "text-muted")}>{WD[i]}</span>
                      <span className="font-bib text-xl">{d}</span>
                    </button>
                  ))}
                </div>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Distance (km)">
                  <TextInput value={km} onChange={(e) => setKm(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" leading={<Path className="size-4" />} />
                </Field>
                <Field label="Time (h:mm:ss)">
                  <TextInput value={time} onChange={(e) => setTime(e.target.value.replace(/[^\d:]/g, "").slice(0, 8))} inputMode="numeric" leading={<Timer className="size-4" />} className="tabular" />
                </Field>
              </div>
              <Button variant="cobalt" size="lg" block arrow disabled={!hasProof} onClick={submit}>
                Send my run
              </Button>
              {!hasProof && <p className="text-center text-sm text-muted">Add a screenshot or a link to send.</p>}
            </motion.div>
          )}

          {stage === "checking" && (
            <motion.div key="c" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="mt-10 flex flex-col items-center rounded-[2rem] border border-line bg-white px-6 py-16 text-center shadow-card">
              <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }} className="grid size-16 place-items-center rounded-full border-4 border-cobalt-100 border-t-cobalt" />
              <p className="mt-6 text-xl font-bold text-navy">Checking your run</p>
              <p className="mt-1 flex items-center gap-1.5 text-muted">
                <MagnifyingGlass className="size-4" /> Date, distance and time
              </p>
            </motion.div>
          )}

          {stage === "done" && (
            <motion.div key="d" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-10 rounded-[2rem] border border-line bg-white p-8 text-center shadow-card">
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 380, damping: 14 }} className="inline-block">
                <CheckCircle weight="fill" className="size-20 text-forest" />
              </motion.span>
              <p className="mt-4 font-race text-[2.6rem] text-navy">Run accepted</p>
              <p className="mt-1 text-muted">
                {km} km in {time}, {WD[DAYS.indexOf(day)]} {day} January. Thank you for running from {b.contact.town || "abroad"}.
              </p>
              <div className="mx-auto mt-8 grid max-w-sm gap-3">
                <Link href="/certificate" className="flex h-[3.25rem] items-center justify-center gap-2 rounded-full bg-cobalt font-semibold text-white hover:bg-cobalt-600">
                  <Certificate weight="fill" className="size-5" /> See my e-certificate
                </Link>
                <button onClick={() => setStage("form")} className="text-sm font-semibold text-muted hover:text-navy">
                  Send a different run
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}
