import type { Metadata } from 'next'
import { RsvpForm } from './RsvpForm'
import { SectionShell } from '@/components/invitation/SectionShell'

export const metadata: Metadata = { title: 'Confirmar presença' }

export default function Page() {
  return (
    <SectionShell
      title="Confirmar presença"
      subtitle="Precisamos saber quem vem para preparar tudo com carinho."
    >
      <RsvpForm />
    </SectionShell>
  )
}
