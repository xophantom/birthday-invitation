import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { getEventConfig } from '@/lib/config'

export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

/**
 * Sem `fonts`, o satori cai na Noto Sans que vem embutida no `next/og`: o
 * monograma sairia em sans-serif, e o `fontWeight: 700` seria ignorado por
 * não haver outro peso disponível. A mesma instância estática de peso 700 que
 * a OG image usa resolve os dois — é a serifa da marca e é o peso certo.
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
