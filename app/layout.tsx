import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { fontDisplay, fontSans } from '@/config/fonts'
import { getEventConfig } from '@/lib/config'
import './globals.css'

const config = getEventConfig()

/**
 * Base absoluta de `og:image` e afins.
 *
 * `NEXT_PUBLIC_*` é inlinado no bundle em build time: se a variável não
 * existir no momento do build de produção, todo `og:image` sai apontando
 * para localhost e nenhuma prévia do WhatsApp carrega — e cadastrar a
 * variável depois não conserta sem um novo build. Por isso o degrau
 * intermediário: `VERCEL_PROJECT_PRODUCTION_URL` é injetada pela própria
 * Vercel e traz o domínio de produção sem `https://`. É a mesma variável que
 * o Next usa no fallback interno de `metadataBase`
 * (`lib/metadata/resolvers/resolve-url.js`, `getProductionDeploymentUrl`).
 * localhost fica só como último recurso, para o desenvolvimento local.
 *
 * Os `||` (e não `??`) são deliberados: `.env.example` deixa
 * `NEXT_PUBLIC_SITE_URL=` sem valor, e uma variável declarada vazia chega
 * aqui como string vazia, não `undefined` — com `??` ela passaria pelo
 * fallback e `new URL('')` derrubaria o build inteiro.
 */
const metadataBase = new URL(
  process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, '') ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000')
)

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: `${config.celebrant.name} — ${config.celebrant.age} anos`,
    template: `%s · ${config.celebrant.name}`,
  },
  description: `Convite para os ${config.celebrant.age} anos de ${config.celebrant.name}.`,
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    title: `${config.celebrant.name} — ${config.celebrant.age} anos`,
    description: `Você está convidado! ${config.venue.name}.`,
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  const { colors } = config.theme

  return (
    <html
      lang="pt-BR"
      className={`${fontDisplay.variable} ${fontSans.variable} h-full antialiased`}
      style={
        {
          '--brand-surface': colors.surface,
          '--brand-surface-deep': colors.surfaceDeep,
          '--brand-highlight': colors.highlight,
          '--brand-accent': colors.accent,
          '--brand-accent-light': colors.accentLight,
          '--brand-foreground': colors.foreground,
        } as React.CSSProperties
      }
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
