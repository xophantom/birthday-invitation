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
      {/*
        Região viva persistente (nunca desmontada) — mesma solução documentada
        em app/(site)/fotos/PhotoUploader.tsx. O <p> de sucesso/erro abaixo só
        passa a existir quando `state.message` já tem valor: montar a região
        viva no mesmo instante em que o texto aparece é o caso que a própria
        PhotoUploader documenta como não garantido em todo leitor de tela.
        Aqui a região existe desde o primeiro paint e só o texto muda depois.

        O prefixo "Sucesso:"/"Erro:" é o mesmo do texto visível abaixo, e é
        anunciado de propósito: a distinção entre os dois estados foi criada
        justamente para quem não distingue as cores `text-highlight` e
        `text-danger`, então anunciar a mensagem crua devolvia o problema
        inteiro a quem usa leitor de tela.
      */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {state.message ? `${state.ok ? 'Sucesso' : 'Erro'}: ${state.message}` : ''}
      </div>

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

          {/*
            Sem role/aria-live aqui: a região viva persistente lá em cima já
            anuncia o texto assim que `state.message` muda — duplicar o canal
            aqui faria o leitor de tela falar duas vezes. Sucesso e erro
            continuam elementos visuais distintos, mas agora também se
            diferenciam por prefixo e borda, não só pela cor (`text-highlight`
            vs `text-danger`), para quem não distingue cores.
          */}
          {state.message &&
            (state.ok ? (
              <p className="mt-2 border-l-2 border-highlight pl-2 text-sm text-highlight">
                <span className="font-medium">Sucesso:</span> {state.message}
              </p>
            ) : (
              <p className="mt-2 border-l-2 border-danger pl-2 text-sm text-danger">
                <span className="font-medium">Erro:</span> {state.message}
              </p>
            ))}
        </div>
      </form>
    </Card>
  )
}
