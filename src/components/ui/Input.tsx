import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

/**
 * Komponen input reusable dengan label, error state, dan helper text.
 * Mengikuti design tokens dari global.css.
 */
export function Input({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-fg">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`rounded-md border bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent ${
          error ? 'border-error' : 'border-border'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-error">{error}</p>}
      {helperText && !error && <p className="text-xs text-fg-muted">{helperText}</p>}
    </div>
  );
}
