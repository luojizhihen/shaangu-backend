'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'

import { Panel, StatusTag } from '@/components/layout/page-frame'
import { ReadTrendChart } from '@/components/workbench/charts'
import { MetricHint } from '@/components/workbench/metric-hint'
import { HOT_MEDIA, HOT_NEWS, KPIS, SYSTEM_STATUS } from '@/lib/mock'
import { Button } from '@/components/ui/button'

const TREND_RANGES = [
  { key: '7d' as const, label: '近 7 天' },
  { key: '30d' as const, label: '近 30 天' },
]

export function OverviewPanel() {
  const router = useRouter()
  const [trendRange, setTrendRange] = React.useState<'7d' | '30d'>('7d')

  function goto(path: string) {
    router.push(path)
  }

  return (
    <>
      {/* 核心指标 */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        {KPIS.map((k) => (
          <button
            key={k.label}
            type="button"
            onClick={() => goto(k.target)}
            className="rounded-lg border border-border bg-surface px-3.5 py-3 text-left transition-colors hover:border-brand/40"
          >
            <div className="text-xs text-muted-foreground">{k.label}</div>
            <div className="mt-1 text-xl font-medium text-foreground">
              {k.value}
            </div>
            <div className="mt-0.5 truncate text-xs text-muted-foreground">
              {k.note}
            </div>
          </button>
        ))}
      </div>

      <div className="mb-4 grid gap-4 xl:grid-cols-3">
        <Panel
          title="资讯阅读与视听播放趋势"
          className="xl:col-span-2"
          extra={
            <div className="flex items-center gap-2">
              <div
                role="tablist"
                aria-label="趋势时间范围"
                className="flex items-center gap-1 rounded-md border border-border p-0.5"
              >
                {TREND_RANGES.map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    role="tab"
                    aria-selected={trendRange === r.key}
                    onClick={() => setTrendRange(r.key)}
                    className={`h-6 rounded px-2.5 text-xs transition-colors ${
                      trendRange === r.key
                        ? 'bg-brand text-brand-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <MetricHint metric="阅读互动趋势" />
            </div>
          }
        >
          <ReadTrendChart range={trendRange} />
        </Panel>

        <Panel
          title="系统状态"
          bodyClassName="p-0"
          extra={
            <span className="text-xs text-muted-foreground">
              NC 为每日定时同步
            </span>
          }
        >
          <ul className="divide-y divide-border">
            {SYSTEM_STATUS.map((s) => (
              <li key={s.name} className="px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-medium">{s.name}</span>
                  <StatusTag tone={s.state === '正常' ? 'success' : 'warning'}>
                    {s.state}
                  </StatusTag>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {s.detail}
                </p>
                <Button
                  size="xs"
                  variant="ghost"
                  className="mt-1 px-0"
                  onClick={() => goto(s.target)}
                >
                  查看详情
                  <ArrowRight className="size-3" />
                </Button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="热门资讯" bodyClassName="p-0">
          <ol className="divide-y divide-border">
            {HOT_NEWS.map((n, i) => (
              <li
                key={n.title}
                className="flex items-center gap-3 px-4 py-2.5 text-[13px]"
              >
                <span className="w-4 text-center text-muted-foreground">
                  {i + 1}
                </span>
                <span className="flex-1 truncate">{n.title}</span>
                <StatusTag tone="neutral">{n.category}</StatusTag>
                <span className="w-16 text-right text-muted-foreground">
                  {n.reads.toLocaleString('zh-CN')}
                </span>
              </li>
            ))}
          </ol>
        </Panel>
        <Panel title="热门视频与音频" bodyClassName="p-0">
          <ol className="divide-y divide-border">
            {HOT_MEDIA.map((m, i) => (
              <li
                key={m.title}
                className="flex items-center gap-3 px-4 py-2.5 text-[13px]"
              >
                <span className="w-4 text-center text-muted-foreground">
                  {i + 1}
                </span>
                <span className="flex-1 truncate">{m.title}</span>
                <StatusTag tone="neutral">{m.type}</StatusTag>
                <span className="w-16 text-right text-muted-foreground">
                  {m.plays.toLocaleString('zh-CN')}
                </span>
              </li>
            ))}
          </ol>
        </Panel>
      </div>
    </>
  )
}
