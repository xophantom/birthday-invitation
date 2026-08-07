import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'
import { getEventConfig } from '@/lib/config'
import { countPhotos } from '@/lib/db/queries/photos'
import { getPhotosGlobalLimit, PHOTOS_LIMIT_REACHED_MESSAGE } from '@/lib/photos/global-limit'

/** Mensagem do erro esperado (teto de armazenamento) — usada para distingui-lo
 * de qualquer falha inesperada no catch abaixo, sem repetir o texto.
 * Compartilhada com a Server Action de registro (Task 5,
 * `app/(site)/fotos/actions.ts`), que replica este mesmo teto — ver
 * `lib/photos/global-limit.ts`. */
const LIMITE_ATINGIDO_MESSAGE = PHOTOS_LIMIT_REACHED_MESSAGE

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as HandleUploadBody
    const config = getEventConfig()

    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // countPhotos() conta registros da tabela `photos`, e cada registro
        // representa um par full+thumb. O teto abaixo já foi dimensionado
        // nessa mesma unidade (pares), então a comparação é direta.
        const total = await countPhotos()

        if (total >= getPhotosGlobalLimit()) {
          throw new Error(LIMITE_ATINGIDO_MESSAGE)
        }

        return {
          allowedContentTypes: ['image/jpeg'],
          addRandomSuffix: true,
          maximumSizeInBytes: config.photos.maxFileSizeMb * 1024 * 1024,
        }
      },
      onUploadCompleted: async () => {
        // Intencionalmente vazio. O registro no banco acontece em
        // registerPhoto(), porque este callback não dispara em localhost sem
        // túnel e chega por arquivo — o que quebraria o pareamento full+thumb.
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Falha ao emitir token de upload:', error)

    // Só repassa a mensagem do erro quando é o teto de armazenamento que
    // nós mesmos lançamos acima — qualquer outra falha (JSON inválido,
    // config do evento quebrada, erro interno do SDK do Blob) usa uma
    // mensagem genérica em pt-BR, para não vazar detalhe interno ao convidado.
    const message =
      error instanceof Error && error.message === LIMITE_ATINGIDO_MESSAGE
        ? error.message
        : 'Não foi possível iniciar o envio.'

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
