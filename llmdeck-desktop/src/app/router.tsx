import { createHashHistory, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { lazy } from 'react'

const Layout = lazy(() => import('./components/Layout'))
const SettingPage = lazy(() => import('./pages/SettingPage'))

function EmptyRoute() {
  return null
}

const rootRoute = createRootRoute()

const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  component: Layout,
  id: 'layout',
})

const indexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/',
  component: EmptyRoute,
})

function ChatRoute() {
  return null
}

const chatRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'chat/$botId',
  component: ChatRoute,
})

const settingRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: 'setting',
  component: SettingPage,
})

const routeTree = rootRoute.addChildren([layoutRoute.addChildren([indexRoute, chatRoute, settingRoute])])

const hashHistory = createHashHistory()
const router = createRouter({ routeTree, history: hashHistory })

export { router }
