import type { Metadata } from 'next'
import { SectionShell } from '@/components/invitation/SectionShell'

export const metadata: Metadata = { title: 'Confirmar presença' }

export default function Page() {
  return (
    <SectionShell
      title="Confirmar presença"
      subtitle="O formulário de confirmação estará disponível em instantes."
    >
      <p className="text-center text-foreground/70">
        Estamos preparando esta parte do convite.
      </p>
    </SectionShell>
  )
}
