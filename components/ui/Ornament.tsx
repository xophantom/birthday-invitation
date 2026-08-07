type OrnamentProps = {
  placement?: 'top' | 'bottom' | 'divider'
}

export function Ornament({ placement = 'divider' }: OrnamentProps) {
  // 'top' e 'divider' renderizam de forma idêntica hoje. 'top' existe como
  // variante própria para que o ornamento de cabeçalho possa divergir
  // (tamanho, espaçamento etc.) no futuro sem quebrar quem já o consome.
  const rotation = placement === 'bottom' ? 'rotate-180' : ''

  return (
    <div aria-hidden className={`flex items-center justify-center gap-3 ${rotation}`}>
      <span className="h-px w-16 bg-linear-to-r from-transparent to-accent/60" />
      <span className="text-accent/80">❧</span>
      <span className="h-px w-16 bg-linear-to-l from-transparent to-accent/60" />
    </div>
  )
}
