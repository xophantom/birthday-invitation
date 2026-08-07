import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'
import { getEventConfig } from '@/lib/config'
import { countPhotos } from '@/lib/db/queries/photos'

const DEFAULT_GLOBAL_LIMIT = 1000

/** Mensagem do erro esperado (teto de armazenamento) — usada para distingui-lo
 * de qualquer falha inesperada no catch abaixo, sem repetir o texto. */
const LIMITE_ATINGIDO_MESSAGE = 'Limite de armazenamento atingido.'

let cachedGlobalLimit: number | undefined

/**
 * Lê o teto global de fotos armazenadas (em pares full+thumb, a mesma unidade
 * que `countPhotos()` devolve) da variável de ambiente `PHOTOS_GLOBAL_LIMIT`.
 *
 * A leitura é adiada para dentro do handler — não fica no escopo do módulo —
 * porque ali o valor seria congelado no momento em que este arquivo é
 * importado. Mesmo raciocínio do cliente de banco em `lib/db/index.ts`: adiar
 * a leitura do ambiente até o momento em que ela é de fato necessária.
 *
 * Um valor ausente, vazio ou inválido (ex.: "mil", "", "1_000") não vira um
 * `NaN` silencioso — o que faria a comparação do teto falhar sempre e o
 * limite deixar de existir sem nenhum aviso. Nesses casos cai no default.
 */
function getGlobalLimit(): number {
  if (cachedGlobalLimit === undefined) {
    const raw = process.env.PHOTOS_GLOBAL_LIMIT
    const parsed = raw === undefined ? Number.NaN : Number(raw)
    cachedGlobalLimit = Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_GLOBAL_LIMIT
  }
  return cachedGlobalLimit
}

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

        if (total >= getGlobalLimit()) {
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
