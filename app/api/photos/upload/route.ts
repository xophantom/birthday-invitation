import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'
import { countPhotos } from '@/lib/db/queries/photos'
import { getPhotosGlobalLimit, PHOTOS_LIMIT_REACHED_MESSAGE } from '@/lib/photos/global-limit'
import { isPhotosPathname, PHOTOS_PATHNAME_PREFIX } from '@/lib/photos/pathname'

/** Mensagem do erro esperado (teto de armazenamento) — usada para distingui-lo
 * de qualquer falha inesperada no catch abaixo, sem repetir o texto.
 * Compartilhada com a Server Action de registro (Task 5,
 * `app/(site)/fotos/actions.ts`), que replica este mesmo teto — ver
 * `lib/photos/global-limit.ts`. */
const LIMITE_ATINGIDO_MESSAGE = PHOTOS_LIMIT_REACHED_MESSAGE

/** Idem, para o caminho de gravação recusado — ver `lib/photos/pathname.ts`. */
const CAMINHO_INVALIDO_MESSAGE = `O caminho de envio precisa começar com "${PHOTOS_PATHNAME_PREFIX}".`

/** As mensagens que nós mesmos lançamos em `onBeforeGenerateToken`, e as
 * únicas que o catch repassa como estão. */
const MENSAGENS_ESPERADAS: readonly string[] = [LIMITE_ATINGIDO_MESSAGE, CAMINHO_INVALIDO_MESSAGE]

/**
 * Teto de bytes do arquivo que o navegador realmente envia — o **já
 * comprimido** por `hooks/use-image-compression.ts`, não a foto que o
 * convidado escolheu.
 *
 * Não confundir com `config.photos.maxFileSizeMb` (15MB): aquele é o teto da
 * **foto original**, checado no cliente antes de comprimir, e serve para
 * recusar cedo um arquivo grande demais para o aparelho processar. Este aqui
 * é a única barreira de bytes da superfície *pública*, e precisa ser
 * dimensionado sobre a saída da compressão: um JPEG de 2048px no maior lado,
 * qualidade 0.83, fica na casa de 1MB. 6MB é folga enorme sobre isso e ainda
 * assim mantém o orçamento de armazenamento do design de pé (~840KB por par
 * full+thumb, 1000 pares ≈ 840MB de 1GB) — assinar o token com 15MB deixava
 * ~35 pares estourarem o orçamento inteiro.
 */
const MAX_UPLOAD_BYTES = 6 * 1024 * 1024

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as HandleUploadBody

    // Sem `onUploadCompleted`: o registro no banco acontece em
    // registerPhoto() (Server Action), porque o callback do Blob não dispara
    // em localhost sem túnel e chega **por arquivo** — o que quebraria o
    // pareamento full+thumb, que só existe quando os dois blobs subiram.
    // O callback não é declarado nem vazio: o SDK deriva um `callbackUrl`
    // sempre que a função existe (`node_modules/@vercel/blob/dist/client.js`,
    // `getCallbackUrl`), e em produção na Vercel isso faz o serviço do Blob
    // fazer POST de volta nesta mesma rota — duas invocações extras por foto
    // para executar uma função vazia, e mais uma peça móvel no caminho da
    // noite (com Deployment Protection ligada, esses POSTs batem em 401).
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // O token assina *onde* pode ser gravado. Sem esta checagem, qualquer
        // chamador obtinha token para gravar em qualquer caminho da store
        // (`evil/x.jpg`, a raiz, `PHOTOS/`) — e o que cai fora de `photos/`
        // nunca vira linha no banco, então o teto abaixo, que conta linhas,
        // nem enxergava esse consumo. Mesma regra da Server Action de
        // registro, pela mesma função (`lib/photos/pathname.ts`).
        if (!isPhotosPathname(pathname)) {
          console.error('Token de upload recusado: caminho fora do prefixo esperado:', pathname)
          throw new Error(CAMINHO_INVALIDO_MESSAGE)
        }

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
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
        }
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Falha ao emitir token de upload:', error)

    // Só repassa a mensagem do erro quando é uma das que nós mesmos lançamos
    // acima (teto de armazenamento, caminho recusado) — qualquer outra falha
    // (JSON inválido, erro interno do SDK do Blob) usa uma mensagem genérica
    // em pt-BR, para não vazar detalhe interno ao convidado.
    const message =
      error instanceof Error && MENSAGENS_ESPERADAS.includes(error.message)
        ? error.message
        : 'Não foi possível iniciar o envio.'

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
