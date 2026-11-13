"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { House, GlobeHemisphereWest, MapPin, Sparkle, Check, Clock } from "@phosphor-icons/react";
import { CITIES, CURRENCIES, EVENTS, RUN, type RaceEvent } from "@/lib/data";
import { useBooking, entryPrice, fmt, lead } from "@/lib/store";
import { Segmented, Field, Combobox, Badge, RadioDot } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
import { StepFooter, StepTitle, SectionCard } from "@/components/register/Shell";
import { cn } from "@/lib/cn";

const CITY_OPTIONS = [...CITIES.map((c) => `${c.city}, ${c.country}`), "Leeds, United Kingdom", "Leicester, United Kingdom", "Houston, United States", "Gothenburg, Sweden", "Rome, Italy"];

export default function ChooseEvent() {
  const b = useBooking();
  const router = useRouter();
  const me = lead(b);
  const abroad = b.residence === "abroad";
  const virtual = EVENTS.filter((e) => e.kind === "virtual");
  const inPerson = EVENTS.filter((e) => e.kind === "in-person");
  const counted = abroad && b.city.trim().length > 2;

  const pick = (ev: RaceEvent) => b.patchParticipant(me.id, { eventId: ev.id });

  return (
    <div>
      <StepTitle eyebrow={`${RUN.name} ${RUN.edition}`} title="Where do you live?" sub="It sets your currency and how you pay. Every event stays open to everyone." />

      <Segmented
        value={b.residence}
        onChange={(v) => b.setResidence(v)}
        options={[
          { value: "gambia", label: "The Gambia", icon: <House weight="bold" className="size-4" /> },
          { value: "abroad", label: "Abroad", icon: <GlobeHemisphereWest weight="bold" className="size-4" /> },
        ]}
        className="max-w-md"
      />

      <AnimatePresence initial={false}>
        {abroad && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
            <div className="grid max-w-xl gap-4 pt-6">
              <Field label="City" htmlFor="city" required>
                <Combobox id="city" value={b.city} onChange={(v) => b.patch({ city: v })} options={CITY_OPTIONS} placeholder="Start typing your city" icon={<MapPin weight="bold" className="size-4" />} />
              </Field>
              <AnimatePresence>
                {counted && (
                  <motion.div initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3 rounded-2xl bg-cobalt-50 px-4 py-3 text-cobalt ring-1 ring-cobalt/10">
                    <span className="grid size-8 place-items-center rounded-full bg-cobalt text-white">
                      <GlobeHemisphereWest weight="fill" className="size-4" />
                    </span>
                    <span className="text-sm font-semibold">
                      You count toward 62 Cities, One Gambia. <span className="font-normal text-cobalt/80">{RUN.citiesCounted} cities so far.</span>
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
              <Field label="Show amounts in">
                <div className="flex flex-wrap gap-2">
                  {CURRENCIES.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => b.patch({ currency: c.code, donation: 0 })}
                      className={cn(
                        "flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-all",
                        b.currency === c.code ? "border-navy bg-navy text-white" : "border-line bg-white text-navy hover:border-line-strong",
                      )}
                    >
                      <span className="opacity-60">{c.symbol}</span>
                      {c.code}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="text-xl font-bold text-navy">Choose your event</h2>
        <Badge tone="sun">{abroad ? "Sample amounts" : "Sample fees"}</Badge>
      </div>

      <div className="mt-4 space-y-2.5">
        {(abroad ? virtual : inPerson).map((ev) => (
          <EventRow key={ev.id} ev={ev} on={me.eventId === ev.id} price={fmt(b, entryPrice(b, ev.id))} suggested={abroad} onPick={() => pick(ev)} />
        ))}
      </div>

      <p className="mb-3 mt-8 font-label text-muted">{abroad ? "Home for race day?" : "Or run from anywhere"}</p>
      <div className="space-y-2.5">
        {(abroad ? inPerson : virtual).map((ev) => (
          <EventRow key={ev.id} ev={ev} on={me.eventId === ev.id} price={fmt(b, entryPrice(b, ev.id))} suggested={abroad} onPick={() => pick(ev)} />
        ))}
      </div>

      <SectionCard className="mt-8 border-dashed bg-transparent shadow-none">
        <div className="flex items-start gap-3 text-sm text-muted">
          <Sparkle weight="fill" className="mt-0.5 size-4 shrink-0 text-sun" />
          <p>
            Registering children or a team? Add them at step 3. One booking can hold the whole family, and under 18s can walk the Heritage walk at any age with
            you as their guardian.
          </p>
        </div>
      </SectionCard>

      <StepFooter>
        <Button size="lg" arrow onClick={() => router.push("/register/details")} disabled={abroad && !b.city.trim()}>
          Continue
        </Button>
      </StepFooter>
    </div>
  );
}

function EventRow({ ev, on, price, suggested, onPick }: { ev: RaceEvent; on: boolean; price: string; suggested: boolean; onPick: () => void }) {
  return (
    <motion.button
      layout
      role="radio"
      aria-checked={on}
      onClick={onPick}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "group relative flex w-full items-center gap-4 rounded-[1.25rem] border-2 bg-white p-4 text-left transition-[border-color,box-shadow,background-color] duration-200 sm:p-5",
        on ? "border-forest bg-forest-50/50 shadow-[0_10px_30px_-18px_rgb(19_95_64/0.7)]" : "border-transparent shadow-card hover:border-line-strong",
      )}
    >
      <AnimatePresence initial={false} mode="wait">
        {on ? (
          <motion.span key="on" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="grid size-[1.375rem] shrink-0 place-items-center rounded-full bg-forest text-white">
            <Check weight="bold" className="size-3.5" />
          </motion.span>
        ) : (
          <motion.span key="off" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <RadioDot checked={false} />
          </motion.span>
        )}
      </AnimatePresence>
      <span className={cn("font-race hidden w-[5.4rem] shrink-0 text-navy sm:block", ev.distance.length > 4 ? "text-[1.55rem]" : "text-[2.1rem]")}>{ev.distance}</span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-navy">{ev.name}</span>
          <Badge tone={ev.minAge >= 18 ? "ember" : ev.minAge === 0 ? "forest" : "cobalt"}>{ev.ageLabel}</Badge>
        </span>
        <span className="mt-0.5 flex items-center gap-2 text-sm text-muted">
          {ev.kind === "virtual" ? `Any day, ${RUN.virtualWindow}` : ev.blurb}
          {ev.kind === "in-person" && (
            <span className="hidden items-center gap-1 sm:flex">
              · <Clock className="size-3.5" /> {ev.start}
            </span>
          )}
        </span>
      </span>
      <span className="text-right">
        <span className="block whitespace-nowrap font-bold text-navy tabular">{price}</span>
        {suggested && <span className="block text-[0.6875rem] text-faint">suggested</span>}
      </span>
    </motion.button>
  );
}
