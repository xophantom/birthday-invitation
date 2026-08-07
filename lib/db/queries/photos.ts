import 'server-only'
import { desc, eq, lt } from 'drizzle-orm'
import { db, photos, type NewPhoto, type Photo } from '@/lib/db'

export async function createPhotoRecord(input: NewPhoto): Promise<Photo> {
  const [created] = await db.insert(photos).values(input).returning()
  return created
}

export async function countPhotos(): Promise<number> {
  const rows = await db.$count(photos)
  return rows
}

export async function listPhotos({
  limit,
  cursor,
}: {
  limit: number
  cursor?: string
}): Promise<{ items: Photo[]; nextCursor: string | null }> {
  const where = cursor ? lt(photos.createdAt, new Date(cursor)) : undefined

  // Busca um item a mais para saber se existe próxima página sem fazer count.
  const rows = await db
    .select()
    .from(photos)
    .where(where)
    .orderBy(desc(photos.createdAt))
    .limit(limit + 1)

  const items = rows.slice(0, limit)
  const nextCursor =
    rows.length > limit ? items[items.length - 1].createdAt.toISOString() : null

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
