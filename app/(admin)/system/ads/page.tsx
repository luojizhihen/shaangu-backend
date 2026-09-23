'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { Pencil, Plus, Trash2 } from 'lucide-react'
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
import { AdSlotDialog } from '@/components/system/ad-slot-dialog'
import {
  removeAdSlots,
  useSystem,
  type AdSlot,
  type BatchResult,
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

type Query = { instance: string; component: string; remark: string }

const EMPTY_QUERY: Query = { instance: '', component: '', remark: '' }

export default function AdsPage() {
  const pathname = usePathname()
  const { ads } = useSystem()
  const { allow } = useApp()
  const canWrite = allow('system.ads')

  const [draft, setDraft] = React.useState<Query>(EMPTY_QUERY)
  const [query, setQuery] = React.useState<Query>(EMPTY_QUERY)

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<AdSlot | null>(null)
  const [results, setResults] = React.useState<BatchResult[] | null>(null)

  const rows = React.useMemo(
    () =>
      ads.filter(
        (a) =>
          a.instance.toLowerCase().includes(query.instance.trim().toLowerCase()) &&
          a.component.includes(query.component.trim()) &&
          a.remark.includes(query.remark.trim()),
      ),
    [ads, query],
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

  function openEdit(ad: AdSlot) {
    setEditing(ad)
    setDialogOpen(true)
  }

  function batchDelete() {
    if (table.selected.length === 0) {
      toast.error('请先选择要操作的记录')
      return
    }
    setResults(removeAdSlots(table.selected))
    table.clear()
  }

  return (
    <>
      <PageHeader breadcrumb={breadcrumbFor(pathname)} title="广告组件" />

      <FilterBar onSearch={search} onReset={reset}>
        <FilterField label="实例名称">
          <Input
            value={draft.instance}
            placeholder="请输入实例名称"
            onChange={(e) => setDraft((d) => ({ ...d, instance: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) search()
            }}
          />
        </FilterField>
        <FilterField label="系统组件名称">
          <Input
            value={draft.component}
            placeholder="请输入系统组件名称"
            onChange={(e) => setDraft((d) => ({ ...d, component: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) search()
            }}
          />
        </FilterField>
        <FilterField label="备注">
          <Input
            value={draft.remark}
            placeholder="请输入备注"
            onChange={(e) => setDraft((d) => ({ ...d, remark: e.target.value }))}
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
            共 {rows.length} 个广告位
            {table.selected.length > 0 ? ` · 已选 ${table.selected.length} 个` : ''}
          </span>
        </Toolbar>

        <Table className="text-[13px]">
          <TableHeader>
            <TableRow className="bg-muted/60">
              <TableHead className="w-14 pl-4">序号</TableHead>
              <TableHead className="w-10">
                <Checkbox
                  aria-label="全选本页"
                  checked={table.allChecked}
                  onCheckedChange={(v) => table.togglePage(Boolean(v))}
                />
              </TableHead>
              <TableHead className="w-64">实例名称</TableHead>
              <TableHead className="w-56">系统组件名称</TableHead>
              <TableHead className="min-w-72">备注</TableHead>
              <TableHead className="w-20 pr-4 text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.pageRows.length === 0 && (
              <TableEmpty colSpan={6} text="没有符合条件的广告组件" />
            )}
            {table.pageRows.map((a, i) => (
              <TableRow key={a.id}>
                <TableCell className="pl-4 text-muted-foreground">
                  {(table.page - 1) * table.pageSize + i + 1}
                </TableCell>
                <TableCell>
                  <Checkbox
                    aria-label={`选择 ${a.instance}`}
                    checked={table.selected.includes(a.id)}
                    onCheckedChange={(v) => table.toggleRow(a.id, Boolean(v))}
                  />
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => openEdit(a)}
                    className="font-mono text-xs text-brand hover:underline"
                  >
                    {a.instance}
                  </button>
                </TableCell>
                <TableCell className="font-medium">{a.component}</TableCell>
                <TableCell className="text-muted-foreground">
                  <span className="line-clamp-2 whitespace-normal">
                    {a.remark || '—'}
                  </span>
                </TableCell>
                <TableCell className="pr-4 text-center">
                  {canWrite && (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`编辑 ${a.instance}`}
                      onClick={() => openEdit(a)}
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

      <AdSlotDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />

      <BatchResultDialog
        open={results !== null}
        onOpenChange={(v) => !v && setResults(null)}
        action="删除广告组件"
        results={results ?? []}
      />
    </>
  )
}
