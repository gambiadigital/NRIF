# Run for Independence 2027 · NRIF

The registration platform for the National Research & Innovation Fund's Run for Independence, built as a complete
clickable UI prototype from the storyboard *Registration from User POV*. Every frame in the storyboard has a working
screen; there is no backend yet, so names, fees, times and payments are samples held in the browser.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. A navy **Prototype** pill floats over every screen: it lists all 25 screens grouped by
journey, switches between the two personas (Fatou in Serrekunda, Lamin in London, or a blank form), and `[` / `]` step
through the storyboard in order. `/flow` shows each storyboard frame beside the screen that answers it.

## Screens

| Journey | Route | Storyboard frame |
| --- | --- | --- |
| Landing page (video hero, countdown, events, race day, 62 Cities, steps, kit, FAQ) | `/` | 02 |
| Landing from a share link (`?src=` and `?ref=`) | `/?src=instagram&ref=1047` | 01 |
| Social post and printable poster with source-tagged QR | `/campaign` | 01 |
| Step 1: where you live, then the event | `/register` | 03 |
| Step 2: your details, emergency contact, race kit | `/register/details` | 04 |
| Step 3: participants, guardians, team code, steps challenge | `/register/participants` | 05 |
| Step 4: waiver and consents | `/register/waiver` | 06 |
| Step 5: payment and donation | `/register/payment` | 07 |
| Paying with Wave | `/register/wave` | 07 |
| Payment pending with reference code | `/register/pending` | 08 |
| Confirmation, bib pop-ups, share card | `/confirmation` | 10 |
| Text and email | `/messages` | 11 |
| Virtual confirmation and e-bib | `/confirmation/virtual` | 12 |
| My entry (code sign-in, bibs, QR, kit, transfer) | `/my-entry` | — |
| Upload a virtual run | `/my-entry/upload` | — |
| E-certificate | `/certificate` | — |
| Steps challenge fundraising page | `/steps/SC-1047` | — |
| Help, waiver v1.0, refund and transfer policy | `/help` | — |
| Admin: overview, payment matching, entries, bib ranges, messages, campaign links | `/admin/*` | 09 |

## How it is built

- Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS 4.
- Radix primitives for dialogs, popovers, tabs and accordions; Motion for animation; Lenis for smooth scrolling on the
  landing page; Phosphor icons; Sonner toasts; canvas-confetti; qrcode.react; html-to-image for the e-bib, share card and
  certificate downloads.
- Every form control is custom: phone fields format themselves (The Gambia: `87 701 2345`) and take pasted `+220…`
  numbers, dates are typed as DD / MM / YYYY, and there is no native select or date picker.
- Fonts are self-hosted variable fonts in `app/fonts`: Google Sans Flex for reading, Archivo (narrowed and italic, like
  the logo) for the race voice, Google Sans Code for references and bib codes.
- The booking lives in a Zustand store (`lib/store.ts`) saved to sessionStorage. Sample data, fees, bib ranges and the
  admin ledger are in `lib/data.ts`; the waiver and policy text in `lib/content.ts`.
- Photography and the hero clips were generated for this project and live in `public/media`. The 62 Cities map is a
  dot matrix pre-computed from Natural Earth land (`lib/worldDots.ts`), so the page ships no map library.

## What the backend needs to replace

The grey "System" notes in the storyboard map to these seams in the code: source tags (`booking.source`), age category
and under-18 checks (`lib/format.ts`), waiver version and acceptance time (`booking.consents`), reference codes and the
five-day hold (`/register/pending`), payment matching and bib issue (`/admin/payments`, `/admin/bibs`), and the SMS and
email templates with their 160-character limit (`lib/messages.ts`, `/admin/messages`).
