import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { getEventConfig } from '@/lib/config'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

/** Mesma razão de `app/icon.tsx`: sem `fonts` o monograma sai em sans-serif. */
export default async function AppleIcon() {
  const { celebrant, theme } = getEventConfig()
  const font = await readFile(
    join(process.cwd(), 'assets', 'fonts', 'CormorantGaramond-Bold.ttf')
  )

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.surface,
          color: theme.colors.accentLight,
          fontSize: 88,
          fontWeight: 700,
        }}
      >
        {celebrant.monogram}
      </div>
    ),
    {
      ...size,
      fonts: [{ name: 'Cormorant', data: font, style: 'normal', weight: 700 }],
    }
  )
}
