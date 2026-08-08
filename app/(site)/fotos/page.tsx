import type { Metadata } from 'next'
import { PhotoUploader } from './PhotoUploader'
import { SectionShell } from '@/components/invitation/SectionShell'
import { getEventConfig } from '@/lib/config'

/**
 * `robots: { index: false }` because this screen's threat model assumes only
 * people who scanned the printed QR code reach it — it is a public upload form
 * with no login. Indexed, it would be reachable from search, and the
 * assumption the rest of the defence rests on would stop holding.
 */
export const metadata: Metadata = {
  title: 'Enviar fotos',
  robots: { index: false, follow: false },
}

export default function Page() {
  const { celebrant, photos } = getEventConfig()
  const firstName = celebrant.name.split(' ')[0]

  return (
    <SectionShell
      title="Enviar fotos"
      subtitle={`Registrou um momento bonito? Compartilhe com a família de ${firstName}.`}
    >
      <PhotoUploader maxPerUpload={photos.maxPerUpload} maxFileSizeMb={photos.maxFileSizeMb} />
      <p className="mt-8 text-center text-xs text-foreground/50">
        As fotos enviadas são privadas e ficam disponíveis apenas para a família.
      </p>
    </SectionShell>
  )
}
