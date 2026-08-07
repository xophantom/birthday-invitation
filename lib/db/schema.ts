import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const rsvpSource = pgEnum('rsvp_source', ['guest', 'admin'])
export const rsvpStatus = pgEnum('rsvp_status', ['confirmed', 'removed'])

export const rsvps = pgTable(
  'rsvps',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fullName: text('full_name').notNull(),
    phone: text('phone'),
    companionsCount: integer('companions_count').notNull().default(0),
    message: text('message'),
    source: rsvpSource('source').notNull().default('guest'),
    status: rsvpStatus('status').notNull().default('confirmed'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('idx_rsvps_status').on(table.status)]
)

export const photos = pgTable(
  'photos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fullUrl: text('full_url').notNull(),
    thumbUrl: text('thumb_url').notNull(),
    fullPathname: text('full_pathname').notNull(),
    thumbPathname: text('thumb_pathname').notNull(),
    uploadedBy: text('uploaded_by'),
    isFavorite: boolean('is_favorite').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_photos_created_at').on(table.createdAt),
    /**
     * Um mesmo blob só pode virar uma linha. `registerPhoto` é pública e sem
     * autenticação (o convidado não faz login, por decisão de design) e não
     * deduplica: com uma única URL válida da nossa store — obtível subindo
     * uma foto de verdade pela própria UI — mil POSTs diretos preenchiam o
     * teto global e derrubavam o envio para todos os convidados sem subir um
     * byte. Recuperar disso exigiria apagar linhas ou trocar variável de
     * ambiente e redeployar, às 23h, no meio da festa.
     *
     * Com a constraint, repetir o ataque exige empurrar centenas de MB pelo
     * wifi da festa. Nenhum envio legítimo colide: o token é assinado com
     * `addRandomSuffix: true`, então o Blob acrescenta um sufixo aleatório
     * a cada pathname.
     */
    uniqueIndex('uq_photos_full_pathname').on(table.fullPathname),
  ]
)

export type Rsvp = typeof rsvps.$inferSelect
export type NewRsvp = typeof rsvps.$inferInsert
export type Photo = typeof photos.$inferSelect
export type NewPhoto = typeof photos.$inferInsert
