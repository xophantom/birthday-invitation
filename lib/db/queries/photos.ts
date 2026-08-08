import 'server-only'
import { desc, eq, sql } from 'drizzle-orm'
import { db, photos, type NewPhoto, type Photo } from '@/lib/db'
import { UUID_PATTERN } from '@/lib/validation/uuid'

export async function createPhotoRecord(input: NewPhoto): Promise<Photo> {
  const [created] = await db.insert(photos).values(input).returning()
  return created
}

export async function countPhotos(): Promise<number> {
  const total = await db.$count(photos)
  return total
}

export async function listPhotos({
  limit,
  cursor,
}: {
  limit: number
  cursor?: string
}): Promise<{ items: Photo[]; nextCursor: string | null }> {
  // An invalid cursor is ignored, falling back to the first page.
  const isValidCursor = !cursor || UUID_PATTERN.test(cursor)

  if (!isValidCursor) {
    cursor = undefined
  }

  // Tuple comparison keeps timestamp precision inside Postgres, where
  // microseconds are never lost. If the cursor row was deleted between pages
  // the subquery is empty, the comparison is NULL and the page comes back
  // empty — accepted behaviour.
  const cursorRow = cursor
    ? db
        .select({ createdAt: photos.createdAt, id: photos.id })
        .from(photos)
        .where(eq(photos.id, cursor))
        .as('cursor_row')
    : undefined

  // One extra row tells us whether a next page exists, without a count query.
  const rows = await db
    .select()
    .from(photos)
    .where(
      cursorRow
        ? sql`(${photos.createdAt}, ${photos.id}) < (SELECT ${cursorRow.createdAt}, ${cursorRow.id} FROM ${cursorRow})`
        : undefined
    )
    .orderBy(desc(photos.createdAt), desc(photos.id))
    .limit(limit + 1)

  const items = rows.slice(0, limit)
  const nextCursor = rows.length > limit ? items[items.length - 1].id : null

  return { items, nextCursor }
}

export async function togglePhotoFavorite(id: string, isFavorite: boolean): Promise<void> {
  await db.update(photos).set({ isFavorite }).where(eq(photos.id, id))
}

export async function listFavoritePhotos(): Promise<Photo[]> {
  return db
    .select()
    .from(photos)
    .where(eq(photos.isFavorite, true))
    .orderBy(desc(photos.createdAt))
}
