import type { Metadata } from 'next'
import { SectionShell } from '@/components/invitation/SectionShell'
import { Card } from '@/components/ui/Card'
import { getEventConfig } from '@/lib/config'

export const metadata: Metadata = { title: 'Sugestões de presente' }

export default function Page() {
  const { gifts, celebrant } = getEventConfig()

  const sizes = [
    gifts.clothingSize && { label: 'Tamanho de roupa', value: gifts.clothingSize },
    gifts.shoeSize && { label: 'Numeração de calçado', value: gifts.shoeSize },
  ].filter((size): size is { label: string; value: string } => Boolean(size))

  return (
    <SectionShell
      title="Sugestões de presente"
      subtitle={`Se quiser presentear ${celebrant.name.split(' ')[0]}, aqui vão algumas ideias.`}
    >
      <div className="flex flex-col gap-5">
        {sizes.length > 0 && (
          <Card>
            <dl className="flex flex-col gap-3">
              {sizes.map((size) => (
                <div key={size.label} className="flex justify-between gap-4">
                  <dt className="text-foreground/70">{size.label}</dt>
                  <dd className="font-display text-xl text-accent-light">{size.value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        )}

        {gifts.preferences.length > 0 && (
          <Card>
            <h2 className="font-display text-2xl text-accent-light">Preferências</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {gifts.preferences.map((preference) => (
                <li key={preference} className="flex items-start gap-3 text-foreground/90">
                  <span aria-hidden className="mt-1 text-accent">
                    ✦
                  </span>
                  <span>{preference}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {gifts.pixKey && (
          <Card>
            <h2 className="font-display text-2xl text-accent-light">Vale-presente via Pix</h2>
            <p className="mt-2 text-sm text-foreground/70">Chave Pix</p>
            <p className="mt-1 font-mono text-lg break-all text-foreground">{gifts.pixKey}</p>
          </Card>
        )}
      </div>
    </SectionShell>
  )
}
