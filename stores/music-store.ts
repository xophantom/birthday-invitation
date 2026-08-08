import { create } from 'zustand'

type MusicState = {
  /** True after the first user gesture — what unlocks audio in the browser. */
  hasStarted: boolean
  isMuted: boolean
  /**
   * True while the animated opening covers the screen.
   *
   * Lives here because it is the only channel the two sides share:
   * `InvitationExperience` knows when the opening is on screen, but
   * `MusicPlayer` renders from the group layout, outside `<main>`, where the
   * `inert` guarding the content behind the opening can't reach it.
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
