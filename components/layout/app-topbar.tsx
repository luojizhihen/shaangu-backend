'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  Activity,
  Bell,
  LogOut,
  Search,
  UserCog,
  UserRound,
} from 'lucide-react'
import { toast } from 'sonner'

import { useApp } from '@/components/app-store'
import { ALL_ROUTES, ROLES, can } from '@/lib/nav'
import { NOTICES, PLATFORM_NAME } from '@/lib/mock'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function AppTopbar() {
  const router = useRouter()
  const { role, roleKey, setRoleKey, signOut } = useApp()
  const [keyword, setKeyword] = React.useState('')

  const results = keyword.trim()
    ? ALL_ROUTES.filter(
        (r) => can(role, r.perm) && r.title.includes(keyword.trim()),
      ).slice(0, 6)
    : []

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 bg-brand px-4 text-white">
      <h1 className="mr-2 text-[17px] font-medium tracking-wide whitespace-nowrap">
        {PLATFORM_NAME}
      </h1>

      {/* 全局搜索：仅在当前角色有权限的功能内检索 */}
      <div className="relative w-64">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-white/70" />
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索功能、菜单"
          aria-label="全局搜索"
          className="h-8 w-full rounded-md border border-white/25 bg-white/10 pr-2 pl-8 text-[13px] text-white placeholder:text-white/60 focus:border-white/60 focus:outline-none"
        />
        {results.length > 0 && (
          <ul className="absolute top-9 left-0 z-50 w-full overflow-hidden rounded-md border border-border bg-popover py-1 text-foreground shadow-md">
            {results.map((r) => (
              <li key={r.path}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-3 py-1.5 text-[13px] hover:bg-accent"
                  onClick={() => {
                    setKeyword('')
                    router.push(r.path)
                  }}
                >
                  <span>{r.title}</span>
                  <span className="text-xs text-muted-foreground">{r.path}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {keyword.trim() && results.length === 0 && (
          <div className="absolute top-9 left-0 z-50 w-full rounded-md border border-border bg-popover px-3 py-2 text-[13px] text-muted-foreground shadow-md">
            当前角色无匹配的可访问功能
          </div>
        )}
      </div>

      <div className="flex-1" />

      {/* 任务状态 */}
      <button
        type="button"
        onClick={() => router.push('/logs/system')}
        className="flex h-8 items-center gap-2 rounded-md border border-white/25 px-2.5 text-xs hover:bg-white/10"
      >
        <Activity className="size-4" />
        任务运行中 2
        <span className="airflow-line h-[2px] w-6 rounded-full" />
      </button>

      {/* 消息 */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              aria-label="消息"
              className="relative flex size-8 items-center justify-center rounded-md hover:bg-white/10"
            />
          }
        >
          <Bell className="size-[18px]" />
          <span className="absolute top-1 right-1 size-1.5 rounded-full bg-brand-green" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel>系统提醒（{NOTICES.length}）</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {NOTICES.map((n) => (
            <DropdownMenuItem key={n.title} className="flex-col items-start gap-0.5">
              <span className="text-[13px]">{n.title}</span>
              <span className="text-xs text-muted-foreground">{n.time}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 角色切换（仅供原型演示）与用户菜单 */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className="flex h-8 items-center gap-2 rounded-md border border-white/25 pr-2 pl-1.5 text-[13px] hover:bg-white/10"
            />
          }
        >
          <span className="flex size-5 items-center justify-center rounded-full bg-white/20">
            <UserRound className="size-3.5" />
          </span>
          {role.person}｜{role.name}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="flex items-center gap-1.5">
            <UserCog className="size-3.5" />
            角色切换（仅供原型演示）
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {ROLES.map((r) => (
            <DropdownMenuItem
              key={r.key}
              onClick={() => {
                setRoleKey(r.key)
                toast.success(`已切换为「${r.name}」`, {
                  description: `菜单、按钮与路由权限同步生效｜数据范围：${r.scope}`,
                })
              }}
              className={cn(
                'flex-col items-start gap-0.5',
                r.key === roleKey && 'bg-accent text-accent-foreground',
              )}
            >
              <span className="text-[13px] font-medium">{r.name}</span>
              <span className="text-xs text-muted-foreground">
                {r.person}｜{r.scope}
              </span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              signOut()
              router.push('/login')
            }}
          >
            <LogOut className="size-4" />
            退出登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
