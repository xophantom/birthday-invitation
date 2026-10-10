import { sql } from 'drizzle-orm'
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
    /**
     * Named by the guest form, one per companion, so `companionsCount` equals
     * its length there. Empty for manual entries and for RSVPs saved before
     * the form asked for names — the count stays the source of the totals.
     */
    companionNames: text('companion_names')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
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
     * One blob, one row. `registerPhoto` is public and unauthenticated (guests
     * don't log in, by design) and doesn't deduplicate: with a single valid
     * URL from our store, a thousand direct POSTs would fill the global cap
     * and break uploads for everyone without transferring a byte. With this
     * constraint, repeating the attack means pushing hundreds of MB over party
     * wifi.
     *
     * No legitimate upload collides: tokens are signed with
     * `addRandomSuffix: true`.
     */
    uniqueIndex('uq_photos_full_pathname').on(table.fullPathname),
  ]
)

export type Rsvp = typeof rsvps.$inferSelect
export type NewRsvp = typeof rsvps.$inferInsert
export type Photo = typeof photos.$inferSelect
export type NewPhoto = typeof photos.$inferInsert
