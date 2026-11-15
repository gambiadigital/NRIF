"use client";

import { WhatsappLogo, Phone, EnvelopeSimple, MapPin } from "@phosphor-icons/react";
import { useSettings } from "@/lib/client";
import { cn } from "@/lib/cn";

/** NRIF's contact routes, as entered in Admin → Settings. Empty ones are left out; nothing shows until one exists. */
export function useContacts() {
  const s = useSettings().data;
  const digits = (v: string) => v.replace(/[^\d+]/g, "").replace(/^\+/, "");
  return [
    s?.contact_whatsapp && { icon: WhatsappLogo, l: "WhatsApp", v: s.contact_whatsapp, href: `https://wa.me/${digits(s.contact_whatsapp)}`, c: "text-[#25D366]" },
    s?.contact_phone && { icon: Phone, l: "Call", v: s.contact_phone, href: `tel:+${digits(s.contact_phone)}`, c: "text-navy" },
    s?.contact_email && { icon: EnvelopeSimple, l: "Email", v: s.contact_email, href: `mailto:${s.contact_email}`, c: "text-navy" },
    s?.contact_office && { icon: MapPin, l: "Office", v: s.contact_office, href: undefined, c: "text-navy" },
  ].filter(Boolean) as { icon: typeof Phone; l: string; v: string; href?: string; c: string }[];
}

export function ContactList({ className, big }: { className?: string; big?: boolean }) {
  const items = useContacts();
  if (!items.length) return null;
  return (
    <div className={cn("grid gap-2", big && "sm:grid-cols-2", className)}>
      {items.map((x) => {
        const inner = (
          <>
            <x.icon weight="fill" className={cn(big ? "size-7" : "size-5", x.c)} />
            {big ? (
              <span>
                <span className="block text-sm text-muted">{x.l}</span>
                <span className="block font-semibold text-navy">{x.v}</span>
              </span>
            ) : (
              <>
                <span className="text-sm text-muted">{x.l}</span>
                <span className="ml-auto text-sm font-semibold text-navy">{x.v}</span>
              </>
            )}
          </>
        );
        const cls = cn("flex items-center gap-3 bg-white transition-colors", big ? "gap-4 rounded-[1.25rem] border border-line p-5 hover:bg-paper" : "rounded-2xl p-3 hover:bg-sand");
        return x.href ? (
          <a key={x.l} href={x.href} target={x.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className={cls}>
            {inner}
          </a>
        ) : (
          <div key={x.l} className={cls}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
