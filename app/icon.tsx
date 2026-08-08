import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { getEventConfig } from '@/lib/config'

export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

/**
 * Without `fonts`, satori falls back to the Noto Sans bundled with `next/og`:
 * the monogram would render sans-serif and `fontWeight: 700` would be ignored
 * for lack of another weight. The same 700 face the OG image loads fixes both.
 */
export default async function Icon() {
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
          fontSize: 32,
          fontWeight: 700,
          letterSpacing: -1,
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
