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
const AI_STUDIO_USER_AGENT = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${process.versions.chrome} Safari/537.36`
const ACCEPT_LANGUAGES = 'zh-CN,zh,en-US,en'
const isDev = !app.isPackaged

app.setName(APP_NAME)
app.userAgentFallback = USER_AGENT
if (process.platform === 'win32') {
  app.setAppUserModelId(APP_ID)
}

const GOOGLE_AI_HOSTS = new Set(['aistudio.google.com', 'gemini.google.com'])
const GOOGLE_RELATED_HOSTS = new Set(['google.com', 'googleapis.com', 'googleusercontent.com', 'gstatic.com'])
const GOOGLE_LOGIN_COOKIE_NAMES = new Set([
  'SID',
  'HSID',
  'SSID',
  'APISID',
  'SAPISID',
  'LSID',
  '__Secure-1PSID',
  '__Secure-3PSID',
  '__Secure-1PAPISID',
  '__Secure-3PAPISID',
])
const GOOGLE_AI_PERMISSIONS = new Set([
  'clipboard-read',
  'clipboard-sanitized-write',
  'fileSystem',
  'fullscreen',
  'media',
  'storage-access',
  'top-level-storage-access',
])
const COMMON_SAFE_PERMISSIONS = new Set(['clipboard-sanitized-write', 'fullscreen'])
const trackedWebContents = new Set()
let hasGoogleLogin = false
let pendingGoogleLoginRefresh = null

function getHost(value) {
  if (!value) return ''
  try {
    return new URL(value).hostname.toLowerCase()
  } catch {
    return ''
  }
}

function isHttpsUrl(value) {
  if (!value) return false
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

function isGoogleRelatedHost(host) {
  if (!host) return false
  if (GOOGLE_RELATED_HOSTS.has(host)) return true
  return Array.from(GOOGLE_RELATED_HOSTS).some((baseHost) => host.endsWith(`.${baseHost}`))
}

function isGoogleAiUrl(value) {
  return GOOGLE_AI_HOSTS.has(getHost(value))
}

function isGoogleAiWebContents(contents) {
  if (!contents || contents.isDestroyed()) return false
  return isGoogleAiUrl(contents.getURL())
}

function getUserAgentForUrl(value) {
  return hasGoogleLogin ? AI_STUDIO_USER_AGENT : USER_AGENT
}

function setUserAgentForUrl(contents, value) {
  if (!contents || contents.isDestroyed()) return
  contents.setUserAgent(getUserAgentForUrl(value))
}

function getRequestUserAgent(details) {
  return hasGoogleLogin ? AI_STUDIO_USER_AGENT : USER_AGENT
}

function isGoogleLoginCookie(cookie) {
  if (!cookie || !GOOGLE_LOGIN_COOKIE_NAMES.has(cookie.name)) return false
  const domain = (cookie.domain || '').replace(/^\./, '').toLowerCase()
  return domain === 'google.com' || domain.endsWith('.google.com')
}

function updateTrackedGoogleAiUserAgents(reloadAiPages = false) {
  for (const contents of Array.from(trackedWebContents)) {
    if (!contents || contents.isDestroyed()) {
      trackedWebContents.delete(contents)
      continue
    }

    const url = contents.getURL()
    setUserAgentForUrl(contents, url)
    if (reloadAiPages && isGoogleAiUrl(url)) {
      contents.reload()
    }
  }
}

function refreshGoogleLoginState(ses) {
  if (pendingGoogleLoginRefresh) return pendingGoogleLoginRefresh

  pendingGoogleLoginRefresh = ses.cookies
    .get({ url: 'https://accounts.google.com' })
    .then((cookies) => {
      const nextHasGoogleLogin = cookies.some(isGoogleLoginCookie)
      if (nextHasGoogleLogin !== hasGoogleLogin) {
        hasGoogleLogin = nextHasGoogleLogin
        updateTrackedGoogleAiUserAgents(true)
      }
    })
    .catch((err) => {
      console.error('Failed to refresh Google login state:', err)
    })
    .finally(() => {
      pendingGoogleLoginRefresh = null
    })

  return pendingGoogleLoginRefresh
}

function attachUserAgentSwitch(contents) {
  if (!contents || contents.isDestroyed() || contents.__llmDeckUserAgentSwitch) return
  contents.__llmDeckUserAgentSwitch = true
  trackedWebContents.add(contents)
  contents.once('destroyed', () => {
    trackedWebContents.delete(contents)
  })

  contents.on('will-navigate', (event, url) => {
    setUserAgentForUrl(contents, url)
  })
  contents.on('did-navigate', (event, url) => {
    setUserAgentForUrl(contents, url)
  })
  contents.on('did-finish-load', () => {
    setUserAgentForUrl(contents, contents.getURL())
  })
}

function shouldAllowPermission(contents, permission, requestingOrigin, details = {}) {
  const candidates = [
    requestingOrigin,
    details.requestingUrl,
    details.securityOrigin,
    details.embeddingOrigin,
  ].filter(Boolean)

  if (COMMON_SAFE_PERMISSIONS.has(permission)) {
    return candidates.some(isHttpsUrl) || isHttpsUrl(contents?.getURL?.())
  }

  if (!GOOGLE_AI_PERMISSIONS.has(permission) || !isGoogleAiWebContents(contents)) {
    return false
  }

  if (candidates.length === 0) {
    return true
  }

  return candidates.some((value) => isGoogleRelatedHost(getHost(value)))
}

function configureSession(ses) {
  if (ses.__llmDeckConfigured) return
  ses.__llmDeckConfigured = true
  ses.setUserAgent(USER_AGENT, ACCEPT_LANGUAGES)
  refreshGoogleLoginState(ses)
  ses.cookies.on('changed', (event, cookie) => {
    if (isGoogleLoginCookie(cookie)) {
      refreshGoogleLoginState(ses)
    }
  })
  ses.setPermissionCheckHandler((contents, permission, requestingOrigin, details) => {
    return shouldAllowPermission(contents, permission, requestingOrigin, details)
  })
  ses.setPermissionRequestHandler((contents, permission, callback, details) => {
    callback(shouldAllowPermission(contents, permission, details.requestingUrl, details))
  })
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
  configureSession(session.defaultSession)

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

  mainWindow.webContents.on('will-attach-webview', (event, webPreferences, params) => {
    params.useragent = getUserAgentForUrl(params.src)
    delete webPreferences.preload
    webPreferences.nodeIntegration = false
    webPreferences.contextIsolation = true
    webPreferences.webSecurity = true
  })

  mainWindow.webContents.on('did-attach-webview', (event, guestContents) => {
    setUserAgentForUrl(guestContents, guestContents.getURL())
    attachUserAgentSwitch(guestContents)
  })

  // Use a dedicated session for webviews to handle headers cleanly
  const filter = { urls: ['<all_urls>'] }

  session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
    details.requestHeaders['User-Agent'] = getRequestUserAgent(details)
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
