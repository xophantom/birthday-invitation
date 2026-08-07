import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { fontDisplay, fontSans } from '@/config/fonts'
import { getEventConfig } from '@/lib/config'
import './globals.css'

const config = getEventConfig()

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
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
