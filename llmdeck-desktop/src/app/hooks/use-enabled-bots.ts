import useSWR from 'swr'
import { getUserConfig } from '~services/user-config'

export function useEnabledBots() {
  const query = useSWR('enabled-bots', async () => {
    const { chatbots } = await getUserConfig()
    return chatbots
  })
  return query.data || []
}
