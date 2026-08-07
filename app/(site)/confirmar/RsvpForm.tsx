'use client'

import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FormField } from '@/components/ui/FormField'
import { useRsvpForm } from '@/hooks/use-rsvp-form'

const inputClass =
  'min-h-11 w-full rounded-xl border border-accent/30 bg-surface-deep/60 px-4 text-foreground placeholder:text-foreground/40'

/**
 * O `FormField` renderiza hint e erro com ids derivados do `htmlFor`
 * (`${htmlFor}-hint` e `${htmlFor}-error`) mas não controla o input — quem o
 * passa como children é responsável por apontar para eles. Os dois podem estar
 * visíveis ao mesmo tempo, então `aria-describedby` referencia ambos: escolher
 * só o erro deixaria a orientação de formato, que está na tela, muda para quem
 * usa leitor de tela.
 */
function describedBy(htmlFor: string, hasHint: boolean, hasError: boolean) {
  const ids = [hasHint && `${htmlFor}-hint`, hasError && `${htmlFor}-error`]
  const value = ids.filter(Boolean).join(' ')
  return value || undefined
}

export function RsvpForm() {
  const { form, onSubmit, submitted, serverError } = useRsvpForm()
  const { errors, isSubmitting } = form.formState
  const successRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (submitted) {
      successRef.current?.focus()
    }
  }, [submitted])

  if (submitted) {
    return (
      <Card className="text-center">
        {/*
          Sem role/aria-live aqui: `role="status"` já implica
          `aria-live="polite"` + `aria-atomic`, e o `useEffect` acima move o
          foco para este mesmo nó — o leitor de tela acabava falando a
          confirmação duas vezes, uma como região viva e outra ao receber o
          foco. Mantemos só o gerenciamento de foco, que entrega o texto uma
          vez e ainda deixa o convidado num ponto conhecido da página. Mesma
          solução adotada em `/fotos` (app/(site)/fotos/PhotoUploader.tsx).
        */}
        <div ref={successRef} tabIndex={-1} className="outline-none">
          <p className="font-display text-3xl text-accent-light">Presença confirmada!</p>
          <p className="mt-3 text-foreground/85">
            Que alegria ter você conosco. Nos vemos na festa.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <FormField label="Nome completo" htmlFor="fullName" error={errors.fullName?.message}>
        <input
          id="fullName"
          autoComplete="name"
          aria-invalid={!!errors.fullName}
          aria-describedby={describedBy('fullName', false, !!errors.fullName)}
          className={inputClass}
          {...form.register('fullName')}
        />
      </FormField>

      <FormField label="Telefone" htmlFor="phone" optional error={errors.phone?.message}>
        <input
          id="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          aria-invalid={!!errors.phone}
          aria-describedby={describedBy('phone', false, !!errors.phone)}
          className={inputClass}
          {...form.register('phone')}
        />
      </FormField>

      <FormField
        label="Número de acompanhantes"
        htmlFor="companionsCount"
        optional
        hint="Quantas pessoas vêm com você, sem contar você."
        error={errors.companionsCount?.message}
      >
        <input
          id="companionsCount"
          type="number"
          min={0}
          max={20}
          inputMode="numeric"
          aria-invalid={!!errors.companionsCount}
          aria-describedby={describedBy('companionsCount', true, !!errors.companionsCount)}
          className={inputClass}
          {...form.register('companionsCount')}
        />
      </FormField>

      <FormField label="Recado" htmlFor="message" optional error={errors.message?.message}>
        <textarea
          id="message"
          rows={4}
          placeholder="Tem alguma restrição alimentar? Quer deixar alguma coisa avisada? Deixe o recado aqui."
          aria-invalid={!!errors.message}
          aria-describedby={describedBy('message', false, !!errors.message)}
          className={`${inputClass} min-h-30 py-3`}
          {...form.register('message')}
        />
      </FormField>

      {serverError && (
        <p role="alert" className="text-sm text-danger">
          {serverError}
        </p>
      )}

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? 'Enviando...' : 'Confirmar presença'}
      </Button>
    </form>
  )
}
