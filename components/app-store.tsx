'use client'

import * as React from 'react'
import {
  DEFAULT_ROLE,
  getRole,
  type Role,
  type RoleKey,
  can,
  routeMeta,
} from '@/lib/nav'

export type WorkTab = { path: string; title: string }

type State = {
  ready: boolean
  signedIn: boolean
  rememberedAccount: string
  roleKey: RoleKey
  collapsed: boolean
  tabs: WorkTab[]
}

type Store = State & {
  role: Role
  allow: (perm: string) => boolean
  signIn: (account: string, remember: boolean) => void
  signOut: () => void
  setRoleKey: (key: RoleKey) => void
  toggleCollapsed: () => void
  openTab: (tab: WorkTab) => void
  closeTab: (path: string) => string | null
  closeOthers: (path: string) => void
  closeAll: () => string
}

const HOME: WorkTab = { path: '/workbench', title: '工作台' }
const KEY = 'shaangu-admin-state-v1'

const initial: State = {
  ready: false,
  signedIn: false,
  rememberedAccount: '',
  roleKey: DEFAULT_ROLE,
  collapsed: false,
  tabs: [HOME],
}

const Ctx = React.createContext<Store | null>(null)

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<State>(initial)

  // 刷新后恢复演示角色、侧栏状态、已打开页签和登录态
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY)
      if (raw) {
        const saved = JSON.parse(raw) as Partial<State>
        // 丢弃指向已下线路由的历史页签，避免恢复后打开空白页
        const valid = (saved.tabs ?? []).filter((t) => routeMeta(t.path))
        setState((s) => ({
          ...s,
          ...saved,
          tabs: valid.length ? valid : [HOME],
          ready: true,
        }))
        return
      }
    } catch {
      // 忽略损坏的本地状态
    }
    setState((s) => ({ ...s, ready: true }))
  }, [])

  React.useEffect(() => {
    if (!state.ready) return
    const { ready: _ready, ...persist } = state
    window.localStorage.setItem(KEY, JSON.stringify(persist))
  }, [state])

  const role = getRole(state.roleKey)

  const store: Store = {
    ...state,
    role,
    allow: (perm: string) => can(role, perm),
    signIn: (account, remember) =>
      setState((s) => ({
        ...s,
        signedIn: true,
        rememberedAccount: remember ? account : '',
      })),
    signOut: () => setState((s) => ({ ...s, signedIn: false, tabs: [HOME] })),
    setRoleKey: (key) => setState((s) => ({ ...s, roleKey: key })),
    toggleCollapsed: () => setState((s) => ({ ...s, collapsed: !s.collapsed })),
    openTab: (tab) =>
      setState((s) =>
        s.tabs.some((t) => t.path === tab.path)
          ? s
          : { ...s, tabs: [...s.tabs, tab] },
      ),
    closeTab: (path) => {
      if (path === HOME.path) return null
      let next: string | null = null
      setState((s) => {
        const idx = s.tabs.findIndex((t) => t.path === path)
        const tabs = s.tabs.filter((t) => t.path !== path)
        const fallback = tabs[Math.max(0, idx - 1)] ?? HOME
        next = fallback.path
        return { ...s, tabs: tabs.length ? tabs : [HOME] }
      })
      return next
    },
    closeOthers: (path) =>
      setState((s) => ({
        ...s,
        tabs: [HOME, ...s.tabs.filter((t) => t.path === path && t.path !== HOME.path)],
      })),
    closeAll: () => {
      setState((s) => ({ ...s, tabs: [HOME] }))
      return HOME.path
    },
  }

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useApp(): Store {
  const ctx = React.useContext(Ctx)
  if (!ctx) throw new Error('useApp 必须在 AppStoreProvider 内使用')
  return ctx
}
