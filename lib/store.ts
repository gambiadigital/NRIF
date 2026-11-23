"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { eventById, type Currency, type PaymentMethodId, type RaceEvent, type Residence } from "./data";
import { money, raceDayAge, suggested } from "./format";

/*
 * The booking as the participant builds it across the five steps. One booking holds many participants and goes
 * through one payment. Pay first (NRIF, 2026-11-24): step 1 picks everyone's entries, step 2 takes the payment and
 * keeps the server's order (its reference and the token that proves it is theirs), and only then come the names and
 * details. It lives in sessionStorage so a refresh mid-form keeps the answers; once the booking is made the form clears.
 */

export type Phone = { iso: string; digits: string };

export type Participant = {
  id: string;
  isLead: boolean;
  fullName: string;
  dob: string;
  gender: "Female" | "Male" | "";
  eventId: RaceEvent["id"];
  shirt: string;
  bibName: string;
  guardianIsLead: boolean;
  guardian: { name: string; relation: string; phone: Phone };
};

/** The payment, once made: claimed with the payer's own reference, or paid by card. */
export type PaidOrder = {
  id: string;
  token: string;
  reference: string;
  status: "claimed" | "paid";
  method: PaymentMethodId;
  total: number;
  payerReference: string | null;
};

export type Booking = {
  source: string;
  referral: string;
  residence: Residence;
  city: string;
  currency: Currency;
  participants: Participant[];
  contact: {
    phone: Phone;
    email: string;
    town: string;
    emergency: { name: string; relation: string; phone: Phone };
  };
  teamCode: string;
  steps: boolean;
  consents: { waiver: boolean; guardian: boolean; photos: boolean; news: boolean; acceptedAt: string };
  donation: number;
  payMethod: PaymentMethodId;
  order: PaidOrder | null;
};

const blankGuardian = () => ({ name: "", relation: "", phone: { iso: "GM", digits: "" } });

export const newParticipant = (eventId: RaceEvent["id"] = "heritage", isLead = false): Participant => ({
  id: Math.random().toString(36).slice(2, 9),
  isLead,
  fullName: "",
  dob: "",
  gender: "",
  eventId,
  shirt: "",
  bibName: "",
  guardianIsLead: true,
  guardian: blankGuardian(),
});

const blank = (): Booking => ({
  source: "direct",
  referral: "",
  residence: "gambia",
  city: "",
  currency: "GMD",
  participants: [{ ...newParticipant("5k", true), id: "lead" }],
  contact: { phone: { iso: "GM", digits: "" }, email: "", town: "", emergency: { name: "", relation: "", phone: { iso: "GM", digits: "" } } },
  teamCode: "",
  steps: false,
  consents: { waiver: false, guardian: false, photos: false, news: false, acceptedAt: "" },
  donation: 0,
  payMethod: "wave",
  order: null,
});

type Actions = {
  patch: (p: Partial<Booking>) => void;
  patchContact: (p: Partial<Booking["contact"]>) => void;
  patchParticipant: (id: string, p: Partial<Participant>) => void;
  addParticipant: (p: Participant) => void;
  removeParticipant: (id: string) => void;
  setResidence: (r: Residence) => void;
  /** How many people other than the booker are entered in an event (step 1). */
  setOthers: (eventId: RaceEvent["id"], n: number) => void;
  setConsent: (k: keyof Booking["consents"], v: boolean) => void;
  /** Clears the form after the server has the booking, keeping where the visitor came from. */
  reset: () => void;
};

