export function GoldParticles({ count = 28 }: { count?: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }, (_, index) => {
        // Distribuição pseudoaleatória estável: mesmo resultado no servidor e no cliente.
        const left = (index * 37) % 100
        const top = (index * 61) % 100
        const size = 2 + (index % 3)
        const delay = (index % 7) * 0.4
        const duration = 3 + (index % 5) * 0.6

        return (
          <span
            key={index}
            className="absolute rounded-full bg-accent-light motion-safe:animate-pulse"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${size}px`,
              height: `${size}px`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              opacity: 0.5,
              boxShadow: '0 0 6px 1px rgba(232, 199, 102, 0.6)',
            }}
          />
        )
      })}
    </div>
  )
}
