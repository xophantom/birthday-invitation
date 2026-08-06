'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { menuItems } from '@/components/invitation/menu-items'

export function MenuGrid() {
  return (
    <nav aria-label="Menu do convite" className="mx-auto w-full max-w-md px-6 pb-16">
      <ul className="flex flex-col gap-3">
        {menuItems.map((item, index) => (
          <motion.li
            key={item.href}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.5 }}
          >
            <Link
              href={item.href}
              className="flex min-h-14 items-center gap-4 rounded-full border border-accent/30 bg-surface/60 px-6 text-foreground transition-colors hover:border-accent hover:bg-surface"
            >
              <span aria-hidden className="text-accent">
                {item.icon}
              </span>
              <span className="font-sans text-sm tracking-wide">{item.label}</span>
            </Link>
          </motion.li>
        ))}
      </ul>
    </nav>
  )
}
