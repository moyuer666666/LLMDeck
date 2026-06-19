import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { getDefaultThemeColor } from '~app/utils/color-scheme'

export const sidebarCollapsedAtom = atomWithStorage('sidebarCollapsed', false, undefined, { getOnInit: true })
export const themeColorAtom = atomWithStorage('themeColor', getDefaultThemeColor())
export const followArcThemeAtom = atomWithStorage('followArcTheme', false)
export const releaseNotesAtom = atom<string[]>([])
