'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { Download, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { useApp } from '@/components/app-store'
import { PageHeader, Panel } from '@/components/layout/page-frame'
import {
  FilterBar,
  FilterField,
  Pagination,
  TableEmpty,
  Toolbar,
  useTableState,
} from '@/components/content/table-shell'
import { BatchResultDialog } from '@/components/content/batch-result-dialog'
import { ParamDialog } from '@/components/system/param-dialog'
import {
  removeParams,
  useSystem,
  type BatchResult,
  type SysParam,
} from '@/lib/system-store'
import { downloadCsv } from '@/lib/export'
import { breadcrumbFor } from '@/lib/nav'
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

type Query = { key: string; value: string }

const EMPTY_QUERY: Query = { key: '', value: '' }

export default function ParamsPage() {
  const pathname = usePathname()
  const { params } = useSystem()
  const { allow } = useApp()
  const canWrite = allow('system.params')

  const [draft, setDraft] = React.useState<Query>(EMPTY_QUERY)
  const [query, setQuery] = React.useState<Query>(EMPTY_QUERY)

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<SysParam | null>(null)
  const [results, setResults] = React.useState<BatchResult[] | null>(null)

  const rows = React.useMemo(
    () =>
      params.filter(
        (p) =>
          p.key.toLowerCase().includes(query.key.trim().toLowerCase()) &&
          p.value.toLowerCase().includes(query.value.trim().toLowerCase()),
      ),
    [params, query],
  )

  const table = useTableState(rows)

  function search() {
    setQuery(draft)
    table.setPage(1)
  }

  function reset() {
    setDraft(EMPTY_QUERY)
    setQuery(EMPTY_QUERY)
    table.setPage(1)
  }

  function batchDelete() {
    if (table.selected.length === 0) {
      toast.error('请先选择要操作的记录')
      return
    }
    setResults(removeParams(table.selected))
    table.clear()
  }

  function exportCsv() {
    downloadCsv(
      '系统参数.csv',
      ['参数名', '参数值', '描述'],
      rows.map((p) => [p.key, p.value, p.description]),
    )
    toast.success(`已导出 ${rows.length} 条记录`)
  }

  return (
    <>
      <PageHeader breadcrumb={breadcrumbFor(pathname)} title="参数管理" />

      <FilterBar onSearch={search} onReset={reset}>
        <FilterField label="参数名">
          <Input
            value={draft.key}
            placeholder="请输入参数名"
            onChange={(e) => setDraft((d) => ({ ...d, key: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) search()
            }}
          />
        </FilterField>
        <FilterField label="参数值">
          <Input
            value={draft.value}
            placeholder="请输入参数值"
            onChange={(e) => setDraft((d) => ({ ...d, value: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) search()
            }}
          />
        </FilterField>
      </FilterBar>

      <Panel bodyClassName="p-0">
        <Toolbar>
          {canWrite && (
            <>
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null)
                  setDialogOpen(true)
                }}
              >
                <Plus className="size-3.5" />
                新增
              </Button>
              <Button size="sm" variant="outline" onClick={batchDelete}>
                <Trash2 className="size-3.5" />
                删除
              </Button>
            </>
          )}
          <Button size="sm" variant="outline" onClick={exportCsv}>
            <Download className="size-3.5" />
            导出
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">
            共 {rows.length} 个参数
            {table.selected.length > 0 ? ` · 已选 ${table.selected.length} 个` : ''}
          </span>
        </Toolbar>

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
              <TableHead className="w-72">参数名</TableHead>
              <TableHead className="min-w-96">参数值</TableHead>
              <TableHead className="min-w-64">描述</TableHead>
              <TableHead className="w-20 pr-4 text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.pageRows.length === 0 && (
              <TableEmpty colSpan={5} text="没有符合条件的参数" />
            )}
            {table.pageRows.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="pl-4">
                  <Checkbox
                    aria-label={`选择 ${p.key}`}
                    checked={table.selected.includes(p.id)}
                    onCheckedChange={(v) => table.toggleRow(p.id, Boolean(v))}
                  />
                </TableCell>
                <TableCell className="font-mono text-xs font-medium">{p.key}</TableCell>
                <TableCell
                  title={p.value}
                  className="max-w-96 truncate font-mono text-xs text-muted-foreground"
                >
                  {p.value}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {p.description || '—'}
                </TableCell>
                <TableCell className="pr-4 text-center">
                  {canWrite && (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`编辑 ${p.key}`}
                      onClick={() => {
                        setEditing(p)
                        setDialogOpen(true)
                      }}
                    >
                      <Pencil />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Pagination
          total={rows.length}
          page={table.page}
          pageSize={table.pageSize}
          selectedCount={table.selected.length}
          onPageChange={table.setPage}
          onPageSizeChange={table.setPageSize}
        />
      </Panel>

      <ParamDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />

      <BatchResultDialog
        open={results !== null}
        onOpenChange={(v) => !v && setResults(null)}
        action="删除参数"
        results={results ?? []}
      />
    </>
  )
}
