import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useAtom, useSetAtom } from 'jotai'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import allInOneIcon from '~/assets/all-in-one.svg'
import brandMark from '~/assets/brand-mark-clean.png'
import collapseIcon from '~/assets/icons/collapse.svg'
import settingIcon from '~/assets/icons/setting.svg'
import themeIcon from '~/assets/icons/theme.svg'
import { cx, getFaviconUrl } from '~/utils'
import { useEnabledBots } from '~app/hooks/use-enabled-bots'
import { releaseNotesAtom, sidebarCollapsedAtom } from '~app/state'
import { checkReleaseNotes } from '~services/release-notes'
import GuideModal from '../GuideModal'
import ThemeSettingModal from '../ThemeSettingModal'
import Tooltip from '../Tooltip'
import NavLink from './NavLink'

function IconButton(props: { icon: string; onClick?: () => void }) {
  return (
    <div
      className="p-[6px] rounded-[10px] w-fit cursor-pointer hover:opacity-80 bg-secondary bg-opacity-20"
      onClick={props.onClick}
    >
      <img src={props.icon} className="w-6 h-6" />
    </div>
  )
}

function Sidebar() {
  const { t } = useTranslation()
  const [collapsed, setCollapsed] = useAtom(sidebarCollapsedAtom)
  const [themeSettingModalOpen, setThemeSettingModalOpen] = useState(false)
  const enabledBots = useEnabledBots()
  const setReleaseNotes = useSetAtom(releaseNotesAtom)

  useEffect(() => {
    checkReleaseNotes().then(setReleaseNotes)
  }, [setReleaseNotes])

  return (
    <motion.aside
      className={cx(
        'flex flex-col bg-primary-background bg-opacity-40 overflow-hidden',
        collapsed ? 'items-center px-[0.9375rem]' : 'w-[14.375rem] px-4',
      )}
    >
      <div className={cx('flex mt-7 items-center', collapsed ? 'justify-center' : 'justify-between')}>
        {!collapsed && (
          <div className="flex min-w-0 items-center gap-2.5">
            <img src={brandMark} className="h-16 w-16 shrink-0 object-contain drop-shadow-sm" />
            <span className="flex flex-col bg-gradient-to-r from-[#6756BD] via-[#4987FC] to-[#303D72] bg-clip-text text-[1.45rem] font-black leading-[0.82] tracking-tight text-transparent drop-shadow-[0_1px_0_rgba(255,255,255,0.55)]">
              <span>LLM</span>
              <span>Deck</span>
            </span>
          </div>
        )}
        <motion.img
          src={collapseIcon}
          className={cx('h-6 w-6 shrink-0 cursor-pointer', !collapsed && 'ml-3')}
          animate={{ rotate: collapsed ? 180 : 0 }}
          onClick={() => setCollapsed((c) => !c)}
        />
      </div>
      <div className="flex flex-col gap-[13px] mt-10 overflow-y-auto scrollbar-none">
        <NavLink to="/" text={'All-In-One'} icon={allInOneIcon} iconOnly={collapsed} />
        {enabledBots.map((bot) => (
          <NavLink
            key={bot.id}
            to="/chat/$botId"
            params={{ botId: bot.id }}
            text={bot.name}
            icon={getFaviconUrl(bot.url)}
            iconOnly={collapsed}
          />
        ))}
      </div>
      <div className="mt-auto pt-2">
        {!collapsed && <hr className="border-[#ffffff4d]" />}
        <div className={cx('flex mt-5 gap-[10px] mb-4', collapsed ? 'flex-col' : 'flex-row ')}>
          {!collapsed && (
            <Tooltip content={t('Display')}>
              <a onClick={() => setThemeSettingModalOpen(true)}>
                <IconButton icon={themeIcon} />
              </a>
            </Tooltip>
          )}
          <Tooltip content={t('Settings')}>
            <Link to="/setting">
              <IconButton icon={settingIcon} />
            </Link>
          </Tooltip>
        </div>
      </div>
      <GuideModal />
      <ThemeSettingModal open={themeSettingModalOpen} onClose={() => setThemeSettingModalOpen(false)} />
    </motion.aside>
  )
}

export default Sidebar
