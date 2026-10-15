"use client";

import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Icon } from "../Icon";

interface BaseProps {
  label: ReactNode;
  error?: string | null;
  hint?: ReactNode;
  required?: boolean;
  /** Show the red asterisk after the label (Figma portal forms). */
  markRequired?: boolean;
  labelClassName?: string;
  inputClassName?: string;
}

type TextFieldProps = BaseProps & Omit<InputHTMLAttributes<HTMLInputElement>, "className">;

export function TextField({ label, error, hint, markRequired, labelClassName, inputClassName = "", id, required, ...input }: TextFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const errId = `${fieldId}-err`;
  const hintId = `${fieldId}-hint`;
  return (
    <div className={`field ${error ? "has-error" : ""}`}>
      <label htmlFor={fieldId} className={labelClassName ?? "field-label"}>
        {label}
        {markRequired ? <span className="req" aria-hidden="true">*</span> : null}
      </label>
      <input
        id={fieldId}
        className={`input ${inputClassName}`}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={[error ? errId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined}
        {...input}
      />
      {error ? (
        <span id={errId} className="field-error">
          <Icon name="alert-triangle" size={13} strokeWidth={2.2} /> {error}
        </span>
      ) : null}
      {hint ? (
        <span id={hintId} className="field-hint">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

type PasswordFieldProps = BaseProps & Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "type">;

export function PasswordField({ label, error, hint, markRequired, labelClassName, inputClassName = "", id, required, ...input }: PasswordFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const errId = `${fieldId}-err`;
  const hintId = `${fieldId}-hint`;
  const [visible, setVisible] = useState(false);
  return (
    <div className={`field ${error ? "has-error" : ""}`}>
      <label htmlFor={fieldId} className={labelClassName ?? "field-label"}>
        {label}
        {markRequired ? <span className="req" aria-hidden="true">*</span> : null}
      </label>
      <div className="input-wrap">
        <input
          id={fieldId}
          type={visible ? "text" : "password"}
          className={`input ${inputClassName}`}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={[error ? errId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined}
          {...input}
        />
        <button
          type="button"
          className="input-icon-btn"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          disabled={input.disabled}
          onClick={() => setVisible((v) => !v)}
        >
          <Icon name={visible ? "eye-off" : "eye"} size={20} />
        </button>
      </div>
      {error ? (
        <span id={errId} className="field-error">
          <Icon name="alert-triangle" size={13} strokeWidth={2.2} /> {error}
        </span>
      ) : null}
      {hint ? (
        <span id={hintId} className="field-hint">
          {hint}
        </span>
      ) : null}
    </div>
  );
}
