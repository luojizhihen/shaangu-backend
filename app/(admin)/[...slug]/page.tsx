'use client'

import { usePathname } from 'next/navigation'
import { Construction } from 'lucide-react'

import { PageHeader, Panel, StatusTag } from '@/components/layout/page-frame'
import { breadcrumbFor, routeMeta } from '@/lib/nav'

/**
 * 公共后台框架已就绪的业务路由占位页。
 * 权限校验在 AdminShell 中统一完成，无权限时本页不会渲染，直接显示 403。
 */
export default function ModulePlaceholderPage() {
  const pathname = usePathname()
  const meta = routeMeta(pathname)

  return (
    <>
      <PageHeader
        breadcrumb={breadcrumbFor(pathname)}
        title={meta?.title ?? '功能页面'}
        description="本轮交付公共后台框架、登录页、工作台与 403 页面；该业务页面将在后续轮次按提示词逐模块生成。"
      />
      <Panel bodyClassName="p-8">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-accent text-brand">
            <Construction className="size-6" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-medium">
                {meta?.title ?? '功能页面'}
              </h3>
              <StatusTag tone="info">待生成</StatusTag>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              路由已接入左侧导航、多页签工作区与权限校验，可正常打开、关闭页签并在刷新后恢复。
            </p>
            <dl className="mt-4 grid gap-y-2 text-[13px] sm:grid-cols-[92px_1fr]">
              <dt className="text-muted-foreground">路由地址</dt>
              <dd className="font-mono text-xs">{pathname}</dd>
              <dt className="text-muted-foreground">权限编码</dt>
              <dd className="font-mono text-xs">{meta?.perm ?? '—'}</dd>
            </dl>
          </div>
        </div>
      </Panel>
    </>
  )
}
