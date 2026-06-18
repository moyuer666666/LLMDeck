import react from '@vitejs/plugin-react'
import jotaiDebugLabel from 'jotai-babel/plugin-debug-label'
import jotaiReactRefresh from 'jotai-babel/plugin-react-refresh'
import path from 'path'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(({ mode }) => {
  return {
    base: './',
    resolve: {
      alias: {
        'webextension-polyfill': path.resolve(__dirname, 'src/shim/browser.ts'),
        '~app': path.resolve(__dirname, 'src/app'),
        '~services': path.resolve(__dirname, 'src/services'),
        '~utils': path.resolve(__dirname, 'src/utils'),
        '~types': path.resolve(__dirname, 'src/types'),
        '~assets': path.resolve(__dirname, 'src/assets'),
      },
    },
    plugins: [
      tsconfigPaths(),
      react({
        babel: {
          plugins: [jotaiDebugLabel, jotaiReactRefresh],
        },
      }),
    ],
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
        },
      },
    },
    build: {
      rollupOptions: {
        input: ['index.html'],
      },
    },
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : [],
    },
    server: {
      host: '127.0.0.1',
      strictPort: true,
      port: 5173,
      hmr: {
        clientPort: 5173,
      },
    },
  }
})
