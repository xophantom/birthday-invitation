import { ImageResponse } from 'next/og'
import { getEventConfig } from '@/lib/config'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
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
          fontSize: 88,
          fontWeight: 700,
        }}
      >
        {celebrant.monogram}
      </div>
    ),
    size
  )
}
