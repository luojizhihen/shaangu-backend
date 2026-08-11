'use client'

import { useRouter } from 'next/navigation'
import { FilePlus2, RotateCw } from 'lucide-react'
import { toast } from 'sonner'

import { useApp } from '@/components/app-store'
import { StatusTag } from '@/components/layout/page-frame'
import { AnalyticsBoard } from '@/components/workbench/analytics-board'
import { OpsBoard } from '@/components/workbench/ops-board'
import { Button } from '@/components/ui/button'
import { can } from '@/lib/nav'
import { DATA_UPDATED_AT, KPIS } from '@/lib/mock'

export default function WorkbenchPage() {
  const router = useRouter()
  const { role } = useApp()

  const kpis = KPIS.filter((k) => can(role, k.perm))

  return (
    <>
      {/* 顶部说明条：明确数据更新时间与当前账号的数据权限范围 */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusTag tone="neutral">数据更新 {DATA_UPDATED_AT}</StatusTag>
          <StatusTag tone="info">权限范围：{role.scope}</StatusTag>
          <span className="text-xs text-muted-foreground">
            待办、图表与快捷入口均可下钻到对应业务页
          </span>
        </div>
        <div className="flex items-center gap-2">
          {can(role, 'content.news') && (
            <Button onClick={() => router.push('/content/news/new')}>
              <FilePlus2 className="size-4" />
              新增资讯
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => toast.success('已刷新工作台数据')}
          >
            <RotateCw className="size-4" />
            刷新
          </Button>
        </div>
      </div>

      {/* 运营待办、快捷入口、内容概览与任务状态 */}
      <OpsBoard />

      {/* 指标概览条：紧凑呈现，不抢占运营待办的首屏位置 */}
      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg border border-border bg-surface px-4 py-3 md:grid-cols-4 xl:grid-cols-8">
        {kpis.map((k) => (
          <button
            key={k.label}
            type="button"
            onClick={() => router.push(k.target)}
            className="flex flex-col items-start text-left transition-colors hover:text-brand"
          >
            <span className="text-xs text-muted-foreground">{k.label}</span>
            <span className="text-[15px] font-medium text-foreground">
              {k.value}
            </span>
            <span className="max-w-full truncate text-xs text-muted-foreground">
              {k.note}
            </span>
          </button>
        ))}
      </div>

      {/* 运营数据：六维筛选、多类指标、口径说明与导出 */}
      <section id="analytics" className="scroll-mt-4">
        <AnalyticsBoard />
      </section>
    </>
  )
}
