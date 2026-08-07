'use client'

import { MotionConfig } from 'motion/react'
import type { ReactNode } from 'react'

/**
 * `reducedMotion="user"` faz a lib respeitar a preferência do sistema em todas
 * as animações abaixo desta árvore. A regra equivalente no globals.css só
 * alcança animações CSS — o `motion` anima via JavaScript e precisa disto.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
