'use client'

import * as React from 'react'
import { toast } from 'sonner'

import { StatusTag } from '@/components/layout/page-frame'
import {
  FilterField,
  TableEmpty,
  useTableState,
} from '@/components/content/table-shell'
import {
  DateRangeField,
  LogPageFrame,
  inDateRange,
  matchKeyword,
  useLogQuery,
} from '@/components/logs/log-shell'
import { SLOW_MS, costTone, useLogs } from '@/lib/log-store'
import { downloadCsv } from '@/lib/export'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

/** 系统日志：后台方法级操作记录与耗时 */
export default function SystemLogsPage() {
  const { sysLogs } = useLogs()
  const query = useLogQuery('shaangu-logs-system')

  const rows = React.useMemo(
    () =>
      sysLogs.filter(
        (l) =>
          matchKeyword(l.operator, query.applied.keyword) &&
          inDateRange(l.operatedAt, query.applied.from, query.applied.to),
      ),
    [sysLogs, query.applied],
  )

  const table = useTableState(rows)
  const slow = rows.filter((l) => l.costMs > SLOW_MS).length

  function search() {
    if (query.search()) table.setPage(1)
  }

  function reset() {
    query.reset()
    table.setPage(1)
  }

  function exportCsv() {
    downloadCsv(
      '系统日志.csv',
      ['操作人姓名', '操作描述', '方法路径', '入参', '耗费时间(ms)', '操作时间'],
      rows.map((l) => [
        l.operator,
        l.description,
        l.method,
        l.params,
        l.costMs,
        l.operatedAt,
      ]),
    )
    toast.success(`已导出 ${rows.length} 条记录`)
  }

  return (
    <LogPageFrame
      title="系统日志"
      total={rows.length}
      table={table}
      onSearch={search}
      onReset={reset}
      onExport={exportCsv}
      toolbarStart={
        slow > 0 ? (
          <StatusTag tone="warning">
            慢请求 {slow} 条（超过 {SLOW_MS}ms）
          </StatusTag>
        ) : undefined
      }
      filters={
        <>
          <FilterField label="操作人姓名">
            <Input
              value={query.draft.keyword}
              placeholder="请输入操作人姓名"
              onChange={(e) => query.patch({ keyword: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) search()
              }}
            />
          </FilterField>
          <DateRangeField
            label="操作时间"
            from={query.draft.from}
            to={query.draft.to}
            onFromChange={(v) => query.patch({ from: v })}
            onToChange={(v) => query.patch({ to: v })}
          />
        </>
      }
    >
      <Table className="text-[13px]">
        <TableHeader>
          <TableRow className="bg-muted/60">
            <TableHead className="w-10 pl-4">
              <Checkbox
                aria-label="全选本页"
                checked={table.allChecked}
                onCheckedChange={(v) => table.togglePage(Boolean(v))}
              />
            </TableHead>
            <TableHead className="w-36">操作人姓名</TableHead>
            <TableHead className="w-48">操作描述</TableHead>
            <TableHead className="min-w-72">方法路径</TableHead>
            <TableHead className="min-w-56">入参</TableHead>
            <TableHead className="w-32 text-right">耗费时间(ms)</TableHead>
            <TableHead className="w-44">操作时间</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {table.pageRows.length === 0 && (
            <TableEmpty colSpan={7} text="没有符合条件的系统日志" />
          )}
          {table.pageRows.map((l) => (
            <TableRow key={l.id}>
              <TableCell className="pl-4">
                <Checkbox
                  aria-label={`选择 ${l.id}`}
                  checked={table.selected.includes(l.id)}
                  onCheckedChange={(v) => table.toggleRow(l.id, Boolean(v))}
                />
              </TableCell>
              <TableCell>{l.operator}</TableCell>
              <TableCell className="font-medium">{l.description}</TableCell>
              <TableCell
                title={l.method}
                className="max-w-72 truncate font-mono text-xs text-muted-foreground"
              >
                {l.method}
              </TableCell>
              <TableCell
                title={l.params}
                className="max-w-56 truncate font-mono text-xs text-muted-foreground"
              >
                {l.params}
              </TableCell>
              <TableCell className="text-right">
                {l.costMs > SLOW_MS ? (
                  <StatusTag tone={costTone(l.costMs)}>
                    {l.costMs.toLocaleString('zh-CN')}
                  </StatusTag>
                ) : (
                  <span className="font-mono text-xs text-muted-foreground">
                    {l.costMs.toLocaleString('zh-CN')}
                  </span>
                )}
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {l.operatedAt}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </LogPageFrame>
  )
}
