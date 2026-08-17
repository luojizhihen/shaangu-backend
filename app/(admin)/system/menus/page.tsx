'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import {
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Pencil,
  Plus,
  RefreshCcw,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

import { useApp } from '@/components/app-store'
import { PageHeader, Panel, StatusTag } from '@/components/layout/page-frame'
import { TableEmpty, Toolbar } from '@/components/content/table-shell'
import { BatchResultDialog } from '@/components/content/batch-result-dialog'
import { MenuNodeDialog } from '@/components/system/menu-node-dialog'
import {
  menuTypeTone,
  removeMenuNodes,
  useSystem,
  type BatchResult,
  type MenuNode,
} from '@/lib/system-store'
import { breadcrumbFor } from '@/lib/nav'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type Row = { node: MenuNode; depth: number; hasKids: boolean }

/** 按 parentId 递归展开为带层级的可见行，仅展开中的父节点才继续下钻 */
function buildRows(menus: MenuNode[], expanded: string[]): Row[] {
  const rows: Row[] = []

  function walk(parentId: string | null, depth: number) {
    menus
      .filter((m) => m.parentId === parentId)
      .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, 'zh-CN'))
      .forEach((node) => {
        const hasKids = menus.some((m) => m.parentId === node.id)
        rows.push({ node, depth, hasKids })
        if (hasKids && expanded.includes(node.id)) walk(node.id, depth + 1)
      })
  }

  walk(null, 0)
  return rows
}

export default function MenusPage() {
  const pathname = usePathname()
  const { menus } = useSystem()
  const { allow } = useApp()
  const canWrite = allow('system.menus')

  const [expanded, setExpanded] = React.useState<string[]>([])
  // 菜单为树形结构，分页会破坏层级关系，因此本页不分页，仅保留勾选
  const [selected, setSelected] = React.useState<string[]>([])
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<MenuNode | null>(null)
  const [results, setResults] = React.useState<BatchResult[] | null>(null)

  const rows = React.useMemo(() => buildRows(menus, expanded), [menus, expanded])
  const visibleIds = rows.map((r) => r.node.id)
  const validSelected = selected.filter((id) => visibleIds.includes(id))
  const allChecked = rows.length > 0 && validSelected.length === rows.length

  function toggleExpand(id: string) {
    setExpanded((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  function toggleRow(id: string, checked: boolean) {
    setSelected((s) => (checked ? [...new Set([...s, id])] : s.filter((x) => x !== id)))
  }

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(node: MenuNode) {
    setEditing(node)
    setDialogOpen(true)
  }

  function batchDelete() {
    if (validSelected.length === 0) {
      toast.error('请先选择要操作的记录')
      return
    }
    setResults(removeMenuNodes(validSelected))
    setSelected([])
  }

  return (
    <>
      <PageHeader breadcrumb={breadcrumbFor(pathname)} title="菜单管理" />

      <Panel bodyClassName="p-0">
        <Toolbar>
          {canWrite && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-3.5" />
              新增
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast.success('菜单树已刷新')}
          >
            <RefreshCcw className="size-3.5" />
            刷新
          </Button>
          {canWrite && (
            <Button size="sm" variant="outline" onClick={batchDelete}>
              <Trash2 className="size-3.5" />
              批量删除
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              setExpanded(
                expanded.length > 0
                  ? []
                  : menus.filter((m) => menus.some((c) => c.parentId === m.id)).map((m) => m.id),
              )
            }
          >
            {expanded.length > 0 ? (
              <ChevronsDownUp className="size-3.5" />
            ) : (
              <ChevronsUpDown className="size-3.5" />
            )}
            {expanded.length > 0 ? '收起全部' : '展开全部'}
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">
            共 {menus.length} 个节点 · 当前展示 {rows.length} 行
            {validSelected.length > 0 ? ` · 已选 ${validSelected.length} 个` : ''}
          </span>
        </Toolbar>

        <Table className="text-[13px]">
          <TableHeader>
            <TableRow className="bg-muted/60">
              <TableHead className="w-10 pl-4">
                <Checkbox
                  aria-label="全选可见节点"
                  checked={allChecked}
                  onCheckedChange={(v) => setSelected(v ? visibleIds : [])}
                />
              </TableHead>
              <TableHead className="min-w-72">菜单名称</TableHead>
              <TableHead className="w-64">url</TableHead>
              <TableHead className="w-24 text-right">排序号</TableHead>
              <TableHead className="w-24">类型</TableHead>
              <TableHead className="w-24">是否使用</TableHead>
              <TableHead className="w-28 pr-4 text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && <TableEmpty colSpan={7} text="暂无菜单节点" />}
            {rows.map(({ node, depth, hasKids }) => (
              <TableRow key={node.id}>
                <TableCell className="pl-4">
                  <Checkbox
                    aria-label={`选择 ${node.name}`}
                    checked={validSelected.includes(node.id)}
                    onCheckedChange={(v) => toggleRow(node.id, Boolean(v))}
                  />
                </TableCell>
                <TableCell>
                  <div
                    className="flex items-center gap-1"
                    style={{ paddingLeft: depth * 20 }}
                  >
                    {hasKids ? (
                      <button
                        type="button"
                        aria-label={
                          expanded.includes(node.id)
                            ? `收起 ${node.name}`
                            : `展开 ${node.name}`
                        }
                        onClick={() => toggleExpand(node.id)}
                        className="flex size-4 items-center justify-center rounded text-muted-foreground hover:text-brand"
                      >
                        {expanded.includes(node.id) ? (
                          <ChevronDown className="size-3.5" />
                        ) : (
                          <ChevronRight className="size-3.5" />
                        )}
                      </button>
                    ) : (
                      <span className="size-4 shrink-0" />
                    )}
                    <span className={depth === 0 ? 'font-medium' : ''}>{node.name}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {node.url || '—'}
                </TableCell>
                <TableCell className="text-right font-mono text-xs text-muted-foreground">
                  {node.sort}
                </TableCell>
                <TableCell>
                  <StatusTag tone={menuTypeTone(node.type)}>{node.type}</StatusTag>
                </TableCell>
                <TableCell>
                  <StatusTag tone={node.enabled ? 'success' : 'neutral'}>
                    {node.enabled ? '是' : '否'}
                  </StatusTag>
                </TableCell>
                <TableCell className="pr-4">
                  <div className="flex items-center justify-center gap-0.5">
                    {canWrite && (
                      <>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`编辑 ${node.name}`}
                          onClick={() => openEdit(node)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`删除 ${node.name}`}
                          onClick={() => setResults(removeMenuNodes([node.id]))}
                        >
                          <Trash2 className="text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>

      <MenuNodeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
      />

      <BatchResultDialog
        open={results !== null}
        onOpenChange={(v) => !v && setResults(null)}
        action="删除节点"
        results={results ?? []}
      />
    </>
  )
}
