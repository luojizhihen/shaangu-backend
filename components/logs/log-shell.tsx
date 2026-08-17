'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { Download } from 'lucide-react'
import { toast } from 'sonner'

import { usePersistentState } from '@/hooks/use-persistent-state'
import { PageHeader, Panel } from '@/components/layout/page-frame'
import { FilterBar, Pagination, Toolbar } from '@/components/content/table-shell'
import { breadcrumbFor } from '@/lib/nav'
import { Button } from '@/components/ui/button'

/* ---------------- 通用查询状态 ---------------- */

export type LogQuery = {
  /** 关键词，各页含义不同（用户账号、操作人、接口 URL 等） */
  keyword: string
  /** 起始日期，格式 YYYY-MM-DD */
  from: string
  /** 结束日期，格式 YYYY-MM-DD */
  to: string
}

const EMPTY_QUERY: LogQuery = { keyword: '', from: '', to: '' }

/**
 * 日志页通用查询：draft 为输入中的值，applied 为已生效的筛选条件。
 * 只有点击「搜索」才把 draft 提交为 applied，与资讯管理等既有页面的交互语义一致。
 */
export function useLogQuery(storageKey: string) {
  const [applied, setApplied, ready] = usePersistentState<LogQuery>(
    storageKey,
    EMPTY_QUERY,
  )
  const [draft, setDraft] = React.useState<LogQuery>(EMPTY_QUERY)

  // 本地状态恢复完成后回填输入框，保证刷新后筛选条件可见
  React.useEffect(() => {
    if (ready) setDraft(applied)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  function patch(p: Partial<LogQuery>) {
    setDraft((d) => ({ ...d, ...p }))
  }

  function search() {
    if (draft.from && draft.to && draft.from > draft.to) {
      toast.error('结束时间不能早于开始时间')
      return false
    }
    setApplied(draft)
    return true
  }

  function reset() {
    setDraft(EMPTY_QUERY)
    setApplied(EMPTY_QUERY)
  }

  return { draft, applied, patch, search, reset }
}

/* ---------------- 过滤工具 ---------------- */

/** 关键词匹配：为空视为不过滤，忽略大小写 */
export function matchKeyword(value: string, keyword: string) {
  const k = keyword.trim().toLowerCase()
  if (!k) return true
  return value.toLowerCase().includes(k)
}

/**
 * 日期范围匹配。
 * 日志时间形如 2026-08-12 09:37:23，取前 10 位与 YYYY-MM-DD 直接比较，
 * ISO 格式的字典序等于时间序，无需构造 Date 对象。
 */
export function inDateRange(dateTime: string, from: string, to: string) {
  const day = dateTime.slice(0, 10)
  if (from && day < from) return false
  if (to && day > to) return false
  return true
}

/* ---------------- 筛选字段 ---------------- */

const dateInputClass =
  'h-8 w-[132px] rounded-md border border-input bg-surface px-2 text-[13px] text-foreground focus:border-ring focus:outline-none'

/** 开始日期 ~ 结束日期 */
export function DateRangeField({
  label,
  from,
  to,
  onFromChange,
  onToChange,
}: {
  label: string
  from: string
  to: string
  onFromChange: (v: string) => void
  onToChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0 text-[13px] text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={from}
          aria-label={`${label}开始日期`}
          onChange={(e) => onFromChange(e.target.value)}
          className={dateInputClass}
        />
        <span className="text-xs text-muted-foreground">~</span>
        <input
          type="date"
          value={to}
          aria-label={`${label}结束日期`}
          onChange={(e) => onToChange(e.target.value)}
          className={dateInputClass}
        />
      </div>
    </div>
  )
}

/* ---------------- 页面骨架 ---------------- */

/** 只声明骨架用得到的字段，兼容 useTableState 的返回值 */
type TableState = {
  page: number
  pageSize: number
  selected: string[]
  setPage: (p: number) => void
  setPageSize: (s: number) => void
}

/**
 * 日志页统一骨架：页头 + 筛选区 + 工具栏 + 表格 + 分页。
 * 6 个日志页只在筛选字段与表格列上存在差异，其余结构全部由本组件收口。
 */
export function LogPageFrame({
  title,
  filters,
  onSearch,
  onReset,
  onExport,
  toolbarStart,
  total,
  unit = '条记录',
  table,
  children,
}: {
  title: string
  filters: React.ReactNode
  onSearch: () => void
  onReset: () => void
  /** 传入则渲染导出按钮 */
  onExport?: () => void
  /** 工具栏左侧的额外操作（如强制下线） */
  toolbarStart?: React.ReactNode
  total: number
  unit?: string
  table: TableState
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <>
      <PageHeader breadcrumb={breadcrumbFor(pathname)} title={title} />

      <FilterBar onSearch={onSearch} onReset={onReset}>
        {filters}
      </FilterBar>

      <Panel bodyClassName="p-0">
        <Toolbar>
          {toolbarStart}
          {onExport && (
            <Button size="sm" variant="outline" onClick={onExport}>
              <Download className="size-3.5" />
              导出
            </Button>
          )}
          <span className="ml-auto text-xs text-muted-foreground">
            共 {total} {unit}
            {table.selected.length > 0 ? ` · 已选 ${table.selected.length} 条` : ''}
          </span>
        </Toolbar>

        <div className="scroll-thin overflow-x-auto">{children}</div>

        <Pagination
          total={total}
          page={table.page}
          pageSize={table.pageSize}
          selectedCount={table.selected.length}
          onPageChange={table.setPage}
          onPageSizeChange={table.setPageSize}
        />
      </Panel>
    </>
  )
}
