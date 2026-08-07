'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createPhotoRecord } from '@/lib/db/queries/photos'

/**
 * Formato real de uma URL pública do Vercel Blob (conferido em
 * `constructBlobUrl`, @vercel/blob 2.7, com `access: 'public'`):
 * `https://{storeId}.public.blob.vercel-storage.com/{pathname}`. O pathname
 * sempre começa com `photos/` porque é assim que o hook de upload (Task 5)
 * monta o nome do arquivo.
 *
 * Esta regex é a única barreira contra alguém chamando `registerPhoto` por
 * POST direto e apontando o registro para uma URL arbitrária — não é defesa
 * perfeita, é proporcional. Também é o ponto cego mais caro da tarefa: se
 * ela não bater com o formato real, o sintoma vira "a foto sobe com sucesso
 * para o armazenamento, o registro é recusado, e o log só diz 'payload
 * inválido'". Por isso o `refine` abaixo registra a URL recusada e o motivo
 * antes de devolver `false`.
 */
const BLOB_URL_PATTERN = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/photos\//

const blobUrl = z
  .url()
  .refine(
    (value) => {
      const matches = BLOB_URL_PATTERN.test(value)
      if (!matches) {
        console.error(
          'registerPhoto recusou uma URL fora do formato esperado do Blob:',
          value
        )
      }
      return matches
    },
    { error: 'URL fora do armazenamento esperado.' }
  )

const registerPhotoSchema = z.object({
  fullUrl: blobUrl,
  thumbUrl: blobUrl,
  fullPathname: z.string().min(1),
  thumbPathname: z.string().min(1),
  uploadedBy: z.string().trim().max(120).nullable(),
})

export type RegisterPhotoResult = { ok: true } | { ok: false; message: string }

export async function registerPhoto(input: unknown): Promise<RegisterPhotoResult> {
  const parsed = registerPhotoSchema.safeParse(input)

  if (!parsed.success) {
    console.error('registerPhoto recebeu payload inválido:', z.treeifyError(parsed.error))
    return { ok: false, message: 'Não foi possível registrar a foto.' }
  }

  try {
    await createPhotoRecord(parsed.data)
  } catch (error) {
    console.error('Falha ao registrar foto:', error)
    return { ok: false, message: 'Não foi possível registrar a foto.' }
  }

  // Mantém a galeria do admin (Fase 5) atualizada assim que uma foto entra.
  revalidatePath('/admin/fotos')

  return { ok: true }
}
