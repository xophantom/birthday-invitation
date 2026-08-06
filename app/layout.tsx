import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { fontDisplay, fontSans } from '@/config/fonts'
import { getEventConfig } from '@/lib/config'
import './globals.css'

const config = getEventConfig()

export const metadata: Metadata = {
  title: {
    default: `${config.celebrant.name} — ${config.celebrant.age} anos`,
    template: `%s · ${config.celebrant.name}`,
  },
  description: `Convite para os ${config.celebrant.age} anos de ${config.celebrant.name}.`,
}

export default function RootLayout({ children }: { children: ReactNode }) {
  const { colors } = config.theme

  return (
    <html
      lang="pt-BR"
      className={`${fontDisplay.variable} ${fontSans.variable} h-full antialiased`}
      style={
        {
          '--brand-esmeralda': colors.esmeralda,
          '--brand-esmeralda-fundo': colors.esmeraldaFundo,
          '--brand-jade': colors.jade,
          '--brand-ouro': colors.ouro,
          '--brand-ouro-claro': colors.ouroClaro,
          '--brand-creme': colors.creme,
        } as React.CSSProperties
      }
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
