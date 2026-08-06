type OrnamentProps = {
  placement?: 'top' | 'bottom' | 'divider'
}

export function Ornament({ placement = 'divider' }: OrnamentProps) {
  const rotation = placement === 'bottom' ? 'rotate-180' : ''

  return (
    <div aria-hidden className={`flex items-center justify-center gap-3 ${rotation}`}>
      <span className="h-px w-16 bg-linear-to-r from-transparent to-ouro/60" />
      <span className="text-ouro/80">❧</span>
      <span className="h-px w-16 bg-linear-to-l from-transparent to-ouro/60" />
    </div>
  )
}
