"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "motion/react";
import { Heart, ChatCircle, PaperPlaneTilt, DotsThree, BookmarkSimple, ArrowRight, LinkSimple, Printer } from "@phosphor-icons/react";
import { SiteHeader } from "@/components/site/Header";
import { Phone } from "@/components/Phone";
import { Button } from "@/components/ui/button";
import { Swoosh, R4ILogo, NrifLockup, FlagBars } from "@/components/brand";
import { RUN } from "@/lib/data";

/** Frame 01: how people find the run. A social post and a poster, both carrying a source tag. */
export default function Campaign() {
  const router = useRouter();
  return (
    <>
      <div className="no-print">
        <SiteHeader />
      </div>
      <main className="mx-auto max-w-6xl px-4 pb-32 pt-[calc(var(--header-h)+2.5rem)] sm:px-6">
        <div className="no-print">
          <p className="font-label text-forest">Frame 01 · Find the run</p>
          <h1 className="mt-3 font-race text-[clamp(2.6rem,7vw,4.6rem)] text-navy">Every link carries a tag</h1>
          <p className="mt-2 max-w-2xl text-muted">
            Posts, posters and share cards each send people to the landing page with a source tag, so NRIF can count sign-ups by channel.
          </p>
        </div>

        <div className="mt-12 grid items-start gap-12 lg:grid-cols-2">
          <div className="no-print">
            <Phone>
              <div className="flex items-center gap-3 px-4 pb-3 pt-1">
                <span className="relative size-9 overflow-hidden rounded-full bg-white ring-2 ring-[#E1306C]/70 ring-offset-1">
                  <Image src="/brand/nrif-seal.svg" alt="" fill unoptimized className="object-contain" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-navy">nrif.thegambia</p>
                  <p className="text-[0.6875rem] text-muted">Sponsored · Banjul</p>
                </div>
                <DotsThree weight="bold" className="size-5 text-navy" />
              </div>
              <div className="relative aspect-square overflow-hidden bg-cobalt">
                <Image src="/media/hero-coast.webp" alt="" fill sizes="350px" className="object-cover opacity-40 mix-blend-luminosity" />
                <div className="absolute inset-0 bg-gradient-to-t from-cobalt via-cobalt/50 to-transparent" />
                <Swoosh className="absolute -bottom-6 -right-8 w-3/4" />
                <div className="relative flex h-full flex-col p-6 text-white">
                  <p className="font-label !text-[0.625rem] text-sun">NRIF Endowment Fund Run 2027</p>
                  <p className="mt-3 font-race text-[3rem]">Run for Independence</p>
                  <p className="mt-2 text-sm">Sat 30 Jan 2027 · Independence Stadium</p>
                </div>
              </div>
              <div className="flex items-center gap-4 px-4 py-3 text-navy">
                <Heart weight="bold" className="size-6" />
                <ChatCircle weight="bold" className="size-6" />
                <PaperPlaneTilt weight="bold" className="size-6" />
                <BookmarkSimple weight="bold" className="ml-auto size-6" />
              </div>
              <div className="px-4 pb-5 text-[0.8125rem] text-navy">
                <p>
                  <b>nrif.thegambia</b> Run, walk or join from abroad. Every entry grows the Endowment Fund.
                </p>
                <Link href="/?src=instagram&ref=1047" className="mt-3 flex items-center justify-between rounded-xl bg-forest px-4 py-3 font-semibold text-white">
                  Register now <ArrowRight weight="bold" className="size-4" />
                </Link>
                <p className="mt-2 flex items-center gap-1.5 font-mono text-[0.6875rem] text-muted">
                  <LinkSimple className="size-3" /> run4independence.gm/?src=instagram
                </p>
              </div>
            </Phone>
          </div>

          <div>
            <motion.div initial={{ rotate: 2, y: 20, opacity: 0 }} animate={{ rotate: 0, y: 0, opacity: 1 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} className="@container relative mx-auto aspect-[1/1.414] w-full max-w-md overflow-hidden rounded-xl bg-navy text-white shadow-pop print:max-w-none print:rounded-none print:shadow-none">
              <Image src="/media/start-line.webp" alt="" fill sizes="450px" className="object-cover opacity-45" />
              <div className="absolute inset-0 bg-gradient-to-b from-navy/70 via-navy/40 to-navy" />
              <div className="relative flex h-full flex-col p-[7cqw]">
                <div className="flex items-center justify-between">
                  <NrifLockup white className="h-[9cqw]" />
                  <FlagBars />
                </div>
                <R4ILogo reverse className="mt-[10cqw] w-[78cqw]" />
                <p className="mt-[6cqw] font-race text-[9cqw] text-sun">{RUN.tagline}</p>
                <p className="mt-[2cqw] text-[3.6cqw] text-white/85">
                  {RUN.dateLong}
                  <br />
                  {RUN.venue}, {RUN.venueArea}
                </p>
                <p className="mt-[2cqw] text-[3.2cqw] text-white/65">21K · 10K · 5K · 1.965K Heritage walk · Virtual</p>
                <div className="mt-auto flex items-end justify-between gap-[4cqw]">
                  <div className="rounded-[2cqw] bg-white p-[2.4cqw]">
                    <QRCodeSVG value="https://run4independence.gm/?src=poster" size={160} fgColor="#0b1b3a" className="block size-[30cqw]" />
                  </div>
                  <div className="text-right">
                    <p className="font-race text-[7cqw]">Scan to register</p>
                    <p className="mt-[1cqw] font-mono text-[3cqw] text-white/60">?src=poster</p>
                  </div>
                </div>
              </div>
            </motion.div>
            <div className="no-print mt-6 flex justify-center gap-3">
              <Button variant="ink" icon={<Printer weight="bold" className="size-4" />} onClick={() => window.print()}>
                Print the poster
              </Button>
              <Button variant="line" onClick={() => router.push("/admin/campaigns")}>
                Make more links
              </Button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
