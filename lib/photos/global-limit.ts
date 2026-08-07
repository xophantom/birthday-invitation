/**
 * Teto global de fotos armazenadas (em pares full+thumb — a mesma unidade
 * que `countPhotos()` devolve), lido da variável de ambiente
 * `PHOTOS_GLOBAL_LIMIT`.
 *
 * Compartilhado entre dois pontos de entrada independentes que precisam da
 * mesma regra: a rota que emite o token de upload (Task 3,
 * `app/api/photos/upload/route.ts`) barra quem tenta *subir o arquivo*; a
 * Server Action que registra o par no banco (Task 5,
 * `app/(site)/fotos/actions.ts`) barra quem pula a rota e ataca o registro
 * direto por POST — um payload pequeno, sem subir um byte, que também
 * precisa respeitar o teto. Extraído para um só lugar porque as duas cópias
 * já divergiram uma vez nesta fase.
 *
 * A leitura é adiada para dentro da primeira chamada — não fica em escopo
 * de módulo — porque ali o valor seria congelado no momento em que o módulo
 * é importado. Mesmo raciocínio do cliente de banco em `lib/db/index.ts`.
 *
 * Um valor ausente, vazio ou inválido (ex.: "mil", "", "1_000") não vira um
 * `NaN` silencioso — o que faria a comparação do teto falhar sempre e o
 * limite deixar de existir sem nenhum aviso. Nesses casos cai no default.
 */
const DEFAULT_PHOTOS_GLOBAL_LIMIT = 1000

/** Mensagem pt-BR mostrada quando o teto é atingido — a mesma em ambos os
 * pontos de entrada, para não divergir. */
export const PHOTOS_LIMIT_REACHED_MESSAGE = 'Limite de armazenamento atingido.'

let cachedPhotosGlobalLimit: number | undefined

export function getPhotosGlobalLimit(): number {
  if (cachedPhotosGlobalLimit === undefined) {
    const raw = process.env.PHOTOS_GLOBAL_LIMIT
    const parsed = raw === undefined ? Number.NaN : Number(raw)
    cachedPhotosGlobalLimit =
      Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_PHOTOS_GLOBAL_LIMIT
  }
  return cachedPhotosGlobalLimit
}
