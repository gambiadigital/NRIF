/* The prototype's map: every screen, grouped by journey, with the storyboard frame it answers. */

export type Screen = { href: string; title: string; note: string; frame?: string; persona?: "fatou" | "lamin" };
export type Journey = { id: string; title: string; who: string; screens: Screen[] };

export const JOURNEYS: Journey[] = [
  {
    id: "find",
    title: "Find the run",
    who: "Everyone",
    screens: [
      { href: "/", title: "Landing page", note: "Video hero, countdown, events, why we run", frame: "02" },
      { href: "/?src=instagram&ref=1047", title: "Landing from a share link", note: "Fatou's referral tag, closing the loop", frame: "01" },
      { href: "/campaign", title: "Social post and poster", note: "Every link and QR carries a source tag", frame: "01" },
    ],
  },
  {
    id: "register",
    title: "Register",
    who: "Fatou, Serrekunda",
    screens: [
      { href: "/register", title: "1 · Where you live, then the event", note: "Dalasi fees or suggested donations", frame: "03", persona: "fatou" },
      { href: "/register/details", title: "2 · Your details", note: "Date of birth sets the category", frame: "04", persona: "fatou" },
      { href: "/register/participants", title: "3 · Who is running", note: "Children, guardian, team code, steps", frame: "05", persona: "fatou" },
      { href: "/register/waiver", title: "4 · Waiver and consents", note: "Saved with version and time", frame: "06", persona: "fatou" },
      { href: "/register/payment", title: "5 · Payment", note: "One payment for the family, plus a donation", frame: "07", persona: "fatou" },
      { href: "/register/wave", title: "Paying with Wave", note: "Instant confirmation path", frame: "07", persona: "fatou" },
    ],
  },
  {
    id: "confirm",
    title: "You're in",
    who: "Fatou, Serrekunda",
    screens: [
      { href: "/confirmation", title: "Confirmation and bibs", note: "Bib pop-ups, share card, steps code", frame: "10", persona: "fatou" },
      { href: "/messages", title: "Text and email", note: "SMS under 160 characters, full email", frame: "11", persona: "fatou" },
      { href: "/my-entry", title: "My entry", note: "Sign in with a code, bibs, QR, kit, transfer", persona: "fatou" },
      { href: "/steps/SC-1047", title: "Steps challenge page", note: "Friends give to Fatou's code", persona: "fatou" },
    ],
  },
  {
    id: "abroad",
    title: "From abroad",
    who: "Lamin, London",
    screens: [
      { href: "/register?as=lamin", title: "Abroad: suggested donations", note: "Pounds, 62 Cities tally", frame: "03", persona: "lamin" },
      { href: "/register/pending", title: "Payment pending", note: "Reference RFI-7Q4K, place held 5 days", frame: "08", persona: "lamin" },
      { href: "/confirmation/virtual", title: "Virtual confirmation", note: "E-bib V1213, run window, upload", frame: "12", persona: "lamin" },
      { href: "/my-entry/upload", title: "Upload my run", note: "Screenshot or link, then checked", persona: "lamin" },
      { href: "/certificate", title: "E-certificate", note: "Once the run is checked", persona: "lamin" },
    ],
  },
  {
    id: "admin",
    title: "Behind the scenes",
    who: "NRIF admin team",
    screens: [
      { href: "/admin", title: "Overview", note: "Entries, fund, channels, 62 Cities" },
      { href: "/admin/payments", title: "Payment matching", note: "Auto-matched, waiting, match by hand", frame: "09" },
      { href: "/admin/entries", title: "Entries", note: "Every participant, waiver and consents" },
      { href: "/admin/bibs", title: "Bib ranges", note: "Per distance, V prefix for virtual", frame: "09" },
      { href: "/admin/messages", title: "Messages", note: "Templates, reminders and the send log", frame: "11" },
      { href: "/admin/campaigns", title: "Campaign links", note: "Source tags and poster QR codes", frame: "01" },
    ],
  },
  {
    id: "help",
    title: "Help",
    who: "Everyone",
    screens: [{ href: "/help", title: "Help, waiver and policies", note: "FAQ, refund and transfer, waiver v1.0" }],
  },
];

export const ALL_SCREENS = JOURNEYS.flatMap((j) => j.screens);
