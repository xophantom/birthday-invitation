import type { Metadata } from 'next'
import QRCode from 'qrcode'
import { requireAdmin } from '@/lib/auth/session'
import { getEventConfig } from '@/lib/config'

export const metadata: Metadata = {
  title: 'QR Code',
  robots: { index: false, follow: false },
}

export default async function Page() {
  await requireAdmin()

  const config = getEventConfig()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const target = `${siteUrl ?? 'http://localhost:3000'}/fotos`

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
      {!siteUrl && (
        // NEXT_PUBLIC_SITE_URL ausente: o QR acima aponta para localhost, e
        // "imprimir mesmo assim" mata a coleta de fotos da festa inteira —
        // o único caminho de envio é este QR na mesa. Continua visível na
        // impressão de propósito: mesmo que o anfitrião pule a tela e mande
        // direto para o Cmd+P, o aviso ainda sai no papel.
        <p
          role="alert"
          className="w-full rounded-2xl border-2 border-danger bg-danger/10 p-4 text-center text-sm font-medium text-danger"
        >
          NEXT_PUBLIC_SITE_URL não está configurada. Este QR Code aponta para{' '}
          {target}, não para o site publicado — não imprima antes de corrigir a
          variável de ambiente.
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
