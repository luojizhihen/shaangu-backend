'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react'

import { useApp } from '@/components/app-store'
import { PLATFORM_NAME } from '@/lib/mock'
import { menuForRole } from '@/lib/nav'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function AppSidebar() {
  const { role, collapsed, toggleCollapsed } = useApp()
  const pathname = usePathname()
  const groups = React.useMemo(() => menuForRole(role), [role])

  const isActivePath = (p: string) =>
    pathname === p || pathname.startsWith(p + '/')

  const activeGroup = groups.find(
    (g) =>
      (g.path && isActivePath(g.path)) ||
      g.children.some((c) => isActivePath(c.path)),
  )
  const [open, setOpen] = React.useState<string[]>([])

  React.useEffect(() => {
    if (activeGroup && activeGroup.children.length > 0) {
      setOpen((prev) =>
        prev.includes(activeGroup.title) ? prev : [...prev, activeGroup.title],
      )
    }
  }, [activeGroup])

  return (
    <aside
      className={cn(
        'flex h-screen shrink-0 flex-col bg-nav text-nav-foreground transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-56',
      )}
    >
      {/* 平台名称作为导航区标识 */}
      <div className="flex h-14 items-center border-b border-white/10 px-3">
        <Link
          href="/workbench"
          className="flex h-9 w-full items-center rounded-md text-white"
          aria-label={PLATFORM_NAME}
        >
          {collapsed ? (
            <span className="w-full text-center text-sm font-medium tracking-wide">
              融媒
            </span>
          ) : (
            <span className="text-[15px] font-medium tracking-wide whitespace-nowrap">
              {PLATFORM_NAME}
            </span>
          )}
        </Link>
      </div>

      <nav className="scroll-thin flex-1 overflow-y-auto py-2">
        {groups.map((group) => {
          const Icon = group.icon
          const isOpen = open.includes(group.title)
          const groupActive = activeGroup?.title === group.title
          const isLeaf = group.children.length === 0 && !!group.path
          const targetPath = group.path ?? group.children[0]?.path ?? '/workbench'

          if (collapsed) {
            return (
              <div key={group.title} className="px-2 py-1">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Link
                        href={targetPath}
                        className={cn(
                          'flex h-10 items-center justify-center rounded-md',
                          groupActive
                            ? 'bg-nav-active text-white'
                            : 'text-nav-muted hover:bg-nav-hover hover:text-white',
                        )}
                      />
                    }
                  >
                    <Icon className="size-[18px]" />
                    <span className="sr-only">{group.title}</span>
                  </TooltipTrigger>
                  <TooltipContent side="right">{group.title}</TooltipContent>
                </Tooltip>
              </div>
            )
          }

          // 无下级菜单的一级项（工作台）直接作为链接
          if (isLeaf) {
            return (
              <div key={group.title} className="px-2">
                <Link
                  href={targetPath}
                  className={cn(
                    'flex h-10 w-full items-center gap-2 rounded-md px-2.5 text-sm transition-colors',
                    groupActive
                      ? 'bg-nav-active font-medium text-white'
                      : 'text-nav-foreground/85 hover:bg-nav-hover hover:text-white',
                  )}
                >
                  <Icon className="size-[18px] shrink-0" />
                  <span className="flex-1 text-left">{group.title}</span>
                </Link>
              </div>
            )
          }

          return (
            <div key={group.title} className="px-2">
              <button
                type="button"
                onClick={() =>
                  setOpen((prev) =>
                    prev.includes(group.title)
                      ? prev.filter((t) => t !== group.title)
                      : [...prev, group.title],
                  )
                }
                aria-expanded={isOpen}
                className={cn(
                  'flex h-10 w-full items-center gap-2 rounded-md px-2.5 text-sm transition-colors',
                  groupActive
                    ? 'text-white'
                    : 'text-nav-foreground/85 hover:bg-nav-hover hover:text-white',
                )}
              >
                <Icon className="size-[18px] shrink-0" />
                <span className="flex-1 text-left">{group.title}</span>
                <ChevronDown
                  className={cn(
                    'size-4 shrink-0 text-nav-muted transition-transform',
                    isOpen && 'rotate-180',
                  )}
                />
              </button>

              {isOpen && (
                <ul className="mb-1 space-y-0.5">
                  {group.children.map((item) => {
                    const active =
                      pathname === item.path ||
                      pathname.startsWith(item.path + '/')
                    return (
                      <li key={item.path}>
                        <Link
                          href={item.path}
                          className={cn(
                            'relative flex h-9 items-center rounded-md pl-9 pr-2 text-[13px] transition-colors',
                            active
                              ? 'bg-nav-active font-medium text-white'
                              : 'text-nav-muted hover:bg-nav-hover hover:text-white',
                          )}
                        >
                          {active && (
                            <span className="airflow-line absolute left-2 h-4 w-[2px] rounded-full" />
                          )}
                          {item.title}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </nav>

      <button
        type="button"
        onClick={toggleCollapsed}
        className="flex h-11 items-center justify-center gap-2 border-t border-white/10 text-xs text-nav-muted hover:bg-nav-hover hover:text-white"
      >
        {collapsed ? (
          <PanelLeftOpen className="size-4" />
        ) : (
          <>
            <PanelLeftClose className="size-4" />
            收起导航
          </>
        )}
      </button>
    </aside>
  )
}
