const { app, BrowserWindow, session, Menu, MenuItem, ipcMain, clipboard, nativeImage, webContents, shell } = require('electron')
const path = require('path')

const APP_ID = 'com.llmdeck.desktop'
const APP_NAME = 'LLMDeck'
const USER_AGENT_MARKER = 'LLMDeck'

// Get localized labels for context menu items
function getContextMenuLabels() {
  const locale = app.getLocale() || 'en'
  const isZh = locale.startsWith('zh')
  return {
    undo: isZh ? '撤销' : 'Undo',
    redo: isZh ? '重做' : 'Redo',
    cut: isZh ? '剪切' : 'Cut',
    copy: isZh ? '复制' : 'Copy',
    paste: isZh ? '粘贴' : 'Paste',
    selectAll: isZh ? '全选' : 'Select All',
    copyLink: isZh ? '复制链接地址' : 'Copy Link Address',
    reload: isZh ? '重新加载页面' : 'Reload Page',
    inspect: isZh ? '检查' : 'Inspect Element'
  }
}


// Enable webview tag
console.log('--- Electron Main Process Starting ---')

const USER_AGENT = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 (${USER_AGENT_MARKER})`
const isDev = !app.isPackaged

app.setName(APP_NAME)
if (process.platform === 'win32') {
  app.setAppUserModelId(APP_ID)
}

// Register IPC handlers (must be registered once, outside createWindow)
// Write an image (as Buffer) to the system clipboard — async/awaitable
ipcMain.handle('clipboard-write-image', async (event, imageBuffer) => {
  try {
    const img = nativeImage.createFromBuffer(Buffer.from(imageBuffer))
    if (img.isEmpty()) {
      return { success: false, error: 'Invalid image data' }
    }
    clipboard.writeImage(img)
    return { success: true }
  } catch (err) {
    console.error('Failed to write image to clipboard:', err)
    return { success: false, error: err.message }
  }
})

// Paste clipboard content into a specific webContents (by ID) — async/awaitable
ipcMain.handle('paste-to-webview', async (event, webContentsId) => {
  try {
    const wc = webContents.fromId(webContentsId)
    if (wc) {
      wc.paste()
      return { success: true }
    }
    return { success: false, error: 'webContents not found for id: ' + webContentsId }
  } catch (err) {
    console.error('Failed to paste to webview:', err)
    return { success: false, error: err.message }
  }
})

// Write text to the system clipboard — async/awaitable
ipcMain.handle('clipboard-write-text', async (event, text) => {
  try {
    clipboard.writeText(text)
    return { success: true }
  } catch (err) {
    console.error('Failed to write text to clipboard:', err)
    return { success: false, error: err.message }
  }
})

ipcMain.handle('open-external', async (event, url) => {
  try {
    const parsedUrl = new URL(url)
    if (!['https:', 'http:'].includes(parsedUrl.protocol)) {
      return { success: false, error: 'Unsupported URL protocol' }
    }
    await shell.openExternal(parsedUrl.toString())
    return { success: true }
  } catch (err) {
    console.error('Failed to open external URL:', err)
    return { success: false, error: err.message }
  }
})

function createWindow() {
  console.log('Action: Creating Browser Window...')
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'build', 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      webviewTag: true, // Enable webview tag
      preload: path.join(__dirname, 'preload.cjs'),
    },
  })

  mainWindow.webContents.setUserAgent(USER_AGENT)

  // Use a dedicated session for webviews to handle headers cleanly
  const filter = { urls: ['<all_urls>'] }

  session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
    details.requestHeaders['User-Agent'] = USER_AGENT
    callback({ requestHeaders: details.requestHeaders })
  })

  session.defaultSession.webRequest.onHeadersReceived(filter, (details, callback) => {
    const responseHeaders = details.responseHeaders
    const deleteHeader = (name) => {
      for (const key in responseHeaders) {
        if (key.toLowerCase() === name.toLowerCase()) {
          delete responseHeaders[key]
        }
      }
    }
    deleteHeader('x-frame-options')
    deleteHeader('content-security-policy')
    callback({ cancel: false, responseHeaders: responseHeaders })
  })

  ipcMain.on('set-proxy', (event, config) => {
    const { mode, server } = config
    if (mode === 'custom' && server) {
      console.log(`Setting proxy to: ${server}`)
      session.defaultSession.setProxy({ proxyRules: server })
    } else {
      console.log('Resetting proxy to system default')
      session.defaultSession.setProxy({ mode: 'system' })
    }
  })

  if (isDev) {
    const url = 'http://127.0.0.1:5173'
    mainWindow.loadURL(url).catch(err => {
      console.error('Error: Failed to load dev URL:', err)
    })
  } else {
    const indexPath = path.join(__dirname, 'dist', 'index.html')
    mainWindow.loadFile(indexPath)
  }
}

app.whenReady().then(() => {
  console.log('Status: Electron App Ready.')
  Menu.setApplicationMenu(null)
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// Listen to context menu events globally for all webContents (main window, webviews, etc.)
app.on('web-contents-created', (event, contents) => {
  contents.on('context-menu', (e, params) => {
    const labels = getContextMenuLabels()
    const menu = new Menu()

    // 1. Text actions if clicked in an editable area
    if (params.isEditable) {
      menu.append(new MenuItem({ label: labels.undo, role: 'undo', enabled: params.editFlags.canUndo }))
      menu.append(new MenuItem({ label: labels.redo, role: 'redo', enabled: params.editFlags.canRedo }))
      menu.append(new MenuItem({ type: 'separator' }))
      menu.append(new MenuItem({ label: labels.cut, role: 'cut', enabled: params.editFlags.canCut }))
      menu.append(new MenuItem({ label: labels.copy, role: 'copy', enabled: params.editFlags.canCopy }))
      menu.append(new MenuItem({ label: labels.paste, role: 'paste', enabled: params.editFlags.canPaste }))
      menu.append(new MenuItem({ type: 'separator' }))
      menu.append(new MenuItem({ label: labels.selectAll, role: 'selectAll', enabled: params.editFlags.canSelectAll }))
      menu.append(new MenuItem({ type: 'separator' }))
    } else if (params.selectionText && params.selectionText.trim() !== '') {
      // 2. Copy selection option if text is selected
      menu.append(new MenuItem({ label: labels.copy, role: 'copy' }))
      menu.append(new MenuItem({ type: 'separator' }))
    }

    // 3. Link action if clicked on a link
    if (params.linkURL) {
      menu.append(new MenuItem({
        label: labels.copyLink,
        click: () => {
          const { clipboard } = require('electron')
          clipboard.writeText(params.linkURL)
        }
      }))
      menu.append(new MenuItem({ type: 'separator' }))
    }

    // 4. Reload page action
    menu.append(new MenuItem({
      label: labels.reload,
      click: () => {
        contents.reload()
      }
    }))

    // 5. Inspect element action
    menu.append(new MenuItem({
      label: labels.inspect,
      click: () => {
        contents.inspectElement(params.x, params.y)
      }
    }))

    // Popup the context menu
    const win = BrowserWindow.fromWebContents(contents) || BrowserWindow.getFocusedWindow()
    menu.popup({ window: win })
  })
})
