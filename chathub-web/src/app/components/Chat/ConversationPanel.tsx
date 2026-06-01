import { motion } from 'framer-motion'
import { FC } from 'react'
import { cx } from '~/utils'
import { CHATBOTS } from '~app/consts'
import { BotId, BotInstance } from '../../bots'
import ChatbotName from './ChatbotName'

interface Props {
  botId: BotId
  bot: BotInstance
  messages: any[]
  onUserSendMessage: (input: string, image?: File) => void
  resetConversation: () => void
  generating: boolean
  stopGenerating: () => void
  mode?: 'full' | 'compact'
  onSwitchBot?: (botId: BotId) => void
}

const ConversationPanel: FC<Props> = (props) => {
  const botInfo = CHATBOTS[props.botId]
  const mode = props.mode || 'full'
  const marginClass = 'mx-5'

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
            src={botInfo.avatar}
            className="w-[18px] h-[18px] object-contain rounded-sm mr-2"
            whileHover={{ rotate: 180 }}
          />
          <ChatbotName
            botId={props.botId}
            name={botInfo.name}
            fullName={props.bot.name}
            onSwitchBot={mode === 'compact' ? props.onSwitchBot : undefined}
          />
        </div>
      </div>
      <div className="grow overflow-hidden">
        <webview
          src={botInfo.url}
          className="w-full h-full border-0"
          allowpopups="true"
          useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 (ChatHub)"
        />
      </div>
    </div>
  )
}

export default ConversationPanel
