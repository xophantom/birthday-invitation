import type { ReactNode } from 'react'

type FormFieldProps = {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  optional?: boolean
  children: ReactNode
}

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  optional,
  children,
}: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="font-sans text-sm text-creme">
        {label}
        {optional && <span className="ml-1 text-creme/50">(opcional)</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-creme/60">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs text-erro">
          {error}
        </p>
      )}
    </div>
  )
}
