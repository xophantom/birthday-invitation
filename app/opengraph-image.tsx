import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { getEventConfig } from '@/lib/config'
import { formatEventDate } from '@/lib/date'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/**
 * `alt` is a static export evaluated at module load, so the config has to be
 * read out here rather than inside the component. `getEventConfig()` is
 * memoized, so the call below reuses this result.
 */
const { celebrant } = getEventConfig()
export const alt = `Convite de aniversário de ${celebrant.name} — ${celebrant.age} anos`

export default async function Image() {
  const config = getEventConfig()
  const date = formatEventDate(config.event.startsAt, config.event.timeZone)
  const { colors } = config.theme

  const [poster, font] = await Promise.all([
    readFile(join(process.cwd(), 'public', 'poster.jpeg')),
    readFile(join(process.cwd(), 'assets', 'fonts', 'CormorantGaramond-Bold.ttf')),
  ])

  const posterSrc = `data:image/jpeg;base64,${poster.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          backgroundColor: colors.surfaceDeep,
        }}
      >
        <img
          src={posterSrc}
          alt=""
          width={430}
          height={630}
          style={{ width: 430, height: 630, objectFit: 'cover' }}
        />

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 18,
            padding: '0 64px',
          }}
        >
          <div style={{ display: 'flex', fontSize: 84, color: colors.accent }}>
            {config.celebrant.monogram}
          </div>
          <div style={{ display: 'flex', fontSize: 62, color: colors.accentLight }}>
            {config.celebrant.name}
          </div>
          <div style={{ display: 'flex', fontSize: 40, color: colors.foreground }}>
            {config.celebrant.age} anos
          </div>
          <div
            style={{
              display: 'flex',
              width: 180,
              height: 2,
              backgroundColor: colors.accent,
              margin: '10px 0',
            }}
          />
          <div style={{ display: 'flex', fontSize: 30, color: colors.foreground }}>
            {date.weekday}, {date.day} de {date.month} de {date.year} · {date.time}
          </div>
          <div style={{ display: 'flex', fontSize: 26, color: colors.highlight }}>
            {config.venue.name}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: 'Cormorant', data: font, style: 'normal', weight: 700 }],
    }
  )
}
