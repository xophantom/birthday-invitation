import 'server-only'
import { and, desc, eq, lt, or } from 'drizzle-orm'
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
  let where: ReturnType<typeof or | typeof lt> | undefined

  // Decodifica cursor composto (createdAt|id) se fornecido.
  // Cursor malformado é ignorado e retorna à primeira página.
  if (cursor) {
    const [cursorCreatedAtISO, cursorId] = cursor.split('|')
    const cursorCreatedAt = new Date(cursorCreatedAtISO)

    // Se cursor não puder ser desserializado, ignora e volta à primeira página.
    if (isNaN(cursorCreatedAt.getTime()) || !cursorId) {
      where = undefined
    } else {
      // Comparação composta para evitar colisão de timestamps em milissegundos:
      // retorna fotos com (createdAt < cursorCreatedAt) OU
      // (createdAt == cursorCreatedAt E id < cursorId)
      where = or(
        lt(photos.createdAt, cursorCreatedAt),
        and(eq(photos.createdAt, cursorCreatedAt), lt(photos.id, cursorId))
      )
    }
  }

  // Busca um item a mais para saber se existe próxima página sem fazer count.
  const rows = await db
    .select()
    .from(photos)
    .where(where)
    .orderBy(desc(photos.createdAt), desc(photos.id))
    .limit(limit + 1)

  const items = rows.slice(0, limit)
  const nextCursor =
    rows.length > limit
      ? `${items[items.length - 1].createdAt.toISOString()}|${items[items.length - 1].id}`
      : null

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
