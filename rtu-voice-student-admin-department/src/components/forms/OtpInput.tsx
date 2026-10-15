"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";

interface OtpInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  length?: number;
  className?: string;
  boxClassName?: string;
  invalid?: boolean;
  disabled?: boolean;
}

/** Six single-digit boxes with auto-advance, backspace-to-previous and paste support. */
export function OtpInput({ value, onChange, length = 6, className, boxClassName, invalid, disabled }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const setDigit = (i: number, digit: string) => {
    const next = [...value];
    next[i] = digit;
    onChange(next);
  };

  const handleChange = (i: number, raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (!digits) {
      setDigit(i, "");
      return;
    }
    if (digits.length > 1) {
      // Typed fast or autofilled: spread across the following boxes.
      const next = [...value];
      for (let k = 0; k < digits.length && i + k < length; k++) next[i + k] = digits[k];
      onChange(next);
      refs.current[Math.min(i + digits.length, length - 1)]?.focus();
      return;
    }
    setDigit(i, digits);
    if (i < length - 1) refs.current[i + 1]?.focus();
  };

  const handleKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[i] && i > 0) {
      e.preventDefault();
      setDigit(i - 1, "");
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowLeft" && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < length - 1) {
      refs.current[i + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!digits) return;
    e.preventDefault();
    const next = Array.from({ length }, (_, k) => digits[k] ?? "");
    onChange(next);
    refs.current[Math.min(digits.length, length - 1)]?.focus();
  };

  return (
    <div className={className} role="group" aria-label="Verification code">
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className={boxClassName}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          pattern="[0-9]*"
          maxLength={length}
          value={value[i] ?? ""}
          aria-label={`Digit ${i + 1} of ${length}`}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}
