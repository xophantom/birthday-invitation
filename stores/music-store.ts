import { create } from 'zustand'

type MusicState = {
  /** Vira true no primeiro gesto do usuário — é o que destrava o áudio no navegador. */
  hasStarted: boolean
  isMuted: boolean
  start: () => void
  toggleMute: () => void
}

export const useMusicStore = create<MusicState>((set) => ({
  hasStarted: false,
  isMuted: false,
  start: () => set({ hasStarted: true }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
}))
