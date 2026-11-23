"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { UserCircle, ShieldPlus, WarningOctagon, Envelope } from "@phosphor-icons/react";
import { RELATIONSHIPS, TOWNS } from "@/lib/data";
import { useBooking, lead } from "@/lib/store";
import { raceDayAge, category } from "@/lib/format";
import { Field, TextInput, DateField, Select, PhoneField, Combobox } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
import { StepFooter, StepTitle, SectionCard } from "@/components/register/Shell";

export default function Details() {
  const b = useBooking();
  const router = useRouter();
  const me = lead(b);
  const [tried, setTried] = useState(false);
  const age = raceDayAge(me.dob);
  const cat = category(age, me.gender);
  const minor = age !== null && age < 18;
  // People abroad already gave their city at step 1, so only people in The Gambia are asked for a town.
  const abroad = b.residence === "abroad";
  const set = (p: Partial<typeof me>) => b.patchParticipant(me.id, p);

  const errors = {
    name: !me.fullName.trim() && "Enter your full name",
    dob: (!me.dob && "Enter your date of birth") || (me.dob && age === null && "Check the date, for example 12 / 03 / 1991"),
    gender: !me.gender && "Choose one",
    phone: b.contact.phone.digits.length < 7 && "Enter a phone number we can text",
    email: !/^\S+@\S+\.\S+$/.test(b.contact.email) && "Enter an email address",
    town: !abroad && !b.contact.town.trim() && "Enter your town or area",
    eName: !b.contact.emergency.name.trim() && "Enter a name",
    ePhone: b.contact.emergency.phone.digits.length < 7 && "Enter their phone number",
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
                    <p className="mt-1 text-ember-600/85">Ask them to fill in this form as the person booking, with their own details, and add you on the next step. They accept the waiver on your behalf.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Phone" required htmlFor="phone" hint="We use it only if we need to reach you" error={err("phone")}>
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
            {!abroad && (
              <Field label="Town or area" required htmlFor="town" error={err("town")} className="sm:col-span-2">
                <Combobox id="town" value={b.contact.town} onChange={(v) => b.patchContact({ town: v })} options={TOWNS} placeholder="Serrekunda, Bakau, Brikama…" invalid={!!err("town")} />
              </Field>
            )}
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
      </div>

      <StepFooter back="/register/payment">
        <Button
          size="lg"
          arrow
          disabled={minor}
          onClick={() => {
            setTried(true);
            if (ok) {
              if (abroad) b.patchContact({ town: b.city.split(",")[0]!.trim() });
              router.push("/register/participants");
            }
            else window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          Continue
        </Button>
      </StepFooter>
    </div>
  );
}

