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
 * Contrato de acessibilidade para quem passa o input em `children`: hint e
 * erro são renderizados de forma independente e podem coexistir na tela —
 * não é uma escolha exclusiva entre um e outro. Por isso `aria-describedby`
 * deve referenciar os dois ids quando ambos estiverem presentes (por
 * exemplo `"${htmlFor}-hint ${htmlFor}-error"`, separados por espaço), e só
 * o(s) que existirem quando houver apenas um. `errorId` é `${htmlFor}-error`
 * e `hintId` é `${htmlFor}-hint` — os mesmos ids que este componente usa nos
 * `<p>` de hint e erro. Quem consome também deve passar
 * `aria-invalid={!!error}` no input.
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
