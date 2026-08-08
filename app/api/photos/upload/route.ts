import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'
import { countPhotos } from '@/lib/db/queries/photos'
import { getPhotosGlobalLimit, PHOTOS_LIMIT_REACHED_MESSAGE } from '@/lib/photos/global-limit'
import { isPhotosPathname, PHOTOS_PATHNAME_PREFIX } from '@/lib/photos/pathname'

const LIMITE_ATINGIDO_MESSAGE = PHOTOS_LIMIT_REACHED_MESSAGE

const CAMINHO_INVALIDO_MESSAGE = `O caminho de envio precisa começar com "${PHOTOS_PATHNAME_PREFIX}".`

/** The only messages the catch below passes through verbatim. */
const MENSAGENS_ESPERADAS: readonly string[] = [LIMITE_ATINGIDO_MESSAGE, CAMINHO_INVALIDO_MESSAGE]

/**
 * Byte cap on what the browser actually uploads — the output of
 * `use-image-compression.ts`, not the photo the guest picked.
 *
 * Not to be confused with `config.photos.maxFileSizeMb` (15MB), which caps the
 * *original* on the client. This is the only byte barrier on the public
 * surface, so it is sized against compressed output (~1MB for a 2048px JPEG at
 * quality 0.83). Signing tokens for 15MB would let ~35 pairs blow the whole
 * 1GB storage budget.
 */
const MAX_UPLOAD_BYTES = 6 * 1024 * 1024

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as HandleUploadBody

    // No `onUploadCompleted`: the DB row is written by `registerPhoto()`,
    // because the Blob callback never fires on localhost without a tunnel and
    // arrives *per file*, which would break full+thumb pairing.
    //
    // Not even declared empty — the SDK derives a `callbackUrl` whenever the
    // function exists, so Blob would POST back to this route twice per photo
    // just to run a no-op (and hit 401 under Deployment Protection).
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // The token signs *where* the caller may write. Without this, anyone
        // could get a token for any path in the store — and blobs outside
        // `photos/` never become rows, so the row-counting cap below would
        // never see that storage being consumed.
        if (!isPhotosPathname(pathname)) {
          console.error('Token de upload recusado: caminho fora do prefixo esperado:', pathname)
          throw new Error(CAMINHO_INVALIDO_MESSAGE)
        }

        // Both sides are in full+thumb pairs: one `photos` row is one pair.
        const total = await countPhotos()

        if (total >= getPhotosGlobalLimit()) {
          throw new Error(LIMITE_ATINGIDO_MESSAGE)
        }

        return {
          allowedContentTypes: ['image/jpeg'],
          addRandomSuffix: true,
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
        }
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Falha ao emitir token de upload:', error)

    // Only our own messages are forwarded; anything else (bad JSON, an SDK
    // internal) falls back to a generic one so no internals leak to the guest.
    const message =
      error instanceof Error && MENSAGENS_ESPERADAS.includes(error.message)
        ? error.message
        : 'Não foi possível iniciar o envio.'

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
