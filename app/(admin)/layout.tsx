import type { ReactNode } from 'react'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-esmeralda-fundo text-creme">
      {children}
    </div>
  )
}
