import { z } from 'zod'

export const eventConfigSchema = z.object({
  celebrant: z.object({
    name: z.string().min(1),
    monogram: z.string().min(1).max(3),
    age: z.number().int().positive(),
  }),
  event: z.object({
    /** ISO 8601 com offset. Ex.: 2026-12-11T19:00:00-03:00 */
    startsAt: z.iso.datetime({ offset: true }),
    timeZone: z.string().min(1),
  }),
  venue: z.object({
    name: z.string().min(1),
    address: z.string().min(1),
    mapsQuery: z.string().min(1),
    notes: z.array(z.string()),
  }),
  guide: z.array(z.string()).min(1),
  gifts: z.object({
    clothingSize: z.string().nullable(),
    shoeSize: z.string().nullable(),
    preferences: z.array(z.string()),
    pixKey: z.string().nullable(),
  }),
  dressCode: z.object({
    avoid: z.array(z.string()).min(1),
    reason: z.string().min(1),
  }),
  theme: z.object({
    colors: z.object({
      surface: z.string(),
      surfaceDeep: z.string(),
      highlight: z.string(),
      accent: z.string(),
      accentLight: z.string(),
      foreground: z.string(),
    }),
    poster: z.string().min(1),
  }),
  media: z.object({
    /** null enquanto o arquivo não existir — a UI se adapta sozinha */
    openingVideo: z.string().nullable(),
    soundtrack: z.string().nullable(),
  }),
  photos: z.object({
    maxPerUpload: z.number().int().positive(),
    maxFileSizeMb: z.number().positive(),
  }),
})

export type EventConfig = z.infer<typeof eventConfigSchema>
