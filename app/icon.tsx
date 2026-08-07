import { ImageResponse } from 'next/og'
import { getEventConfig } from '@/lib/config'

export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

export default function Icon() {
  const { celebrant, theme } = getEventConfig()

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
    size
  )
}
