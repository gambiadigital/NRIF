"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { GlobeHemisphereWest, DeviceMobile, UploadSimple, Certificate } from "@phosphor-icons/react";
import { RUN } from "@/lib/data";
import { useStats } from "@/lib/client";
import { useBooking } from "@/lib/store";
import { CitiesMap } from "@/components/CitiesMap";
import { Reveal, RiseLines, CountUp } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";
import { FlagBars } from "@/components/brand";

export function Abroad() {
  const router = useRouter();
  const stats = useStats().data;
  const top = (stats?.cities ?? []).slice(0, 8);
  return (
    <section id="abroad" className="relative scroll-mt-16 overflow-hidden bg-navy py-24 text-white sm:py-32">
      <div className="absolute inset-x-0 top-0 h-1.5 flag-rule" />
      <div className="mx-auto max-w-[88rem] px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <Reveal>
              <p className="flex items-center gap-2.5 font-label text-white"><FlagBars small />From abroad</p>
            </Reveal>
            <h2 className="mt-5 font-race text-[clamp(2.8rem,7vw,6.2rem)] text-white">
              <RiseLines lines={[<span key="c" className="text-white/45">62 Cities,</span>, "One Gambia"]} />
            </h2>
            <Reveal delay={0.1}>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/70">
                Living in London, Atlanta or Stockholm? Run the 10K or 5K virtual wherever you are, any day from {RUN.virtualWindow}, and your city lights up on the
                map. Home for January? Every in-person event is open to you too.
              </p>
            </Reveal>
            <Reveal delay={0.15} className="mt-8 flex items-end gap-6">
              <div>
                <p className="font-bib text-[5.4rem] leading-none text-white">
                  <CountUp key={stats?.cities.length ?? 0} to={stats?.cities.length ?? 0} />
                  <span className="text-white/30">/{RUN.citiesGoal}</span>
                </p>
                <p className="mt-1 text-sm text-white/55">cities counted so far</p>
              </div>
              <div className="mb-2 h-16 w-px bg-white/15" />
              <div className="mb-1">
                <p className="font-bib text-[2.6rem] leading-none text-white">
                  <CountUp key={stats?.abroadEntries ?? 0} to={stats?.abroadEntries ?? 0} />
                </p>
                <p className="mt-1 text-sm text-white/55">entries from abroad</p>
              </div>
            </Reveal>
            <Reveal delay={0.2} className="mt-8">
              <Button
                variant="flag"
                size="lg"
                arrow
                icon={<GlobeHemisphereWest weight="bold" className="size-5" />}
                onClick={() => {
                  useBooking.getState().setResidence("abroad");
                  router.push("/register");
                }}
              >
                Join from abroad
              </Button>
            </Reveal>
          </div>

          <div>
            <Reveal className="relative rounded-[2rem] border border-white/10 bg-white/[0.03] p-3 sm:p-6">
              <CitiesMap counts={stats?.cities} />
            </Reveal>
            <div className="mt-4 flex flex-wrap gap-2">
              {top.length === 0 && <p className="text-sm text-white/55">No cities yet. Yours could be the first on the map.</p>}
              {top.map((c, i) => (
                <Reveal key={c.city} delay={0.04 * i} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1.5 pl-3 pr-1.5 text-sm">
                  {c.city}
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold tabular text-white">{c.n}</span>
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr]">
          <Reveal className="relative min-h-[22rem] overflow-hidden rounded-[2rem]">
            <Image src="/media/london-virtual.webp" alt="A Gambian runner checking his watch on a rainy London riverside at dawn" fill sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/40 to-transparent" />
            <div className="relative flex h-full max-w-sm flex-col justify-end p-7">
              <p className="flex items-center gap-2.5 font-label text-white"><FlagBars small />10K and 5K virtual</p>
              <p className="mt-3 text-2xl font-bold leading-snug">Can&apos;t be in Bakau on the day? Run your own route, wherever you are.</p>
              <p className="mt-3 text-sm text-white/65">E-bibs start with a V</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {[
              { icon: DeviceMobile, t: "Record it your way", d: "Strava, Pacer, a GPS watch or any running app." },
              { icon: UploadSimple, t: "Upload by Tue 2 Feb", d: "A screenshot or a link. We check every run." },
              { icon: Certificate, t: "E-bib and e-certificate", d: "Your bib starts with a V, and the certificate carries your time." },
            ].map((x, i) => (
              <Reveal key={x.t} delay={i * 0.06} className="flex items-start gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-cobalt text-white">
                  <x.icon weight="duotone" className="size-6" />
                </span>
                <span>
                  <span className="block font-semibold">{x.t}</span>
                  <span className="mt-0.5 block text-sm text-white/60">{x.d}</span>
                </span>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
