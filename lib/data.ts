/*
 * Everything the prototype shows: the run, its six events, fees, payment routes, the two storyboard personas and
 * the admin's sample ledger. Names, fees and times are samples from the storyboard, kept in one place so the
 * backend can replace them field by field later.
 */

export const RUN = {
  name: "Run for Independence",
  edition: "2027",
  organiser: "National Research & Innovation Fund",
  short: "NRIF",
  tagline: "One Day, One Nation",
  dateISO: "2027-01-30T07:00:00Z", // The Gambia is UTC+0 all year.
  dateLong: "Saturday 30 January 2027",
  dateShort: "Sat 30 Jan 2027",
  venue: "Independence Stadium",
  venueArea: "Bakau",
  gatesOpen: "05:30",
  kitLock: "Sat 9 Jan 2027",
  racePacks: "Thu 28 and Fri 29 Jan, 10:00 to 17:00",
  racePacksShort: "Thu 28 or Fri 29 Jan",
  virtualWindow: "23 to 31 Jan",
  virtualUploadBy: "Tue 2 Feb",
  goal: 20_000_000,
  raised: 4_213_450,
  entries: 3_412,
  citiesGoal: 62,
  citiesCounted: 41,
  waiverVersion: "v1.0",
  holdDays: 5,
};

export type Residence = "gambia" | "abroad";
export type Currency = "GMD" | "GBP" | "USD" | "EUR" | "SEK";

export type RaceEvent = {
  id: "21k" | "10k" | "5k" | "heritage" | "10k-virtual" | "5k-virtual";
  name: string;
  distance: string;
  km: number;
  minAge: number;
  ageLabel: string;
  kind: "in-person" | "virtual";
  blurb: string;
  detail: string;
  start: string;
  feeGMD: number;
  suggestedGBP: number;
  bibRange: [number, number];
  accent: "ember" | "royal" | "forest" | "sun" | "cobalt";
  image: string;
};

export const EVENTS: RaceEvent[] = [
  {
    id: "21k",
    name: "21K Half marathon",
    distance: "21K",
    km: 21.1,
    minAge: 18,
    ageLabel: "18+",
    kind: "in-person",
    blurb: "Competitive, timed",
    detail: "Chip-timed, with age categories and prizes for the first three in each.",
    start: "06:30",
    feeGMD: 1000,
    suggestedGBP: 30,
    bibRange: [1, 999],
    accent: "ember",
    image: "/media/start-line.webp",
  },
  {
    id: "10k",
    name: "10K",
    distance: "10K",
    km: 10,
    minAge: 16,
    ageLabel: "16+",
    kind: "in-person",
    blurb: "Community run",
    detail: "The coast road and back. Run it, jog it, enjoy it.",
    start: "07:00",
    feeGMD: 500,
    suggestedGBP: 20,
    bibRange: [1000, 3999],
    accent: "royal",
    image: "/media/hero-coast.webp",
  },
  {
    id: "5k",
    name: "5K",
    distance: "5K",
    km: 5,
    minAge: 12,
    ageLabel: "12+",
    kind: "in-person",
    blurb: "Community run",
    detail: "A fast, friendly loop for first-timers, schools and teams.",
    start: "07:30",
    feeGMD: 300,
    suggestedGBP: 15,
    bibRange: [4000, 6999],
    accent: "forest",
    image: "/media/team.webp",
  },
  {
    id: "heritage",
    name: "1.965K Heritage walk",
    distance: "1.965K",
    km: 1.965,
    minAge: 0,
    ageLabel: "All ages",
    kind: "in-person",
    blurb: "Under 18s with a guardian",
    detail: "1.965 kilometres, one for every year since 1965. Families, elders and everyone in between.",
    start: "08:00",
    feeGMD: 200,
    suggestedGBP: 10,
    bibRange: [7000, 8999],
    accent: "sun",
    image: "/media/family-walk.webp",
  },
  {
    id: "10k-virtual",
    name: "10K Virtual",
    distance: "10K",
    km: 10,
    minAge: 16,
    ageLabel: "16+",
    kind: "virtual",
    blurb: "Run anywhere",
    detail: "Any day, 23 to 31 Jan. Record it on Strava, Pacer or any GPS app.",
    start: "Any day",
    feeGMD: 500,
    suggestedGBP: 20,
    bibRange: [1000, 3999],
    accent: "cobalt",
    image: "/media/london-virtual.webp",
  },
  {
    id: "5k-virtual",
    name: "5K Virtual",
    distance: "5K",
    km: 5,
    minAge: 12,
    ageLabel: "12+",
    kind: "virtual",
    blurb: "Run anywhere",
    detail: "Any day, 23 to 31 Jan. Walk it or run it, wherever you are.",
    start: "Any day",
    feeGMD: 300,
    suggestedGBP: 15,
    bibRange: [4000, 6999],
    accent: "cobalt",
    image: "/media/shoes.webp",
  },
];

