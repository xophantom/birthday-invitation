'use client'

import { MotionConfig } from 'motion/react'
import type { ReactNode } from 'react'

/**
 * `reducedMotion="user"` makes the library honour the system preference for
 * everything below this tree. The equivalent rule in globals.css only reaches
 * CSS animations; `motion` animates in JavaScript and needs this.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
