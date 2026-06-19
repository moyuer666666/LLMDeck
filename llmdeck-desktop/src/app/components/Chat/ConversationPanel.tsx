import { motion } from 'framer-motion'
import { FC } from 'react'
import { FiChevronLeft, FiChevronRight, FiGrid, FiMaximize2, FiMinimize2, FiX } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import { cx, getFaviconUrl } from '~/utils'
import { useEnabledBots } from '~app/hooks/use-enabled-bots'
import { BotId } from '../../bots'
import ChatbotName from './ChatbotName'

interface Props {
  botId: BotId
  mode?: 'full' | 'compact'
  onSwitchBot?: (botId: BotId) => void
  focused?: boolean
  onFocusToggle?: () => void
  overview?: boolean
  onOverviewToggle?: () => void
  canMoveLeft?: boolean
  canMoveRight?: boolean
  onMoveLeft?: () => void
  onMoveRight?: () => void
  onRemove?: () => void
}

const ConversationPanel: FC<Props> = (props) => {
  const { t } = useTranslation()
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
            draggable={false}
            whileHover={{ rotate: 180 }}
          />
          <ChatbotName
            botId={props.botId}
            name={botInfo.name}
            onSwitchBot={mode === 'compact' ? props.onSwitchBot : undefined}
          />
        </div>
        {(props.onOverviewToggle || props.onMoveLeft || props.onMoveRight || props.onFocusToggle || props.onRemove) && (
          <div className="flex flex-row items-center gap-1 shrink-0">
            {props.onOverviewToggle && (
              <button
                type="button"
                title={props.overview ? t('Exit overview') : t('View all sessions')}
                className={cx(
                  'shrink-0 p-1 rounded-md text-light-text hover:text-primary-text hover:bg-secondary transition-colors',
                  props.overview && 'text-primary-text bg-secondary',
                )}
                onClick={props.onOverviewToggle}
              >
                <FiGrid className="w-4 h-4" />
              </button>
            )}
            {(props.onMoveLeft || props.onMoveRight) && (
              <>
                <button
                  type="button"
                  title={t('Move left')}
                  disabled={!props.canMoveLeft}
                  className={cx(
                    'shrink-0 p-1 rounded-md transition-colors',
                    props.canMoveLeft
                      ? 'text-light-text hover:text-primary-text hover:bg-secondary'
                      : 'text-light-text opacity-35 cursor-not-allowed',
                  )}
                  onClick={props.onMoveLeft}
                >
                  <FiChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title={t('Move right')}
                  disabled={!props.canMoveRight}
                  className={cx(
                    'shrink-0 p-1 rounded-md transition-colors',
                    props.canMoveRight
                      ? 'text-light-text hover:text-primary-text hover:bg-secondary'
                      : 'text-light-text opacity-35 cursor-not-allowed',
                  )}
                  onClick={props.onMoveRight}
                >
                  <FiChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
            {props.onFocusToggle && (
              <button
                type="button"
                title={props.focused ? t('Exit focus') : t('Focus this bot')}
                className="shrink-0 p-1 rounded-md text-light-text hover:text-primary-text hover:bg-secondary transition-colors"
                onClick={props.onFocusToggle}
              >
                {props.focused ? <FiMinimize2 className="w-4 h-4" /> : <FiMaximize2 className="w-4 h-4" />}
              </button>
            )}
            {props.onRemove && (
              <button
                type="button"
                title={t('Remove session')}
                className="shrink-0 p-1 rounded-md text-light-text hover:text-red-500 hover:bg-secondary transition-colors"
                onClick={props.onRemove}
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
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