export const eventById = (id: string) => EVENTS.find((e) => e.id === id) ?? EVENTS[1];

export const CURRENCIES: { code: Currency; symbol: string; label: string; perGBP: number }[] = [
  { code: "GBP", symbol: "£", label: "British pound", perGBP: 1 },
  { code: "USD", symbol: "$", label: "US dollar", perGBP: 1.27 },
  { code: "EUR", symbol: "€", label: "Euro", perGBP: 1.17 },
  { code: "SEK", symbol: "kr", label: "Swedish krona", perGBP: 13.4 },
];

export const TIMELINE = [
  { time: "05:30", label: "Gates open", note: "Bag drop and warm-up on the track" },
  { time: "06:30", label: "21K start", note: "Half marathon, chip-timed" },
  { time: "07:00", label: "10K start", note: "Community run" },
  { time: "07:30", label: "5K start", note: "Community run" },
  { time: "08:00", label: "Heritage walk", note: "1.965K, all ages" },
  { time: "10:00", label: "Awards", note: "On the main stage" },
];

export const TOWNS = [
  "Serrekunda",
  "Bakau",
  "Banjul",
  "Brikama",
  "Kololi",
  "Fajara",
  "Kanifing",
  "Lamin",
  "Sukuta",
  "Brusubi",
  "Bijilo",
  "Farafenni",
  "Soma",
  "Janjanbureh",
  "Basse",
  "Kerewan",
  "Mansa Konko",
  "Gunjur",
  "Tanji",
];

export const CITIES = [
  { city: "London", country: "United Kingdom", count: 214, lat: 51.5, lng: -0.13 },
  { city: "Manchester", country: "United Kingdom", count: 37, lat: 53.48, lng: -2.24 },
  { city: "Birmingham", country: "United Kingdom", count: 29, lat: 52.49, lng: -1.9 },
  { city: "New York", country: "United States", count: 96, lat: 40.71, lng: -74.0 },
  { city: "Atlanta", country: "United States", count: 71, lat: 33.75, lng: -84.39 },
  { city: "Minneapolis", country: "United States", count: 18, lat: 44.98, lng: -93.27 },
  { city: "Raleigh", country: "United States", count: 22, lat: 35.78, lng: -78.64 },
  { city: "Washington", country: "United States", count: 31, lat: 38.9, lng: -77.04 },
  { city: "Toronto", country: "Canada", count: 14, lat: 43.65, lng: -79.38 },
  { city: "Stockholm", country: "Sweden", count: 43, lat: 59.33, lng: 18.07 },
  { city: "Oslo", country: "Norway", count: 12, lat: 59.91, lng: 10.75 },
  { city: "Copenhagen", country: "Denmark", count: 9, lat: 55.68, lng: 12.57 },
  { city: "Berlin", country: "Germany", count: 26, lat: 52.52, lng: 13.4 },
  { city: "Hamburg", country: "Germany", count: 11, lat: 53.55, lng: 9.99 },
  { city: "Barcelona", country: "Spain", count: 33, lat: 41.39, lng: 2.17 },
  { city: "Madrid", country: "Spain", count: 15, lat: 40.42, lng: -3.7 },
  { city: "Paris", country: "France", count: 19, lat: 48.86, lng: 2.35 },
  { city: "Amsterdam", country: "Netherlands", count: 8, lat: 52.37, lng: 4.9 },
  { city: "Brussels", country: "Belgium", count: 7, lat: 50.85, lng: 4.35 },
  { city: "Milan", country: "Italy", count: 10, lat: 45.46, lng: 9.19 },
  { city: "Dakar", country: "Senegal", count: 48, lat: 14.69, lng: -17.45 },
  { city: "Lagos", country: "Nigeria", count: 13, lat: 6.52, lng: 3.38 },
  { city: "Accra", country: "Ghana", count: 11, lat: 5.6, lng: -0.19 },
  { city: "Freetown", country: "Sierra Leone", count: 6, lat: 8.48, lng: -13.23 },
  { city: "Dubai", country: "United Arab Emirates", count: 17, lat: 25.2, lng: 55.27 },
  { city: "Doha", country: "Qatar", count: 9, lat: 25.29, lng: 51.53 },
  { city: "Abu Dhabi", country: "United Arab Emirates", count: 5, lat: 24.45, lng: 54.38 },
];

