'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronDown, RotateCw, X } from 'lucide-react'

import { useApp } from '@/components/app-store'
import { routeTitle } from '@/lib/nav'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function WorkspaceTabs() {
  const router = useRouter()
  const pathname = usePathname()
  const { tabs, openTab, closeTab, closeOthers, closeAll } = useApp()

  // 进入任意路由自动追加工作区页签
  React.useEffect(() => {
    openTab({ path: pathname, title: routeTitle(pathname) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return (
    <div className="flex h-10 shrink-0 items-center gap-1 border-b border-border bg-surface pr-2">
      <div className="scroll-thin flex h-10 flex-1 items-end gap-1 overflow-x-auto px-2">
        {tabs.map((tab) => {
          const active = tab.path === pathname
          const closable = tab.path !== '/workbench'
          return (
            <div
              key={tab.path}
              className={cn(
                'group relative flex h-8 shrink-0 items-center gap-1 rounded-t-md border border-b-0 px-3 text-[13px]',
                active
                  ? 'border-border bg-surface text-brand'
                  : 'border-transparent bg-muted text-muted-foreground hover:text-foreground',
              )}
            >
              {active && (
                <span className="airflow-line absolute inset-x-0 top-0 h-[2px] rounded-full" />
              )}
              <button
                type="button"
                onClick={() => router.push(tab.path)}
                className="whitespace-nowrap"
              >
                {tab.title}
              </button>
              {closable && (
                <button
                  type="button"
                  aria-label={`关闭 ${tab.title}`}
                  onClick={() => {
                    const next = closeTab(tab.path)
                    if (active && next) router.push(next)
                  }}
                  className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => router.refresh()}
        className="flex h-7 items-center gap-1 rounded-md border border-border px-2 text-xs text-muted-foreground hover:text-brand"
      >
        <RotateCw className="size-3.5" />
        刷新
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className="flex h-7 items-center gap-1 rounded-md border border-border px-2 text-xs text-muted-foreground hover:text-brand"
            />
          }
        >
          页签操作
          <ChevronDown className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              const next = closeTab(pathname)
              if (next) router.push(next)
            }}
          >
            关闭当前
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => closeOthers(pathname)}>
            关闭其他
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              const next = closeAll()
              router.push(next)
            }}
          >
            关闭全部
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
