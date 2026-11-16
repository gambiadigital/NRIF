import confetti from "canvas-confetti";

const FLAG = ["#D7141A", "#1F3C99", "#135F40", "#ffffff"];

/** A short burst in the flag's colours from both lower corners. */
export function celebrate() {
  if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const base = { colors: FLAG, ticks: 260, gravity: 0.9, scalar: 1.05, disableForReducedMotion: true };
  confetti({ ...base, particleCount: 90, angle: 60, spread: 62, origin: { x: 0, y: 0.85 }, startVelocity: 58 });
  confetti({ ...base, particleCount: 90, angle: 120, spread: 62, origin: { x: 1, y: 0.85 }, startVelocity: 58 });
  setTimeout(() => confetti({ ...base, particleCount: 60, spread: 100, origin: { x: 0.5, y: 0.3 }, startVelocity: 30 }), 380);
}

/** A calendar file for the run, so it lands in any phone's calendar. */
export function downloadIcs({ title, start, end, location, description }: { title: string; start: string; end: string; location: string; description: string }) {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NRIF//Run for Independence//EN",
    "BEGIN:VEVENT",
    `UID:${start}-r4i@nrif.gm`,
    `DTSTAMP:${start}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${title}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${description}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT12H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Run for Independence tomorrow",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "run-for-independence-2027.ics";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
