'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { CalendarClock, Download, Lock, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'

import { useApp } from '@/components/app-store'
import { PageHeader, Panel, StatusTag } from '@/components/layout/page-frame'
import { Pagination, TableEmpty, Toolbar, useTableState } from '@/components/content/table-shell'
import { breadcrumbFor } from '@/lib/nav'
import { downloadCsv } from '@/lib/export'
import {
  CLEAR_CYCLE,
  CLEAR_MODE,
  CLEAR_SCOPE,
  nextClearAt,
  saveClearConfig,
  usePoints,
  validateClearConfig,
  type ClearDraft,
} from '@/lib/points-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

/** 只读配置项：周期、范围与执行方式由业务基线固定，不开放修改 */
function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1.5">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <div className="flex h-8 items-center rounded-md border border-border bg-muted/50 px-2.5 text-[13px]">
        {value}
      </div>
    </div>
  )
}

export default function PointsAnnualClearPage() {
  const pathname = usePathname()
  const { role } = useApp()
  const { clearConfig, clearRecords } = usePoints()

  const [draft, setDraft] = React.useState<ClearDraft>({
    enabled: clearConfig.enabled,
    month: clearConfig.month,
    day: clearConfig.day,
    time: clearConfig.time,
    noticeDays: clearConfig.noticeDays,
  })
  const [issues, setIssues] = React.useState<string[]>([])

  const table = useTableState(clearRecords)

  const dirty =
    draft.enabled !== clearConfig.enabled ||
    draft.month !== clearConfig.month ||
    draft.day !== clearConfig.day ||
    draft.time !== clearConfig.time ||
    draft.noticeDays !== clearConfig.noticeDays

  function save() {
    const found = validateClearConfig(draft)
    setIssues(found)
    if (found.length > 0) {
      toast.error(`校验未通过，共 ${found.length} 项`)
      return
    }
    saveClearConfig(draft, role.person)
    toast.success('已保存年度清零配置，将在下一个清零时点自动执行')
  }

  function revert() {
    setDraft({
      enabled: clearConfig.enabled,
      month: clearConfig.month,
      day: clearConfig.day,
      time: clearConfig.time,
      noticeDays: clearConfig.noticeDays,
    })
    setIssues([])
  }

  return (
    <>
      <PageHeader
        breadcrumb={breadcrumbFor(pathname)}
        title="积分年度清零"
        actions={
          <Button variant="outline" onClick={() => toast.success('页面已刷新')}>
            <RefreshCcw className="size-4" />
            刷新
          </Button>
        }
      />

      <p className="mb-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/8 px-4 py-2.5 text-xs leading-relaxed text-warning">
        <Lock className="mt-0.5 size-3.5 shrink-0" />
        年度清零只能配置每年固定时点由系统对全部会员自动执行，不提供立即清零、不提供按用户选择清零，
        也不可修改已执行的清零记录与历史积分。清零会为每位会员生成一条只读流水。
      </p>

      <div className="grid gap-4 pb-4 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <Panel title="清零配置" className="self-start">
          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px]">自动清零</span>
              <div className="flex items-center gap-2">
                <Switch
                  checked={draft.enabled}
                  aria-label="自动清零"
                  onCheckedChange={(v) => setDraft((d) => ({ ...d, enabled: v }))}
                />
                <span className="text-[13px] text-muted-foreground">
                  {draft.enabled ? '已启用' : '已停用'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ReadOnlyField label="清零周期" value={CLEAR_CYCLE} />
              <ReadOnlyField label="生效范围" value={CLEAR_SCOPE} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-1.5">
                <label htmlFor="clear-month" className="text-[13px]">
                  月份
                </label>
                <Input
                  id="clear-month"
                  type="number"
                  min={1}
                  max={12}
                  value={draft.month}
                  onChange={(e) => setDraft((d) => ({ ...d, month: Number(e.target.value) }))}
                />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="clear-day" className="text-[13px]">
                  日期
                </label>
                <Input
                  id="clear-day"
                  type="number"
                  min={1}
                  max={31}
                  value={draft.day}
                  onChange={(e) => setDraft((d) => ({ ...d, day: Number(e.target.value) }))}
                />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="clear-notice" className="text-[13px]">
                  提醒天数
                </label>
                <Input
                  id="clear-notice"
                  type="number"
                  min={0}
                  max={90}
                  value={draft.noticeDays}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, noticeDays: Number(e.target.value) }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="clear-time" className="text-[13px]">
                执行时刻
              </label>
              <Input
                id="clear-time"
                value={draft.time}
                placeholder="HH:mm:ss"
                onChange={(e) => setDraft((d) => ({ ...d, time: e.target.value }))}
              />
            </div>

            <div className="flex items-start gap-2 rounded-md border border-border bg-muted/50 px-3 py-2.5">
              <CalendarClock className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              <div className="grid gap-1 text-xs leading-relaxed text-muted-foreground">
                <span>
                  下次自动执行：
                  <span className="font-mono text-foreground">
                    {draft.enabled ? nextClearAt(clearConfig) : '已停用'}
                  </span>
                </span>
                <span>
                  清零前 {draft.noticeDays} 天通过站内消息提醒全部会员，执行方式为{CLEAR_MODE}。
                </span>
                <span>
                  最近修改：{clearConfig.updatedAt} · {clearConfig.operator}
                </span>
              </div>
            </div>

            {issues.length > 0 && (
              <ul className="grid gap-1 rounded-md border border-destructive/30 bg-destructive/8 px-3 py-2.5">
                {issues.map((s) => (
                  <li key={s} className="text-xs text-destructive">
                    {s}
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-center gap-2">
              <Button size="sm" disabled={!dirty} onClick={save}>
                保存配置
              </Button>
              <Button size="sm" variant="outline" disabled={!dirty} onClick={revert}>
                还原
              </Button>
            </div>
          </div>
        </Panel>

        <Panel title="清零记录" bodyClassName="p-0" className="self-start">
          <Toolbar>
            <span className="text-xs text-muted-foreground">
              共 {clearRecords.length} 次清零 · 记录只读留痕
            </span>
            <Button
              size="sm"
              variant="outline"
              className="ml-auto"
              onClick={() => {
                downloadCsv(
                  '积分年度清零记录',
                  ['记录编号', '清零年度', '执行时间', '涉及会员数', '清零积分总额', '执行方式', '状态'],
                  clearRecords.map((r) => [
                    r.id,
                    r.year,
                    r.executedAt,
                    r.members,
                    r.totalPoints,
                    r.mode,
                    r.status,
                  ]),
                )
                toast.success(`已导出 ${clearRecords.length} 条清零记录`)
              }}
            >
              <Download className="size-3.5" />
              导出
            </Button>
          </Toolbar>

          <Table className="text-[13px]">
            <TableHeader>
              <TableRow className="bg-muted/60">
                <TableHead className="w-14 pl-4">序号</TableHead>
                <TableHead className="w-24">记录编号</TableHead>
                <TableHead className="w-20">清零年度</TableHead>
                <TableHead className="w-44">执行时间</TableHead>
                <TableHead className="w-24">涉及会员数</TableHead>
                <TableHead className="w-28">清零积分总额</TableHead>
                <TableHead className="w-28">执行方式</TableHead>
                <TableHead className="w-20 pr-4">状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.pageRows.length === 0 && (
                <TableEmpty colSpan={8} text="暂无年度清零记录" />
              )}
              {table.pageRows.map((r, i) => (
                <TableRow key={r.id}>
                  <TableCell className="pl-4 text-muted-foreground">
                    {(table.page - 1) * table.pageSize + i + 1}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{r.id}</TableCell>
                  <TableCell>{r.year} 年</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {r.executedAt}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {r.members.toLocaleString('zh-CN')}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {r.totalPoints.toLocaleString('zh-CN')}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.mode}</TableCell>
                  <TableCell className="pr-4">
                    <StatusTag tone={r.status === '已完成' ? 'success' : 'info'}>
                      {r.status}
                    </StatusTag>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Pagination
            total={clearRecords.length}
            page={table.page}
            pageSize={table.pageSize}
            onPageChange={table.setPage}
            onPageSizeChange={table.setPageSize}
          />
        </Panel>
      </div>
    </>
  )
}
