"use client";

/*
 * Every control here is custom: no native select, no browser date picker, no raw tel input. Inputs format
 * themselves as people type (phone groups, DD / MM / YYYY), and the faint remainder shows what is still to come.
 */

import { forwardRef, useId, useMemo, useRef, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { Popover } from "radix-ui";
import { motion, AnimatePresence } from "motion/react";
import { CaretDown, Check, MagnifyingGlass, WarningCircle } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { COUNTRY_CODES, formatPhone, phoneMax } from "@/lib/format";
import type { Phone } from "@/lib/store";

export const inputBase =
  "h-12 w-full rounded-xl border border-line bg-white px-3.5 text-[0.9375rem] text-navy outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-faint hover:border-line-strong focus:border-forest focus:shadow-[0_0_0_4px_rgb(19_95_64/0.12)]";

export function Field({
  label,
  required,
  optional,
  hint,
  error,
  children,
  htmlFor,
  className,
  aside,
}: {
  label?: ReactNode;
  required?: boolean;
  optional?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  htmlFor?: string;
  className?: string;
  aside?: ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      {label && (
        <div className="flex items-baseline justify-between gap-2">
          <label htmlFor={htmlFor} className="text-[0.8125rem] font-semibold text-navy">
            {label}
            {required && <span className="ml-0.5 text-ember">*</span>}
            {optional && <span className="ml-1.5 font-normal text-faint">Optional</span>}
          </label>
          {aside}
        </div>
      )}
      {children}
      <AnimatePresence initial={false}>
        {error ? (
          <motion.p
            key="e"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-ember"
          >
            <WarningCircle weight="fill" className="size-4 shrink-0" />
            {error}
          </motion.p>
        ) : hint ? (
          <p key="h" className="text-[0.8125rem] text-muted">
            {hint}
          </p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export const TextInput = forwardRef<HTMLInputElement, ComponentPropsWithoutRef<"input"> & { leading?: ReactNode; trailing?: ReactNode; invalid?: boolean }>(
  function TextInput({ className, leading, trailing, invalid, ...rest }, ref) {
    return (
      <div className="relative">
        {leading && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint">{leading}</span>}
        <input
          ref={ref}
          className={cn(inputBase, leading && "pl-10", trailing && "pr-11", invalid && "border-ember/70 focus:border-ember focus:shadow-[0_0_0_4px_rgb(215_20_26/0.1)]", className)}
          {...rest}
        />
        {trailing && <span className="absolute right-3 top-1/2 -translate-y-1/2">{trailing}</span>}
      </div>
    );
  },
);

/* ---------- Phone ---------- */

export function PhoneField({ value, onChange, id, invalid }: { value: Phone; onChange: (v: Phone) => void; id?: string; invalid?: boolean }) {
  const country = COUNTRY_CODES.find((c) => c.iso === value.iso) ?? COUNTRY_CODES[0];
  const shown = formatPhone(value.digits, value.iso);
  const ghost = country.sample.slice(shown.length);
  const [open, setOpen] = useState(false);

  function handle(raw: string) {
    let digits = raw.replace(/[^\d+]/g, "");
    // A pasted international number picks its own country.
    if (digits.startsWith("+")) {
      const match = [...COUNTRY_CODES].sort((a, b) => b.dial.length - a.dial.length).find((c) => digits.startsWith(c.dial));
      if (match) {
        onChange({ iso: match.iso, digits: digits.slice(match.dial.length).slice(0, phoneMax(match.iso)) });
        return;
      }
    }
    digits = digits.replace(/\D/g, "");
    if (value.iso === "GM" && digits.startsWith("220") && digits.length > 9) digits = digits.slice(3);
    onChange({ iso: value.iso, digits: digits.slice(0, phoneMax(value.iso)) });
  }

  return (
    <div
      className={cn(
        "flex h-12 items-stretch overflow-hidden rounded-xl border border-line bg-white transition-[border-color,box-shadow] focus-within:border-forest focus-within:shadow-[0_0_0_4px_rgb(19_95_64/0.12)] hover:border-line-strong",
        invalid && "border-ember/70",
      )}
    >
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger className="flex shrink-0 items-center gap-1.5 border-r border-line pl-3 pr-2.5 text-[0.9375rem] font-medium text-navy outline-none hover:bg-paper">
          <span className="rounded-md bg-sand px-1.5 py-0.5 font-mono text-[0.6875rem] font-semibold text-muted">{country.iso}</span>
          {country.dial}
          <CaretDown weight="bold" className="size-3 text-faint" />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content align="start" sideOffset={6} className="z-[80] w-64 rounded-2xl border border-line bg-white p-1.5 shadow-lift">
            {COUNTRY_CODES.map((c) => (
              <button
                key={c.iso}
                onClick={() => {
                  onChange({ iso: c.iso, digits: value.digits.slice(0, phoneMax(c.iso)) });
                  setOpen(false);
                }}
                className={cn("flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm hover:bg-paper", c.iso === value.iso && "bg-forest-50")}
              >
                <span className="w-7 rounded-md bg-sand py-0.5 text-center font-mono text-[0.6875rem] font-semibold text-muted">{c.iso}</span>
                <span className="flex-1 text-navy">{c.name}</span>
                <span className="text-muted">{c.dial}</span>
              </button>
            ))}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      <div className="relative flex-1">
        <span aria-hidden className="pointer-events-none absolute inset-0 flex items-center px-3 text-[0.9375rem] tabular">
          <span className="invisible">{shown}</span>
          <span className="text-faint/70">{ghost}</span>
        </span>
        <input
          id={id}
          inputMode="tel"
          autoComplete="tel-national"
          value={shown}
          onChange={(e) => handle(e.target.value)}
          className="relative h-full w-full bg-transparent px-3 text-[0.9375rem] text-navy outline-none tabular"
        />
      </div>
    </div>
  );
}

/* ---------- Date of birth: DD / MM / YYYY ---------- */

export function DateField({ value, onChange, id, invalid }: { value: string; onChange: (v: string) => void; id?: string; invalid?: boolean }) {
  const [d, m, y] = value ? value.split("/") : ["", "", ""];
  const parts = [d ?? "", m ?? "", y ?? ""];
  const refs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  const lens = [2, 2, 4];
  const ph = ["DD", "MM", "YYYY"];

  function set(i: number, raw: string) {
    const v = raw.replace(/\D/g, "").slice(0, lens[i]);
    const next = [...parts];
    next[i] = v;
    onChange(next.every((p) => !p) ? "" : next.join("/"));
    if (v.length === lens[i] && i < 2) refs[i + 1]!.current?.focus();
  }

  return (
    <div
      className={cn(
        "flex h-12 items-center rounded-xl border border-line bg-white px-1.5 transition-[border-color,box-shadow] focus-within:border-forest focus-within:shadow-[0_0_0_4px_rgb(19_95_64/0.12)] hover:border-line-strong",
        invalid && "border-ember/70",
      )}
    >
      {parts.map((p, i) => (
        <div key={i} className="flex items-center">
          <input
            id={i === 0 ? id : undefined}
            ref={refs[i]}
            inputMode="numeric"
            aria-label={["Day", "Month", "Year"][i]}
            placeholder={ph[i]}
            value={p}
            onChange={(e) => set(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !p && i > 0) refs[i - 1]!.current?.focus();
              if (e.key === "/" && i < 2) {
                e.preventDefault();
                refs[i + 1]!.current?.focus();
              }
            }}
            className={cn("h-9 rounded-lg bg-transparent text-center text-[0.9375rem] text-navy outline-none tabular placeholder:text-faint focus:bg-paper", i === 2 ? "w-16" : "w-10")}
          />
          {i < 2 && <span className="px-0.5 text-faint">/</span>}
        </div>
      ))}
    </div>
  );
}

/* ---------- Select ---------- */

type Opt = { value: string; label: string; hint?: string; icon?: ReactNode };

export function Select({
  value,
  onChange,
  options,
  placeholder = "Choose",
  id,
  invalid,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Opt[];
  placeholder?: string;
  id?: string;
  invalid?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const current = options.find((o) => o.value === value);
  const openWith = (o: boolean) => {
    if (o) setActive(Math.max(0, options.findIndex((x) => x.value === value)));
    setOpen(o);
  };

  return (
    <Popover.Root open={open} onOpenChange={openWith}>
      <Popover.Trigger
        id={id}
        className={cn(inputBase, "flex items-center justify-between gap-2 text-left", !current && "text-faint", invalid && "border-ember/70", className)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            openWith(true);
          }
        }}
      >
        <span className="flex min-w-0 items-center gap-2 truncate">
          {current?.icon}
          {current?.label ?? placeholder}
        </span>
        <CaretDown weight="bold" className={cn("size-3.5 shrink-0 text-faint transition-transform", open && "rotate-180")} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-[80] max-h-72 w-[var(--radix-popover-trigger-width)] min-w-44 overflow-y-auto rounded-2xl border border-line bg-white p-1.5 shadow-lift"
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(options.length - 1, a + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(0, a - 1));
            } else if (e.key === "Enter") {
              e.preventDefault();
              onChange(options[active]!.value);
              setOpen(false);
            }
          }}
        >
          <div role="listbox">
            {options.map((o, i) => (
              <button
                key={o.value}
                role="option"
                aria-selected={o.value === value}
                onMouseEnter={() => setActive(i)}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={cn("flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[0.9375rem] text-navy", i === active && "bg-paper")}
              >
                {o.icon}
                <span className="flex-1">
                  {o.label}
                  {o.hint && <span className="block text-xs text-muted">{o.hint}</span>}
                </span>
                {o.value === value && <Check weight="bold" className="size-4 text-forest" />}
              </button>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/* ---------- Combobox (towns, cities) ---------- */

export function Combobox({
  value,
  onChange,
  options,
  placeholder,
  id,
  icon,
  invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  id?: string;
  icon?: ReactNode;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const list = useMemo(() => {
    const q = value.trim().toLowerCase();
    const hits = q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
    return hits.slice(0, 8);
  }, [value, options]);

  return (
    <Popover.Root open={open && list.length > 0 && !(list.length === 1 && list[0] === value)} onOpenChange={setOpen}>
      <Popover.Anchor asChild>
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint">{icon ?? <MagnifyingGlass className="size-4" />}</span>
          <input
            id={id}
            value={value}
            placeholder={placeholder}
            autoComplete="off"
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            onChange={(e) => {
              onChange(e.target.value);
              setOpen(true);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(list.length - 1, a + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(0, a - 1));
              } else if (e.key === "Enter" && list[active]) {
                e.preventDefault();
                onChange(list[active]!);
                setOpen(false);
              } else if (e.key === "Escape") setOpen(false);
            }}
            className={cn(inputBase, "pl-10", invalid && "border-ember/70")}
          />
        </div>
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="z-[80] w-[var(--radix-popover-trigger-width)] min-w-56 rounded-2xl border border-line bg-white p-1.5 shadow-lift"
        >
          {list.map((o, i) => (
            <button
              key={o}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => {
                onChange(o);
                setOpen(false);
              }}
              className={cn("flex w-full items-center rounded-xl px-3 py-2.5 text-left text-[0.9375rem] text-navy", i === active && "bg-paper")}
            >
              {o}
            </button>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/* ---------- Segmented control ---------- */

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  tone = "light",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; icon?: ReactNode }[];
  className?: string;
  tone?: "light" | "dark";
}) {
  const id = useId();
  return (
    <div role="radiogroup" className={cn("relative grid auto-cols-fr grid-flow-col rounded-2xl p-1", tone === "light" ? "bg-sand" : "bg-white/10", className)}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative z-10 flex h-11 items-center justify-center gap-2 rounded-xl px-3 text-[0.9375rem] font-semibold transition-colors",
              tone === "light" ? (on ? "text-forest" : "text-muted hover:text-navy") : on ? "text-navy" : "text-white/75 hover:text-white",
            )}
          >
            {on && (
              <motion.span
                layoutId={`seg-${id}`}
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
                className={cn("absolute inset-0 -z-10 rounded-xl bg-white", tone === "light" && "shadow-[0_1px_2px_rgb(11_27_58/0.08),0_4px_12px_-4px_rgb(11_27_58/0.12)]")}
              />
            )}
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Chip group (sizes, donations) ---------- */

export function ChipGroup<T extends string | number>({
  value,
  onChange,
  options,
  className,
}: {
  value: T | null;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode }[];
  className?: string;
}) {
  return (
    <div role="radiogroup" className={cn("flex flex-wrap gap-2", className)}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={String(o.value)}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative h-11 min-w-12 rounded-full border px-4 text-[0.9375rem] font-semibold transition-all duration-200 active:scale-95",
              on ? "border-forest bg-forest text-white shadow-[0_6px_16px_-8px_rgb(19_95_64/0.8)]" : "border-line bg-white text-navy hover:border-line-strong",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Checkbox ---------- */

export function Checkbox({
  checked,
  onChange,
  children,
  tag,
  className,
  invalid,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
  tag?: "required" | "optional";
  className?: string;
  invalid?: boolean;
}) {
  return (
    <button
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "group flex w-full items-start gap-3.5 rounded-2xl border p-4 text-left transition-all duration-200",
        checked ? "border-forest/30 bg-forest-50/70" : "border-line bg-white hover:border-line-strong",
        invalid && !checked && "border-ember/50 bg-ember-50/50",
        className,
      )}
    >
      <CheckMark checked={checked} />
      <span className="flex-1 text-[0.9375rem] leading-snug text-navy">
        {children}
        {tag && (
          <span
            className={cn(
              "mt-1.5 block w-fit rounded-md px-1.5 py-0.5 font-label !text-[0.6875rem]",
              tag === "required" ? "bg-ember-50 text-ember" : "bg-cobalt-50 text-cobalt",
            )}
          >
            {tag}
          </span>
        )}
      </span>
    </button>
  );
}

export function CheckMark({ checked, round }: { checked: boolean; round?: boolean }) {
  return (
    <span
      className={cn(
        "relative mt-px grid size-6 shrink-0 place-items-center border-2 transition-all duration-200",
        round ? "rounded-full" : "rounded-[0.5rem]",
        checked ? "border-forest bg-forest" : "border-line-strong bg-white group-hover:border-navy/40",
      )}
    >
      <svg viewBox="0 0 16 16" className="size-3.5" fill="none" aria-hidden>
        <motion.path
          d="M3.5 8.5l3 3 6-7"
          stroke="white"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        />
      </svg>
    </span>
  );
}

export function RadioDot({ checked }: { checked: boolean }) {
  return (
    <span className={cn("grid size-[1.375rem] shrink-0 place-items-center rounded-full border-2 transition-colors", checked ? "border-forest" : "border-line-strong")}>
      <motion.span initial={false} animate={{ scale: checked ? 1 : 0 }} transition={{ type: "spring", stiffness: 600, damping: 30 }} className="size-2.5 rounded-full bg-forest" />
    </span>
  );
}

/* ---------- Switch ---------- */

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200", checked ? "bg-forest" : "bg-line-strong")}
    >
      <motion.span
        initial={false}
        animate={{ x: checked ? 22 : 2 }}
        transition={{ type: "spring", stiffness: 600, damping: 35 }}
        className="absolute top-0.5 block size-6 rounded-full bg-white shadow-[0_1px_3px_rgb(0_0_0/0.25)]"
      />
    </button>
  );
}

/* ---------- Badge ---------- */

const TONES = {
  forest: "bg-forest-50 text-forest ring-forest/15",
  ember: "bg-ember-50 text-ember ring-ember/15",
  cobalt: "bg-cobalt-50 text-cobalt ring-cobalt/15",
  navy: "bg-navy text-white ring-navy",
  neutral: "bg-sand text-muted ring-line",
  white: "bg-white/15 text-white ring-white/20",
} as const;

export function Badge({ tone = "neutral", children, className, icon }: { tone?: keyof typeof TONES; children: ReactNode; className?: string; icon?: ReactNode }) {
  return (
    <span className={cn("inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-[0.6875rem] font-bold uppercase tracking-[0.06em] ring-1 ring-inset", TONES[tone], className)}>
      {icon}
      {children}
    </span>
  );
}
