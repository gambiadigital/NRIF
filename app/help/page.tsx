"use client";

import { useMemo, useState } from "react";
import { Accordion } from "radix-ui";
import { MagnifyingGlass, Plus, FileText, ArrowsLeftRight } from "@phosphor-icons/react";
import { ContactList, useContacts } from "@/components/site/Contact";
import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";
import { FlagBars } from "@/components/brand";
import { FAQS } from "@/lib/data";
import { WAIVER, POLICY } from "@/lib/content";

export default function Help() {
  const [q, setQ] = useState("");
  const list = useMemo(() => FAQS.filter((f) => !q || `${f.q} ${f.a}`.toLowerCase().includes(q.toLowerCase())), [q]);
  return (
    <>
      <SiteHeader />
      <main className="pt-[var(--header-h)]">
        <section className="bg-navy px-4 pb-16 pt-14 text-white sm:px-6">
          <div className="mx-auto max-w-4xl">
            <p className="flex items-center gap-2.5 font-label text-white"><FlagBars small />Help</p>
            <h1 className="mt-3 font-race text-[clamp(3rem,9vw,6rem)]">How can we help?</h1>
            <div className="relative mt-8 max-w-xl">
              <MagnifyingGlass className="absolute left-5 top-1/2 size-5 -translate-y-1/2 text-white/50" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search: children, refunds, race packs…"
                className="h-14 w-full rounded-full border border-white/15 bg-white/10 pl-14 pr-5 text-white outline-none backdrop-blur placeholder:text-white/45 focus:border-white/60"
              />
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-4xl px-4 pb-24 pt-12 sm:px-6">
          <Accordion.Root type="multiple" className="divide-y divide-line rounded-[1.5rem] border border-line bg-white">
            {list.map((f) => (
              <Accordion.Item key={f.q} value={f.q}>
                <Accordion.Header>
                  <Accordion.Trigger className="group flex w-full items-center justify-between gap-6 px-6 py-5 text-left">
                    <span className="font-semibold text-navy">{f.q}</span>
                    <Plus weight="bold" className="size-4 shrink-0 text-muted transition-transform duration-300 group-data-[state=open]:rotate-45" />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="overflow-hidden data-[state=closed]:animate-[collapse_.3s_ease-out] data-[state=open]:animate-[expand_.35s_cubic-bezier(.16,1,.3,1)]">
                  <p className="px-6 pb-5 leading-relaxed text-muted">{f.a}</p>
                </Accordion.Content>
              </Accordion.Item>
            ))}
            {list.length === 0 && <p className="px-6 py-8 text-center text-muted">Nothing matches “{q}”. Try the team on WhatsApp below.</p>}
          </Accordion.Root>

          <section id="refunds" className="mt-16 scroll-mt-24">
            <h2 className="flex items-center gap-3 text-2xl font-bold text-navy">
              <ArrowsLeftRight weight="duotone" className="size-7 text-forest" /> Refund and transfer policy
            </h2>
            <p className="mt-1 text-sm text-muted">Version {POLICY.version}</p>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {POLICY.sections.map((s) => (
                <div key={s.h} className="rounded-[1.25rem] border border-line bg-white p-5">
                  <p className="font-bold text-navy">{s.h}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.p}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="waiver" className="mt-16 scroll-mt-24">
            <h2 className="flex items-center gap-3 text-2xl font-bold text-navy">
              <FileText weight="duotone" className="size-7 text-forest" /> Health disclaimer and waiver
            </h2>
            <p className="mt-1 text-sm text-muted">
              Version {WAIVER.version}, published {WAIVER.published}. Every acceptance is saved with this version and the time.
            </p>
            <div className="mt-5 space-y-4 rounded-[1.5rem] border border-line bg-white p-6">
              {WAIVER.sections.map((s) => (
                <div key={s.h}>
                  <p className="font-bold text-navy">{s.h}</p>
                  <p className="mt-1 leading-relaxed text-muted">{s.p}</p>
                </div>
              ))}
            </div>
          </section>

          <HelpContact />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function HelpContact() {
  const items = useContacts();
  if (!items.length) return null;
  return (
    <section id="contact" className="mt-16 scroll-mt-24">
      <h2 className="text-2xl font-bold text-navy">Talk to the team</h2>
      <ContactList big className="mt-5" />
    </section>
  );
}
