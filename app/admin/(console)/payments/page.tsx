"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Popover } from "radix-ui";
import { Check, BellRinging, ArrowsClockwise, PaperPlaneTilt, ShieldCheck, Copy, CircleNotch, HourglassMedium, ArrowCounterClockwise, Eye, X, WarningCircle, CaretDown, SquaresFour } from "@phosphor-icons/react";
import { AdminTitle, Empty, SearchBox, Tabs, Toolbar, type Me } from "@/components/admin/Shell";
import { BookingDrawer } from "@/components/admin/BookingDrawer";
import { Badge } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { PayMark } from "@/components/register/PayMethods";
import { api } from "@/lib/client";
import { useAdmin, useNow, when, ago, adminChanged, STATUS_LABEL, STATUS_TONE } from "@/lib/admin-client";
import { money } from "@/lib/format";
import { cn } from "@/lib/cn";

type Row = {
  id: string;
  reference: string;
  status: "pending" | "paid" | "released";
  total: number;
  currency: string;
  pay_method: string;
  created_at: string;
  hold_until: string;
  payer_claimed_at: string | null;
  payer_from: string | null;
  phone_tail: string;
  email: string;
  paid_at: string | null;
  reminded_at: string | null;
  confirmed_by: string | null;
  by_card: boolean;
  day: number;
  expired: boolean;
  lead: string;
  people: number;
  events: string;
  bibs: string | null;
};
type Data = { bookings: Row[]; methods: { method: string; confirmed: number; waiting: number }[] };
type Tab = "all" | "waiting" | "confirmed";

const METHODS = [
  { id: "wave", label: "Wave", short: "Wave", where: "NRIF's Wave merchant account" },
  { id: "card", label: "Visa or Mastercard", short: "Card", where: "the Modem Pay dashboard" },
  { id: "yonna", label: "Yonna", short: "Yonna", where: "NRIF's Yonna account" },
  { id: "ecobank", label: "Ecobank", short: "Ecobank", where: "NRIF's Ecobank account" },
  { id: "remit", label: "Remitly or ACE", short: "Remitly / ACE", where: "NRIF's Yonna or Wave account" },
] as const;
const method = (id: string) => METHODS.find((m) => m.id === id) ?? { id, label: id, short: id, where: "NRIF's accounts" };
const KNOWN = METHODS.map((m) => m.id) as string[];

const amt = (n: number, c: string) => money(n, c as never, { decimals: c !== "GMD" });
const PAGE = 60;
/** Each staff member's method filter, remembered on their device, so whoever looks after Wave always lands on Wave. */
const METHOD_KEY = "r4i-admin-pay-method";

