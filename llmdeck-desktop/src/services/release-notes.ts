import { compareVersions } from 'compare-versions'
import Browser from 'webextension-polyfill'
import { getVersion } from '~utils'

const RELEASE_NOTES = [
  {
    version: '2.0.0',
    notes: [
      '修复 Gemini 笔记本加载失败和 AI Studio 权限拒绝问题。',
      '修复 AI Studio 同步发送误触设置面板的问题。',
      '将使用一段时间后的弹窗改为推荐 LLMDeck 项目。',
    ],
  },
  {
    version: '1.0.3',
    notes: [
      '优化应用启动加载速度，减少首屏不必要的代码和依赖加载。',
      '优化 All-In-One 与单 bot 页面切换速度，保留已加载的 webview。',
      '单 bot 页面使用独立预热会话，避免继承 All-In-One 当前对话。',
    ],
  },
  {
    version: '1.0.2',
    notes: [
      '优化多会话窗口管理和缩略视图。',
      '清理会员相关功能，完善设置页版本与更新入口。',
    ],
  },
  {
    version: '1.0.1',
    notes: ['你好'],
  },
]

export async function checkReleaseNotes(): Promise<string[]> {
  const version = getVersion()
  const { lastSeenReleaseNotesVersion } = await Browser.storage.sync.get('lastSeenReleaseNotesVersion')

  const releasedNotes = RELEASE_NOTES.filter(({ version: v }) => compareVersions(v, version) <= 0)
  const notesToShow = lastSeenReleaseNotesVersion
    ? releasedNotes.filter(({ version: v }) => compareVersions(v, lastSeenReleaseNotesVersion) > 0).slice(0, 3)
    : releasedNotes.filter(({ version: v }) => compareVersions(v, version) === 0).slice(0, 1)

  if (notesToShow.length > 0) {
    await Browser.storage.sync.set({
      lastSeenReleaseNotesVersion: version,
      lastCheckReleaseNotesVersion: version,
    })
  }

  return notesToShow
    .map(({ notes }) => notes)
    .flat()
}
