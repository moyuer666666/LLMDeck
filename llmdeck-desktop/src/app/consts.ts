import claudeLogo from '~/assets/logos/anthropic.png'
import baichuanLogo from '~/assets/logos/baichuan.png'
import bardLogo from '~/assets/logos/bard.svg'
import bingLogo from '~/assets/logos/bing.svg'
import chatglmLogo from '~/assets/logos/chatglm.svg'
import chatgptLogo from '~/assets/logos/chatgpt.svg'
import falconLogo from '~/assets/logos/falcon.jpeg'
import geminiLogo from '~/assets/logos/gemini.png'
import grokLogo from '~/assets/logos/grok.png'
import llamaLogo from '~/assets/logos/llama.png'
import mistralLogo from '~/assets/logos/mistral.png'
import piLogo from '~/assets/logos/pi.png'
import pplxLogo from '~/assets/logos/pplx.jpg'
import qianwenLogo from '~/assets/logos/qianwen.png'
import vicunaLogo from '~/assets/logos/vicuna.jpg'
import wizardlmLogo from '~/assets/logos/wizardlm.png'
import xunfeiLogo from '~/assets/logos/xunfei.png'
import yiLogo from '~/assets/logos/yi.svg'
import { BotId } from './bots'

export const CHATBOTS: Record<BotId, { name: string; avatar: string; url: string }> = {
  chatgpt: {
    name: 'ChatGPT',
    avatar: chatgptLogo,
    url: 'https://chatgpt.com',
  },
  claude: {
    name: 'Claude',
    avatar: claudeLogo,
    url: 'https://claude.ai',
  },
  bard: {
    name: 'Bard',
    avatar: bardLogo,
    url: 'https://gemini.google.com',
  },
  bing: {
    name: 'Bing',
    avatar: bingLogo,
    url: 'https://www.bing.com/chat',
  },
  perplexity: {
    name: 'Perplexity',
    avatar: pplxLogo,
    url: 'https://www.perplexity.ai',
  },
  llama: {
    name: 'Llama 2',
    avatar: llamaLogo,
    url: 'https://www.meta.ai',
  },
  gemini: {
    name: 'Gemini Pro',
    avatar: geminiLogo,
    url: 'https://gemini.google.com',
  },
  mistral: {
    name: 'Mixtral',
    avatar: mistralLogo,
    url: 'https://chat.mistral.ai',
  },
  vicuna: {
    name: 'Vicuna',
    avatar: vicunaLogo,
    url: 'https://chat.lmsys.org',
  },
  falcon: {
    name: 'Falcon',
    avatar: falconLogo,
    url: 'https://chat.lmsys.org',
  },
  grok: {
    name: 'Grok',
    avatar: grokLogo,
    url: 'https://x.ai',
  },
  pi: {
    name: 'Pi',
    avatar: piLogo,
    url: 'https://pi.ai',
  },
  wizardlm: {
    name: 'WizardLM',
    avatar: wizardlmLogo,
    url: 'https://chat.lmsys.org',
  },
  chatglm: {
    name: 'ChatGLM2',
    avatar: chatglmLogo,
    url: 'https://chatglm.cn',
  },
  xunfei: {
    name: 'iFlytek Spark',
    avatar: xunfeiLogo,
    url: 'https://xinghuo.xfyun.cn',
  },
  qianwen: {
    name: 'Qianwen',
    avatar: qianwenLogo,
    url: 'https://tongyi.aliyun.com',
  },
  baichuan: {
    name: 'Baichuan',
    avatar: baichuanLogo,
    url: 'https://www.baichuan-ai.com',
  },
  yi: {
    name: 'Yi-Chat',
    avatar: yiLogo,
    url: 'https://www.lingyiwanwu.com',
  },
}

export const ALL_IN_ONE_PAGE_ID = 'all'

export type Layout = 2 | 3 | 4 | 'imageInput' | 'twoVertical' | 'sixGrid' // twoVertical is deprecated
