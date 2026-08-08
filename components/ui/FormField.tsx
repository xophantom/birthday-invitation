import type { ReactNode } from 'react'

type FormFieldProps = {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  optional?: boolean
  children: ReactNode
}

/**
 * Accessibility contract for whoever passes the input as `children`: hint and
 * error render independently and can coexist, so `aria-describedby` must list
 * every id present — `${htmlFor}-hint` and/or `${htmlFor}-error`, space
 * separated. Consumers must also set `aria-invalid={!!error}`.
 */
export function FormField({
  label,
  htmlFor,
  error,
  hint,
  optional,
  children,
}: FormFieldProps) {
  const hintId = `${htmlFor}-hint`
  const errorId = `${htmlFor}-error`

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="font-sans text-sm text-foreground">
        {label}
        {optional && <span className="ml-1 text-foreground/65">(opcional)</span>}
      </label>
      {children}
      {hint && (
        <p id={hintId} className="text-xs text-foreground/60">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
