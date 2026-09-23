'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { useApp } from '@/components/app-store'
import { PageHeader, Panel, StatusTag } from '@/components/layout/page-frame'
import {
  FilterBar,
  FilterField,
  Pagination,
  TableEmpty,
  Toolbar,
  useTableState,
} from '@/components/content/table-shell'
import { BatchResultDialog } from '@/components/content/batch-result-dialog'
import { CodeTypeDialog } from '@/components/system/code-type-dialog'
import {
  removeCodeTypes,
  useSystem,
  type BatchResult,
  type CodeType,
} from '@/lib/system-store'
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

type Query = { code: string; name: string }

const EMPTY_QUERY: Query = { code: '', name: '' }

export default function CodesPage() {
  const pathname = usePathname()
  const { codeTypes } = useSystem()
  const { allow } = useApp()
  const canWrite = allow('system.codes')

  const [draft, setDraft] = React.useState<Query>(EMPTY_QUERY)
  const [query, setQuery] = React.useState<Query>(EMPTY_QUERY)

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<CodeType | null>(null)
  const [results, setResults] = React.useState<BatchResult[] | null>(null)

  const rows = React.useMemo(
    () =>
      codeTypes
        .filter(
          (t) =>
            t.code.toLowerCase().includes(query.code.trim().toLowerCase()) &&
            t.name.includes(query.name.trim()),
        )
        .sort((a, b) => a.sort - b.sort),
    [codeTypes, query],
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

  function openEdit(type: CodeType) {
    setEditing(type)
    setDialogOpen(true)
  }

  function batchDelete() {
    if (table.selected.length === 0) {
      toast.error('请先选择要操作的记录')
      return
    }
    setResults(removeCodeTypes(table.selected))
    table.clear()
  }

  return (
    <>
      <PageHeader breadcrumb={breadcrumbFor(pathname)} title="通用代码" />

      <FilterBar onSearch={search} onReset={reset}>
        <FilterField label="类型编号">
          <Input
            value={draft.code}
            placeholder="请输入类型编号"
            onChange={(e) => setDraft((d) => ({ ...d, code: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) search()
            }}
          />
        </FilterField>
        <FilterField label="类型名称">
          <Input
            value={draft.name}
            placeholder="请输入类型名称"
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
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
          <span className="ml-auto text-xs text-muted-foreground">
            共 {rows.length} 个代码类型
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
              <TableHead className="w-56">类型编号</TableHead>
              <TableHead className="w-40">类型名称</TableHead>
              <TableHead className="w-24">明细数</TableHead>
              <TableHead className="w-24 text-right">显示顺序</TableHead>
              <TableHead className="min-w-72">备注</TableHead>
              <TableHead className="w-20 pr-4 text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.pageRows.length === 0 && (
              <TableEmpty colSpan={7} text="没有符合条件的通用代码" />
            )}
            {table.pageRows.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="pl-4">
                  <Checkbox
                    aria-label={`选择 ${t.name}`}
                    checked={table.selected.includes(t.id)}
                    onCheckedChange={(v) => table.toggleRow(t.id, Boolean(v))}
                  />
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => openEdit(t)}
                    className="font-mono text-xs text-brand hover:underline"
                  >
                    {t.code}
                  </button>
                </TableCell>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell>
                  <StatusTag tone={t.items.length > 0 ? 'info' : 'neutral'}>
                    {t.items.length} 条
                  </StatusTag>
                </TableCell>
                <TableCell className="text-right font-mono text-xs text-muted-foreground">
                  {t.sort}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <span className="line-clamp-2 whitespace-normal">
                    {t.remark || '—'}
                  </span>
                </TableCell>
                <TableCell className="pr-4 text-center">
                  {canWrite && (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`编辑 ${t.name}`}
                      onClick={() => openEdit(t)}
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

      <CodeTypeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
      />

      <BatchResultDialog
        open={results !== null}
        onOpenChange={(v) => !v && setResults(null)}
        action="删除通用代码"
        results={results ?? []}
      />
    </>
  )
}
