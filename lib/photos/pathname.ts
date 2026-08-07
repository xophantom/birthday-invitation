/**
 * Prefixo obrigatório de todo blob de foto no armazenamento.
 *
 * Compartilhado pelos dois pontos que precisam da mesma regra, porque são as
 * duas metades da mesma defesa e discordar seria a falha: a rota que assina o
 * token de upload (`app/api/photos/upload/route.ts`) decide *onde o convidado
 * pode gravar*, e a Server Action que registra o par (`app/(site)/fotos/actions.ts`)
 * decide *qual caminho pode virar linha no banco*. Enquanto só a action exigia
 * o prefixo, qualquer chamador obtinha token para gravar em qualquer lugar da
 * store — e o que é gravado fora de `photos/` nunca vira linha, então esse
 * consumo de armazenamento ficava invisível para o teto global, que conta
 * linhas.
 *
 * O prefixo também é o que torna seguro o `del(pathname)` que a Fase 5 vai
 * usar para excluir uma foto: sem ele, um pathname escolhido por um chamador
 * hostil apagaria qualquer blob da store.
 */
export const PHOTOS_PATHNAME_PREFIX = 'photos/'

export function isPhotosPathname(value: string): boolean {
  return value.startsWith(PHOTOS_PATHNAME_PREFIX)
}
