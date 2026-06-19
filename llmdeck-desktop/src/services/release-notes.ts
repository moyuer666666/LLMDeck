import { compareVersions } from 'compare-versions'
import Browser from 'webextension-polyfill'
import { getVersion } from '~utils'

const RELEASE_NOTES = [
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
