'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Download } from 'lucide-react'
import { toast } from 'sonner'

import { NativeSelect, Panel, StatusTag } from '@/components/layout/page-frame'
import { DeptPointsChart, ReadTrendChart } from '@/components/workbench/charts'
import {
  DEPT_POINTS,
  DEPT_POINT_MEMBERS,
  HOT_MEDIA,
  HOT_NEWS,
  KPIS,
  SYSTEM_STATUS,
} from '@/lib/mock'
import { downloadCsv } from '@/lib/export'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const TREND_RANGES = [
  { key: '7d' as const, label: '近 7 天' },
  { key: '30d' as const, label: '近 30 天' },
]

const DEPT_OPTIONS = ['全部部门', ...DEPT_POINTS.map((d) => d.dept)]

export default function WorkbenchPage() {
  const router = useRouter()
  const [trendRange, setTrendRange] = React.useState<'7d' | '30d'>('7d')
  const [dept, setDept] = React.useState('全部部门')
  const [startDate, setStartDate] = React.useState('2026-08-01')
  const [endDate, setEndDate] = React.useState('2026-08-11')

  const deptRows = React.useMemo(
    () =>
      dept === '全部部门'
        ? DEPT_POINTS
        : DEPT_POINTS.filter((d) => d.dept === dept),
    [dept],
  )

  const memberRows = React.useMemo(
    () =>
      dept === '全部部门'
        ? DEPT_POINT_MEMBERS
        : DEPT_POINT_MEMBERS.filter((m) => m.dept === dept),
    [dept],
  )

  const suffix = `${dept}_${startDate}至${endDate}`

  function exportDeptSummary() {
    downloadCsv(
      `部门积分汇总_${suffix}.csv`,
      ['部门', '积分合计', '统计开始日期', '统计结束日期'],
      deptRows.map((d) => [d.dept, d.积分, startDate, endDate]),
    )
    toast.success(`已导出 ${deptRows.length} 个部门的积分汇总`)
  }

  function exportMemberDetail() {
    downloadCsv(
      `部门员工积分明细_${suffix}.csv`,
      ['部门', '姓名', '工号', '获取积分', '消耗积分', '积分余额', '统计区间'],
      memberRows.map((m) => [
        m.dept,
        m.name,
        m.employeeNo,
        m.获取,
        m.消耗,
        m.余额,
        `${startDate} 至 ${endDate}`,
      ]),
    )
    toast.success(`已导出 ${memberRows.length} 条员工积分明细`)
  }

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

      {/* 趋势与排行 */}
      <div className="mb-4 grid gap-4 xl:grid-cols-3">
        <Panel
          title="资讯阅读与视听播放趋势"
          className="xl:col-span-2"
          extra={
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
          }
        >
          <ReadTrendChart range={trendRange} />
        </Panel>

        <Panel
          title="部门积分排行"
          extra={
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button size="xs" variant="outline" />}
              >
                <Download className="size-3.5" />
                导出
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={exportDeptSummary}>
                  导出部门积分汇总
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportMemberDetail}>
                  导出部门员工积分明细
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          }
        >
          <div className="mb-3 flex flex-col gap-2 border-b border-border pb-3">
            <NativeSelect
              aria-label="部门"
              value={dept}
              onChange={setDept}
              options={DEPT_OPTIONS}
            />
            <div className="flex items-center gap-2">
              <Input
                type="date"
                aria-label="开始日期"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 text-[13px]"
              />
              <span className="text-xs text-muted-foreground">至</span>
              <Input
                type="date"
                aria-label="结束日期"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 text-[13px]"
              />
            </div>
          </div>
          <DeptPointsChart data={deptRows} />
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
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
