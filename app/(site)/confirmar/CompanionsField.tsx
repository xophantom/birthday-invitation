'use client'

import { useEffect, useRef } from 'react'
import { useFieldArray } from 'react-hook-form'
import { describedBy, inputClass } from './field-styles'
import { FormField } from '@/components/ui/FormField'
import type { useRsvpForm } from '@/hooks/use-rsvp-form'
import { MAX_COMPANIONS } from '@/lib/validation/rsvp'

type RsvpForm = ReturnType<typeof useRsvpForm>['form']

/**
 * One full-name field per companion, added with the "+" button, instead of a
 * number box: the hosts need to know who is coming, not just how many.
 */
export function CompanionsField({ form }: { form: RsvpForm }) {
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'companions' })
  const errors = form.formState.errors.companions
  const addButtonRef = useRef<HTMLButtonElement>(null)
  // Where focus lands once a removal has re-rendered the list: the row before
  // the removed one, or the add button (-1) when the list empties. Without it,
  // removing a row takes its focused button with it and drops focus to <body>.
  const focusAfterRemove = useRef<number | null>(null)

  useEffect(() => {
    const target = focusAfterRemove.current
    if (target === null) return
    focusAfterRemove.current = null
    if (target < 0) addButtonRef.current?.focus()
    else form.setFocus(`companions.${target}.fullName`)
  }, [fields, form])

  function handleRemove(index: number) {
    focusAfterRemove.current = fields.length > 1 ? Math.max(0, index - 1) : -1
    remove(index)
  }

  // Set by the server action's fallback or a list-level rule (the maximum),
  // not tied to any single row.
  const listError = errors?.message ?? errors?.root?.message

  return (
    <fieldset aria-describedby="companions-hint" className="flex flex-col gap-3">
      <legend className="mb-2 font-sans text-sm text-foreground">
        Acompanhantes
        <span className="ml-1 text-foreground/65">(opcional)</span>
      </legend>
      <p id="companions-hint" className="text-xs text-foreground/60">
        Vem alguém com você? Adicione cada pessoa pelo nome completo.
      </p>

      {fields.length > 0 && (
        <ul className="flex flex-col gap-4">
          {fields.map((field, index) => {
            const id = `companion-${index}`
            const error = errors?.[index]?.fullName?.message

            return (
              <li key={field.id}>
                <FormField label={`Acompanhante ${index + 1}`} htmlFor={id} error={error}>
                  <div className="flex items-center gap-2">
                    <input
                      id={id}
                      placeholder="Nome completo"
                      autoComplete="off"
                      aria-invalid={!!error}
                      aria-describedby={describedBy(id, false, !!error)}
                      className={inputClass}
                      {...form.register(`companions.${index}.fullName`)}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemove(index)}
                      aria-label={`Remover acompanhante ${index + 1}`}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-danger/10 hover:text-danger"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5">
                        <path
                          d="M6 6l12 12M18 6L6 18"
                          stroke="currentColor"
                          strokeWidth={1.8}
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>
                </FormField>
              </li>
            )
          })}
        </ul>
      )}

      {fields.length < MAX_COMPANIONS && (
        <button
          ref={addButtonRef}
          type="button"
          // append() focuses the new row's input on its own.
          onClick={() => append({ fullName: '' })}
          className="group inline-flex min-h-11 items-center gap-3 self-start rounded-full pr-4 text-sm text-accent-light"
        >
          <span
            aria-hidden
            className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/50 bg-surface/70 transition-colors group-hover:border-accent group-hover:bg-surface"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
            </svg>
          </span>
          Adicionar acompanhante
        </button>
      )}

      {listError && (
        <p role="alert" className="text-xs text-danger">
          {listError}
        </p>
      )}
    </fieldset>
  )
}
