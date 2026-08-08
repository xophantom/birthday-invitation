import { create } from 'zustand'

type MusicState = {
  /** Vira true no primeiro gesto do usuário — é o que destrava o áudio no navegador. */
  hasStarted: boolean
  isMuted: boolean
  /**
   * True enquanto a abertura animada cobre a tela.
   *
   * Mora aqui porque é o único canal que os dois lados já compartilham: a
   * `InvitationExperience` (que sabe quando a abertura está em cena) e o
   * `MusicPlayer` vivem em árvores irmãs — o player é renderizado por
   * `app/(site)/layout.tsx`, fora do `<main>`. O `inert` que tira o conteúdo
   * de trás da abertura do foco e da árvore de acessibilidade não alcança
   * ele, e `z-index` não afeta ordem de tabulação: sem esta flag o botão de
   * som continuava alcançável por `Tab`, invisível atrás de uma tela opaca.
   */
  isOpeningVisible: boolean
  start: () => void
  toggleMute: () => void
  setOpeningVisible: (visible: boolean) => void
}

export const useMusicStore = create<MusicState>((set) => ({
  hasStarted: false,
  isMuted: false,
  isOpeningVisible: false,
  start: () => set({ hasStarted: true }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  setOpeningVisible: (visible) => set({ isOpeningVisible: visible }),
}))
