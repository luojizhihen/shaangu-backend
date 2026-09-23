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
import { RoleDialog } from '@/components/system/role-dialog'
import {
  removeRoles,
  useSystem,
  type BatchResult,
  type SysRole,
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

export default function RolesPage() {
  const pathname = usePathname()
  const { roles } = useSystem()
  const { allow } = useApp()
  const canWrite = allow('system.roles')

  const [draft, setDraft] = React.useState<Query>(EMPTY_QUERY)
  const [query, setQuery] = React.useState<Query>(EMPTY_QUERY)

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<SysRole | null>(null)
  const [results, setResults] = React.useState<BatchResult[] | null>(null)
  const [resultAction, setResultAction] = React.useState('操作')

  const rows = React.useMemo(
    () =>
      roles.filter(
        (r) =>
          r.code.toLowerCase().includes(query.code.trim().toLowerCase()) &&
          r.name.includes(query.name.trim()),
      ),
    [roles, query],
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

  function runBatch(action: string, fn: (ids: string[]) => BatchResult[]) {
    if (table.selected.length === 0) {
      toast.error('请先选择要操作的记录')
      return
    }
    setResultAction(action)
    setResults(fn(table.selected))
    table.clear()
  }

  return (
    <>
      <PageHeader breadcrumb={breadcrumbFor(pathname)} title="角色管理" />

      <FilterBar onSearch={search} onReset={reset}>
        <FilterField label="角色编号">
          <Input
            value={draft.code}
            placeholder="请输入角色编号"
            onChange={(e) => setDraft((d) => ({ ...d, code: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) search()
            }}
          />
        </FilterField>
        <FilterField label="角色名称">
          <Input
            value={draft.name}
            placeholder="请输入角色名称"
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
              <Button
                size="sm"
                variant="outline"
                onClick={() => runBatch('删除角色', removeRoles)}
              >
                <Trash2 className="size-3.5" />
                删除
              </Button>
            </>
          )}
          <span className="ml-auto text-xs text-muted-foreground">
            共 {rows.length} 个角色
            {table.selected.length > 0 ? ` · 已选 ${table.selected.length} 个` : ''}
          </span>
        </Toolbar>

        <div className="scroll-thin overflow-x-auto">
          <Table className="min-w-[1140px] text-[13px]">
            <TableHeader>
              <TableRow className="bg-muted/60">
                <TableHead className="w-10 pl-4">
                  <Checkbox
                    aria-label="全选本页"
                    checked={table.allChecked}
                    onCheckedChange={(v) => table.togglePage(Boolean(v))}
                  />
                </TableHead>
                <TableHead className="w-32">角色编号</TableHead>
                <TableHead className="w-40">角色名称</TableHead>
                <TableHead className="w-24">权限项</TableHead>
                <TableHead className="w-24">创建人</TableHead>
                <TableHead className="w-44">创建时间</TableHead>
                <TableHead className="w-28">最后修改人</TableHead>
                <TableHead className="w-44">最后修改时间</TableHead>
                <TableHead className="min-w-56">备注</TableHead>
                <TableHead className="w-20 pr-4 text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.pageRows.length === 0 && (
                <TableEmpty colSpan={10} text="没有符合条件的角色" />
              )}
              {table.pageRows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="pl-4">
                    <Checkbox
                      aria-label={`选择 ${r.name}`}
                      checked={table.selected.includes(r.id)}
                      onCheckedChange={(v) => table.toggleRow(r.id, Boolean(v))}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{r.code}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">{r.name}</span>
                      {r.system && <StatusTag tone="info">系统</StatusTag>}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {r.perms.length}
                  </TableCell>
                  <TableCell>{r.createdBy}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {r.createdAt}
                  </TableCell>
                  <TableCell>{r.updatedBy || '—'}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {r.updatedAt || '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <span className="line-clamp-2 whitespace-normal">
                      {r.remark || '—'}
                    </span>
                  </TableCell>
                  <TableCell className="pr-4 text-center">
                    {canWrite && (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`编辑 ${r.name}`}
                        onClick={() => {
                          setEditing(r)
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

      <RoleDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />

      <BatchResultDialog
        open={results !== null}
        onOpenChange={(v) => !v && setResults(null)}
        action={resultAction}
        results={results ?? []}
      />
    </>
  )
}
