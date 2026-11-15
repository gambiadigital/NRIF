"use client";

import { Suspense, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AnimatePresence, motion } from "motion/react";
import { UploadSimple, LinkSimple, Image as ImageIcon, X, CheckCircle, Certificate, MagnifyingGlass, Timer, Path } from "@phosphor-icons/react";
import { SiteHeader } from "@/components/site/Header";
import { Button } from "@/components/ui/button";
import { Field, TextInput, Segmented } from "@/components/ui/fields";
import { eventById, RUN } from "@/lib/data";
import { api } from "@/lib/client";
import { useBookingData, type ClientBooking } from "@/lib/booking-client";
import { EntryGate } from "@/components/EntryGate";
import { cn } from "@/lib/cn";

const DAYS = ["23", "24", "25", "26", "27", "28", "29", "30", "31"];
const WD = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Shrinks a photo in the browser so uploads stay small on mobile data: longest side 1400 px, JPEG. */
async function shrink(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new window.Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const scale = Math.min(1, 1400 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * scale);
    c.height = Math.round(img.naturalHeight * scale);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function UploadPage() {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={null}>
        <UploadGate />
      </Suspense>
    </>
  );
}

function UploadGate() {
  const sp = useSearchParams();
  const { data, error, loading } = useBookingData(null, null);
  if (!data) return <div className="pt-[var(--header-h)]"><EntryGate loading={loading} error={error} /></div>;
  const virtual = data.participants.filter((p) => eventById(p.eventId).kind === "virtual");
  const p = virtual.find((x) => x.id === sp.get("p")) ?? virtual[0];
  if (!p || data.status !== "paid")
    return (
      <div className="pt-[var(--header-h)]">
        <EntryGate loading={false} error={{ status: 409, message: !p ? "Only virtual entries upload a run." : "Uploads open once your entry is paid." }} />
      </div>
    );
  return <Upload b={data} participantId={p.id} />;
}

/** Virtual runners send proof: a screenshot or a link, the day, the distance and the time. */
function Upload({ b, participantId }: { b: ClientBooking; participantId: string }) {
  const lead = b.participants.find((x) => x.id === participantId)!;
  const ev = eventById(lead.eventId);
  const [mode, setMode] = useState<"shot" | "link">("shot");
  const [file, setFile] = useState<{ url: string; name: string; data?: string } | null>(null);
  const [link, setLink] = useState("");
  const [day, setDay] = useState("24");
  const [km, setKm] = useState(String(ev.km));
  const [time, setTime] = useState("");
  const [drag, setDrag] = useState(false);
  const [stage, setStage] = useState<"form" | "checking" | "done">("form");
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const hasProof = mode === "shot" ? !!file : /strava\.com|pacer|garmin|nike|\.app\.goo\.gl|https?:\/\//i.test(link);

  async function take(f?: File | null) {
    if (!f || !f.type.startsWith("image/")) return;
    try {
      const data = await shrink(f);
      setFile({ url: data, name: f.name, data });
    } catch {
      toast.error("That image could not be read. Try a screenshot instead.");
    }
  }

  async function submit() {
    setStage("checking");
    setError(null);
    try {
      await api("/api/entry/virtual", {
        json: {
          participantId,
          runDate: `2027-01-${day}`,
          distanceKm: Number(km),
          duration: time,
          ...(mode === "shot" ? { image: file?.data } : { link }),
        },
      });
      setStage("done");
    } catch (e) {
      setError((e as Error).message);
      setStage("form");
    }
  }

  const timeOk = /^(\d{1,2}:)?\d{1,2}:\d{2}$/.test(time);
  const kmOk = Number(km) >= 0.5;
  const result = b.results?.find((r) => r.participant_id === participantId);

  return (
    <>
      <main className="mx-auto max-w-3xl px-4 pb-32 pt-[calc(var(--header-h)+2.5rem)] sm:px-6">
        <p className="font-label text-cobalt">
          {lead.firstName} · {ev.name} · e-bib {lead.bib}
        </p>
        <h1 className="mt-3 font-race text-[clamp(2.6rem,7vw,4.4rem)] text-navy">Upload my run</h1>
        <p className="mt-2 text-muted">
          Any day from {RUN.virtualWindow} January. Send it by {RUN.virtualUploadBy} and we check it within two days.
        </p>

        {result && stage === "form" && (
          <p className="mt-6 rounded-2xl bg-cobalt-50 px-4 py-3 text-sm text-cobalt ring-1 ring-cobalt/10">
            Your last run is {result.status === "submitted" ? "waiting to be checked" : result.status}
            {result.review_note ? `: ${result.review_note}` : "."} Sending another replaces it.
          </p>
        )}

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
                <Field label="Activity link" hint="Make the activity public so we can open it">
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Distance (km)">
                  <TextInput value={km} onChange={(e) => setKm(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" leading={<Path className="size-4" />} />
                </Field>
                <Field label="Time (h:mm:ss)">
                  <TextInput value={time} placeholder="0:52:41" onChange={(e) => setTime(e.target.value.replace(/[^\d:]/g, "").slice(0, 8))} inputMode="numeric" leading={<Timer className="size-4" />} className="tabular" />
                </Field>
              </div>
              {error && <p className="rounded-2xl bg-ember-50 px-4 py-3 text-sm font-medium text-ember-600 ring-1 ring-ember/15">{error}</p>}
              <Button variant="cobalt" size="lg" block arrow disabled={!hasProof || !timeOk || !kmOk} onClick={submit}>
                Send my run
              </Button>
              {(!hasProof || !timeOk) && <p className="text-center text-sm text-muted">{!hasProof ? "Add a screenshot or a link." : "Add your time, for example 0:52:41."}</p>}
            </motion.div>
          )}

          {stage === "checking" && (
            <motion.div key="c" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="mt-10 flex flex-col items-center rounded-[2rem] border border-line bg-white px-6 py-16 text-center shadow-card">
              <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }} className="grid size-16 place-items-center rounded-full border-4 border-cobalt-100 border-t-cobalt" />
              <p className="mt-6 text-xl font-bold text-navy">Sending your run</p>
              <p className="mt-1 flex items-center gap-1.5 text-muted">
                <MagnifyingGlass className="size-4" /> Date, distance, time and proof
              </p>
            </motion.div>
          )}

          {stage === "done" && (
            <motion.div key="d" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-10 rounded-[2rem] border border-line bg-white p-8 text-center shadow-card">
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 380, damping: 14 }} className="inline-block">
                <CheckCircle weight="fill" className="size-20 text-forest" />
              </motion.span>
              <p className="mt-4 font-race text-[2.6rem] text-navy">Run sent</p>
              <p className="mt-1 text-muted">
                {km} km in {time}, {WD[DAYS.indexOf(day)]} {day} January. We check every run within two days, and your e-certificate appears in My entry once it is approved.
              </p>
              <div className="mx-auto mt-8 grid max-w-sm gap-3">
                <Link href="/my-entry" className="flex h-[3.25rem] items-center justify-center gap-2 rounded-full bg-cobalt font-semibold text-white hover:bg-cobalt-600">
                  <Certificate weight="fill" className="size-5" /> Back to My entry
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
