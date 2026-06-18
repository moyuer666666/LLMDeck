import { FC } from 'react'
import { useEnabledBots } from '~app/hooks/use-enabled-bots'
import { BotId } from '../bots'

interface Props {
  botId: BotId
}

const SingleBotChatPanel: FC<Props> = ({ botId }) => {
  const chatbots = useEnabledBots()
  const botConfig = chatbots.find((b) => b.id === botId)

  if (!botConfig) {
    return null
  }

  return (
    <div className="overflow-hidden h-full">
      <webview
        src={botConfig.url}
        className="w-full h-full border-0"
        allowpopups={true}
        useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 (LLMDeck)"
      />
    </div>
  )
}

export default SingleBotChatPanel
