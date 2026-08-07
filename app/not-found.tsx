import { NotFoundContent } from '@/components/errors/NotFoundContent'

/**
 * Cobre URLs que não casam rota nenhuma (ex.: /rota-que-nao-existe). Com dois
 * route groups sob `app/`, um `not-found.tsx` só dentro de `(site)` atende
 * apenas `notFound()` chamado nos segmentos daquele grupo — o Next cai neste
 * arquivo raiz para qualquer URL sem rota correspondente. Renderiza dentro de
 * `app/layout.tsx`, que já aplica a paleta da marca via `--brand-*`, então o
 * visual sai igual ao de `app/(site)/not-found.tsx` mesmo sem passar pela
 * moldura (`MotionProvider`, vinheta, player) daquele grupo.
 */
export default function NotFound() {
  return <NotFoundContent />
}
