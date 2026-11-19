import type { NextRequest } from "next/server";
import { q } from "@/lib/server/db";
import { json, requireAdmin, route } from "@/lib/server/http";
import { visibleActor } from "@/lib/server/admin";

/** Action filters on the audit page, each a set of activity kinds. */
const KINDS: Record<string, string[]> = {
  confirm: ["confirm", "revert"],
  remind: ["remind"],
  release: ["release", "cancel", "extend"],
  settings: ["admin", "settings", "event", "team", "template"],
  virtual: ["virtual"],
  bookings: ["booking", "claim", "paylink", "transfer", "signin"],
  payments: ["card", "wave", "receipt", "note", "pledge"],
};

/*
 * The audit trail: what every member of the team did, newest first, plus a summary per person. What the hidden
 * (developer) account did is left out, as it is everywhere the team looks.
 * ?actor=<name> | staff | system | participants   ?kind=<key of KINDS>   ?q=<text>   ?before=<ISO time, for paging>
 */
export const GET = route(async (req: NextRequest) => {
  await requireAdmin();
  const sp = req.nextUrl.searchParams;
  const actor = sp.get("actor") ?? "";
  const kinds = KINDS[sp.get("kind") ?? ""] ?? null;
  const term = (sp.get("q") ?? "").trim().slice(0, 80);
  const before = sp.get("before");
  const limit = 80;

  const rows = await q<{ id: string; at: string; actor: string; kind: string; text: string; reference: string | null; booking_id: string | null }>(
    `select a.id::text, a.at, a.actor, a.kind, a.text, b.reference, a.booking_id
       from activity a left join bookings b on b.id = a.booking_id
      where ${visibleActor("a")}
        and ($1 = '' or ($1 = 'staff' and a.actor in (select name from admins))
                     or ($1 = 'system' and a.actor not in (select name from admins) and a.actor not in ('payer', 'participant'))
                     or ($1 = 'participants' and a.actor in ('payer', 'participant'))
                     or a.actor = $1)
        and ($2::text[] is null or a.kind = any($2))
        and ($3 = '' or a.text ilike '%' || $3 || '%' or a.actor ilike '%' || $3 || '%')
        and ($4::timestamptz is null or a.at < $4::timestamptz)
      order by a.at desc, a.id desc
      limit ${limit + 1}`,
    [actor, kinds, term, before || null],
  );

  const team = await q(
    `select ad.id, ad.name, ad.email, ad.role, ad.last_login_at,
            count(a.id) filter (where a.kind = 'confirm')::int as confirmed,
            count(a.id) filter (where a.kind = 'remind')::int as reminded,
            count(a.id) filter (where a.kind = 'release')::int as released,
            count(a.id)::int as actions,
            max(a.at) as last_action_at
       from admins ad left join activity a on a.actor = ad.name
      where not ad.hidden
      group by ad.id
      order by max(a.at) desc nulls last, ad.created_at`,
  );

  return json({ rows: rows.slice(0, limit), more: rows.length > limit, team });
});
