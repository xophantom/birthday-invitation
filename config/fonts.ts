import { Cormorant_Garamond, Jost } from 'next/font/google'

export const fontDisplay = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-display-family',
  display: 'swap',
})

export const fontSans = Jost({
  subsets: ['latin'],
  variable: '--font-sans-family',
  display: 'swap',
})
