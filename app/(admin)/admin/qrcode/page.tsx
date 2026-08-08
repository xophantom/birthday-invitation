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
 * Checking only for a missing variable isn't enough: the likelier production
 * mistake is a *wrong* value. A `http://localhost:3000` copied from the local
 * environment is truthy, would pass silently, and the printed QR code would
 * point at a development machine. An unparseable URL fails the same way.
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
  // A trailing slash would encode `https://example.com//fotos` — and what is
  // already printed can't be fixed.
  const baseUrl = siteUrl?.replace(/\/+$/, '') || 'http://localhost:3000'
  const target = `${baseUrl}/fotos`
  const isUnsafeToPrint = !siteUrl || pointsToDevelopment(baseUrl)

  const dataUrl = await QRCode.toDataURL(target, {
    width: 720,
    margin: 1,
    color: {
      dark: config.theme.colors.surfaceDeep,
      // White is the colour of the paper, not a brand colour — literal on
      // purpose, never read from the event config.
      light: '#FFFFFF',
    },
  })

  return (
    <div className="flex flex-col items-center gap-6">
      {isUnsafeToPrint && (
        // Printing anyway would kill photo collection for the whole party,
        // since this QR code is the only upload path. Kept visible in print on
        // purpose, with high-contrast `print:` overrides — browsers don't
        // print background colours, so `text-danger` alone would be invisible.
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
