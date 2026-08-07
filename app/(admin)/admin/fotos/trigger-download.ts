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
 * é aceitável, já que o download em curso precisa dele de qualquer forma.
 */
const REVOKE_DELAY_MS = 60_000

export function triggerBlobDownload(blob: Blob, fileName: string): void {
  const href = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = href
  anchor.download = fileName
  anchor.rel = 'noopener'
  anchor.style.display = 'none'

  document.body.append(anchor)
  anchor.click()

  setTimeout(() => {
    anchor.remove()
    URL.revokeObjectURL(href)
  }, REVOKE_DELAY_MS)
}
