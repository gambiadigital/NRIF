"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { ArrowSquareOut } from "@phosphor-icons/react";
import { ECOBANK_QR } from "@/components/register/PayMethods";
import type { PaymentMethodId } from "@/lib/data";

/*
 * How to pay NRIF by each method, before registering (pay first). There is no booking reference yet, so payers put
 * their own name in any reference box and keep the transaction reference from their receipt: they type it in next.
 */

export type PaySettings = { wave_number?: string; yonna_number?: string; ecobank_account?: string; ecobank_name?: string; wave_link?: string };

export const WAVE_LINK_FALLBACK = "https://pay.wave.com/m/M_gm_CedMPBz-cNJ4/c/gm/";

export function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="space-y-3">
      {items.map((s, i) => (
        <li key={i} className="flex items-start gap-3 text-[0.9375rem] text-navy">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-cobalt text-xs font-bold text-white">{i + 1}</span>
          <span>{s}</span>
        </li>
      ))}
    </ol>
  );
}

export function QrTile({ children, caption }: { children: ReactNode; caption: string }) {
  return (
    <div className="mx-auto flex w-fit flex-col items-center gap-2">
      <div className="rounded-2xl bg-[#f0f0f0] p-3 ring-1 ring-line">{children}</div>
      <span className="text-xs text-muted">{caption}</span>
    </div>
  );
}

/** What the payer types after paying, per method: the label, where to find it, and whether we need the paying number. */
export const PAYER_REF: Record<Exclude<PaymentMethodId, "card">, { label: string; hint: string; placeholder: string; from: "required" | "optional" | null; fromLabel: string }> = {
  wave: { label: "Wave transaction ID", hint: "On the receipt in the Wave app, under the payment.", placeholder: "e.g. T_8F3K2Q91", from: "required", fromLabel: "The Wave number you paid from" },
  yonna: { label: "Yonna transaction ID", hint: "In the confirmation message from Yonna.", placeholder: "e.g. YN24113091", from: "optional", fromLabel: "The Yonna number you paid from" },
  ecobank: { label: "Transaction reference", hint: "On your transfer receipt, or in your banking app.", placeholder: "e.g. FT24113ABC12", from: null, fromLabel: "" },
  remit: { label: "Remitly or ACE reference number", hint: "In the confirmation from Remitly or ACE.", placeholder: "e.g. RM 4321 8765", from: "optional", fromLabel: "Your phone number" },
};

export function PayHow({ method, amount, abroad, settings }: { method: Exclude<PaymentMethodId, "card">; amount: string; abroad: boolean; settings: PaySettings | null | undefined }) {
  const waveLink = settings?.wave_link || WAVE_LINK_FALLBACK;
  const waveNumber = settings?.wave_number || "+220 83 379 6680";
  const yonnaNumber = settings?.yonna_number || "+220 83 379 6680";
  const ecobankAccount = settings?.ecobank_account || "6240050636";
  const ecobankName = settings?.ecobank_name || "National Research and Innovation Fund";

  if (method === "wave")
    return (
      <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-[1fr_auto]">
        <div>
          <Steps
            items={[
              <>Tap <b>Open Wave</b>, or scan the code with the Wave app.</>,
              <>Pay <b>{amount}</b> to National Research and Innovation Fund.</>,
              <>Keep the receipt: you type its <b>transaction ID</b> below.</>,
            ]}
          />
          <p className="mt-3 text-sm text-muted">
            Or send it in Wave to <b className="text-navy">{waveNumber}</b>.
          </p>
          <a
            href={waveLink}
            target="_blank"
            rel="noreferrer"
            className="mt-5 flex h-[3.25rem] w-full items-center justify-center gap-2.5 rounded-full bg-[#1dc3f3] font-semibold text-navy transition-colors hover:bg-[#12b0de]"
          >
            <ArrowSquareOut weight="bold" className="size-5" /> Open Wave and pay {amount}
          </a>
        </div>
        <QrTile caption="Scan with the Wave app">
          <QRCodeSVG value={waveLink} size={164} fgColor="#0b1b3a" level="M" />
        </QrTile>
      </div>
    );

  if (method === "yonna")
    return (
      <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-[1fr_auto]">
        <Steps
          items={[
            <>Scan the code in the Yonna app, or send to <b>{yonnaNumber}</b>.</>,
            <>Pay <b>{amount}</b>, with your name in the reference box.</>,
            <>Keep the confirmation message: you type its <b>transaction ID</b> below.</>,
          ]}
        />
        <QrTile caption="Scan with the Yonna app">
          <Image src="/pay/yonna-qr.png" alt="Yonna QR code for NRIF" width={369} height={369} className="size-[164px]" />
        </QrTile>
      </div>
    );

  if (method === "ecobank")
    return (
      <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-[1fr_auto]">
        <div>
          <Steps
            items={[
              abroad ? <>Send an international transfer to Ecobank Gambia.</> : <>Scan the code with the Ecobank app, or pay by transfer.</>,
              <>
                Account <b className="font-mono">{ecobankAccount}</b>, {ecobankName}. Put your name in the reference.
              </>,
              <>Keep the receipt: you type its <b>transaction reference</b> below.</>,
            ]}
          />
          <p className="mt-3 text-sm text-muted">
            Amount: {amount}
            {abroad ? ", or its value in dalasi on arrival" : ""}.
          </p>
        </div>
        {!abroad && (
          <QrTile caption="Scan with your banking app">
            <QRCodeSVG value={ECOBANK_QR} size={164} fgColor="#0b1b3a" level="M" />
          </QrTile>
        )}
      </div>
    );

  return (
    <Steps
      items={[
        <>In Remitly or ACE, choose <b>The Gambia</b>, then mobile money: <b>Yonna</b> (or Wave).</>,
        <>Send <b>{amount}</b> to <b>{yonnaNumber}</b>, recipient National Research and Innovation Fund.</>,
        <>Keep the confirmation: you type its <b>reference number</b> below.</>,
      ]}
    />
  );
}
