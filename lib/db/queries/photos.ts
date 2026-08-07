import 'server-only'
import { desc, eq, sql } from 'drizzle-orm'
import { db, photos, type NewPhoto, type Photo } from '@/lib/db'
import { UUID_PATTERN } from '@/lib/validation/uuid'

export async function createPhotoRecord(input: NewPhoto): Promise<Photo> {
  const [created] = await db.insert(photos).values(input).returning()
  return created
}

export async function countPhotos(): Promise<number> {
  // `db.$count` devolve o número de linhas, não as linhas.
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
  // Valida cursor como UUID. Cursor inválido é ignorado e volta à primeira página.
  const isValidCursor = !cursor || UUID_PATTERN.test(cursor)

  if (!isValidCursor) {
    cursor = undefined
  }

  // Comparação de tupla no Postgres: (createdAt, id) < (createdAt_cursor, id_cursor).
  // Resolve a precisão de timestamp dentro do banco, onde microssegundos nunca são perdidos.
  // Nota: se a linha do cursor foi apagada entre páginas, a subconsulta retorna vazio,
  // a comparação fica NULL e a página sai vazia — comportamento aceito.
  const cursorRow = cursor
    ? db
        .select({ createdAt: photos.createdAt, id: photos.id })
        .from(photos)
        .where(eq(photos.id, cursor))
        .as('cursor_row')
    : undefined

  // Busca um item a mais para saber se existe próxima página sem fazer count.
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
