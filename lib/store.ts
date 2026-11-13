"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { eventById, RUN, type Currency, type PaymentMethodId, type PersonaKey, type RaceEvent, type Residence } from "./data";
import { money, raceDayAge, suggested } from "./format";

/*
 * The booking, as the participant builds it across the five steps. One booking holds many participants and goes
 * through one payment (storyboard frame 05). The prototype starts on Fatou's booking so every screen has something
 * to show; the prototype menu switches to Lamin or to a blank form.
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

export type Booking = {
  persona: PersonaKey | "blank";
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
  reference: string;
  status: "draft" | "pending" | "paid";
  bibs: Record<string, string>;
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

export const FATOU: Booking = {
  persona: "fatou",
  source: "instagram",
  referral: "",
  residence: "gambia",
  city: "",
  currency: "GMD",
  participants: [
    { id: "fatou", isLead: true, fullName: "Fatou Jallow", dob: "12/03/1991", gender: "Female", eventId: "10k", shirt: "M", bibName: "FATOU", guardianIsLead: true, guardian: blankGuardian() },
    { id: "awa", isLead: false, fullName: "Awa Jallow", dob: "08/06/2012", gender: "Female", eventId: "heritage", shirt: "S", bibName: "AWA", guardianIsLead: true, guardian: blankGuardian() },
    { id: "musa", isLead: false, fullName: "Musa Jallow", dob: "21/09/2017", gender: "Male", eventId: "heritage", shirt: "XS", bibName: "MUSA", guardianIsLead: true, guardian: blankGuardian() },
  ],
  contact: {
    phone: { iso: "GM", digits: "877012345" },
    email: "fatou@example.com",
    town: "Serrekunda",
    emergency: { name: "Ebrima Jallow", relation: "Brother", phone: { iso: "GM", digits: "877654321" } },
  },
  teamCode: "",
  steps: true,
  consents: { waiver: true, guardian: true, photos: true, news: false, acceptedAt: "20 Oct 2026, 14:32" },
  donation: 250,
  payMethod: "wave",
  reference: "WV-88231",
  status: "paid",
  bibs: { fatou: "1047", awa: "7012", musa: "7013" },
};

export const LAMIN: Booking = {
  persona: "lamin",
  source: "facebook",
  referral: "",
  residence: "abroad",
  city: "London, United Kingdom",
  currency: "GBP",
  participants: [
    { id: "lamin", isLead: true, fullName: "Lamin Touray", dob: "04/11/1993", gender: "Male", eventId: "10k-virtual", shirt: "L", bibName: "LAMIN", guardianIsLead: true, guardian: blankGuardian() },
  ],
  contact: {
    phone: { iso: "GB", digits: "7911123456" },
    email: "lamin@example.com",
    town: "London",
    emergency: { name: "Mariama Touray", relation: "Sister", phone: { iso: "GM", digits: "873456789" } },
  },
  teamCode: "",
  steps: false,
  consents: { waiver: true, guardian: false, photos: true, news: false, acceptedAt: "20 Oct 2026, 23:59" },
  donation: 0,
  payMethod: "remit",
  reference: "RFI-7Q4K",
  status: "pending",
  bibs: { lamin: "V1213" },
};

export const BLANK: Booking = {
  persona: "blank",
  source: "direct",
  referral: "",
  residence: "gambia",
  city: "",
  currency: "GMD",
  participants: [{ ...newParticipant("10k", true), id: "lead" }],
  contact: { phone: { iso: "GM", digits: "" }, email: "", town: "", emergency: { name: "", relation: "", phone: { iso: "GM", digits: "" } } },
  teamCode: "",
  steps: false,
  consents: { waiver: false, guardian: false, photos: false, news: false, acceptedAt: "" },
  donation: 0,
  payMethod: "wave",
  reference: "RFI-8C2M",
  status: "draft",
  bibs: {},
};

type Actions = {
  patch: (p: Partial<Booking>) => void;
  patchContact: (p: Partial<Booking["contact"]>) => void;
  patchParticipant: (id: string, p: Partial<Participant>) => void;
  addParticipant: (p: Participant) => void;
  removeParticipant: (id: string) => void;
  setResidence: (r: Residence) => void;
  setConsent: (k: keyof Booking["consents"], v: boolean) => void;
  load: (key: PersonaKey | "blank") => void;
};

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

export const useBooking = create<Booking & Actions>()(
  persist(
    (set, get) => ({
      ...clone(FATOU),
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
        set({
          residence: r,
          currency: r === "gambia" ? "GMD" : s.currency === "GMD" ? "GBP" : s.currency,
          payMethod: r === "gambia" ? "wave" : "remit",
          donation: 0,
          participants: s.participants.map((p, i) =>
            i === 0 ? { ...p, eventId: r === "abroad" && ev.kind === "in-person" ? "10k-virtual" : r === "gambia" && ev.kind === "virtual" ? "10k" : p.eventId } : p,
          ),
        });
      },
      setConsent: (k, v) => {
        const c = { ...get().consents, [k]: v };
        if (k === "waiver" && v && !c.acceptedAt) c.acceptedAt = "Today, " + new Date().toTimeString().slice(0, 5);
        set({ consents: c as Booking["consents"] });
      },
      load: (key) => set(clone(key === "fatou" ? FATOU : key === "lamin" ? LAMIN : BLANK)),
    }),
    {
      name: "r4i-booking",
      storage: createJSONStorage(() => sessionStorage),
      skipHydration: true,
      partialize: (s) => {
        const { patch, patchContact, patchParticipant, addParticipant, removeParticipant, setResidence, setConsent, load, ...rest } = s;
        void patch; void patchContact; void patchParticipant; void addParticipant; void removeParticipant; void setResidence; void setConsent; void load;
        return rest;
      },
    },
  ),
);

/* Derived values, kept as plain functions so any screen can use them. */

export function entryPrice(b: Booking, eventId: RaceEvent["id"]) {
  const ev = eventById(eventId);
  return b.residence === "gambia" ? ev.feeGMD : suggested(ev.suggestedGBP, b.currency);
}

export function lineItems(b: Booking) {
  return b.participants.map((p) => ({
    id: p.id,
    name: p.fullName || (p.isLead ? "You" : "New participant"),
    first: (p.fullName || "You").split(" ")[0]!,
    event: eventById(p.eventId),
    amount: entryPrice(b, p.eventId),
  }));
}

export function total(b: Booking) {
  return lineItems(b).reduce((a, x) => a + x.amount, 0) + (b.donation || 0);
}

export function fmt(b: Booking, n: number) {
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

export function isVirtualOnly(b: Booking) {
  return b.participants.every((p) => eventById(p.eventId).kind === "virtual");
}

export const DONATION_PRESETS: Record<string, number[]> = {
  GMD: [100, 250, 500],
  GBP: [5, 10, 25],
  USD: [5, 15, 30],
  EUR: [5, 10, 25],
  SEK: [50, 100, 250],
};

export const RACE = RUN;
