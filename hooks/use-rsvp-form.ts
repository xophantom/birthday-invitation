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
      companionsCount: 0,
      message: '',
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null)

    let result: Awaited<ReturnType<typeof createRsvp>>
    try {
      result = await createRsvp(values)
    } catch (error) {
      // A própria Server Action já captura falhas de gravação (Task 4) e o
      // erro de banco (DATABASE_URL ausente etc.) só surge dentro daquele
      // try/catch, já que a criação do cliente é preguiçosa (lib/db/index.ts).
      // Este catch é defesa em profundidade para o que sobrar: falha de rede
      // ao chamar a Server Action, erro inesperado antes dela retornar, etc.
      // Sem isto, o React Hook Form relança o erro depois de zerar
      // `isSubmitting` (silenciosamente, sem mexer no estado do formulário) e
      // o convidado fica sem nenhum retorno visual de que a confirmação não
      // foi salva.
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
