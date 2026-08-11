'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { NativeSelect } from '@/components/layout/page-frame'

/** 查询条件区：与工具栏共用一块灰底容器 */
export function FilterBar({
  children,
  onSearch,
  onReset,
}: {
  children: React.ReactNode
  onSearch: () => void
  onReset: () => void
}) {
  return (
    <div className="mb-3 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-3">
      {children}
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={onSearch}>
          搜索
        </Button>
        <Button size="sm" variant="outline" onClick={onReset}>
          重置
        </Button>
      </div>
    </div>
  )
}

export function FilterField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="flex items-center gap-2">
      <span className="shrink-0 text-[13px] text-muted-foreground">{label}</span>
      <span className="w-44">{children}</span>
    </label>
  )
}

export function TableEmpty({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="h-28 text-center text-[13px] text-muted-foreground"
      >
        {text}
      </td>
    </tr>
  )
}

/** 分页：页码与每页条数 */
export function Pagination({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  selectedCount,
}: {
  total: number
  page: number
  pageSize: number
  onPageChange: (p: number) => void
  onPageSizeChange: (s: number) => void
  selectedCount?: number
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-2.5">
      <div className="text-xs text-muted-foreground">
        共 {total} 条
        {typeof selectedCount === 'number' && selectedCount > 0
          ? ` · 已选 ${selectedCount} 条`
          : ''}
      </div>
      <div className="flex items-center gap-2">
        <NativeSelect
          aria-label="每页条数"
          className="w-24"
          value={`${pageSize} 条/页`}
          onChange={(v) => onPageSizeChange(Number.parseInt(v, 10))}
          options={['10 条/页', '20 条/页', '50 条/页']}
        />
        <Button
          size="icon-sm"
          variant="outline"
          aria-label="上一页"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft />
        </Button>
        <span className="text-xs text-muted-foreground">
          {page} / {pages}
        </span>
        <Button
          size="icon-sm"
          variant="outline"
          aria-label="下一页"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  )
}

/** 列表批量操作工具栏 */
export function Toolbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
      {children}
    </div>
  )
}

/** 通用的分页/选择状态 */
export function useTableState<T extends { id: string }>(rows: T[]) {
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [selected, setSelected] = React.useState<string[]>([])

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const pageRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize)
  const ids = rows.map((r) => r.id)
  const validSelected = selected.filter((id) => ids.includes(id))
  const allChecked =
    pageRows.length > 0 && pageRows.every((r) => validSelected.includes(r.id))

  function toggleRow(id: string, checked: boolean) {
    setSelected((s) => (checked ? [...new Set([...s, id])] : s.filter((x) => x !== id)))
  }

  function togglePage(checked: boolean) {
    const pageIds = pageRows.map((r) => r.id)
    setSelected((s) =>
      checked
        ? [...new Set([...s, ...pageIds])]
        : s.filter((x) => !pageIds.includes(x)),
    )
  }

  return {
    page: safePage,
    pageSize,
    pageRows,
    selected: validSelected,
    allChecked,
    setPage,
    setPageSize: (s: number) => {
      setPageSize(s)
      setPage(1)
    },
    setSelected,
    toggleRow,
    togglePage,
    clear: () => setSelected([]),
  }
}
