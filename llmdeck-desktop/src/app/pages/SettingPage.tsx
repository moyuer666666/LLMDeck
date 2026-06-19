import { motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import Browser from 'webextension-polyfill'
import Button from '~app/components/Button'
import { Input } from '~app/components/Input'
import Select from '~app/components/Select'
import EnabledBotsSettings from '~app/components/Settings/EnabledBotsSettings'
import ExportDataPanel from '~app/components/Settings/ExportDataPanel'
import { ALL_IN_ONE_PAGE_ID } from '~app/consts'
import {
  UserConfig,
  getUserConfig,
  updateUserConfig,
} from '~services/user-config'
import { getVersion } from '~utils'
import PagePanel from '../components/Page'

const UPDATE_RELEASES_URL = 'https://github.com/moyuer666666/myChathub/releases/latest'

function SettingPage() {
  const { t } = useTranslation()
  const [userConfig, setUserConfig] = useState<UserConfig | undefined>(undefined)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    getUserConfig().then((config) => setUserConfig(config))
  }, [])

  const updateConfigValue = useCallback(
    (update: Partial<UserConfig>) => {
      setUserConfig({ ...userConfig!, ...update })
      setDirty(true)
    },
    [userConfig],
  )

  const save = useCallback(async () => {
    if (userConfig) {
      await updateUserConfig(userConfig)
    }

    if (window.electronAPI) {
      window.electronAPI.setProxy({
        mode: userConfig!.proxyMode,
        server: userConfig!.proxyServer,
      })
    }

    setDirty(false)
    toast.success('Saved')
    setTimeout(() => location.reload(), 500)
  }, [userConfig])

  const openUpdatePage = useCallback(async () => {
    try {
      if (window.electronAPI?.openExternal) {
        const result = await window.electronAPI.openExternal(UPDATE_RELEASES_URL)
        if (!result.success) {
          throw new Error(result.error)
        }
        return
      }
      window.open(UPDATE_RELEASES_URL, '_blank', 'noopener,noreferrer')
    } catch (err) {
      console.error('Failed to open update page:', err)
      toast.error(t('Failed to open update page'))
    }
  }, [t])

  if (!userConfig) {
    return null
  }

  return (
    <PagePanel title={`${t('Settings')} (v${getVersion()})`}>
      <div className="flex flex-col gap-5 mt-3 mb-10 px-10">
        <div>
          <p className="font-bold mb-2 text-lg">{t('Updates')}</p>
          <div className="flex flex-row items-center justify-between gap-4 max-w-[400px] rounded-xl border border-solid border-primary-border bg-secondary bg-opacity-10 px-4 py-3">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-primary-text">{t('Current version')}</span>
              <span className="text-sm text-secondary-text">v{getVersion()}</span>
            </div>
            <Button size="small" text={t('Check for updates')} onClick={openUpdatePage} className="py-2" />
          </div>
        </div>
        <div>
          <p className="font-bold mb-2 text-lg">{t('Startup page')}</p>
          <div className="w-[200px]">
            <Select
              options={[
                { name: 'All-In-One', value: ALL_IN_ONE_PAGE_ID },
                ...userConfig.chatbots.map((bot) => ({ name: bot.name, value: bot.id })),
              ]}
              value={userConfig.startupPage}
              onChange={(v) => updateConfigValue({ startupPage: v })}
            />
          </div>
        </div>

        <div>
          <p className="font-bold mb-2 text-lg">网络代理 (Network Proxy)</p>
          <div className="flex flex-col gap-3 max-w-[400px]">
            <Select
              options={[
                { name: '系统默认 (System Default)', value: 'system' },
                { name: '自定义 (Custom)', value: 'custom' },
              ]}
              value={userConfig.proxyMode}
              onChange={(v) => updateConfigValue({ proxyMode: v as 'system' | 'custom' })}
            />
            {userConfig.proxyMode === 'custom' && (
              <Input
                placeholder="例如: http://127.0.0.1:7890"
                value={userConfig.proxyServer}
                onChange={(e) => updateConfigValue({ proxyServer: e.currentTarget.value })}
              />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 max-w-[700px]">
          <p className="font-bold text-lg">{t('Chatbots')}</p>
          <EnabledBotsSettings userConfig={userConfig} updateConfigValue={updateConfigValue} />
        </div>
        <ExportDataPanel />
      </div>
      {dirty && (
        <motion.div
          className="sticky bottom-0 w-full bg-primary-background border-t-2 border-primary-border px-5 py-4 drop-shadow flex flex-row items-center justify-center"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: 'tween', ease: 'easeInOut' }}
        >
          <Button color="primary" size="small" text={t('Save changes')} onClick={save} className="py-2" />
        </motion.div>
      )}
      <Toaster position="bottom-center" />
    </PagePanel>
  )
}

export default SettingPage
