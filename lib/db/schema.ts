import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
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
  (table) => [index('idx_photos_created_at').on(table.createdAt)]
)

export type Rsvp = typeof rsvps.$inferSelect
export type NewRsvp = typeof rsvps.$inferInsert
export type Photo = typeof photos.$inferSelect
export type NewPhoto = typeof photos.$inferInsert