export default function Payments() {
  const { data, reload, loading } = useAdmin<Data>("/api/admin/payments");
  const me = useAdmin<Me>("/api/admin/me").data;
  const now = useNow();
  const [tab, setTab] = useState<Tab>("all");
  const [term, setTerm] = useState("");
  const [only, setOnly] = useState<string | null>(null);
  const [shown, setShown] = useState(PAGE);

  // First load: a link with ?method=wave wins, then what this person picked last time on this device.
  useEffect(() => {
    const t = setTimeout(() => {
      let v: string | null = null;
      try {
        v = new URLSearchParams(window.location.search).get("method") || localStorage.getItem(METHOD_KEY);
      } catch {}
      if (v && KNOWN.includes(v)) setOnly(v);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  /** Shows one payment method only (or all, with null), remembers it, and puts it in the link so it can be shared. */
  function pickMethod(v: string | null) {
    setOnly(v);
    setShown(PAGE);
    try {
      if (v) localStorage.setItem(METHOD_KEY, v);
      else localStorage.removeItem(METHOD_KEY);
    } catch {}
    const u = new URL(window.location.href);
    if (v) u.searchParams.set("method", v);
    else u.searchParams.delete("method");
    window.history.replaceState(window.history.state, "", u);
  }
  const [confirming, setConfirming] = useState<Row | null>(null);
  const [releasing, setReleasing] = useState<Row | null>(null);
  const [reminding, setReminding] = useState<string | null>(null);
  const [details, setDetails] = useState<string | null>(null);

  const all = useMemo(() => data?.bookings ?? [], [data]);
  // The tab counts follow the method filter, so "Waiting 14" means 14 Wave payments to look for when Wave is picked.
  const mine = useMemo(() => (only ? all.filter((r) => r.pay_method === only) : all), [all, only]);
  const counts = { all: mine.length, waiting: mine.filter((r) => r.status === "pending").length, confirmed: mine.filter((r) => r.status === "paid").length };

  const rows = useMemo(() => {
    const t = term.trim().toLowerCase();
    const digits = t.replace(/\D/g, "");
    let list = mine.filter(
      (r) =>
        (tab === "all" || (tab === "waiting" ? r.status === "pending" : r.status === "paid")) &&
        (!t ||
          `${r.reference} ${r.lead} ${r.events} ${r.email} ${r.confirmed_by ?? ""} ${r.bibs ?? ""}`.toLowerCase().includes(t) ||
          (digits.length >= 3 && `${r.payer_from ?? ""} ${r.phone_tail}`.replace(/\D/g, "").includes(digits))),
    );
    // Waiting: the ones whose payer says the money is sent come first, since those are ready to look for.
    if (tab === "waiting") list = [...list].sort((a, b) => Number(!!b.payer_claimed_at) - Number(!!a.payer_claimed_at) || b.created_at.localeCompare(a.created_at));
    if (tab === "confirmed") list = [...list].sort((a, b) => (b.paid_at ?? "").localeCompare(a.paid_at ?? ""));
    return list;
  }, [mine, tab, term]);

  async function remind(r: Row) {
    setReminding(r.id);
    try {
      const res = await api<{ emailed: boolean }>(`/api/admin/bookings/${r.id}`, { json: { action: "remind" } });
      toast.success(`Reminder for ${r.reference}`, { description: res.emailed ? `On its way to ${r.email}.` : "Queued. It goes out once email is set up (see Messages)." });
      adminChanged();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setReminding(null);
    }
  }

  const tile = (id: string) => data?.methods.find((m) => m.method === id);

  return (
    <div className="mx-auto max-w-7xl">
      <AdminTitle
        title="Payments"
        sub="Look for each payment in NRIF's accounts by its reference, then confirm it. Confirming issues the bibs and emails the runner, recorded under your name."
        actions={
          <Button variant="line" icon={<ArrowsClockwise weight="bold" className={cn("size-4", loading && "animate-spin")} />} onClick={() => reload()}>
            Refresh
          </Button>
        }
      />

      <div className="@container mb-2">
        <div className="mb-2 flex min-h-8 items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {only ? (
              <>
                Showing <b className="text-navy">{method(only).label}</b> payments only
              </>
            ) : (
              "Pick a method to work on only its payments"
            )}
          </p>
          {only && (
            <button onClick={() => pickMethod(null)} className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-3 text-sm font-semibold text-forest hover:bg-forest-50">
              <X weight="bold" className="size-3.5" /> Show all
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 @xl:grid-cols-3 @4xl:grid-cols-5 @4xl:gap-3">
        {METHODS.map((m) => {
          const t = tile(m.id);
          const on = only === m.id;
          return (
            <button
              key={m.id}
              onClick={() => pickMethod(on ? null : m.id)}
              aria-pressed={on}
              className={cn(
                "flex min-w-0 items-center gap-2.5 rounded-2xl border bg-white p-2.5 text-left transition-[border-color,box-shadow] @xl:gap-3 @xl:p-3",
                on ? "border-forest shadow-[0_0_0_3px_rgb(19_95_64/0.15)]" : only ? "border-line opacity-60 hover:opacity-100" : "border-line hover:border-line-strong",
              )}
            >
              <PayMark id={m.id as never} className="h-8 w-11 rounded-lg @xl:h-10 @xl:w-14 @xl:rounded-xl" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-navy">{m.short}</span>
                <span className="block truncate text-xs text-muted">
                  <b className="font-semibold text-forest">{t?.confirmed ?? 0}</b> confirmed
                </span>
                <span className="block truncate text-xs text-muted">{t?.waiting ?? 0} waiting</span>
              </span>
            </button>
          );
        })}
      </div>
      </div>

      <Toolbar>
        <div className="mx-auto flex max-w-7xl flex-col gap-3 @3xl:flex-row @3xl:items-center">
          <Tabs
            value={tab}
            onChange={(v) => {
              setTab(v);
              setShown(PAGE);
            }}
            tabs={[
              { v: "all", l: "All", n: counts.all },
              { v: "waiting", l: "Waiting", n: counts.waiting },
              { v: "confirmed", l: "Confirmed", n: counts.confirmed },
            ]}
          />
          <div className="flex gap-2 @3xl:ml-auto">
            <MethodPicker value={only} onChange={pickMethod} counts={data?.methods ?? []} />
            <SearchBox value={term} onChange={setTerm} placeholder="Reference, name, email or paying number" className="min-w-0 flex-1 @3xl:w-72 @3xl:flex-none" />
          </div>
        </div>
      </Toolbar>

      {!data ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-[1.25rem] bg-white/70" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Empty>
          {term
            ? "Nothing matches that search."
            : tab === "waiting"
              ? `No ${only ? `${method(only).label} ` : ""}bookings are waiting for payment.`
              : tab === "confirmed"
                ? `No ${only ? `${method(only).label} ` : ""}payments confirmed yet.`
                : only
                  ? `No ${method(only).label} bookings yet.`
                  : "No bookings yet."}
        </Empty>
      ) : (
        <>
          <ul className="@container divide-y divide-line overflow-hidden rounded-[1.25rem] border border-line bg-white">
            {rows.slice(0, shown).map((r) => (
              <PaymentRow
                key={r.id}
                r={r}
                now={now}
                reminding={reminding === r.id}
                onConfirm={() => setConfirming(r)}
                onRemind={() => remind(r)}
                onRelease={() => setReleasing(r)}
                onOpen={() => setDetails(r.id)}
              />
            ))}
          </ul>
          {rows.length > shown && (
            <div className="mt-4 text-center">
              <Button variant="line" onClick={() => setShown((n) => n + PAGE)}>
                Show more ({rows.length - shown} left)
              </Button>
            </div>
          )}
        </>
      )}

      <ConfirmSheet row={confirming} me={me} onClose={() => setConfirming(null)} />
      <ReleaseSheet row={releasing} onClose={() => setReleasing(null)} />
      <BookingDrawer id={details} onClose={() => setDetails(null)} />
    </div>
  );
}

/**
 * The method filter in the sticky bar: the console's own dropdown (as in components/ui/fields Select), shaped as a pill
 * to sit with the tabs and search, with each method's logo and how many of its payments are waiting.
 */
function MethodPicker({ value, onChange, counts }: { value: string | null; onChange: (v: string | null) => void; counts: Data["methods"] }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const options: { id: string | null; label: string; short: string }[] = [{ id: null, label: "All methods", short: "All methods" }, ...METHODS.map((m) => ({ id: m.id as string, label: m.label, short: m.short }))];
  const current = options.find((o) => o.id === value) ?? options[0]!;
  const n = (id: string | null) =>
    id ? counts.find((c) => c.method === id) : { waiting: counts.reduce((a, c) => a + c.waiting, 0), confirmed: counts.reduce((a, c) => a + c.confirmed, 0) };
  const pick = (id: string | null) => {
    onChange(id);
    setOpen(false);
  };
  const openWith = (o: boolean) => {
    if (o) setActive(Math.max(0, options.findIndex((x) => x.id === value)));
    setOpen(o);
  };

  return (
    <Popover.Root open={open} onOpenChange={openWith}>
      <Popover.Trigger
        aria-label={`Payment method: ${current.label}`}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            openWith(true);
          }
        }}
        className={cn(
          "flex h-11 w-[11.5rem] shrink-0 items-center gap-2 rounded-full border pl-1.5 pr-3.5 text-left text-[0.9375rem] font-semibold outline-none transition-[border-color,background-color,box-shadow] focus-visible:shadow-[0_0_0_4px_rgb(19_95_64/0.15)] @3xl:w-48",
          value ? "border-forest bg-forest-50 text-forest" : "border-line bg-white text-navy hover:border-line-strong",
          open && "border-forest",
        )}
      >
        <MethodIcon id={current.id} small />
        <span className="min-w-0 flex-1 truncate">{current.short}</span>
        <CaretDown weight="bold" className={cn("size-3.5 shrink-0 transition-transform", value ? "text-forest" : "text-faint", open && "rotate-180")} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          collisionPadding={16}
          side="bottom"
          avoidCollisions={false}
          className="z-[80] max-h-[var(--radix-popover-content-available-height)] w-72 max-w-[calc(100vw-2rem)] scroll-panel overflow-y-auto overscroll-contain rounded-2xl border border-line bg-white p-1.5 shadow-lift"
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(options.length - 1, a + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(0, a - 1));
            } else if (e.key === "Enter") {
              e.preventDefault();
              pick(options[active]!.id);
            }
          }}
        >
          <p className="px-3 pb-1.5 pt-2 font-label text-muted">Show payments made with</p>
          <div role="listbox" aria-label="Payment method">
            {options.map((o, i) => {
              const c = n(o.id);
              const on = o.id === value;
              return (
                <button
                  key={o.id ?? "all"}
                  role="option"
                  aria-selected={on}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(o.id)}
                  className={cn("flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-navy transition-colors", i === active && "bg-paper", i === 0 && "mb-1")}
                >
                  <MethodIcon id={o.id} />
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate text-[0.9375rem]", on ? "font-bold" : "font-semibold")}>{o.label}</span>
                    <span className="block truncate text-xs text-muted">
                      {c?.waiting ?? 0} waiting · {c?.confirmed ?? 0} confirmed
                    </span>
                  </span>
                  {on && <Check weight="bold" className="size-4 shrink-0 text-forest" />}
                </button>
              );
            })}
          </div>
          {value && (
            <p className="mx-1.5 mt-1.5 rounded-xl bg-paper px-3 py-2 text-xs text-muted">Remembered on this device. Share the page link to give a colleague the same view.</p>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/** A method's logo in the picker; "All methods" gets a neutral grid mark. */
function MethodIcon({ id, small }: { id: string | null; small?: boolean }) {
  const size = small ? "h-8 w-11 rounded-full" : "h-9 w-12 rounded-lg";
  if (!id)
    return (
      <span className={cn("grid shrink-0 place-items-center bg-sand text-navy", size)}>
        <SquaresFour weight="fill" className="size-4" />
      </span>
    );
  return <PayMark id={id as never} className={size} />;
}

function PaymentRow({ r, now, reminding, onConfirm, onRemind, onRelease, onOpen }: { r: Row; now: number; reminding: boolean; onConfirm: () => void; onRemind: () => void; onRelease: () => void; onOpen: () => void }) {
  const m = method(r.pay_method);
  return (
    <li className="p-4 sm:p-5">
      <div className="flex flex-col gap-3 @4xl:flex-row @4xl:items-center @4xl:gap-6">
        <button onClick={onOpen} className="group flex min-w-0 flex-1 items-start gap-3 text-left">
          <PayMark id={(KNOWN.includes(r.pay_method) ? r.pay_method : "remit") as never} className="hidden sm:grid" />
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[0.9375rem] font-bold text-navy group-hover:text-forest">{r.reference}</span>
              <Badge tone={STATUS_TONE[r.status] ?? "neutral"}>{STATUS_LABEL[r.status] ?? r.status}</Badge>
              {r.status === "pending" && r.payer_claimed_at && (
                <Badge tone="cobalt" icon={<PaperPlaneTilt weight="fill" className="size-3" />}>
                  Says paid
                </Badge>
              )}
            </span>
            <span className="mt-1 block truncate font-semibold text-navy">
              {r.lead}
              {r.people > 1 && <span className="font-normal text-muted"> +{r.people - 1}</span>}
            </span>
            <span className="block truncate text-sm text-muted">
              {r.events} · <span className="sm:hidden">{m.label} · </span>booked {when(r.created_at)}
            </span>
            {r.status === "pending" && r.payer_claimed_at && (
              <span className="mt-1 block text-[0.8125rem] font-semibold text-cobalt">
                Sent {ago(r.payer_claimed_at, now)}
                {r.payer_from ? (
                  <>
                    {" "}from <span className="font-mono">{r.payer_from}</span>
                  </>
                ) : null}
              </span>
            )}
          </span>
        </button>

        <div className="flex flex-col gap-3 @lg:flex-row @lg:items-center @lg:justify-between @lg:gap-4 @4xl:shrink-0 @4xl:justify-end @4xl:gap-6">
        <div className="flex items-baseline justify-between gap-4 @lg:block @4xl:w-48 @4xl:text-right">
          <p className="shrink-0 whitespace-nowrap text-lg font-bold leading-tight text-navy tabular">{amt(r.total, r.currency)}</p>
          <p className="text-right text-xs text-muted @lg:mt-0.5 @lg:text-left @4xl:text-right">
            {r.status === "paid" ? (
              <>
                <span className="font-semibold text-forest">Confirmed by {r.confirmed_by ?? "staff"}</span>
                <span className="block">
                  {when(r.paid_at)}
                  {r.bibs ? ` · bib ${r.bibs}` : ""}
                </span>
              </>
            ) : r.status === "released" ? (
              <>Released · can still be confirmed</>
            ) : r.expired ? (
              <span className="font-semibold text-ember">Hold ended {when(r.hold_until)}</span>
            ) : (
              <>
                <span className="inline-flex items-center gap-1">
                  <HourglassMedium weight="fill" className="size-3 text-cobalt" /> Day {Math.min(r.day, 5)} of 5
                </span>
                {r.reminded_at && <span className="block">Reminded {ago(r.reminded_at, now)}</span>}
              </>
            )}
          </p>
        </div>

        <div className={cn("grid gap-2 @lg:flex @lg:shrink-0", r.status === "pending" ? "grid-cols-3" : r.status === "released" ? "grid-cols-2" : "grid-cols-1")}>
          {r.status !== "paid" && (
            <Button size="sm" icon={<Check weight="bold" className="size-4" />} onClick={onConfirm} className="h-10 w-full @lg:w-auto">
              Confirm
            </Button>
          )}
          {r.status === "pending" && (
            <>
              <Button size="sm" variant="line" disabled={reminding} icon={reminding ? <CircleNotch weight="bold" className="size-4 animate-spin" /> : <BellRinging weight="bold" className="size-4" />} onClick={onRemind} className="h-10 w-full @lg:w-auto">
                Remind
              </Button>
              <Button size="sm" variant="line" icon={<ArrowCounterClockwise weight="bold" className="size-4" />} onClick={onRelease} className="h-10 w-full text-ember hover:border-ember/50 hover:bg-ember-50 @lg:w-auto">
                Release
              </Button>
            </>
          )}
          {r.status !== "pending" && (
            <Button size="sm" variant="line" icon={<Eye weight="bold" className="size-4" />} onClick={onOpen} className="h-10 w-full @lg:w-auto">
              Details
            </Button>
          )}
        </div>
        </div>
      </div>
    </li>
  );
}

function Fact({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl bg-paper px-3 py-2.5">
      <dt className="text-xs text-muted">{k}</dt>
      <dd className="truncate font-semibold text-navy">{children}</dd>
    </div>
  );
}

function ConfirmSheet({ row, me, onClose }: { row: Row | null; me: Me | null; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const r = row;
  const m = r ? method(r.pay_method) : null;
  async function confirm() {
    if (!r) return;
    setBusy(true);
    try {
      const res = await api<{ bibs: string[]; confirmedBy: string }>(`/api/admin/bookings/${r.id}`, { json: { action: "confirm" } });
      toast.success(`${r.reference} confirmed by ${res.confirmedBy}`, { description: `${res.bibs.length === 1 ? "Bib" : "Bibs"} ${res.bibs.join(", ")} issued. The confirmation email is on its way.` });
      onClose();
      adminChanged();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Sheet
      open={!!r}
      onOpenChange={(o) => !o && !busy && onClose()}
      title="Confirm this payment?"
      description={m ? `Find it in ${m.where} first. Only confirm money you have seen arrive.` : undefined}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="line" size="lg" onClick={onClose} disabled={busy}>
            Not yet
          </Button>
          <Button size="lg" icon={busy ? <CircleNotch weight="bold" className="size-5 animate-spin" /> : <Check weight="bold" className="size-5" />} onClick={confirm} disabled={busy}>
            {busy ? "Confirming…" : "Yes, confirm payment"}
          </Button>
        </div>
      }
    >
      {r && m && (
        <>
          <div className="rounded-2xl bg-navy p-5 text-white">
            <p className="font-label text-white/60">Reference on the payment</p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <p className="font-mono text-[2rem] font-bold leading-none tracking-wide">{r.reference}</p>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(r.reference).catch(() => {});
                  toast.success("Reference copied");
                }}
                className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 hover:bg-white/20"
                aria-label="Copy the reference"
              >
                <Copy weight="bold" className="size-4" />
              </button>
            </div>
            {r.pay_method === "wave" && (
              <p className="mt-3 text-sm text-white/80">
                Wave payments have no reference box. Look for <b className="text-white">{amt(r.total, r.currency)}</b> from{" "}
                <b className="font-mono text-white">{r.payer_from ?? `the number ending ${r.phone_tail}`}</b>.
              </p>
            )}
            {r.pay_method === "card" && <p className="mt-3 text-sm text-white/80">Card payments show in Modem Pay with the description “Booking {r.reference}”.</p>}
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <Fact k="Amount">{amt(r.total, r.currency)}</Fact>
            <Fact k="Paid with">{m.label}</Fact>
            <Fact k="Booked by">
              {r.lead}
              {r.people > 1 ? ` +${r.people - 1}` : ""}
            </Fact>
            <Fact k={r.people > 1 ? "Entries" : "Entry"}>{r.events}</Fact>
            <Fact k="Booked">{when(r.created_at)}</Fact>
            <Fact k="Payer says sent">{r.payer_claimed_at ? when(r.payer_claimed_at) : "Not yet"}</Fact>
          </dl>

          {r.status === "released" && (
            <p className="mt-4 flex items-start gap-2 rounded-2xl bg-ember-50 p-3 text-sm text-navy">
              <WarningCircle weight="fill" className="mt-0.5 size-4 shrink-0 text-ember" />
              This booking was released when its hold ended. Confirming gives the place back.
            </p>
          )}
          <p className="mt-4 flex items-start gap-2 rounded-2xl bg-forest-50 p-3 text-sm text-navy">
            <ShieldCheck weight="fill" className="mt-0.5 size-4 shrink-0 text-forest" />
            <span>
              Confirming issues {r.people > 1 ? "the bibs" : "the bib"} at once and emails {r.lead.split(/\s+/)[0]}. It is recorded as confirmed by <b>{me?.name ?? "you"}</b>.
            </span>
          </p>
        </>
      )}
    </Sheet>
  );
}

function ReleaseSheet({ row, onClose }: { row: Row | null; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  async function release() {
    if (!row) return;
    setBusy(true);
    try {
      await api(`/api/admin/bookings/${row.id}`, { json: { action: "release" } });
      toast.success(`${row.reference} released`, { description: "If the money turns up later, you can still confirm it from All." });
      onClose();
      adminChanged();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Sheet
      open={!!row}
      onOpenChange={(o) => !o && !busy && onClose()}
      title={`Release ${row?.reference ?? ""}?`}
      description="The place is freed and the booking stops waiting for payment."
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="line" size="lg" onClick={onClose} disabled={busy}>
            Keep waiting
          </Button>
          <Button variant="danger" size="lg" icon={busy ? <CircleNotch weight="bold" className="size-5 animate-spin" /> : <ArrowCounterClockwise weight="bold" className="size-5" />} onClick={release} disabled={busy}>
            {busy ? "Releasing…" : "Release booking"}
          </Button>
        </div>
      }
    >
      {row && (
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <Fact k="Booked by">{row.lead}</Fact>
          <Fact k="Amount">{amt(row.total, row.currency)}</Fact>
          <Fact k={row.people > 1 ? "Entries" : "Entry"}>{row.events}</Fact>
          <Fact k="Hold">{row.expired ? `Ended ${when(row.hold_until)}` : `Day ${Math.min(row.day, 5)} of 5`}</Fact>
        </dl>
      )}
    </Sheet>
  );
}
