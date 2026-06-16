const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  setProxy: (proxyConfig) => ipcRenderer.send('set-proxy', proxyConfig),
  clipboardWriteImage: (imageBuffer) => ipcRenderer.send('clipboard-write-image', imageBuffer),
  clipboardWriteText: (text) => ipcRenderer.send('clipboard-write-text', text),
  pasteToWebview: (webContentsId) => ipcRenderer.send('paste-to-webview', webContentsId),
})
