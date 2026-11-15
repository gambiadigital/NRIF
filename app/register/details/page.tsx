"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Popover } from "radix-ui";
import { UserCircle, ShieldPlus, TShirt, LockSimple, Ruler, WarningOctagon, Envelope } from "@phosphor-icons/react";
import { RELATIONSHIPS, RUN, SHIRT_SIZES, TOWNS, eventById } from "@/lib/data";
import { useBooking, lead } from "@/lib/store";
import { raceDayAge, category } from "@/lib/format";
import { Field, TextInput, DateField, Select, PhoneField, Combobox, ChipGroup } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
import { Bib } from "@/components/Bib";
import { StepFooter, StepTitle, SectionCard } from "@/components/register/Shell";

export default function Details() {
  const b = useBooking();
  const router = useRouter();
  const me = lead(b);
  const [tried, setTried] = useState(false);
  const age = raceDayAge(me.dob);
  const cat = category(age, me.gender);
  const minor = age !== null && age < 18;
  const ev = eventById(me.eventId);
  const set = (p: Partial<typeof me>) => b.patchParticipant(me.id, p);

  const errors = {
    name: !me.fullName.trim() && "Enter your full name",
    dob: (!me.dob && "Enter your date of birth") || (me.dob && age === null && "Check the date, for example 12 / 03 / 1991"),
    gender: !me.gender && "Choose one",
    phone: b.contact.phone.digits.length < 7 && "Enter a phone number we can text",
    email: !/^\S+@\S+\.\S+$/.test(b.contact.email) && "Enter an email address",
    town: !b.contact.town.trim() && "Enter your town or area",
    eName: !b.contact.emergency.name.trim() && "Enter a name",
    ePhone: b.contact.emergency.phone.digits.length < 7 && "Enter their phone number",
    size: !me.shirt && "Choose a size",
  };
  const ok = !minor && Object.values(errors).every((e) => !e);
  const err = (k: keyof typeof errors) => (tried ? errors[k] || undefined : undefined);

  return (
    <div>
      <StepTitle title="About you" sub="We use these to set your race category and to reach you or your emergency contact on the day." />

      <div className="space-y-4">
        <SectionCard title="You" icon={<UserCircle weight="bold" className="size-4" />}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full name" required htmlFor="name" error={err("name")} className="sm:col-span-2">
              <TextInput id="name" value={me.fullName} onChange={(e) => set({ fullName: e.target.value })} placeholder="As on your ID" autoComplete="name" invalid={!!err("name")} />
            </Field>
            <Field label="Date of birth" required htmlFor="dob" error={err("dob")}>
              <DateField id="dob" value={me.dob} onChange={(v) => set({ dob: v })} invalid={!!err("dob")} />
            </Field>
            <Field label="Gender" required htmlFor="gender" error={err("gender")}>
              <Select
                id="gender"
                value={me.gender}
                onChange={(v) => set({ gender: v as "Female" | "Male" })}
                options={[
                  { value: "Female", label: "Female" },
                  { value: "Male", label: "Male" },
                ]}
                invalid={!!err("gender")}
              />
            </Field>
          </div>

          <AnimatePresence>
            {age !== null && !minor && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="mt-4 flex w-fit items-center gap-2 rounded-xl bg-cobalt-50 px-3.5 py-2.5 text-sm font-semibold text-cobalt ring-1 ring-cobalt/10">
                  <UserCircle weight="fill" className="size-[1.1rem]" />
                  Race-day age {age}
                  {cat && me.gender && <span className="font-normal text-cobalt/80">· {cat}</span>}
                </div>
              </motion.div>
            )}
            {minor && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="mt-4 flex gap-3 rounded-2xl bg-ember-50 p-4 text-sm text-ember-600 ring-1 ring-ember/15">
                  <WarningOctagon weight="fill" className="mt-0.5 size-5 shrink-0" />
                  <div>
                    <p className="font-bold">You will be {age} on race day, so a parent or guardian needs to book for you.</p>
                    <p className="mt-1 text-ember-600/85">Ask them to start a booking and add you at step 3. They accept the waiver on your behalf.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Phone" required htmlFor="phone" hint="We text your bib and reminders here" error={err("phone")}>
              <PhoneField id="phone" value={b.contact.phone} onChange={(v) => b.patchContact({ phone: v })} invalid={!!err("phone")} />
            </Field>
            <Field label="Email" required htmlFor="email" error={err("email")}>
              <TextInput
                id="email"
                type="email"
                value={b.contact.email}
                onChange={(e) => b.patchContact({ email: e.target.value })}
                placeholder="you@example.com"
                autoComplete="email"
                leading={<Envelope className="size-4" />}
                invalid={!!err("email")}
              />
            </Field>
            <Field label={b.residence === "abroad" ? "Town or city" : "Town or area"} required htmlFor="town" error={err("town")} className="sm:col-span-2">
              <Combobox id="town" value={b.contact.town} onChange={(v) => b.patchContact({ town: v })} options={b.residence === "abroad" ? ["London", "Manchester", "Atlanta", "New York", "Stockholm", "Barcelona", "Berlin"] : TOWNS} placeholder="Serrekunda, Bakau, Brikama…" invalid={!!err("town")} />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="Emergency contact" tone="ember" icon={<ShieldPlus weight="fill" className="size-4" />} aside={<span className="text-xs text-muted">For the medical team</span>}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name" required htmlFor="ename" error={err("eName")}>
              <TextInput id="ename" value={b.contact.emergency.name} onChange={(e) => b.patchContact({ emergency: { ...b.contact.emergency, name: e.target.value } })} placeholder="Someone not running" invalid={!!err("eName")} />
            </Field>
            <Field label="Relationship" htmlFor="erel">
              <Select id="erel" value={b.contact.emergency.relation} onChange={(v) => b.patchContact({ emergency: { ...b.contact.emergency, relation: v } })} options={RELATIONSHIPS.map((r) => ({ value: r, label: r }))} />
            </Field>
            <Field label="Their phone" required htmlFor="ephone" error={err("ePhone")} className="sm:col-span-2">
              <PhoneField id="ephone" value={b.contact.emergency.phone} onChange={(v) => b.patchContact({ emergency: { ...b.contact.emergency, phone: v } })} invalid={!!err("ePhone")} />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="Race kit" icon={<TShirt weight="bold" className="size-4" />} aside={<SizeGuide />}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_13rem] sm:items-start">
            <div className="space-y-5">
              <Field label="T-shirt size" required error={err("size")}>
                <ChipGroup value={me.shirt || null} onChange={(v) => set({ shirt: v })} options={SHIRT_SIZES.map((s) => ({ value: s, label: s }))} />
              </Field>
              <Field label="Name on bib" htmlFor="bibname" hint="Up to 10 letters. Friends shout it on the course.">
                <TextInput
                  id="bibname"
                  value={me.bibName}
                  maxLength={10}
                  onChange={(e) => set({ bibName: e.target.value.toUpperCase().replace(/[^A-Z' -]/g, "") })}
                  placeholder={me.fullName.split(" ")[0]?.toUpperCase() || "YOUR NAME"}
                  className="font-mono uppercase tracking-[0.12em]"
                />
              </Field>
            </div>
            <div className="rounded-2xl bg-paper p-3">
              <Bib number={ev.kind === "virtual" ? "V····" : "····"} eventId={me.eventId} name={me.bibName || me.fullName.split(" ")[0]?.toUpperCase()} flat />
              <p className="mt-2 text-center text-xs text-muted">Your number arrives once you have paid</p>
            </div>
          </div>
          <p className="mt-5 flex items-center gap-2 border-t border-line pt-4 text-[0.8125rem] text-muted">
            <LockSimple weight="fill" className="size-4 text-faint" />
            Kit choices lock on {RUN.kitLock}, so printing can start. {ev.kind === "virtual" && "Family can collect your T-shirt in Bakau."}
          </p>
        </SectionCard>
      </div>

      <StepFooter back="/register">
        <Button
          size="lg"
          arrow
          disabled={minor}
          onClick={() => {
            setTried(true);
            if (ok) router.push("/register/participants");
            else window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          Continue
        </Button>
      </StepFooter>
    </div>
  );
}

function SizeGuide() {
  return (
    <Popover.Root>
      <Popover.Trigger className="-my-2 flex items-center gap-1.5 rounded-full px-2 py-2 text-[0.8125rem] font-semibold text-forest hover:bg-forest-50">
        <Ruler weight="bold" className="size-4" />
        Size guide
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="end" sideOffset={8} className="z-[80] w-72 rounded-2xl border border-line bg-white p-4 shadow-lift">
          <p className="mb-3 text-sm font-bold text-navy">Chest, in centimetres</p>
          <div className="grid grid-cols-6 gap-1 text-center text-xs">
            {SHIRT_SIZES.map((s) => (
              <span key={s} className="rounded-lg bg-sand py-1.5 font-bold text-navy">
                {s}
              </span>
            ))}
            {["84", "92", "100", "108", "116", "124"].map((c) => (
              <span key={c} className="py-1 text-muted tabular">
                {c}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">Unisex fit. Children&apos;s sizes are XS and S.</p>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
