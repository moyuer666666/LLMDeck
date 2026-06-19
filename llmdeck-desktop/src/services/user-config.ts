import { defaults } from 'lodash-es'
import Browser from 'webextension-polyfill'
import { ALL_IN_ONE_PAGE_ID } from '~app/consts'

export interface Chatbot {
  id: string
  name: string
  url: string
}

export const DEFAULT_CHATBOTS: Chatbot[] = [
  { id: 'gemini', name: 'Gemini Pro', url: 'https://gemini.google.com' },
  { id: 'claude', name: 'Claude', url: 'https://claude.ai' },
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com' },
]

const userConfigWithDefaultValue = {
  startupPage: ALL_IN_ONE_PAGE_ID,
  chatbots: DEFAULT_CHATBOTS,
  proxyMode: 'system' as 'system' | 'custom',
  proxyServer: '',
}

export type UserConfig = typeof userConfigWithDefaultValue

const userConfigKeys = Object.keys(userConfigWithDefaultValue)
let cachedUserConfig: UserConfig | undefined
let pendingUserConfig: Promise<UserConfig> | undefined

function withDefaultConfig(config: Partial<UserConfig>): UserConfig {
  return defaults({}, config, userConfigWithDefaultValue) as UserConfig
}

export async function getUserConfig(): Promise<UserConfig> {
  if (cachedUserConfig) {
    return cachedUserConfig
  }

  if (!pendingUserConfig) {
    pendingUserConfig = Browser.storage.sync
      .get(userConfigKeys)
      .then((result) => {
        cachedUserConfig = withDefaultConfig(result as Partial<UserConfig>)
        return cachedUserConfig
      })
      .finally(() => {
        pendingUserConfig = undefined
      })
  }

  return pendingUserConfig
}

export async function updateUserConfig(updates: Partial<UserConfig>) {
  console.debug('update configs', updates)
  await Browser.storage.sync.set(updates)
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) {
      await Browser.storage.sync.remove(key)
    }
  }

  const nextConfig = { ...(cachedUserConfig || userConfigWithDefaultValue), ...updates }
  for (const [key, value] of Object.entries(nextConfig)) {
    if (value === undefined) {
      delete nextConfig[key as keyof typeof nextConfig]
    }
  }
  cachedUserConfig = withDefaultConfig(nextConfig)
  pendingUserConfig = undefined
}
