'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'

import { useApp } from '@/components/app-store'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AppTopbar } from '@/components/layout/app-topbar'
import { WorkspaceTabs } from '@/components/layout/workspace-tabs'
import { Forbidden } from '@/components/layout/forbidden'
import { routeMeta } from '@/lib/nav'

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { ready, signedIn, allow } = useApp()

  React.useEffect(() => {
    if (ready && !signedIn) router.replace('/login')
  }, [ready, signedIn, router])

  if (!ready || !signedIn) {
    return (
      <div className="flex h-screen items-center justify-center bg-page text-sm text-muted-foreground">
        正在校验管理端登录状态…
      </div>
    )
  }

  const meta = routeMeta(pathname)
  const permitted = !meta || allow(meta.perm)

  return (
    <div className="flex h-screen overflow-hidden bg-page">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar />
        <WorkspaceTabs />
        <main className="scroll-thin flex-1 overflow-y-auto px-6 py-4">
          {permitted ? children : <Forbidden perm={meta?.perm} title={meta?.title} />}
        </main>
      </div>
    </div>
  )
}
