/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-explicit-any */
import packageJson from '../../package.json'

export namespace Runtime {
  export interface MessageSender {
    tab?: Tabs.Tab
    frameId?: number
    id?: string
    url?: string
    origin?: string
  }
  export interface Port {
    name: string
    disconnect: () => void
    onDisconnect: {
      addListener: (callback: (port: Port) => void) => void
      removeListener: (callback: (port: Port) => void) => void
    }
    onMessage: {
      addListener: (callback: (message: any, port: Port) => void) => void
      removeListener: (callback: (message: any, port: Port) => void) => void
    }
    postMessage: (message: any) => void
    sender?: MessageSender
  }
}

export namespace Tabs {
  export interface Tab {
    id?: number
    index: number
    windowId: number
    highlighted: boolean
    active: boolean
    attention?: boolean
    pinned: boolean
    status?: string
    discarded: boolean
    incognito: boolean
    width?: number
    height?: number
    lastAccessed?: number
    audible?: boolean
    mutedInfo?: any
    url?: string
    title?: string
    favIconUrl?: string
    pendingUrl?: string
    sessionId?: string
  }
}

export namespace Permissions {
  export interface Permissions {
    permissions?: string[]
    origins?: string[]
  }
}

const storageShim = {
  get: async (keys: string | string[] | Record<string, any> | null): Promise<any> => {
    const result: Record<string, any> = {}
    if (keys === null) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          try {
            result[key] = JSON.parse(localStorage.getItem(key) || 'null')
          } catch {
            result[key] = localStorage.getItem(key)
          }
        }
      }
    } else if (typeof keys === 'string') {
      const val = localStorage.getItem(keys)
      if (val !== null) {
        try {
          result[keys] = JSON.parse(val)
        } catch {
          result[keys] = val
        }
      }
    } else if (Array.isArray(keys)) {
      keys.forEach((key) => {
        const val = localStorage.getItem(key)
        if (val !== null) {
          try {
            result[key] = JSON.parse(val)
          } catch {
            result[key] = val
          }
        }
      })
    } else if (typeof keys === 'object') {
      Object.keys(keys).forEach((key) => {
        const val = localStorage.getItem(key)
        if (val === null) {
          result[key] = (keys as any)[key]
        } else {
          try {
            result[key] = JSON.parse(val)
          } catch {
            result[key] = val
          }
        }
      })
    }
    return result
  },
  set: async (items: Record<string, any>) => {
    Object.entries(items).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value))
    })
  },
  remove: async (keys: string | string[]) => {
    if (typeof keys === 'string') {
      localStorage.removeItem(keys)
    } else {
      keys.forEach((key) => localStorage.removeItem(key))
    }
  },
  clear: async () => {
    localStorage.clear()
  },
}

export const storage = {
  sync: storageShim,
  local: storageShim,
}

export const runtime = {
  getURL: (path: string) => path,
  getManifest: () => ({ version: packageJson.version }),
  onMessage: {
    addListener: (callback: (message: any, sender: Runtime.MessageSender, sendResponse: (response?: any) => void) => void | boolean | Promise<any>) => {},
    removeListener: (callback: (message: any, sender: Runtime.MessageSender, sendResponse: (response?: any) => void) => void | boolean | Promise<any>) => {},
  },
  sendMessage: async (message: any): Promise<any> => {},
  onConnect: {
    addListener: (callback: (port: Runtime.Port) => void) => {},
  },
}

export const tabs = {
  query: async (queryInfo: any): Promise<Tabs.Tab[]> => [],
  sendMessage: async (tabId: number, message: any): Promise<any> => {},
  create: async (createProperties: any): Promise<any> => ({}),
  reload: async (tabId: number) => {},
  connect: (tabId: number, connectInfo: any): Runtime.Port => ({
    name: '',
    disconnect: () => {},
    onDisconnect: {
      addListener: (cb: any) => {},
      removeListener: (cb: any) => {},
    },
    onMessage: {
      addListener: (cb: any) => {},
      removeListener: (cb: any) => {},
    },
    postMessage: (msg: any) => {},
  }),
  getZoom: async () => {
    const zoom = localStorage.getItem('zoomLevel')
    return zoom ? parseFloat(zoom) : 1
  },
  setZoom: async (zoomLevel: number) => {
    localStorage.setItem('zoomLevel', zoomLevel.toString())
    if (typeof document !== 'undefined') {
      document.documentElement.style.fontSize = `${zoomLevel * 100}%`
    }
  },
}

// Apply zoom on load
if (typeof document !== 'undefined') {
  const applyZoom = async () => {
    const zoom = await tabs.getZoom()
    const doApply = () => {
      document.documentElement.style.fontSize = `${zoom * 100}%`
    }
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      doApply()
    } else {
      window.addEventListener('DOMContentLoaded', doApply)
    }
  }
  applyZoom()
}

export const permissions = {
  contains: async (permissions: Permissions.Permissions) => true,
  request: async (permissions: Permissions.Permissions) => true,
  remove: async (permissions: Permissions.Permissions) => true,
}

export const commands = {
  getAll: async () => [],
}

export const i18n = {
  getMessage: (key: string) => key,
}

const BrowserValue = {
  storage,
  runtime,
  tabs,
  commands,
  i18n,
  permissions,
}

export default BrowserValue
