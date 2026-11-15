"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";

/**
 * Six boxes for an emailed code. Typing moves along, Backspace moves back, pasting the whole code fills every box,
 * and phones offer the code from the email through autocomplete="one-time-code".
 */
export function CodeInput({ value, onChange, onComplete, disabled }: { value: string; onChange: (v: string) => void; onComplete?: (v: string) => void; disabled?: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? "");

  function set(next: string) {
    const v = next.replace(/\D/g, "").slice(0, 6);
    onChange(v);
    if (v.length === 6) onComplete?.(v);
    refs.current[Math.min(v.length, 5)]?.focus();
  }

  return (
    <div
      className="flex justify-between gap-2"
      onPaste={(e) => {
        const d = e.clipboardData.getData("text").replace(/\D/g, "");
        if (d.length >= 6) {
          e.preventDefault();
          set(d);
        }
      }}
    >
      {digits.map((c, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={c}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={i === 0 ? 6 : 1}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => {
            const typed = e.target.value.replace(/\D/g, "");
            if (typed.length > 1) return set(typed);
            const arr = digits.slice();
            arr[i] = typed;
            const joined = arr.join("");
            onChange(joined);
            if (typed && i < 5) refs.current[i + 1]?.focus();
            if (joined.length === 6 && !arr.includes("")) onComplete?.(joined);
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !c && i > 0) refs.current[i - 1]?.focus();
          }}
          className={cn(
            "h-16 w-full min-w-0 rounded-2xl border-2 bg-white text-center font-bib text-[2rem] text-navy outline-none transition-colors focus:border-forest disabled:opacity-60",
            c ? "border-forest/60" : "border-line",
          )}
        />
      ))}
    </div>
  );
}
