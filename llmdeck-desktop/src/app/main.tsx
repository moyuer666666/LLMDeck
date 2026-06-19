import { RouterProvider } from '@tanstack/react-router'
import { Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { getUserConfig } from '~services/user-config'
import './base.scss'
import './i18n'
import { router } from './router'

const container = document.getElementById('app')!
const root = createRoot(container)

if (import.meta.env.VITE_SENTRY_DSN) {
  void import('../services/sentry')
}

if (window.electronAPI) {
  getUserConfig().then((config) => {
    window.electronAPI!.setProxy({
      mode: config.proxyMode,
      server: config.proxyServer,
    })
  })
}

const isElectron = navigator.userAgent.toLowerCase().includes('(llmdeck)')

if (isElectron) {
  root.render(
    <Suspense fallback={null}>
      <RouterProvider router={router} />
    </Suspense>,
  )
} else {
  root.render(
    <div
      style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        fontFamily: 'sans-serif',
        backgroundColor: '#1a1a1a',
        color: 'white',
      }}
    >
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>LLMDeck</h1>
      <p style={{ opacity: 0.8 }}>This app only runs in the desktop client.</p>
      <p style={{ marginTop: '2rem', fontSize: '0.8rem', opacity: 0.5 }}>
        Please use the desktop application to access this service.
      </p>
    </div>,
  )
}
