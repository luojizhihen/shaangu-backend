'use client'

import { Info } from 'lucide-react'

import { useApp } from '@/components/app-store'
import { METRIC_DEFS } from '@/lib/mock'

/**
 * 指标口径说明：鼠标悬停或键盘聚焦即展开，
 * 同时给出统计口径、数据来源、更新时间与当前账号的数据权限范围。
 */
export function MetricHint({ metric }: { metric: keyof typeof METRIC_DEFS }) {
  const { role } = useApp()
  const def = METRIC_DEFS[metric]
  if (!def) return null

  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={`${metric} 指标口径说明`}
        className="inline-flex size-5 items-center justify-center rounded text-muted-foreground transition-colors hover:text-brand focus-visible:text-brand focus-visible:outline-none"
      >
        <Info className="size-3.5" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none invisible absolute top-6 right-0 z-30 w-72 rounded-md border border-border bg-popover p-3 text-left opacity-0 shadow-md transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
      >
        <span className="block text-xs font-medium text-foreground">
          {metric}｜统计口径
        </span>
        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
          {def.caliber}
        </span>
        <span className="mt-2 block border-t border-border pt-2 text-xs text-muted-foreground">
          数据来源：{def.source}
        </span>
        <span className="block text-xs text-muted-foreground">
          更新时间：{def.updatedAt}
        </span>
        <span className="block text-xs text-muted-foreground">
          权限范围：{role.scope}
        </span>
      </span>
    </span>
  )
}
