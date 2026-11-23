"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { House, GlobeHemisphereWest, MapPin, Check, Clock, UsersThree, Minus, Plus, CheckCircle, ArrowRight } from "@phosphor-icons/react";
import { CITIES, CURRENCIES, RUN, type RaceEvent } from "@/lib/data";
import { useLiveEvents, useStats } from "@/lib/client";
import { useBooking, entryPrice, fmt, lead, total } from "@/lib/store";
import { isoForCity } from "@/lib/format";
import { Segmented, Field, Combobox, Badge, RadioDot } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
import { StepFooter, StepTitle, SectionCard } from "@/components/register/Shell";
import { cn } from "@/lib/cn";

const CITY_OPTIONS = [...CITIES.map((c) => `${c.city}, ${c.country}`), "Leeds, United Kingdom", "Leicester, United Kingdom", "Houston, United States", "Gothenburg, Sweden", "Rome, Italy"];

export default function ChooseEvent() {
  const b = useBooking();
  const router = useRouter();
  const me = lead(b);
  const EVENTS = useLiveEvents().filter((e) => e.open !== false);
  const cities = useStats().data?.cities.length ?? 0;
  const abroad = b.residence === "abroad";
  const virtual = EVENTS.filter((e) => e.kind === "virtual");
  const inPerson = EVENTS.filter((e) => e.kind === "in-person");
  const counted = abroad && b.city.trim().length > 2;

  const pick = (ev: RaceEvent) => b.patchParticipant(me.id, { eventId: ev.id });

  // Abroad, phone numbers start in the country of the city, not +220, unless one has already been typed.
  function pickCity(city: string) {
    b.patch({ city });
    const iso = isoForCity(city);
    if (!iso) return;
    const c = useBooking.getState().contact;
    b.patchContact({
      ...(c.phone.digits ? {} : { phone: { ...c.phone, iso } }),
      ...(c.emergency.phone.digits ? {} : { emergency: { ...c.emergency, phone: { ...c.emergency.phone, iso } } }),
    });
  }

  // Paid already: the entries are fixed. They can only carry on to the details.
  if (b.order) return <Paid />;

  const othersFor = (id: string) => b.participants.slice(1).filter((p) => p.eventId === id).length;
  const full = b.participants.length >= 10;

  return (
    <div>
      <StepTitle eyebrow={`${RUN.name} ${RUN.edition}`} title="Where do you live?" sub="It sets your currency, your events and how you pay. The Diaspora Virtual Run is for people who live abroad." />

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
                <Combobox id="city" value={b.city} onChange={pickCity} options={CITY_OPTIONS} placeholder="Start typing your city" icon={<MapPin weight="bold" className="size-4" />} />
              </Field>
              <AnimatePresence>
                {counted && (
                  <motion.div initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3 rounded-2xl bg-cobalt-50 px-4 py-3 text-cobalt ring-1 ring-cobalt/10">
                    <span className="grid size-8 place-items-center rounded-full bg-cobalt text-white">
                      <GlobeHemisphereWest weight="fill" className="size-4" />
                    </span>
                    <span className="text-sm font-semibold">
                      You count toward 62 Cities, One Gambia. {cities > 0 && <span className="font-normal text-cobalt/80">{cities} {cities === 1 ? "city" : "cities"} so far.</span>}
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
      </div>

      <div className="mt-4 space-y-2.5">
        {(abroad ? virtual : inPerson).map((ev) => (
          <EventRow key={ev.id} ev={ev} on={me.eventId === ev.id} price={fmt(b, entryPrice(b, ev.id))} note={abroad && b.currency !== "GBP" ? `about £${ev.suggestedGBP}` : undefined} onPick={() => pick(ev)} />
        ))}
      </div>

      {abroad && (
        <>
          <p className="mb-3 mt-8 font-label text-muted">Home for race day?</p>
          <div className="space-y-2.5">
            {inPerson.map((ev) => (
              <EventRow key={ev.id} ev={ev} on={me.eventId === ev.id} price={fmt(b, entryPrice(b, ev.id))} note={b.currency !== "GBP" ? `about £${ev.suggestedGBP}` : undefined} onPick={() => pick(ev)} />
            ))}
          </div>
        </>
      )}

      <SectionCard className="mt-8" title="Anyone else coming?" icon={<UsersThree weight="bold" className="size-4" />} aside={<span className="text-xs text-muted">Optional</span>}>
        <p className="-mt-2 mb-4 text-sm text-muted">
          Family, friends or a team: one payment covers everyone, and you add their names after paying. Under 18s can walk the Heritage Walk at any age with you as their guardian.
        </p>
        <ul className="divide-y divide-line">
          {(abroad ? [...virtual, ...inPerson] : inPerson).map((ev) => {
            const n = othersFor(ev.id);
            return (
              <li key={ev.id} className="flex items-center gap-3 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-navy">{ev.name}</span>
                  <span className="block text-xs text-muted">
                    {ev.ageLabel} · {fmt(b, entryPrice(b, ev.id))} each
                  </span>
                </span>
                <span className="flex items-center gap-1 rounded-full border border-line bg-paper p-1">
                  <button
                    onClick={() => b.setOthers(ev.id, n - 1)}
                    disabled={n === 0}
                    className="grid size-9 place-items-center rounded-full text-navy transition-colors hover:bg-white disabled:opacity-30"
                    aria-label={`One fewer for the ${ev.name}`}
                  >
                    <Minus weight="bold" className="size-4" />
                  </button>
                  <span className="w-7 text-center font-bold text-navy tabular" aria-live="polite">
                    {n}
                  </span>
                  <button
                    onClick={() => b.setOthers(ev.id, n + 1)}
                    disabled={full}
                    className="grid size-9 place-items-center rounded-full text-navy transition-colors hover:bg-white disabled:opacity-30"
                    aria-label={`One more for the ${ev.name}`}
                  >
                    <Plus weight="bold" className="size-4" />
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
        {full && <p className="mt-2 text-xs text-muted">One booking holds up to 10 people. Make a second booking for more.</p>}
      </SectionCard>

      <StepFooter>
        <Button size="lg" arrow onClick={() => router.push("/register/payment")} disabled={abroad && !b.city.trim()}>
          Continue to payment
        </Button>
      </StepFooter>
    </div>
  );
}

/** Once the entries are paid for they are fixed: this step only shows them and moves on. */
function Paid() {
  const b = useBooking();
  const router = useRouter();
  const counts = new Map<RaceEvent["id"], number>();
  for (const p of b.participants) counts.set(p.eventId, (counts.get(p.eventId) ?? 0) + 1);
  const events = useLiveEvents();
  return (
    <div>
      <StepTitle eyebrow={`${RUN.name} ${RUN.edition}`} title="Your entries are paid for" sub="To change them now, contact NRIF with your reference. Carry on to add everyone's names and details." />
      <SectionCard>
        <p className="flex items-center gap-2 font-semibold text-forest">
          <CheckCircle weight="fill" className="size-5" /> {b.order!.status === "paid" ? "Paid by card" : "Payment sent"} · <span className="font-mono">{b.order!.reference}</span>
        </p>
        <ul className="mt-4 divide-y divide-line">
          {[...counts].map(([id, n]) => (
            <li key={id} className="flex items-center justify-between gap-4 py-3 text-[0.9375rem]">
              <span className="text-navy">
                {events.find((e) => e.id === id)?.name ?? id} <span className="text-muted">× {n}</span>
              </span>
              <span className="font-semibold text-navy tabular">{fmt(b, entryPrice(b, id) * n)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex items-baseline justify-between border-t border-line pt-4">
          <span className="font-bold text-navy">Total paid</span>
          <span className="font-bib text-[2rem] leading-none text-navy">{fmt(b, total(b))}</span>
        </div>
      </SectionCard>
      <StepFooter>
        <Button size="lg" icon={<ArrowRight weight="bold" className="size-5" />} onClick={() => router.push("/register/details")}>
          Continue to your details
        </Button>
      </StepFooter>
    </div>
  );
}

function EventRow({ ev, on, price, note, onPick }: { ev: RaceEvent; on: boolean; price: string; note?: string; onPick: () => void }) {
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
          {ev.kind === "virtual" ? `5 or 10 km, any day ${RUN.virtualWindow}` : ev.blurb}
          {ev.kind === "in-person" && (
            <span className="hidden items-center gap-1 sm:flex">
              · <Clock className="size-3.5" /> {ev.start}
            </span>
          )}
        </span>
      </span>
      <span className="text-right">
        <span className="block whitespace-nowrap font-bold text-navy tabular">{price}</span>
        {note && <span className="block text-[0.6875rem] text-faint">{note}</span>}
      </span>
    </motion.button>
  );
}
