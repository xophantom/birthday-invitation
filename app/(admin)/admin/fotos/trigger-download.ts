/**
 * Salva um `Blob` já pronto como arquivo, pela única via que funciona em
 * todos os navegadores-alvo: uma âncora com `download` apontando para um
 * object URL.
 *
 * Dois detalhes que parecem supérfluos e não são:
 *
 * 1. A âncora é **anexada ao documento** antes do `click()`. Um elemento
 *    desconectado não dispara navegação em vários navegadores, e o clique
 *    vira um no-op silencioso — a tela volta ao estado ocioso como se o
 *    download tivesse acontecido.
 *
 * 2. `revokeObjectURL` roda **fora do caminho síncrono do clique**. Revogar
 *    na linha seguinte ao `click()` invalida o URL antes de a transferência
 *    começar; o Safari de iOS — exatamente o cenário "anfitrião no celular
 *    durante a festa" — cancela o download nesse caso, também sem erro. O
 *    atraso mantém o blob vivo até o navegador ter iniciado a gravação.
 *
 * O preço do item 2 é o blob permanecer alocado durante a janela de revogação;
 * é aceitável, já que o download em curso precisa dele de qualquer forma. A
 * promise devolvida resolve só quando essa janela fecha e o object URL já foi
 * revogado — é o sinal que o chamador usa para saber quando é seguro liberar
 * um novo download sem manter dois zips inteiros vivos ao mesmo tempo.
 *
 * O prazo é para o navegador **começar** a gravação, não para ela terminar:
 * o clique já entregou a âncora e o `href`, e a leitura do blob pelo Safari
 * arranca de forma assíncrona logo em seguida, tipicamente em poucos
 * frames — não há relação com o tamanho do arquivo, que só afeta quanto
 * tempo a gravação em si leva *depois* de começada, o que já não depende
 * mais do object URL estar vivo. 3s é folga generosa para essa largada
 * (ordens de magnitude acima do que qualquer *jank* de main thread
 * costuma custar) sem prender o anfitrião esperando um zip de centenas de
 * MB "terminar" — que pelo wifi da festa pode legitimamente levar muito
 * mais que isso.
 */
const REVOKE_DELAY_MS = 3_000

export function triggerBlobDownload(blob: Blob, fileName: string): Promise<void> {
  const href = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = href
  anchor.download = fileName
  anchor.rel = 'noopener'
  anchor.style.display = 'none'

  document.body.append(anchor)
  anchor.click()

  return new Promise((resolve) => {
    setTimeout(() => {
      anchor.remove()
      URL.revokeObjectURL(href)
      resolve()
    }, REVOKE_DELAY_MS)
  })
}
