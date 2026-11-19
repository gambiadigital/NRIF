"use client";

import { toast } from "sonner";
import { ShieldCheck, Camera, EnvelopeSimple, Tag, Phone, Copy, LinkSimple, UsersThree, CheckCircle } from "@phosphor-icons/react";
import { Sheet } from "@/components/ui/sheet";
import { Bib } from "@/components/Bib";
import { EVENTS } from "@/lib/data";
import { COUNTRY_CODES, money } from "@/lib/format";
import { useAdmin, when, STATUS_LABEL } from "@/lib/admin-client";
import { cn } from "@/lib/cn";

type Detail = {
  booking: Record<string, string | number | boolean | null> & { link: string };
  people: { id: string; full_name: string; event_id: string; bib: string | null; dob: string; guardian_is_lead: boolean; guardian_name: string | null; is_lead: boolean }[];
  messages: { to_addr: string; template: string; status: string; created_at: string }[];
  activity: { at: string; actor: string; text: string }[];
  transfers: { id: string; new_name: string; new_phone: string; status: string; full_name: string }[];
};

export const phone = (v: unknown) => {
  const [iso, digits] = String(v ?? "").split(":");
  return digits ? `${COUNTRY_CODES.find((c) => c.iso === iso)?.dial ?? ""} ${digits}` : String(v ?? "");
};

/** Everything about one booking: who, contact details, consents, the emails sent and its history. */
export function BookingDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data } = useAdmin<Detail>(id ? `/api/admin/bookings/${id}` : null);
  const d = id && data && String(data.booking.id) === id ? data : null;
  const b = d?.booking;
  return (
    <Sheet
      open={!!id}
      onOpenChange={(o) => !o && onClose()}
      title={b ? String(b.reference) : "Booking"}
      description={b ? `${STATUS_LABEL[String(b.status)] ?? String(b.status)} · booked ${when(String(b.created_at))} · ${money(Number(b.total), String(b.currency) as never, { decimals: b.currency !== "GMD" })}` : "Loading…"}
      wide
    >
      {!d || !b ? (
        <div className="h-60 animate-pulse rounded-2xl bg-paper" />
      ) : (
        <div className="space-y-6">
          {b.status === "paid" && (
            <p className="flex items-center gap-2 rounded-2xl bg-forest-50 px-4 py-3 text-sm font-semibold text-forest">
              <CheckCircle weight="fill" className="size-5 shrink-0" /> Payment confirmed{b.confirmed_by ? ` by ${String(b.confirmed_by)}` : ""} · {when(String(b.paid_at))}
            </p>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {d.people.map((p) => (
              <div key={p.id} className="flex gap-3 rounded-2xl border border-line p-3">
                <div className="w-24 shrink-0">
                  <Bib number={p.bib ?? "····"} eventId={p.event_id as never} flat />
                </div>
                <div className="min-w-0 text-sm">
                  <p className="font-bold text-navy">{p.full_name}</p>
                  <p className="text-muted">{EVENTS.find((e) => e.id === p.event_id)?.name ?? p.event_id}</p>
                  <p className="text-muted">Born {new Date(p.dob).toLocaleDateString("en-GB")}</p>
                  {!p.is_lead && !p.guardian_is_lead && p.guardian_name && <p className="text-cobalt">Guardian: {p.guardian_name}</p>}
                </div>
              </div>
            ))}
          </div>

          <ul className="divide-y divide-line rounded-2xl border border-line text-sm">
            {[
              { icon: Phone, l: "Phone", v: phone(`${b.phone_iso}:${b.phone}`) },
              { icon: EnvelopeSimple, l: "Email", v: String(b.email) },
              { icon: ShieldCheck, l: "Emergency contact", v: `${b.emergency_name}${b.emergency_relation ? `, ${b.emergency_relation}` : ""} · ${phone(b.emergency_phone)}` },
              { icon: ShieldCheck, l: `Waiver ${b.waiver_version}`, v: `Accepted ${when(String(b.waiver_accepted_at))}${b.consent_guardian ? ", with guardian consent" : ""}` },
              { icon: Camera, l: "Photos and video", v: b.consent_photos ? "Yes" : "No" },
              { icon: EnvelopeSimple, l: "NRIF news", v: b.consent_news ? "Yes" : "No" },
              { icon: Tag, l: "Source", v: `?src=${b.source ?? "direct"}${b.referral ? ` · referred by bib ${b.referral}` : ""}` },
              { icon: UsersThree, l: "Team", v: String(b.team_code ?? "—") },
            ].map((x) => (
              <li key={x.l} className="flex flex-col gap-0.5 p-3 sm:flex-row sm:items-start sm:gap-3">
                <span className="flex shrink-0 items-center gap-3 text-muted sm:w-48">
                  <x.icon weight="duotone" className="size-5 shrink-0 text-forest" />
                  {x.l}
                </span>
                <span className="min-w-0 flex-1 break-words pl-8 font-semibold text-navy sm:pl-0">{x.v}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => {
              navigator.clipboard?.writeText(d.booking.link).catch(() => {});
              toast.success("Booking link copied", { description: "It opens this booking for the participant, without signing in." });
            }}
            className="flex w-full items-center gap-3 rounded-2xl bg-paper p-3 text-left text-sm hover:bg-sand"
          >
            <LinkSimple weight="bold" className="size-4 shrink-0 text-muted" />
            <span className="min-w-0 flex-1 truncate font-mono text-navy">{d.booking.link}</span>
            <Copy weight="bold" className="size-4 shrink-0 text-muted" />
          </button>

          {d.transfers.length > 0 && (
            <div>
              <p className="mb-2 font-label text-muted">Transfer requests</p>
              {d.transfers.map((t) => (
                <p key={t.id} className="text-sm text-navy">
                  {t.full_name} → {t.new_name} ({phone(t.new_phone)}) · {t.status}
                </p>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <p className="mb-2 font-label text-muted">Emails</p>
              {d.messages.length ? (
                <ul className="space-y-1.5 text-sm">
                  {d.messages.map((m, i) => (
                    <li key={i} className="flex justify-between gap-2">
                      <span className="text-navy">{m.template}</span>
                      <span className={cn("font-semibold", m.status === "sent" ? "text-forest" : m.status === "failed" ? "text-ember" : "text-muted")}>{m.status}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">None yet.</p>
              )}
            </div>
            <div>
              <p className="mb-2 font-label text-muted">History</p>
              <ul className="space-y-1.5 text-sm">
                {d.activity.map((a, i) => (
                  <li key={i} className="text-navy">
                    <span className="mr-2 font-mono text-xs text-muted">{when(a.at)}</span>
                    {a.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </Sheet>
  );
}
