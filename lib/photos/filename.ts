/**
 * `uploadedBy` é texto livre de até 120 caracteres digitado pelo convidado e
 * vira nome de arquivo — dentro do zip do download em lote e no download
 * individual do lightbox. Sem tratamento, `/`, `\`, `:` ou caracteres de
 * controle produzem entrada de zip malformada (ou um caminho inesperado ao
 * extrair), e um nome no limite de 120 caracteres produz um arquivo com nome
 * absurdo. Mantemos letras, números, espaços e pontuação comum; removemos
 * separadores de caminho, os caracteres reservados do Windows (`* ? " < > |`),
 * controles e os controles bidirecionais do Unicode; cortamos em 50
 * caracteres — curto o bastante para não gerar nomes absurdos, longo o
 * bastante para ainda identificar quem enviou.
 *
 * Este módulo não é `server-only` de propósito: o download individual roda no
 * browser e precisa da mesma regra de nome que o zip montado no servidor.
 */
const MAX_UPLOADER_NAME_LENGTH = 50

/**
 * Os controles bidirecionais não são controles ASCII e passariam pelo
 * intervalo `\x00-\x1F`: um U+202E (RIGHT-TO-LEFT OVERRIDE) no meio do nome
 * faz o gerenciador de arquivos exibir o restante invertido, de forma que um
 * arquivo `.jpg` pode aparecer na tela com outra extensão. Cobrimos U+061C
 * (ALM), U+200E/U+200F (LRM/RLM), U+202A–U+202E (embedding e override) e
 * U+2066–U+2069 (isolates).
 *
 * Escritos como escapes `\uXXXX`, e não como os caracteres em si: os bidi são
 * invisíveis, e um literal aqui deixaria a própria regra impossível de
 * revisar — exatamente o defeito que ela existe para corrigir.
 */
const UNSAFE_FILENAME_CHARS =
  /[\\/:*?"<>|\x00-\x1F\x7F\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/g

export function sanitizeUploaderName(rawName: string | null): string {
  const cleaned = (rawName ?? '')
    .replace(UNSAFE_FILENAME_CHARS, '')
    .trim()
    .slice(0, MAX_UPLOADER_NAME_LENGTH)
    .replace(/[.\s]+$/, '')

  return cleaned.length > 0 ? cleaned : 'convidado'
}
