type OrnamentProps = {
  placement?: 'top' | 'bottom' | 'divider'
}

export function Ornament({ placement = 'divider' }: OrnamentProps) {
  // 'top' and 'divider' render identically today. 'top' exists as its own
  // variant so the header ornament can diverge later without breaking callers.
  const rotation = placement === 'bottom' ? 'rotate-180' : ''

  return (
    <div aria-hidden className={`flex items-center justify-center gap-3 ${rotation}`}>
      <span className="h-px w-16 bg-linear-to-r from-transparent to-accent/60" />
      <span className="text-accent/80">✦</span>
      <span className="h-px w-16 bg-linear-to-l from-transparent to-accent/60" />
    </div>
  )
}
