'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
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
import {
  addCategory,
  removeCategories,
  useContent,
  type BatchResult,
} from '@/lib/content-store'
import { breadcrumbFor } from '@/lib/nav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function CategoriesPage() {
  const pathname = usePathname()
  const { categories } = useContent()
  const { role } = useApp()

  const [keyword, setKeyword] = React.useState('')
  const [query, setQuery] = React.useState({ keyword: '' })

  const [createOpen, setCreateOpen] = React.useState(false)
  const [form, setForm] = React.useState({ name: '', remark: '' })
  const [results, setResults] = React.useState<BatchResult[] | null>(null)

  const rows = React.useMemo(
    () => categories.filter((c) => c.name.includes(query.keyword.trim())),
    [categories, query],
  )

  const table = useTableState(rows)

  function search() {
    setQuery({ keyword })
    table.setPage(1)
  }

  function reset() {
    setKeyword('')
    setQuery({ keyword: '' })
  }

  function submitCreate() {
    // 类目不再区分是否支持附件，统一按仅正文创建
    const res = addCategory({ ...form, withAttachment: false, owner: role.person })
    if (!res.ok) {
      toast.error(res.message)
      return
    }
    toast.success(res.message)
    setForm({ name: '', remark: '' })
    setCreateOpen(false)
  }

  function batchDelete() {
    if (table.selected.length === 0) {
      toast.error('请先勾选需要删除的类目')
      return
    }
    setResults(removeCategories(table.selected))
    table.clear()
  }

  return (
    <>
      <PageHeader
        breadcrumb={breadcrumbFor(pathname)}
        title="资讯类目管理"
      />

      <FilterBar onSearch={search} onReset={reset}>
        <FilterField label="分类名称">
          <Input
            value={keyword}
            placeholder="请输入分类名称"
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) search()
            }}
          />
        </FilterField>
      </FilterBar>

      <Panel bodyClassName="p-0">
        <Toolbar>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" />
            新增分类
          </Button>
          <Button size="sm" variant="outline" onClick={batchDelete}>
            <Trash2 className="size-3.5" />
            批量删除
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">
            共 {categories.length} 个类目 · 内置 6 个
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
              <TableHead>分类名称</TableHead>
              <TableHead className="w-24">创建人</TableHead>
              <TableHead className="w-44">创建日期</TableHead>
              <TableHead className="min-w-64">备注</TableHead>
              <TableHead className="w-20 pr-4 text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.pageRows.length === 0 && (
              <TableEmpty colSpan={7} text="没有符合条件的资讯类目" />
            )}
            {table.pageRows.map((c, i) => {
              return (
                <TableRow key={c.id}>
                  <TableCell className="pl-4 text-muted-foreground">
                    {(table.page - 1) * table.pageSize + i + 1}
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      aria-label={`选择 ${c.name}`}
                      checked={table.selected.includes(c.id)}
                      onCheckedChange={(v) => table.toggleRow(c.id, Boolean(v))}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.owner}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {c.createdAt}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <span className="line-clamp-2 whitespace-normal">{c.remark}</span>
                  </TableCell>
                  <TableCell className="pr-4 text-center">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`删除 ${c.name}`}
                      disabled={c.builtin}
                      onClick={() => {
                        setResults(removeCategories([c.id]))
                      }}
                    >
                      <Trash2
                        className={c.builtin ? 'text-muted-foreground' : 'text-destructive'}
                      />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增资讯类目</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <label className="grid gap-1.5">
              <span className="text-[13px] text-muted-foreground">
                <span className="text-destructive">*</span>分类名称
              </span>
              <Input
                value={form.name}
                placeholder="请输入分类名称"
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-[13px] text-muted-foreground">备注</span>
              <textarea
                value={form.remark}
                rows={4}
                placeholder="请输入备注，便于其他管理员理解该类目用途"
                onChange={(e) => setForm((f) => ({ ...f, remark: e.target.value }))}
                className="scroll-thin w-full rounded-md border border-input bg-surface px-3 py-2 text-[13px] leading-relaxed text-foreground focus:border-ring focus:outline-none"
              />
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              取消
            </Button>
            <Button onClick={submitCreate}>确定新增</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BatchResultDialog
        open={results !== null}
        onOpenChange={(v) => !v && setResults(null)}
        action="删除类目"
        results={results ?? []}
      />
    </>
  )
}