export const BANJUL = { lat: 13.45, lng: -16.58 };

export const PAYMENT_METHODS = {
  wave: { id: "wave", name: "Wave", note: "Pay in the Wave app", mode: "instant" as const, home: true },
  yonna: { id: "yonna", name: "Yonna", note: "Transfer with a reference code", mode: "reference" as const, home: true },
  bank: { id: "bank", name: "Bank transfer", note: "Any Gambian bank, with a reference code", mode: "reference" as const, home: true },
  remit: { id: "remit", name: "Remitly or ACE", note: "Send to NRIF's Yonna account", mode: "reference" as const, home: false },
};
export type PaymentMethodId = keyof typeof PAYMENT_METHODS;

export const SHIRT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
export const RELATIONSHIPS = ["Brother", "Sister", "Mother", "Father", "Husband", "Wife", "Son", "Daughter", "Friend", "Colleague", "Other"];

export const TEAMS: Record<string, { name: string; kind: "school" | "company" | "club"; members: number }> = {
  "GSS-2027": { name: "Gambia Senior Secondary School", kind: "school", members: 64 },
  "NRIF-STAFF": { name: "NRIF Staff", kind: "company", members: 38 },
  "UTG-RUN": { name: "University of The Gambia Running Club", kind: "club", members: 121 },
  "BAKAU-RC": { name: "Bakau Road Runners", kind: "company", members: 22 },
};

export const CHANNELS = [
  { tag: "instagram", label: "Instagram", entries: 1084, color: "#2a3181" },
  { tag: "facebook", label: "Facebook", entries: 902, color: "#1f3c99" },
  { tag: "poster", label: "Posters and QR", entries: 516, color: "#135f40" },
  { tag: "tiktok", label: "TikTok", entries: 388, color: "#0b1b3a" },
  { tag: "referral", label: "Share links", entries: 297, color: "#f2b233" },
  { tag: "x", label: "X", entries: 121, color: "#5d6577" },
  { tag: "direct", label: "Direct", entries: 104, color: "#cfc8b9" },
];

export const FAQS = [
  {
    q: "Can I enter if I live abroad?",
    a: "Yes. Pick Abroad at the first step and you will see suggested donations in your currency. Every event stays open to you, so if you are home in January you can run in person, or join the 10K or 5K virtual from wherever you are.",
  },
  {
    q: "How do I register my children?",
    a: "Add them to your booking as extra participants. When a date of birth is under 18, a guardian section opens and you accept the waiver for them. Under 18s can enter the Heritage walk at any age, the 5K from 12 and the 10K from 16.",
  },
  {
    q: "Which payment methods can I use?",
    a: "Wave, Yonna and bank transfer in The Gambia. From abroad, send with Remitly or ACE to NRIF's Yonna account. Methods that cannot confirm straight away give you a reference code and hold your place for five days.",
  },
  {
    q: "When do I get my bib number?",
    a: "As soon as your payment is matched. You see it on screen, and we send it by text and email with a QR code for race-pack collection.",
  },
  {
    q: "Where do I collect my race pack?",
    a: "At Independence Stadium on Thursday 28 or Friday 29 January, 10:00 to 17:00. Show the QR code from your email. One person can collect for the whole booking.",
  },
  {
    q: "Can I change my T-shirt size or the name on my bib?",
    a: "Yes, from My entry, until Saturday 9 January 2027. After that the kit goes to print.",
  },
  {
    q: "What is the steps challenge?",
    a: "Tick the box when you register and you get a code friends and family can give to. Every step you log adds to the Endowment Fund.",
  },
  {
    q: "Can I get a refund or give my place to someone else?",
    a: "You can transfer your place to someone else free of charge until 9 January. Refunds are given if the run is cancelled. The full policy is in Help.",
  },
];

