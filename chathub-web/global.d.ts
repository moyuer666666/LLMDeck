declare module '*.gql'

declare namespace JSX {
  interface IntrinsicElements {
    webview: any;
  }
}

declare namespace Browser {
  namespace Tabs {
    interface Tab {
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
  namespace Runtime {
    interface MessageSender {
      tab?: Tabs.Tab
      frameId?: number
      id?: string
      url?: string
      origin?: string
    }
  }
  namespace Permissions {
    interface Permissions {
      permissions?: string[]
      origins?: string[]
    }
  }
}
