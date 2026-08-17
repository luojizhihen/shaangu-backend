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
import {
  SLOW_MS,
  abnormalTone,
  costTone,
  httpMethodTone,
  useLogs,
} from '@/lib/log-store'
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

/** 接口日志：第三方接口调用记录，用于排查外部依赖故障 */
export default function ApiLogsPage() {
  const { apiLogs } = useLogs()
  const query = useLogQuery('shaangu-logs-api')

  const rows = React.useMemo(
    () =>
      apiLogs.filter(
        (l) =>
          (matchKeyword(l.url, query.applied.keyword) ||
            matchKeyword(l.description, query.applied.keyword)) &&
          inDateRange(l.createdAt, query.applied.from, query.applied.to),
      ),
    [apiLogs, query.applied],
  )

  const table = useTableState(rows)
  const abnormal = rows.filter((l) => l.abnormal).length

  function search() {
    if (query.search()) table.setPage(1)
  }

  function reset() {
    query.reset()
    table.setPage(1)
  }

  function exportCsv() {
    downloadCsv(
      '接口日志.csv',
      [
        '接口URL',
        '接口描述',
        '方法路径',
        'IP',
        '是否异常',
        '入参',
        '返回值',
        '耗费时间(ms)',
        '创建时间',
      ],
      rows.map((l) => [
        l.url,
        l.description,
        l.httpMethod,
        l.ip,
        l.abnormal ? '是' : '否',
        l.params,
        l.response,
        l.costMs,
        l.createdAt,
      ]),
    )
    toast.success(`已导出 ${rows.length} 条记录`)
  }

  return (
    <LogPageFrame
      title="接口日志"
      total={rows.length}
      table={table}
      onSearch={search}
      onReset={reset}
      onExport={exportCsv}
      toolbarStart={
        abnormal > 0 ? (
          <StatusTag tone="danger">异常调用 {abnormal} 条</StatusTag>
        ) : undefined
      }
      filters={
        <>
          <FilterField label="接口URL">
            <Input
              value={query.draft.keyword}
              placeholder="请输入接口 URL 或描述"
              onChange={(e) => query.patch({ keyword: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) search()
              }}
            />
          </FilterField>
          <DateRangeField
            label="创建时间"
            from={query.draft.from}
            to={query.draft.to}
            onFromChange={(v) => query.patch({ from: v })}
            onToChange={(v) => query.patch({ to: v })}
          />
        </>
      }
    >
      <Table className="min-w-[1600px] text-[13px]">
        <TableHeader>
          <TableRow className="bg-muted/60">
            <TableHead className="w-10 pl-4">
              <Checkbox
                aria-label="全选本页"
                checked={table.allChecked}
                onCheckedChange={(v) => table.togglePage(Boolean(v))}
              />
            </TableHead>
            <TableHead className="w-72">接口URL</TableHead>
            <TableHead className="w-48">接口描述</TableHead>
            <TableHead className="w-24">方法路径</TableHead>
            <TableHead className="w-36">IP</TableHead>
            <TableHead className="w-24">是否异常</TableHead>
            <TableHead className="w-64">入参</TableHead>
            <TableHead className="w-64">返回值</TableHead>
            <TableHead className="w-32 text-right">耗费时间(ms)</TableHead>
            <TableHead className="w-44 pr-4">创建时间</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {table.pageRows.length === 0 && (
            <TableEmpty colSpan={10} text="没有符合条件的接口日志" />
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
              <TableCell
                title={l.url}
                className="max-w-72 truncate font-mono text-xs text-brand"
              >
                {l.url}
              </TableCell>
              <TableCell className="font-medium">{l.description}</TableCell>
              <TableCell>
                <StatusTag tone={httpMethodTone(l.httpMethod)}>
                  {l.httpMethod}
                </StatusTag>
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {l.ip}
              </TableCell>
              <TableCell>
                <StatusTag tone={abnormalTone(l.abnormal)}>
                  {l.abnormal ? '是' : '否'}
                </StatusTag>
              </TableCell>
              <TableCell
                title={l.params}
                className="max-w-64 truncate font-mono text-xs text-muted-foreground"
              >
                {l.params}
              </TableCell>
              <TableCell
                title={l.response}
                className="max-w-64 truncate font-mono text-xs text-muted-foreground"
              >
                {l.response}
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
              <TableCell className="pr-4 font-mono text-xs text-muted-foreground">
                {l.createdAt}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </LogPageFrame>
  )
}
