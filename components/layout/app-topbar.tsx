'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Bell, LogOut, UserCog, UserRound } from 'lucide-react'
import { toast } from 'sonner'

import { useApp } from '@/components/app-store'
import { ROLES } from '@/lib/nav'
import { NOTICES } from '@/lib/mock'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function AppTopbar() {
  const router = useRouter()
  const { role, roleKey, setRoleKey, signOut } = useApp()

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 bg-nav px-4 text-nav-foreground">
      <div className="flex-1" />

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
          <DropdownMenuGroup>
            <DropdownMenuLabel>系统提醒（{NOTICES.length}）</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {NOTICES.map((n) => (
              <DropdownMenuItem key={n.title} className="flex-col items-start gap-0.5">
                <span className="text-[13px]">{n.title}</span>
                <span className="text-xs text-muted-foreground">{n.time}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
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
          <DropdownMenuGroup>
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
          </DropdownMenuGroup>
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
