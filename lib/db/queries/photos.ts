import 'server-only'
import { desc, eq, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
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
  // Valida cursor como UUID. Cursor inválido é ignorado e volta à primeira página.
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const isValidCursor = !cursor || uuidRegex.test(cursor)

  if (!isValidCursor) {
    cursor = undefined
  }

  // Comparação de tupla no Postgres: (createdAt, id) < (createdAt_cursor, id_cursor).
  // Resolve a precisão de timestamp dentro do banco, onde microssegundos nunca são perdidos.
  // Nota: se a linha do cursor foi apagada entre páginas, a subconsulta retorna NULL
  // e a comparação fica NULL — a página sai vazia, o que é aceito.
  const cursorRow = alias(photos, 'cursor_row')
  const query = cursor
    ? db
        .select()
        .from(photos)
        .where(
          sql`(${photos.createdAt}, ${photos.id}) < (
            SELECT ${cursorRow.createdAt}, ${cursorRow.id} FROM ${cursorRow}
            WHERE ${eq(cursorRow.id, cursor)}
          )`
        )
        .orderBy(desc(photos.createdAt), desc(photos.id))
        .limit(limit + 1)
    : db
        .select()
        .from(photos)
        .orderBy(desc(photos.createdAt), desc(photos.id))
        .limit(limit + 1)

  // Busca um item a mais para saber se existe próxima página sem fazer count.
  const rows = await query

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
