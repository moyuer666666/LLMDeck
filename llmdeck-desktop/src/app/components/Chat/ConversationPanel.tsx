import { motion } from 'framer-motion'
import { FC } from 'react'
import { cx, getFaviconUrl } from '~/utils'
import { useEnabledBots } from '~app/hooks/use-enabled-bots'
import { BotId } from '../../bots'
import ChatbotName from './ChatbotName'

interface Props {
  botId: BotId
  mode?: 'full' | 'compact'
  onSwitchBot?: (botId: BotId) => void
}

const ConversationPanel: FC<Props> = (props) => {
  const chatbots = useEnabledBots()
  const botInfo = chatbots.find((b) => b.id === props.botId)
  const mode = props.mode || 'full'
  const marginClass = 'mx-5'

  if (!botInfo) {
    return null
  }

  return (
    <div className={cx('flex flex-col overflow-hidden bg-primary-background h-full rounded-2xl')}>
      <div
        className={cx(
          'border-b border-solid border-primary-border flex flex-row items-center justify-between gap-2 py-[10px]',
          marginClass,
        )}
      >
        <div className="flex flex-row items-center">
          <motion.img
            src={getFaviconUrl(botInfo.url)}
            className="w-[18px] h-[18px] object-contain rounded-sm mr-2"
            whileHover={{ rotate: 180 }}
          />
          <ChatbotName
            botId={props.botId}
            name={botInfo.name}
            onSwitchBot={mode === 'compact' ? props.onSwitchBot : undefined}
          />
        </div>
      </div>
      <div className="grow overflow-hidden">
        <webview
          src={botInfo.url}
          className="w-full h-full border-0"
          allowpopups={true}
          useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 (LLMDeck)"
        />
      </div>
    </div>
  )
}

export default ConversationPanel
