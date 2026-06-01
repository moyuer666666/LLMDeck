import { ClaudeMode, getUserConfig } from '~/services/user-config'
import * as agent from '~services/agent'
import { AsyncAbstractBot, MessageParams } from '../abstract-bot'
import { ClaudeApiBot } from '../claude-api'
import { ClaudeWebBot } from '../claude-web'

export class ClaudeBot extends AsyncAbstractBot {
  async initializeBot() {
    const { claudeMode, ...config } = await getUserConfig()
    if (claudeMode === ClaudeMode.API) {
      if (!config.claudeApiKey) {
        throw new Error('Claude API key missing')
      }
      return new ClaudeApiBot({
        claudeApiKey: config.claudeApiKey,
        claudeApiModel: config.claudeApiModel,
      })
    }
    return new ClaudeWebBot()
  }

  async sendMessage(params: MessageParams) {
    const { claudeWebAccess } = await getUserConfig()
    if (claudeWebAccess) {
      return agent.execute(params.prompt, (prompt) => this.doSendMessageGenerator({ ...params, prompt }), params.signal)
    }
    return this.doSendMessageGenerator(params)
  }
}
