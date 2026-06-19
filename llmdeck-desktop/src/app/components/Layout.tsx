import { Outlet, useRouterState } from '@tanstack/react-router'
import { useAtomValue } from 'jotai'
import { lazy, Suspense, useEffect, useState } from 'react'
import { cx } from '~/utils'
import type { BotId } from '~app/bots'
import { followArcThemeAtom, releaseNotesAtom, themeColorAtom } from '~app/state'
import Sidebar from './Sidebar'

const ReleaseNotesModal = lazy(() => import('./Modals/ReleaseNotesModal'))
const MultiBotChatPanelPage = lazy(() => import('../pages/MultiBotChatPanel'))
const SingleBotWorkspace = lazy(() => import('./Chat/SingleBotWorkspace'))

const chatRoutePrefix = '/chat/'

function getSingleBotId(pathname: string): BotId | null {
  if (!pathname.startsWith(chatRoutePrefix)) {
    return null
  }

  const encodedBotId = pathname.slice(chatRoutePrefix.length)
  return encodedBotId ? decodeURIComponent(encodedBotId) : null
}

function Layout() {
  const themeColor = useAtomValue(themeColorAtom)
  const followArcTheme = useAtomValue(followArcThemeAtom)
  const releaseNotes = useAtomValue(releaseNotesAtom)
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const activeSingleBotId = getSingleBotId(pathname)
  const showAllInOne = pathname === '/'
  const showSingleBot = !!activeSingleBotId
  const showChatWorkspace = showAllInOne || showSingleBot
  const [allInOneMounted, setAllInOneMounted] = useState(showChatWorkspace)
  const [singleBotWorkspaceMounted, setSingleBotWorkspaceMounted] = useState(showChatWorkspace)

  useEffect(() => {
    if (showChatWorkspace) {
      setAllInOneMounted(true)
      setSingleBotWorkspaceMounted(true)
    }
  }, [showChatWorkspace])

  return (
    <main
      className="h-screen grid grid-cols-[auto_1fr]"
      style={{ backgroundColor: followArcTheme ? 'var(--arc-palette-foregroundPrimary)' : themeColor }}
    >
      <Sidebar />
      <div className="px-[0.9375rem] py-3 h-full overflow-hidden">
        {allInOneMounted && (
          <div className={cx('h-full', showAllInOne ? 'block' : 'hidden')}>
            <Suspense fallback={null}>
              <MultiBotChatPanelPage skipStartupRedirect={pathname !== '/'} />
            </Suspense>
          </div>
        )}
        {singleBotWorkspaceMounted && (
          <div className={cx('h-full', showSingleBot ? 'block' : 'hidden')}>
            <Suspense fallback={null}>
              <SingleBotWorkspace activeBotId={activeSingleBotId} />
            </Suspense>
          </div>
        )}
        {!showChatWorkspace && (
          <div className="h-full">
            <Outlet />
          </div>
        )}
      </div>
      {releaseNotes.length > 0 && (
        <Suspense fallback={null}>
          <ReleaseNotesModal />
        </Suspense>
      )}
    </main>
  )
}

export default Layout
