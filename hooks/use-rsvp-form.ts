'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { createRsvp } from '@/app/(site)/confirmar/actions'
import { rsvpFormSchema, type RsvpFormValues } from '@/lib/validation/rsvp'

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
      // A própria Server Action já captura falhas de gravação (Task 4). Este
      // catch cobre o que sobra: a chamada nem chegou a rodar o corpo da
      // action — por exemplo, DATABASE_URL ausente derruba o módulo do banco
      // no carregamento, antes do try/catch interno existir. Sem isto, o
      // React Hook Form relança o erro depois de zerar `isSubmitting`
      // (silenciosamente, sem mexer no estado do formulário) e o convidado
      // fica sem nenhum retorno visual de que a confirmação não foi salva.
      console.error('Falha ao chamar createRsvp:', error)
      setServerError('Não conseguimos registrar sua confirmação. Tente novamente em instantes.')
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
