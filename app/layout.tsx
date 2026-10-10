import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { fontDisplay, fontSans } from '@/config/fonts'
import { getEventConfig } from '@/lib/config'
import './globals.css'

const config = getEventConfig()

/**
 * Absolute base for `og:image` and friends.
 *
 * `NEXT_PUBLIC_*` is inlined at build time, so if the variable is missing when
 * production builds, every `og:image` points at localhost and no WhatsApp
 * preview loads — and setting it afterwards fixes nothing without a rebuild.
 * Hence the middle step: `VERCEL_PROJECT_PRODUCTION_URL` is injected by Vercel
 * and is the same variable Next uses in its own `metadataBase` fallback.
 *
 * `||` rather than `??` is deliberate: `.env.example` declares
 * `NEXT_PUBLIC_SITE_URL=` empty, which arrives as `''`, not `undefined` —
 * `??` would let it through and `new URL('')` would break the build.
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
      // The invitation's inline script sets `data-opening-seen` here before
      // React hydrates (see components/invitation/opening-seen.ts). This only
      // silences the mismatch on <html>'s own attributes, not its children.
      suppressHydrationWarning
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
