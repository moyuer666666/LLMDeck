const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  setProxy: (proxyConfig) => ipcRenderer.send('set-proxy', proxyConfig),
  clipboardWriteImage: (imageBuffer) => ipcRenderer.invoke('clipboard-write-image', imageBuffer),
  clipboardWriteText: (text) => ipcRenderer.invoke('clipboard-write-text', text),
  pasteToWebview: (webContentsId) => ipcRenderer.invoke('paste-to-webview', webContentsId),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
})
