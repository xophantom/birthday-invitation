import type { Metadata } from 'next'
import QRCode from 'qrcode'
import { requireAdmin } from '@/lib/auth/session'
import { getEventConfig } from '@/lib/config'

export const metadata: Metadata = {
  title: 'QR Code',
  robots: { index: false, follow: false },
}

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1', '[::1]', '0.0.0.0'])

/**
 * Uma URL só serve para o papel se apontar para o site publicado. Checar
 * apenas a ausência da variável não basta: o erro mais provável em produção
 * é o valor **errado**, não o ausente — um `http://localhost:3000` copiado
 * do ambiente local é truthy, deixaria o guarda calado, e o QR sairia
 * impresso apontando para a máquina de desenvolvimento. (O `.env.example`
 * deixa a variável vazia justamente para não plantar esse valor, mas o
 * guarda não pode depender disso.)
 *
 * URL que nem parseia recebe o mesmo tratamento: também não vira QR válido.
 */
function pointsToDevelopment(url: string): boolean {
  try {
    return LOCAL_HOSTNAMES.has(new URL(url).hostname)
  } catch {
    return true
  }
}

export default async function Page() {
  await requireAdmin()

  const config = getEventConfig()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  // Barra final na variável viraria `https://exemplo.com//fotos` dentro do
  // QR — e o que está impresso não tem conserto depois.
  const baseUrl = siteUrl?.replace(/\/+$/, '') || 'http://localhost:3000'
  const target = `${baseUrl}/fotos`
  const isUnsafeToPrint = !siteUrl || pointsToDevelopment(baseUrl)

  const dataUrl = await QRCode.toDataURL(target, {
    width: 720,
    margin: 1,
    color: {
      // Escuro de marca: mesmo tom de theme.colors.surfaceDeep, via config —
      // não hex literal solto no componente.
      dark: config.theme.colors.surfaceDeep,
      // Branco é a cor do papel impresso, não uma cor de marca: fica literal
      // de propósito, sem passar pela config do evento.
      light: '#FFFFFF',
    },
  })

  return (
    <div className="flex flex-col items-center gap-6">
      {isUnsafeToPrint && (
        // O QR acima aponta para desenvolvimento, e "imprimir mesmo assim"
        // mata a coleta de fotos da festa inteira — o único caminho de envio
        // é este QR na mesa. Continua visível na impressão de propósito:
        // mesmo que o anfitrião pule a tela e mande direto para o Cmd+P, o
        // aviso ainda sai no papel. Por isso os `print:` de alto contraste:
        // navegador não imprime cor de fundo por padrão, então `text-danger`
        // (salmão claro) sozinho sairia quase invisível no branco do papel.
        <p
          role="alert"
          className="w-full rounded-2xl border-2 border-danger bg-danger/10 p-4 text-center text-sm font-medium text-danger print:border-black print:bg-white print:text-black"
        >
          NEXT_PUBLIC_SITE_URL{' '}
          {siteUrl
            ? 'aponta para o ambiente de desenvolvimento'
            : 'não está configurada'}
          . Este QR Code leva a {target}, não ao site publicado — não imprima
          antes de corrigir a variável de ambiente.
        </p>
      )}

      <div className="flex w-full items-center justify-between print:hidden">
        <h1 className="font-display text-3xl text-accent-light">QR Code das fotos</h1>
        <p className="text-sm text-foreground/60">Aponta para {target}</p>
      </div>

      <div className="flex w-full max-w-md flex-col items-center gap-5 rounded-3xl border-2 border-accent/50 bg-surface p-8 text-center print:border-black print:bg-white">
        <p className="font-display text-3xl text-accent-light print:text-black">
          Tirou uma foto bonita?
        </p>
        <p className="text-sm text-foreground/80 print:text-black">
          Aponte a câmera e compartilhe com a família de{' '}
          {config.celebrant.name.split(' ')[0]}.
        </p>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dataUrl}
          alt={`QR Code para ${target}`}
          width={280}
          height={280}
          className="rounded-xl bg-white p-3"
        />

        <p className="text-xs text-foreground/60 print:text-black">
          As fotos ficam privadas, só a família vê.
        </p>
      </div>

      <p className="text-sm text-foreground/60 print:hidden">
        Use Ctrl+P (ou Cmd+P) para imprimir.
      </p>
    </div>
  )
}
