'use client'

import { useActionState } from 'react'
import type { AdminActionResult } from './action-result'
import { addManualRsvp } from './actions'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FormField } from '@/components/ui/FormField'

/**
 * `resetKey` existe só no cliente e só para limpar os campos.
 *
 * Com `useActionState` os inputs preservam o que foi digitado entre uma
 * submissão e outra, a menos que se controle uma chave de reset — é o que o
 * doc do Next 16 recomenda em `01-app/02-guides/interactive-apps.md`. Sem
 * isso, e sem mensagem de sucesso, o anfitrião no celular (com a tabela
 * abaixo da dobra) não vê sinal nenhum de que salvou, toca "Adicionar" de
 * novo e cria um convidado duplicado que infla a contagem do buffet. E o
 * design proíbe deliberadamente barrar homônimos, então nada impede o
 * duplicado: só aparece o selo "nome repetido".
 */
type AddGuestState = AdminActionResult & { resetKey: number }

const initialState: AddGuestState = { ok: true, resetKey: 0 }
const inputClass =
  'min-h-11 w-full rounded-xl border border-accent/30 bg-surface/60 px-4 text-foreground'

export function AddGuestForm() {
  const [state, action, pending] = useActionState(
    async (previous: AddGuestState, formData: FormData): Promise<AddGuestState> => {
      const result = await addManualRsvp(previous, formData)

      // Só limpa quando de fato gravou: em caso de erro o que foi digitado
      // continua na tela para o anfitrião corrigir, em vez de sumir.
      return { ...result, resetKey: result.ok ? previous.resetKey + 1 : previous.resetKey }
    },
    initialState
  )

  return (
    <Card>
      <h2 className="font-display text-xl text-accent-light">Adicionar confirmação</h2>
      <p className="mt-1 text-sm text-foreground/60">
        Para quem confirmou por telefone ou WhatsApp.
      </p>

      <form action={action} className="mt-4 flex flex-col gap-4">
        {/* Remontar esta div é o que zera os campos: a chave muda só no sucesso. */}
        <div key={state.resetKey} className="grid gap-3 sm:grid-cols-2">
          <FormField label="Nome completo" htmlFor="fullName">
            <input id="fullName" name="fullName" className={inputClass} required />
          </FormField>

          <FormField label="Telefone" htmlFor="phone" optional>
            <input id="phone" name="phone" type="tel" className={inputClass} />
          </FormField>

          <FormField
            label="Acompanhantes"
            htmlFor="companionsCount"
            hint="Quantas pessoas vêm além do convidado."
          >
            <input
              id="companionsCount"
              name="companionsCount"
              type="number"
              min={0}
              max={20}
              defaultValue={0}
              aria-describedby="companionsCount-hint"
              className={inputClass}
            />
          </FormField>

          <FormField label="Recado" htmlFor="message" optional>
            <input id="message" name="message" className={inputClass} />
          </FormField>
        </div>

        <div>
          <Button type="submit" disabled={pending}>
            {pending ? 'Salvando...' : 'Adicionar'}
          </Button>

          {/* Sucesso e erro são elementos distintos de propósito: trocar só o
              texto (ou só o `role`) de um mesmo <p> não faz o leitor de tela
              anunciar de novo. Montar/desmontar faz. */}
          {state.message &&
            (state.ok ? (
              <p role="status" className="mt-2 text-sm text-highlight">
                {state.message}
              </p>
            ) : (
              <p role="alert" className="mt-2 text-sm text-danger">
                {state.message}
              </p>
            ))}
        </div>
      </form>
    </Card>
  )
}
