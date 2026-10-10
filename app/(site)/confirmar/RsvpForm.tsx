'use client'

import { useEffect, useRef } from 'react'
import { CompanionsField } from './CompanionsField'
import { describedBy, inputClass } from './field-styles'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FormField } from '@/components/ui/FormField'
import { useRsvpForm } from '@/hooks/use-rsvp-form'

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
        {/* No role/aria-live: the effect above moves focus to this node, so a
            live region would make the screen reader say it twice. Focus alone
            delivers the text once and leaves the guest somewhere known. */}
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

      <CompanionsField form={form} />

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