export const useBooking = create<Booking & Actions>()(
  persist(
    (set, get) => ({
      ...blank(),
      patch: (p) => set(p),
      patchContact: (p) => set({ contact: { ...get().contact, ...p } }),
      patchParticipant: (id, p) => set({ participants: get().participants.map((x) => (x.id === id ? { ...x, ...p } : x)) }),
      addParticipant: (p) => set({ participants: [...get().participants, p] }),
      removeParticipant: (id) => set({ participants: get().participants.filter((x) => x.id !== id || x.isLead) }),
      setResidence: (r) => {
        const s = get();
        if (s.residence === r) return;
        const lead = s.participants[0]!;
        const ev = eventById(lead.eventId);
        // Phone codes follow: back home they return to +220 unless a number is already typed.
        const home = (ph: Phone) => (r === "gambia" && !ph.digits ? { ...ph, iso: "GM" } : ph);
        set({
          contact: { ...s.contact, phone: home(s.contact.phone), emergency: { ...s.contact.emergency, phone: home(s.contact.emergency.phone) } },
          residence: r,
          currency: r === "gambia" ? "GMD" : s.currency === "GMD" ? "GBP" : s.currency,
          payMethod: r === "gambia" ? "wave" : "remit",
          donation: 0,
          participants: s.participants.map((p, i) =>
            // The virtual run is only for people abroad; everyone else at home picks between the 5 km and the walk.
            r === "abroad" && i === 0 && ev.kind === "in-person" ? { ...p, eventId: "virtual" } : r === "gambia" && eventById(p.eventId).kind === "virtual" ? { ...p, eventId: i === 0 ? "5k" : "heritage" } : p,
          ),
        });
      },
      setOthers: (eventId, n) => {
        const s = get();
        const others = s.participants.slice(1);
        const have = others.filter((p) => p.eventId === eventId);
        const room = 10 - s.participants.length + have.length;
        const want = Math.max(0, Math.min(n, room));
        let kept = 0;
        const next = others.filter((p) => p.eventId !== eventId || ++kept <= want);
        for (let i = have.length; i < want; i++) next.push(newParticipant(eventId));
        set({ participants: [s.participants[0]!, ...next] });
      },
      setConsent: (k, v) => {
        const c = { ...get().consents, [k]: v };
        if (k === "waiver" && v && !c.acceptedAt) c.acceptedAt = new Date().toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
        set({ consents: c as Booking["consents"] });
      },
      reset: () => {
        const { source, referral } = get();
        set({ ...blank(), source, referral });
      },
    }),
    {
      name: "r4i-booking-v3",
      storage: createJSONStorage(() => sessionStorage),
      skipHydration: true,
      partialize: (s) => {
        const { patch, patchContact, patchParticipant, addParticipant, removeParticipant, setResidence, setOthers, setConsent, reset, ...rest } = s;
        void patch; void patchContact; void patchParticipant; void addParticipant; void removeParticipant; void setResidence; void setOthers; void setConsent; void reset;
        return rest;
      },
    },
  ),
);

/* Derived values. Prices here are for display; the server prices every booking itself. */

export function entryPrice(b: Pick<Booking, "residence" | "currency">, eventId: RaceEvent["id"]) {
  const ev = eventById(eventId);
  return b.residence === "gambia" ? ev.feeGMD : suggested(ev.suggestedGBP, b.currency);
}

export function lineItems(b: Booking) {
  return b.participants.map((p, i) => ({
    id: p.id,
    name: p.fullName || (p.isLead ? "You" : `Person ${i + 1}`),
    first: (p.fullName || "You").split(" ")[0]!,
    event: eventById(p.eventId),
    amount: entryPrice(b, p.eventId),
  }));
}

export function total(b: Booking) {
  return lineItems(b).reduce((a, x) => a + x.amount, 0) + (b.donation || 0);
}

export function fmt(b: Pick<Booking, "currency">, n: number) {
  return money(n, b.currency, { decimals: b.currency !== "GMD" });
}

export function minors(b: Booking) {
  return b.participants.filter((p) => {
    const a = raceDayAge(p.dob);
    return a !== null && a < 18;
  });
}

export function lead(b: Booking) {
  return b.participants[0]!;
}

export const DONATION_PRESETS: Record<string, number[]> = {
  GMD: [100, 250, 500],
  GBP: [5, 10, 25],
  USD: [5, 15, 30],
  EUR: [5, 10, 25],
  SEK: [50, 100, 250],
};

/* Bookings this browser has made, so the visitor can get back to them without signing in. */
export type SavedBooking = { reference: string; key: string; at: number };
const SAVED = "r4i-bookings";
export function saveBooking(b: { reference: string; key: string }) {
  try {
    const list = JSON.parse(localStorage.getItem(SAVED) || "[]") as SavedBooking[];
    localStorage.setItem(SAVED, JSON.stringify([{ ...b, at: Date.now() }, ...list.filter((x) => x.reference !== b.reference)].slice(0, 5)));
  } catch {}
}
export function savedBookings(): SavedBooking[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED) || "[]") as SavedBooking[];
  } catch {
    return [];
  }
}
