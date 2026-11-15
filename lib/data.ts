/*
 * The run's fixed facts and the presentation side of each event (photos, copy, colours). Fees, start times and bib
 * ranges come from the database at runtime (see useLiveEvents in lib/client.ts); the numbers here are only the
 * defaults shown before that arrives.
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
  citiesGoal: 62,
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
  open?: boolean;
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
  { city: "London", country: "United Kingdom", lat: 51.5, lng: -0.13 },
  { city: "Manchester", country: "United Kingdom", lat: 53.48, lng: -2.24 },
  { city: "Birmingham", country: "United Kingdom", lat: 52.49, lng: -1.9 },
  { city: "New York", country: "United States", lat: 40.71, lng: -74.0 },
  { city: "Atlanta", country: "United States", lat: 33.75, lng: -84.39 },
  { city: "Minneapolis", country: "United States", lat: 44.98, lng: -93.27 },
  { city: "Raleigh", country: "United States", lat: 35.78, lng: -78.64 },
  { city: "Washington", country: "United States", lat: 38.9, lng: -77.04 },
  { city: "Toronto", country: "Canada", lat: 43.65, lng: -79.38 },
  { city: "Stockholm", country: "Sweden", lat: 59.33, lng: 18.07 },
  { city: "Oslo", country: "Norway", lat: 59.91, lng: 10.75 },
  { city: "Copenhagen", country: "Denmark", lat: 55.68, lng: 12.57 },
  { city: "Berlin", country: "Germany", lat: 52.52, lng: 13.4 },
  { city: "Hamburg", country: "Germany", lat: 53.55, lng: 9.99 },
  { city: "Barcelona", country: "Spain", lat: 41.39, lng: 2.17 },
  { city: "Madrid", country: "Spain", lat: 40.42, lng: -3.7 },
  { city: "Paris", country: "France", lat: 48.86, lng: 2.35 },
  { city: "Amsterdam", country: "Netherlands", lat: 52.37, lng: 4.9 },
  { city: "Brussels", country: "Belgium", lat: 50.85, lng: 4.35 },
  { city: "Milan", country: "Italy", lat: 45.46, lng: 9.19 },
  { city: "Dakar", country: "Senegal", lat: 14.69, lng: -17.45 },
  { city: "Lagos", country: "Nigeria", lat: 6.52, lng: 3.38 },
  { city: "Accra", country: "Ghana", lat: 5.6, lng: -0.19 },
  { city: "Freetown", country: "Sierra Leone", lat: 8.48, lng: -13.23 },
  { city: "Dubai", country: "United Arab Emirates", lat: 25.2, lng: 55.27 },
  { city: "Doha", country: "Qatar", lat: 25.29, lng: 51.53 },
  { city: "Abu Dhabi", country: "United Arab Emirates", lat: 24.45, lng: 54.38 },
];

export const BANJUL = { lat: 13.45, lng: -16.58 };

export const PAYMENT_METHODS = {
  wave: { id: "wave", name: "Wave", note: "Pay in the Wave app", home: true, abroad: false },
  yonna: { id: "yonna", name: "Yonna", note: "Yonna Islamic Microfinance", home: true, abroad: false },
  ecobank: { id: "ecobank", name: "Ecobank", note: "Bank transfer or scan with your banking app", home: true, abroad: true },
  remit: { id: "remit", name: "Remitly or ACE", note: "Send to NRIF's Yonna or Wave number", home: false, abroad: true },
};
export type PaymentMethodId = keyof typeof PAYMENT_METHODS;

export const SHIRT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
export const RELATIONSHIPS = ["Brother", "Sister", "Mother", "Father", "Husband", "Wife", "Son", "Daughter", "Friend", "Colleague", "Other"];

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
    a: "Wave, Yonna or Ecobank in The Gambia. From abroad, send with Remitly or ACE to NRIF's Yonna or Wave number, or transfer to NRIF's Ecobank account. You get a reference code to quote with your payment, and your place is held for five days while we match it.",
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
