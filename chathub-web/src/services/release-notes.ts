import { compareVersions } from 'compare-versions'
import Browser from 'webextension-polyfill'
import { getVersion } from '~utils'

const RELEASE_NOTES = [
  {
    version: '1.0.1-web',
    notes: ['你好'],
  },
]

export async function checkReleaseNotes(): Promise<string[]> {
  const version = getVersion()
  const { lastCheckReleaseNotesVersion } = await Browser.storage.sync.get('lastCheckReleaseNotesVersion')

  const latestNoteVersion = RELEASE_NOTES[0]?.version
  const nextVersion =
    latestNoteVersion && compareVersions(latestNoteVersion, version) > 0 ? latestNoteVersion : version
  Browser.storage.sync.set({ lastCheckReleaseNotesVersion: nextVersion })

  if (!lastCheckReleaseNotesVersion) {
    return []
  }
  return RELEASE_NOTES.slice(0, 3)
    .filter(({ version: v }) => compareVersions(v, lastCheckReleaseNotesVersion) > 0)
    .map(({ notes }) => notes)
    .flat()
}
