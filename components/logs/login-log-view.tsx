'use client'

import * as React from 'react'
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'

import { StatusTag } from '@/components/layout/page-frame'
import {
  FilterField,
  TableEmpty,
  useTableState,
} from '@/components/content/table-shell'
import { BatchResultDialog } from '@/components/content/batch-result-dialog'
import {
  DateRangeField,
  LogPageFrame,
  inDateRange,
  matchKeyword,
  useLogQuery,
} from '@/components/logs/log-shell'
import {
  forceOffline,
  loginStateTone,
  loginTypeTone,
  useLogs,
  type BatchResult,
} from '@/lib/log-store'
import { downloadCsv } from '@/lib/export'
import { Button } from '@/components/ui/button'
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
 * 登录类日志的共享视图。
 * scope 为 online 时只展示未过期的在线会话，并提供强制下线；
 * scope 为 history 时展示全部登录记录（含登录失败）。
 */
export function LoginLogView({ scope }: { scope: 'online' | 'history' }) {
  const online = scope === 'online'
  const { loginLogs } = useLogs()
  const query = useLogQuery(`shaangu-logs-${online ? 'online' : 'login'}`)
  const [results, setResults] = React.useState<BatchResult[] | null>(null)

  const rows = React.useMemo(() => {
    const base = online ? loginLogs.filter((l) => l.online) : loginLogs
    return base.filter(
      (l) =>
        (matchKeyword(l.account, query.applied.keyword) ||
          matchKeyword(l.name, query.applied.keyword)) &&
        inDateRange(l.loginAt, query.applied.from, query.applied.to),
    )
  }, [loginLogs, online, query.applied])

  const table = useTableState(rows)

  function search() {
    if (query.search()) table.setPage(1)
  }

  function reset() {
    query.reset()
    table.setPage(1)
  }

  function batchOffline() {
    if (table.selected.length === 0) {
      toast.error('请先选择要操作的记录')
      return
    }
    setResults(forceOffline(table.selected))
    table.clear()
  }

  function exportCsv() {
    downloadCsv(
      online ? '在线用户.csv' : '登录日志.csv',
      ['用户账号', '用户名称', '类型', 'IP', '状态', '登录时间'],
      rows.map((l) => [l.account, l.name, l.type, l.ip, l.state, l.loginAt]),
    )
    toast.success(`已导出 ${rows.length} 条记录`)
  }

  return (
    <>
      <LogPageFrame
        title={online ? '在线用户' : '登录日志'}
        total={rows.length}
        unit={online ? '个在线会话' : '条登录记录'}
        table={table}
        onSearch={search}
        onReset={reset}
        onExport={exportCsv}
        toolbarStart={
          online ? (
            <Button size="sm" variant="outline" onClick={batchOffline}>
              <LogOut className="size-3.5" />
              强制下线
            </Button>
          ) : undefined
        }
        filters={
          <>
            <FilterField label="用户账号">
              <Input
                value={query.draft.keyword}
                placeholder="请输入账号或姓名"
                onChange={(e) => query.patch({ keyword: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) search()
                }}
              />
            </FilterField>
            <DateRangeField
              label="登录时间"
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
              <TableHead className="w-40">用户账号</TableHead>
              <TableHead className="w-40">类型</TableHead>
              <TableHead className="w-36">IP</TableHead>
              <TableHead className="w-24">状态</TableHead>
              <TableHead className="w-44">登录时间</TableHead>
              {online && <TableHead className="w-24 pr-4 text-center">操作</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.pageRows.length === 0 && (
              <TableEmpty
                colSpan={online ? 7 : 6}
                text={online ? '当前没有在线会话' : '没有符合条件的登录记录'}
              />
            )}
            {table.pageRows.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="pl-4">
                  <Checkbox
                    aria-label={`选择 ${l.account}`}
                    checked={table.selected.includes(l.id)}
                    onCheckedChange={(v) => table.toggleRow(l.id, Boolean(v))}
                  />
                </TableCell>
                <TableCell>
                  <span className="font-medium">{l.account}</span>
                  <span className="ml-1.5 text-xs text-muted-foreground">{l.name}</span>
                </TableCell>
                <TableCell>
                  <StatusTag tone={loginTypeTone(l.type)}>{l.type}</StatusTag>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {l.ip}
                </TableCell>
                <TableCell>
                  <StatusTag tone={loginStateTone(l.state)}>{l.state}</StatusTag>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {l.loginAt}
                </TableCell>
                {online && (
                  <TableCell className="pr-4 text-center">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`强制下线 ${l.account}`}
                      onClick={() => {
                        setResults(forceOffline([l.id]))
                      }}
                    >
                      <LogOut className="text-destructive" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </LogPageFrame>

      <BatchResultDialog
        open={results !== null}
        onOpenChange={(v) => !v && setResults(null)}
        action="强制下线"
        results={results ?? []}
      />
    </>
  )
}
