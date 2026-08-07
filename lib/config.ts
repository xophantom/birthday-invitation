/**
 * Se este import falhar com algo como "Module not found: Can't resolve
 * '@/config/event.config'", é porque config/event.config.ts não existe no
 * seu clone — ele carrega dados reais do evento e é ignorado pelo git (ver
 * .gitignore). Copie config/event.config.example.ts para
 * config/event.config.ts e preencha com os dados do seu evento. Não dá
 * para transformar isso num erro em runtime: import estático é resolvido
 * em build-time, antes de qualquer try/catch deste módulo rodar.
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
