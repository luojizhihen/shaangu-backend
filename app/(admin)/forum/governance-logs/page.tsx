'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { Download, RefreshCcw, ScrollText } from 'lucide-react'
import { toast } from 'sonner'

import { NativeSelect, PageHeader, Panel, StatusTag } from '@/components/layout/page-frame'
import {
  FilterBar,
  FilterField,
  Pagination,
  TableEmpty,
  Toolbar,
  useTableState,
} from '@/components/content/table-shell'
import { useForum, type GovernanceObjectType } from '@/lib/forum-store'
import { downloadCsv } from '@/lib/export'
import { breadcrumbFor } from '@/lib/nav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const OBJECT_TYPES: GovernanceObjectType[] = ['帖子', '投票', '评论', '回复', '敏感词']

const ACTIONS = [
  '直接发布',
  '隐藏',
  '恢复显示',
  '逻辑删除',
  '置顶',
  '取消置顶',
  '官方回复',
  '新增词条',
  '编辑词条',
  '启用词条',
  '停用词条',
  '批量导入',
]

const EMPTY_QUERY = { keyword: '', operator: '', objectType: '全部对象', action: '全部操作' }

function actionTone(action: string) {
  if (action === '逻辑删除') return 'danger' as const
  if (action === '隐藏' || action === '停用词条') return 'warning' as const
  if (action === '直接发布' || action === '恢复显示' || action === '启用词条')
    return 'success' as const
  return 'info' as const
}

export default function ForumGovernanceLogsPage() {
  const pathname = usePathname()
  const { logs } = useForum()

  const [keyword, setKeyword] = React.useState('')
  const [operator, setOperator] = React.useState('')
  const [objectType, setObjectType] = React.useState('全部对象')
  const [action, setAction] = React.useState('全部操作')
  const [query, setQuery] = React.useState(EMPTY_QUERY)

  const rows = React.useMemo(
    () =>
      logs.filter((l) => {
        const kw = query.keyword.trim()
        const hitKeyword =
          !kw || l.objectSummary.includes(kw) || l.objectId.includes(kw) || l.reason.includes(kw)
        const hitOperator = l.operator.includes(query.operator.trim())
        const hitType = query.objectType === '全部对象' || l.objectType === query.objectType
        const hitAction = query.action === '全部操作' || l.action === query.action
        return hitKeyword && hitOperator && hitType && hitAction
      }),
    [logs, query],
  )

  const table = useTableState(rows)

  function search() {
    setQuery({ keyword, operator, objectType, action })
    table.setPage(1)
  }

  function reset() {
    setKeyword('')
    setOperator('')
    setObjectType('全部对象')
    setAction('全部操作')
    setQuery(EMPTY_QUERY)
  }

  return (
    <>
      <PageHeader
        breadcrumb={breadcrumbFor(pathname)}
        title="论坛治理日志"
        actions={
          <>
            <Button variant="outline" onClick={() => toast.success('列表已刷新')}>
              <RefreshCcw className="size-4" />
              刷新
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                downloadCsv(
                  '论坛治理日志',
                  ['日志编号', '操作时间', '操作人', '角色', '对象类型', '对象编号', '对象摘要', '操作', '原因', '变更前', '变更后'],
                  rows.map((l) => [
                    l.id,
                    l.at,
                    l.operator,
                    l.role,
                    l.objectType,
                    l.objectId,
                    l.objectSummary,
                    l.action,
                    l.reason,
                    l.before,
                    l.after,
                  ]),
                )
                toast.success(`已导出 ${rows.length} 条治理日志`)
              }}
            >
              <Download className="size-4" />
              导出
            </Button>
          </>
        }
      />

      <p className="mb-4 flex items-start gap-2 rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-xs leading-relaxed text-muted-foreground">
        <ScrollText className="mt-0.5 size-3.5 shrink-0" />
        记录论坛内容的发布与事后治理操作，包含操作人、角色、时间、原因与状态变化。日志只读留痕，不可编辑或删除。
      </p>

      <FilterBar onSearch={search} onReset={reset}>
        <FilterField label="对象/原因">
          <Input
            value={keyword}
            placeholder="请输入对象标题、编号或原因"
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) search()
            }}
          />
        </FilterField>
        <FilterField label="对象类型">
          <NativeSelect
            aria-label="对象类型"
            value={objectType}
            onChange={setObjectType}
            options={['全部对象', ...OBJECT_TYPES]}
          />
        </FilterField>
        <FilterField label="操作类型">
          <NativeSelect
            aria-label="操作类型"
            value={action}
            onChange={setAction}
            options={['全部操作', ...ACTIONS]}
          />
        </FilterField>
        <FilterField label="操作人">
          <Input
            value={operator}
            placeholder="请输入操作人"
            onChange={(e) => setOperator(e.target.value)}
          />
        </FilterField>
      </FilterBar>

      <Panel bodyClassName="p-0">
        <Toolbar>
          <span className="text-xs text-muted-foreground">
            共 {logs.length} 条日志 · 当前筛选 {rows.length} 条
          </span>
        </Toolbar>

        <Table className="text-[13px]">
          <TableHeader>
            <TableRow className="bg-muted/60">
              <TableHead className="w-14 pl-4">序号</TableHead>
              <TableHead className="w-24">日志编号</TableHead>
              <TableHead className="w-44">操作时间</TableHead>
              <TableHead className="w-32">操作人</TableHead>
              <TableHead className="w-20">对象类型</TableHead>
              <TableHead className="min-w-56">对象</TableHead>
              <TableHead className="w-24">操作</TableHead>
              <TableHead className="min-w-48">原因</TableHead>
              <TableHead className="min-w-56 pr-4">状态变化</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.pageRows.length === 0 && (
              <TableEmpty colSpan={9} text="没有符合条件的治理日志" />
            )}
            {table.pageRows.map((l, i) => (
              <TableRow key={l.id}>
                <TableCell className="pl-4 text-muted-foreground">
                  {(table.page - 1) * table.pageSize + i + 1}
                </TableCell>
                <TableCell className="font-mono text-xs">{l.id}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {l.at}
                </TableCell>
                <TableCell>
                  <span className="block truncate">{l.operator}</span>
                  <span className="text-xs text-muted-foreground">{l.role}</span>
                </TableCell>
                <TableCell>
                  <StatusTag tone="neutral">{l.objectType}</StatusTag>
                </TableCell>
                <TableCell>
                  <span className="block max-w-56 truncate" title={l.objectSummary}>
                    {l.objectSummary}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {l.objectId}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusTag tone={actionTone(l.action)}>{l.action}</StatusTag>
                </TableCell>
                <TableCell>
                  <span className="line-clamp-2 whitespace-normal text-muted-foreground">
                    {l.reason}
                  </span>
                </TableCell>
                <TableCell className="pr-4">
                  <span className="line-clamp-2 whitespace-normal text-muted-foreground">
                    {l.before} → {l.after}
                  </span>
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
    </>
  )
}
