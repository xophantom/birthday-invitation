'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { countPhotos, createPhotoRecord } from '@/lib/db/queries/photos'
import { getPhotosGlobalLimit, PHOTOS_LIMIT_REACHED_MESSAGE } from '@/lib/photos/global-limit'
import { isPhotosPathname, PHOTOS_PATHNAME_PREFIX } from '@/lib/photos/pathname'

/**
 * Escapa caracteres especiais de regex antes de interpolar um valor dinâmico
 * num `new RegExp(...)`. Sem isso, um id de store que por acaso contivesse
 * um metacaractere de regex mudaria o significado do padrão em vez de ser
 * tratado como texto literal.
 */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Deriva o id da nossa store a partir de `BLOB_READ_WRITE_TOKEN`, do mesmo
 * jeito que o SDK faz internamente (`parseStoreIdFromReadWriteToken`,
 * @vercel/blob 2.7 — conferido em
 * `node_modules/@vercel/blob/dist/chunk-OYCIHDFF.js`): o token tem o formato
 * `vercel_blob_rw_<storeId>_<segredo>`, e o storeId é o quarto segmento
 * separado por `_` (índice 3, 0-based). Normalizado para minúsculas porque
 * é comparado como texto literal contra um hostname, e hostname é
 * case-insensitive por especificação.
 *
 * Sem o id real da store não há como confirmar que uma URL pertence ao
 * nosso armazenamento — o brief desta tarefa assume que "o pior caso
 * restante é um registro apontando para um blob real do próprio store", o
 * que só é verdade se o store estiver fixado na validação. Por isso, token
 * ausente ou em formato inesperado devolve `null`, nunca um curinga que
 * aceitaria qualquer store: cada chamador que recebe `null` recusa a URL e
 * loga o motivo (ver `blobUrl` abaixo) — nunca aceita tudo, nunca falha em
 * silêncio.
 *
 * A leitura fica atrás de uma função, não em escopo de módulo — mesmo
 * raciocínio do cliente de banco em `lib/db/index.ts`: adia a leitura do
 * ambiente para o momento em que ela é necessária (inclusive porque a
 * variável pode não existir em todo contexto em que este módulo é
 * importado, como o build).
 *
 * **Só o resultado positivo é cacheado.** Cachear também o `null` fazia a
 * primeira chamada de um processo que rodasse sem `BLOB_READ_WRITE_TOKEN`
 * condenar *todo* `registerPhoto` daquela instância a recusar para sempre,
 * mesmo depois de o ambiente voltar ao normal — e o sintoma seria o pior
 * possível: 2 blobs órfãos e 0 linhas por foto, em silêncio para o
 * convidado, com o teto global (que conta linhas) nunca disparando para
 * conter o estrago. O que o cache economizava era um `split` numa função
 * que faz round-trip de banco logo em seguida.
 */
let cachedStoreId: string | undefined

function getBlobStoreId(): string | null {
  if (cachedStoreId === undefined) {
    const token = process.env.BLOB_READ_WRITE_TOKEN
    const storeId = token?.split('_')[3]?.toLowerCase()

    if (!storeId) return null

    cachedStoreId = storeId
  }
  return cachedStoreId
}

/**
 * Formato real de uma URL pública do Vercel Blob (conferido em
 * `constructBlobUrl`, @vercel/blob 2.7, com `access: 'public'`):
 * `https://{storeId}.public.blob.vercel-storage.com/{pathname}`. Fixado no
 * id real da nossa store (`getBlobStoreId`) — sem isso, a regex batia com o
 * subdomínio de *qualquer* store pública do Vercel Blob, e um chamador
 * hostil podia criar a própria store, subir o que quisesse sob `photos/` e
 * registrar a URL aqui como se fosse nossa. Comparação de hostname é
 * case-insensitive (flag `i`) porque hostname é case-insensitive por
 * especificação.
 *
 * A validação de URL é o ponto cego mais caro desta tarefa: se a regex não
 * bater com o formato real, o sintoma vira "a foto sobe com sucesso para o
 * armazenamento, o registro é recusado, e o log só diz 'payload inválido'".
 * Por isso o `refine` abaixo sempre registra a URL recusada e o motivo antes
 * de devolver `false` — a mensagem devolvida ao convidado continua genérica.
 */
