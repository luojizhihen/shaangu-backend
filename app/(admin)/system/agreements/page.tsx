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
import { AgreementDialog } from '@/components/system/agreement-dialog'
import {
  removeAgreements,
  useSystem,
  type Agreement,
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

export default function AgreementsPage() {
  const pathname = usePathname()
  const { agreements } = useSystem()
  const { allow } = useApp()
  const canWrite = allow('system.agreements')

  const [keyword, setKeyword] = React.useState('')
  const [query, setQuery] = React.useState('')

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Agreement | null>(null)
  const [results, setResults] = React.useState<BatchResult[] | null>(null)

  const rows = React.useMemo(
    () => agreements.filter((a) => a.title.includes(query.trim())),
    [agreements, query],
  )

  const table = useTableState(rows)

  function search() {
    setQuery(keyword)
    table.setPage(1)
  }

  function reset() {
    setKeyword('')
    setQuery('')
    table.setPage(1)
  }

  function openEdit(agreement: Agreement) {
    setEditing(agreement)
    setDialogOpen(true)
  }

  function batchDelete() {
    if (table.selected.length === 0) {
      toast.error('请先选择要操作的记录')
      return
    }
    setResults(removeAgreements(table.selected))
    table.clear()
  }

  return (
    <>
      <PageHeader breadcrumb={breadcrumbFor(pathname)} title="协议管理" />

      <FilterBar onSearch={search} onReset={reset}>
        <FilterField label="协议标题">
          <Input
            value={keyword}
            placeholder="请输入协议标题"
            onChange={(e) => setKeyword(e.target.value)}
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
            共 {rows.length} 个协议
            {table.selected.length > 0 ? ` · 已选 ${table.selected.length} 个` : ''}
          </span>
        </Toolbar>

        <div className="scroll-thin overflow-x-auto">
          <Table className="min-w-[1180px] text-[13px]">
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
                <TableHead className="w-40">协议标题</TableHead>
                <TableHead className="w-48">协议编号</TableHead>
                <TableHead className="w-28">是否系统展示</TableHead>
                <TableHead className="w-24">创建人</TableHead>
                <TableHead className="w-44">创建时间</TableHead>
                <TableHead className="w-28">最后修改人</TableHead>
                <TableHead className="w-44">最后修改时间</TableHead>
                <TableHead className="w-20 pr-4 text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.pageRows.length === 0 && (
                <TableEmpty colSpan={10} text="没有符合条件的协议" />
              )}
              {table.pageRows.map((a, i) => (
                <TableRow key={a.id}>
                  <TableCell className="pl-4 text-muted-foreground">
                    {(table.page - 1) * table.pageSize + i + 1}
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      aria-label={`选择 ${a.title}`}
                      checked={table.selected.includes(a.id)}
                      onCheckedChange={(v) => table.toggleRow(a.id, Boolean(v))}
                    />
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => openEdit(a)}
                      className="font-medium text-brand hover:underline"
                    >
                      {a.title}
                    </button>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {a.code}
                  </TableCell>
                  <TableCell>
                    <StatusTag tone={a.systemShown ? 'success' : 'neutral'}>
                      {a.systemShown ? '是' : '否'}
                    </StatusTag>
                  </TableCell>
                  <TableCell>{a.createdBy}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {a.createdAt}
                  </TableCell>
                  <TableCell>{a.updatedBy || '—'}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {a.updatedAt || '—'}
                  </TableCell>
                  <TableCell className="pr-4 text-center">
                    {canWrite && (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`编辑 ${a.title}`}
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
        </div>

        <Pagination
          total={rows.length}
          page={table.page}
          pageSize={table.pageSize}
          selectedCount={table.selected.length}
          onPageChange={table.setPage}
          onPageSizeChange={table.setPageSize}
        />
      </Panel>

      <AgreementDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
      />

      <BatchResultDialog
        open={results !== null}
        onOpenChange={(v) => !v && setResults(null)}
        action="删除协议"
        results={results ?? []}
      />
    </>
  )
}
