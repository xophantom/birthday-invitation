import type { HTMLAttributes } from 'react'

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-ouro/25 bg-esmeralda/70 p-6 shadow-lg shadow-black/30 backdrop-blur-sm ${className}`}
      {...props}
    />
  )
}
