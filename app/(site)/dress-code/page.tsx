import type { Metadata } from 'next'
import { SectionShell } from '@/components/invitation/SectionShell'
import { Card } from '@/components/ui/Card'
import { getEventConfig } from '@/lib/config'

export const metadata: Metadata = { title: 'Dress code' }

export default function Page() {
  const { dressCode } = getEventConfig()

  return (
    <SectionShell title="Dress code" subtitle="Um pedido pequeno, com um motivo bonito.">
      <div className="flex flex-col gap-5">
        <Card>
          <h2 className="text-sm uppercase tracking-[0.2em] text-foreground/70">Traje</h2>
          <p className="mt-2 font-display text-3xl text-accent-light">{dressCode.style}</p>
        </Card>

        <Card>
          <h2 className="font-display text-2xl text-accent-light">Cores a evitar</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {dressCode.avoid.map((color) => (
              <li
                key={color}
                className="rounded-full border border-highlight/60 px-4 py-2 text-sm text-highlight"
              >
                {color}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-foreground/85">{dressCode.reason}</p>
        </Card>
      </div>
    </SectionShell>
  )
}
