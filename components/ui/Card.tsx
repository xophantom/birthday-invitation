import type { HTMLAttributes } from 'react'

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-accent/25 bg-surface/70 p-6 shadow-lg shadow-black/30 backdrop-blur-sm ${className}`}
      {...props}
    />
  )
}
