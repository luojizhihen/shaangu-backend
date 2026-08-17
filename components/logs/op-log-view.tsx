'use client'

import * as React from 'react'
import { toast } from 'sonner'

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
import { useLogs } from '@/lib/log-store'
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

/**
 * 导出日志与删除日志的共享视图：两者字段完全一致，仅数据源不同。
 * 操作类型形如「资讯信息表#导出」，操作内容为请求摘要或受影响的 ID 列表。
 */
export function OpLogView({ scope }: { scope: 'export' | 'delete' }) {
  const { exportLogs, deleteLogs } = useLogs()
  const isExport = scope === 'export'
  const source = isExport ? exportLogs : deleteLogs
  const title = isExport ? '导出日志' : '删除日志'
  const query = useLogQuery(`shaangu-logs-${scope}`)

  const rows = React.useMemo(
    () =>
      source.filter(
        (l) =>
          matchKeyword(l.operator, query.applied.keyword) &&
          inDateRange(l.operatedAt, query.applied.from, query.applied.to),
      ),
    [source, query.applied],
  )

  const table = useTableState(rows)

  function search() {
    if (query.search()) table.setPage(1)
  }

  function reset() {
    query.reset()
    table.setPage(1)
  }

  function exportCsv() {
    downloadCsv(
      `${title}.csv`,
      ['操作人', '操作类型', '操作内容', 'IP', '操作时间'],
      rows.map((l) => [l.operator, l.action, l.content, l.ip, l.operatedAt]),
    )
    toast.success(`已导出 ${rows.length} 条记录`)
  }

  return (
    <LogPageFrame
      title={title}
      total={rows.length}
      table={table}
      onSearch={search}
      onReset={reset}
      onExport={exportCsv}
      filters={
        <>
          <FilterField label="操作人">
            <Input
              value={query.draft.keyword}
              placeholder="请输入操作人"
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
            <TableHead className="w-40">操作人</TableHead>
            <TableHead className="w-56">操作类型</TableHead>
            <TableHead className="min-w-80">操作内容</TableHead>
            <TableHead className="w-36">IP</TableHead>
            <TableHead className="w-44">操作时间</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {table.pageRows.length === 0 && (
            <TableEmpty colSpan={6} text={`没有符合条件的${title}`} />
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
              <TableCell className="font-medium">{l.action}</TableCell>
              <TableCell
                title={l.content}
                className="max-w-80 truncate font-mono text-xs text-muted-foreground"
              >
                {l.content}
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {l.ip}
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
