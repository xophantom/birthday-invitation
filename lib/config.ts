/**
 * Único ponto de leitura da config do evento: valida a instância contra o
 * contrato de config/event.schema.ts antes de qualquer consumidor vê-la, e
 * cacheia o resultado. Nenhum componente importa config/event.config.ts
 * direto, então é aqui que uma config malformada estoura — e como as páginas
 * do convite são pré-renderizadas, ela estoura no build, não na festa.
 */
import { z } from 'zod'
import { eventConfig } from '@/config/event.config'
import { eventConfigSchema, type EventConfig } from '@/config/event.schema'

let cached: EventConfig | null = null

export function getEventConfig(): EventConfig {
  if (cached) return cached

  const result = eventConfigSchema.safeParse(eventConfig)
  if (!result.success) {
    throw new Error(
      `config/event.config.ts inválido:\n${JSON.stringify(z.treeifyError(result.error), null, 2)}`
    )
  }

  cached = result.data
  return cached
}
