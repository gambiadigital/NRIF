import Link from "next/link";
import { FacebookLogo, InstagramLogo, TiktokLogo, XLogo } from "@phosphor-icons/react/dist/ssr";
import { R4ILogo, NrifLockup, FlagBars } from "@/components/brand";
import { RUN } from "@/lib/data";

const COLS = [
  {
    title: "The run",
    links: [
      { href: "/#events", label: "Events and fees" },
      { href: "/#race-day", label: "Race-day plan" },
      { href: "/#abroad", label: "Run from abroad" },
      { href: "/steps/SC-1047", label: "Steps challenge" },
    ],
  },
  {
    title: "Your entry",
    links: [
      { href: "/register", label: "Sign up" },
      { href: "/my-entry", label: "My entry" },
      { href: "/my-entry/upload", label: "Upload a virtual run" },
      { href: "/messages", label: "Messages we send" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/help", label: "Questions and answers" },
      { href: "/help#refunds", label: "Refund and transfer policy" },
      { href: "/help#waiver", label: "Health disclaimer and waiver" },
      { href: "/help#contact", label: "Contact NRIF" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-navy text-white">
      <div className="h-1.5 flag-rule" />
      <div className="mx-auto max-w-[88rem] px-4 pb-28 pt-16 sm:px-6 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div className="space-y-6">
            <R4ILogo reverse className="w-44" />
            <p className="max-w-sm text-[0.9375rem] leading-relaxed text-white/65">
              {RUN.dateLong} at {RUN.venue}, {RUN.venueArea}, and anywhere in the world from 23 to 31 January. Every entry grows NRIF&apos;s
              Endowment Fund for Gambian research and innovation.
            </p>
            <div className="flex gap-2">
              {[FacebookLogo, InstagramLogo, TiktokLogo, XLogo].map((I, i) => (
                <a key={i} href="#" aria-label="NRIF social" className="grid size-10 place-items-center rounded-full bg-white/8 ring-1 ring-white/10 transition-colors hover:bg-white/15">
                  <I weight="fill" className="size-[1.1rem]" />
                </a>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLS.map((c) => (
              <div key={c.title}>
                <p className="font-label text-white/45">{c.title}</p>
                <ul className="mt-4 space-y-2.5">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-[0.9375rem] text-white/80 transition-colors hover:text-sun">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-16 flex flex-col gap-6 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/45">Organised by</span>
            <NrifLockup white className="h-10" />
          </div>
          <div className="flex items-center gap-4 text-xs text-white/45">
            <FlagBars />
            <span>© 2026 National Research &amp; Innovation Fund, The Gambia. Fees and times shown are samples.</span>
          </div>
        </div>
      </div>
      <div aria-hidden className="pointer-events-none absolute -bottom-[3.5vw] left-0 right-0 select-none text-center font-race text-[17vw] leading-none text-white/[0.035]">
        One Nation
      </div>
    </footer>
  );
}
