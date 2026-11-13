import type { Booking } from "./store";
import { eventById, RUN } from "./data";

/* The texts NRIF sends. Each SMS stays under 160 characters with its link, so it goes as one message on every network. */

const LINK = "rfi.gm/e/7Q4K"; // short link, 13 characters

export function smsThread(b: Booking) {
  const lead = b.participants[0]!;
  const first = lead.fullName.split(" ")[0] || "runner";
  const ev = eventById(lead.eventId);
  const bib = b.bibs[lead.id] ?? "1047";
  const others = b.participants.slice(1).map((p) => b.bibs[p.id]).filter(Boolean);
  const virtual = ev.kind === "virtual";

  const messages = virtual
    ? [
        { day: "Wed 21 Oct, 09:12", text: `Run for Independence: You're in, ${first}. ${ev.name}, e-bib ${bib}. Run any day 23-31 Jan, upload by 2 Feb. Your e-bib: ${LINK}`, note: "Confirmation" },
        { day: "Sat 23 Jan, 07:00", text: `The run window is open, ${first}. Run your ${ev.distance} any day to 31 Jan and upload a screenshot or link: ${LINK}`, note: "Window opens" },
        { day: "Sun 31 Jan, 18:00", text: `Last day to run your ${ev.distance}, ${first}. Uploads close Tue 2 Feb. Thank you for running from ${b.contact.town || "abroad"}.`, note: "Last day" },
      ]
    : [
        { day: "Tue 20 Oct, 14:36", text: `Run for Independence: You're in, ${first}. ${ev.distance}, bib ${bib}. Sat 30 Jan, ${ev.start} start, Independence Stadium. Day plan and race pack: ${LINK}`, note: "Confirmation" },
        {
          day: "Sat 23 Jan, 09:00",
          text: `7 days to go. Collect race packs${others.length ? ` for bibs ${[bib, ...others].join(", ")}` : ""} on Thu 28 or Fri 29 Jan, 10:00-17:00. Show the QR code in your email.`,
          note: "Reminder, 7 days before",
        },
        { day: "Fri 29 Jan, 18:00", text: `Tomorrow. Gates open 05:30, ${ev.distance} starts ${ev.start}.${others.length ? " Heritage walk 08:00." : ""} Bring water and your bib. See you at Independence Stadium.`, note: "Reminder, 1 day before" },
      ];
  return messages.map((m) => ({ ...m, chars: m.text.length }));
}

export const RACE_PLAN = [
  { t: "05:30", l: "Gates open" },
  { t: "06:30", l: "21K start" },
  { t: "07:00", l: "10K start" },
  { t: "07:30", l: "5K start" },
  { t: "08:00", l: "Heritage walk" },
  { t: "10:00", l: "Awards" },
];

export { RUN };