/* The two storyboard personas, ready to load into the booking. */
export const PERSONAS = {
  fatou: {
    key: "fatou" as const,
    name: "Fatou Jallow",
    first: "Fatou",
    place: "Serrekunda, The Gambia",
    summary: "Registers herself for the 10K and her two children for the Heritage walk",
    image: "/media/runner-woman.webp",
  },
  lamin: {
    key: "lamin" as const,
    name: "Lamin Touray",
    first: "Lamin",
    place: "London, United Kingdom",
    summary: "Joins the 10K Virtual and pays a donation from abroad",
    image: "/media/runner-man.webp",
  },
};
export type PersonaKey = keyof typeof PERSONAS;

/* Admin ledger: the four storyboard rows first, then a realistic tail. */
export type PaymentRow = {
  ref: string;
  via: string;
  amount: string;
  entry: string;
  people: number;
  status: "auto" | "matched" | "waiting" | "unmatched";
  day?: number;
  bibs?: string;
  received: string;
  event: string;
};

export const PAYMENTS: PaymentRow[] = [
  { ref: "WV-88231", via: "Wave", amount: "GMD 1,150", entry: "Fatou Jallow", people: 3, status: "auto", bibs: "1047 · 7012 · 7013", received: "14:36", event: "10K + 2 Heritage" },
  { ref: "RFI-7Q4K", via: "Remitly to Yonna", amount: "£20.00", entry: "Lamin Touray", people: 1, status: "matched", bibs: "V1213", received: "15:02", event: "10K Virtual" },
  { ref: "RFI-3H2P", via: "Bank transfer", amount: "GMD 300", entry: "Isatou Sowe", people: 1, status: "waiting", day: 2, received: "—", event: "5K" },
  { ref: "—", via: "Yonna", amount: "GMD 500", entry: "No reference", people: 0, status: "unmatched", received: "15:10", event: "—" },
  { ref: "WV-88244", via: "Wave", amount: "GMD 500", entry: "Ousman Ceesay", people: 1, status: "auto", bibs: "1048", received: "15:14", event: "10K" },
  { ref: "RFI-9MX2", via: "ACE to Yonna", amount: "$45.00", entry: "Binta Darboe", people: 2, status: "waiting", day: 1, received: "—", event: "5K Virtual ×2" },
  { ref: "RFI-K2D7", via: "Yonna", amount: "GMD 1,000", entry: "Modou Njie", people: 1, status: "matched", bibs: "0219", received: "13:51", event: "21K" },
  { ref: "RFI-T5RA", via: "Bank transfer", amount: "GMD 900", entry: "Haddy Bah", people: 3, status: "waiting", day: 4, received: "—", event: "5K + 2 Heritage" },
  { ref: "—", via: "Bank transfer", amount: "GMD 200", entry: "No reference", people: 0, status: "unmatched", received: "12:20", event: "—" },
  { ref: "WV-88197", via: "Wave", amount: "GMD 700", entry: "Kebba Sanneh", people: 2, status: "auto", bibs: "1039 · 7006", received: "12:02", event: "10K + Heritage" },
  { ref: "RFI-Q8LN", via: "Remitly to Yonna", amount: "€25.00", entry: "Awa Camara", people: 1, status: "matched", bibs: "V1207", received: "11:47", event: "10K Virtual" },
  { ref: "RFI-ZP3W", via: "Yonna", amount: "GMD 300", entry: "Lamin Jobe", people: 1, status: "waiting", day: 3, received: "—", event: "5K" },
];

