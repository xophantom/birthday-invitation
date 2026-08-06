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
