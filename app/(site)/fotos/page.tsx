import type { Metadata } from 'next'
import { PhotoUploader } from './PhotoUploader'
import { SectionShell } from '@/components/invitation/SectionShell'
import { getEventConfig } from '@/lib/config'

export const metadata: Metadata = { title: 'Enviar fotos' }

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