export const ACTIVITY = [
  { t: "15:14", text: "WV-88244 auto-matched. Bib 1048 issued. SMS and email sent." },
  { t: "15:10", text: "Yonna receipt GMD 500 arrived with no reference. Flagged for matching by hand." },
  { t: "15:02", text: "RFI-7Q4K matched to a Yonna receipt. E-bib V1213 issued. SMS and email sent." },
  { t: "14:36", text: "WV-88231 auto-matched. Bibs 1047, 7012, 7013 issued. SMS and email sent." },
  { t: "14:10", text: "RFI-3H2P still waiting. Reminder SMS due on day 3." },
  { t: "13:51", text: "RFI-K2D7 matched by Mariama C. Bib 0219 issued." },
];

export const DAILY_ENTRIES = [
  12, 18, 15, 22, 31, 28, 26, 40, 44, 39, 52, 61, 58, 49, 66, 72, 81, 77, 69, 88, 96, 104, 99, 92, 118, 126, 131, 122, 140, 128,
];

export const ENTRIES = [
  { bib: "1047", name: "Fatou Jallow", event: "10K", age: 35, cat: "Women 35 to 39", res: "The Gambia", town: "Serrekunda", status: "Paid", src: "instagram", team: "—", size: "M" },
  { bib: "7012", name: "Awa Jallow", event: "1.965K Heritage walk", age: 14, cat: "Under 18", res: "The Gambia", town: "Serrekunda", status: "Paid", src: "instagram", team: "—", size: "S" },
  { bib: "7013", name: "Musa Jallow", event: "1.965K Heritage walk", age: 9, cat: "Under 18", res: "The Gambia", town: "Serrekunda", status: "Paid", src: "instagram", team: "—", size: "XS" },
  { bib: "V1213", name: "Lamin Touray", event: "10K Virtual", age: 33, cat: "Men 30 to 34", res: "London", town: "London", status: "Paid", src: "facebook", team: "—", size: "L" },
  { bib: "—", name: "Isatou Sowe", event: "5K", age: 27, cat: "Women 25 to 29", res: "The Gambia", town: "Brikama", status: "Pending", src: "poster", team: "GSS-2027", size: "M" },
  { bib: "1048", name: "Ousman Ceesay", event: "10K", age: 41, cat: "Men 40 to 44", res: "The Gambia", town: "Bakau", status: "Paid", src: "tiktok", team: "—", size: "XL" },
  { bib: "0219", name: "Modou Njie", event: "21K Half marathon", age: 29, cat: "Men 25 to 29", res: "The Gambia", town: "Banjul", status: "Paid", src: "direct", team: "UTG-RUN", size: "M" },
  { bib: "—", name: "Binta Darboe", event: "5K Virtual", age: 36, cat: "Women 35 to 39", res: "Atlanta", town: "Atlanta", status: "Pending", src: "referral", team: "—", size: "M" },
  { bib: "1039", name: "Kebba Sanneh", event: "10K", age: 52, cat: "Men 50 to 54", res: "The Gambia", town: "Kololi", status: "Paid", src: "facebook", team: "NRIF-STAFF", size: "L" },
  { bib: "V1207", name: "Awa Camara", event: "10K Virtual", age: 31, cat: "Women 30 to 34", res: "Barcelona", town: "Barcelona", status: "Paid", src: "instagram", team: "—", size: "S" },
  { bib: "—", name: "Haddy Bah", event: "5K", age: 44, cat: "Women 40 to 44", res: "The Gambia", town: "Lamin", status: "Pending", src: "poster", team: "—", size: "L" },
  { bib: "4102", name: "Alieu Jammeh", event: "5K", age: 19, cat: "Men 18 to 24", res: "The Gambia", town: "Sukuta", status: "Paid", src: "tiktok", team: "GSS-2027", size: "M" },
];
