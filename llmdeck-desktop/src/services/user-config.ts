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

export async function getUserConfig(): Promise<UserConfig> {
  const result = await Browser.storage.sync.get(Object.keys(userConfigWithDefaultValue))
  return defaults(result, userConfigWithDefaultValue)
}

export async function updateUserConfig(updates: Partial<UserConfig>) {
  console.debug('update configs', updates)
  await Browser.storage.sync.set(updates)
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) {
      await Browser.storage.sync.remove(key)
    }
  }
}
