import { fileOpen, fileSave } from 'browser-fs-access'
import Browser from 'webextension-polyfill'

export async function exportData() {
  const syncData = await Browser.storage.sync.get(null)
  const blob = new Blob([JSON.stringify(syncData)], { type: 'application/json' })
  await fileSave(blob, { fileName: 'llmdeck-settings.json' })
}

export async function importData() {
  const blob = await fileOpen({ extensions: ['.json'] })
  const json = JSON.parse(await blob.text())
  if (!window.confirm('Are you sure you want to import settings? This will overwrite your current settings.')) {
    return
  }
  await Browser.storage.sync.clear()
  await Browser.storage.sync.set(json)

  alert('Imported settings successfully')
  location.reload()
}
