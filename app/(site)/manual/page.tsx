import type { Metadata } from 'next'
import { SectionShell } from '@/components/invitation/SectionShell'
import { getEventConfig } from '@/lib/config'

export const metadata: Metadata = { title: 'Manual do convidado' }

export default function Page() {
  const { guide } = getEventConfig()

  return (
    <SectionShell
      title="Manual do convidado"
      subtitle="Algumas combinações para que a noite seja perfeita para todo mundo."
    >
      <ul className="flex flex-col gap-4">
        {guide.map((item) => (
          <li key={item} className="flex items-start gap-3 text-foreground/90">
            <span aria-hidden className="mt-1 text-accent">
              ✦
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </SectionShell>
  )
}