const blobUrl = z
  .url()
  .refine(
    (value) => {
      const storeId = getBlobStoreId()

      if (!storeId) {
        console.error(
          'registerPhoto recusou uma URL porque BLOB_READ_WRITE_TOKEN está ausente ou em formato inesperado — sem o id da store não é possível confirmar a origem da URL:',
          value
        )
        return false
      }

      const pattern = new RegExp(
        `^https://${escapeRegExp(storeId)}\\.public\\.blob\\.vercel-storage\\.com/${PHOTOS_PATHNAME_PREFIX}`,
        'i'
      )
      const matches = pattern.test(value)

      if (!matches) {
        console.error('registerPhoto recusou uma URL fora do formato esperado do Blob:', value)
      }

      return matches
    },
    { error: 'URL fora do armazenamento esperado.' }
  )

/**
 * O pathname existe para a Fase 5 apagar o blob (`del(pathname)`) quando o
 * admin excluir uma foto — um pathname escolhido por um chamador hostil
 * apagaria qualquer blob da store, não só fotos. Por isso exige o prefixo
 * `photos/` aqui e, no schema abaixo, que o pathname corresponda de fato à
 * URL do mesmo par (`pathnameMatchesUrl`) — o prefixo sozinho não impede um
 * pathname que aponte para outro blob real dentro de `photos/`; as duas
 * checagens juntas são necessárias. A checagem do prefixo é a mesma função
 * usada pela rota que assina o token (`lib/photos/pathname.ts`), para as
 * duas metades desta defesa não poderem divergir.
 */
const blobPathname = z
  .string()
  .min(1)
  .refine(
    (value) => {
      const matches = isPhotosPathname(value)
      if (!matches) {
        console.error('registerPhoto recusou um pathname fora do prefixo esperado:', value)
      }
      return matches
    },
    { error: 'Caminho fora do armazenamento esperado.' }
  )

/**
 * `pathname` (sem barra inicial) é sempre o final de `url` — é assim que o
 * SDK monta a URL (`constructBlobUrl`: host + "/" + pathname). Confirma que
 * quem chamou a action não mandou um pathname de um blob diferente do que a
 * URL aponta.
 */
function pathnameMatchesUrl(url: string, pathname: string): boolean {
  let actualPathname: string
  try {
    actualPathname = new URL(url).pathname
  } catch {
    return false
  }

  const matches = actualPathname === `/${pathname}`
  if (!matches) {
    console.error('registerPhoto recusou um pathname que não corresponde à URL informada:', {
      url,
      pathname,
    })
  }
  return matches
}

const registerPhotoSchema = z
  .object({
    fullUrl: blobUrl,
    thumbUrl: blobUrl,
    fullPathname: blobPathname,
    thumbPathname: blobPathname,
    uploadedBy: z.string().trim().max(120).nullable(),
  })
  .refine((data) => pathnameMatchesUrl(data.fullUrl, data.fullPathname), {
    error: 'O caminho da foto não corresponde à URL informada.',
  })
  .refine((data) => pathnameMatchesUrl(data.thumbUrl, data.thumbPathname), {
    error: 'O caminho da miniatura não corresponde à URL informada.',
  })

export type RegisterPhotoResult = { ok: true } | { ok: false; message: string }

export async function registerPhoto(input: unknown): Promise<RegisterPhotoResult> {
  const parsed = registerPhotoSchema.safeParse(input)

  if (!parsed.success) {
    console.error('registerPhoto recebeu payload inválido:', z.treeifyError(parsed.error))
    return { ok: false, message: 'Não foi possível registrar a foto.' }
  }

  try {
    // Replica o teto global da rota de upload (Task 3, mesma regra —
    // `lib/photos/global-limit.ts`). Aquela rota só barra quem tenta *subir
    // o arquivo*; esta action é alcançável direto por POST, sem passar pelo
    // Blob. Sem esta checagem, um POST direto insere registros sem limite
    // (payload pequeno, nenhum byte sobe) e derruba o teto para os
    // convidados de verdade que ainda estão tentando enviar foto.
    const total = await countPhotos()

    if (total >= getPhotosGlobalLimit()) {
      console.error('registerPhoto recusado: teto global de fotos atingido.')
      return { ok: false, message: PHOTOS_LIMIT_REACHED_MESSAGE }
    }

    await createPhotoRecord(parsed.data)
  } catch (error) {
    console.error('Falha ao registrar foto:', error)
    return { ok: false, message: 'Não foi possível registrar a foto.' }
  }

  // Mantém a galeria do admin (Fase 5) atualizada assim que uma foto entra.
  revalidatePath('/admin/fotos')

  return { ok: true }
}
