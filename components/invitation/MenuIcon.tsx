import type { ReactNode } from 'react'
import type { MenuIconName } from '@/components/invitation/menu-items'

/*
  The same shapes the menu first used as Unicode glyphs (✦ ✳ ✧ ✴ ✶), drawn
  as SVG. As text they were at the mercy of each device: ✳ and ✴ also exist
  as emoji, and iOS and Android drew them as coloured emoji tiles, while the
  rest came out at a different size in every platform's fallback font.

  The points are precomputed rather than generated with Math.cos at render:
  this renders on the server and again on the client, and two JS engines
  rounding a coordinate differently would be a hydration mismatch.
*/
const SPARKLE = '12,2 14.5,9.5 22,12 14.5,14.5 12,22 9.5,14.5 2,12 9.5,9.5'

const shapes = {
  sparkle: <polygon points={SPARKLE} fill="currentColor" />,
  'sparkle-outline': (
    <polygon points={SPARKLE} fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" />
  ),
  asterisk: (
    <path
      d="M12 3v18M3 12h18M5.64 5.64l12.72 12.72M18.36 5.64L5.64 18.36"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
    />
  ),
  'star-eight': (
    <polygon
      points="12,2 13.22,9.04 19.07,4.93 14.96,10.78 22,12 14.96,13.22 19.07,19.07 13.22,14.96 12,22 10.78,14.96 4.93,19.07 9.04,13.22 2,12 9.04,10.78 4.93,4.93 10.78,9.04"
      fill="currentColor"
    />
  ),
  'star-six': (
    <polygon
      points="12,2 14.1,8.36 20.66,7 16.2,12 20.66,17 14.1,15.64 12,22 9.9,15.64 3.34,17 7.8,12 3.34,7 9.9,8.36"
      fill="currentColor"
    />
  ),
} satisfies Record<MenuIconName, ReactNode>

export function MenuIcon({ name }: { name: MenuIconName }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5">
      {shapes[name]}
    </svg>
  )
}
