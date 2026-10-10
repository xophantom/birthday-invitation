'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { createRsvp } from '@/app/(site)/confirmar/actions'
import { RSVP_SUBMIT_ERROR_MESSAGE, rsvpFormSchema, type RsvpFormValues } from '@/lib/validation/rsvp'

export function useRsvpForm() {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm({
    resolver: zodResolver(rsvpFormSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      companions: [],
      message: '',
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null)

    let result: Awaited<ReturnType<typeof createRsvp>>
    try {
      result = await createRsvp(values)
    } catch (error) {
      // The Server Action already catches write failures, so this covers what
      // is left: a network failure reaching it, or an error before it returns.
      // Without it, React Hook Form rethrows after clearing `isSubmitting`,
      // silently leaving the guest with no sign the RSVP wasn't saved.
      console.error('Falha ao chamar createRsvp:', error)
      setServerError(RSVP_SUBMIT_ERROR_MESSAGE)
      return
    }

    if (result.ok) {
      setSubmitted(true)
      return
    }

    setServerError(result.message)

    for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
      if (messages?.[0]) {
        form.setError(field as keyof RsvpFormValues, { message: messages[0] })
      }
    }
  })

  return { form, onSubmit, submitted, serverError }
}
