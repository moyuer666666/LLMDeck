import { FC, useEffect, useMemo, useState } from 'react'
import { cx } from '~/utils'
import type { BotId } from '~app/bots'
import { useEnabledBots } from '~app/hooks/use-enabled-bots'
import ConversationPanel from './ConversationPanel'

interface Props {
  activeBotId: BotId | null
}

const SingleBotWorkspace: FC<Props> = ({ activeBotId }) => {
  const chatbots = useEnabledBots()
  const [preloadInactiveBots, setPreloadInactiveBots] = useState(false)
  const botIds = useMemo(() => {
    if (preloadInactiveBots) {
      return chatbots.map((bot) => bot.id)
    }
    return activeBotId ? [activeBotId] : []
  }, [activeBotId, chatbots, preloadInactiveBots])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPreloadInactiveBots(true)
    }, 300)

    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className="relative h-full overflow-hidden">
      {botIds.map((botId) => {
        const active = botId === activeBotId
        return (
          <div
            key={botId}
            aria-hidden={!active}
            className={cx('absolute inset-0', active ? 'visible z-10' : 'invisible z-0 pointer-events-none')}
          >
            <ConversationPanel botId={botId} mode="compact" activeForBroadcast={false} showHeader={false} />
          </div>
        )
      })}
    </div>
  )
}

export default SingleBotWorkspace
