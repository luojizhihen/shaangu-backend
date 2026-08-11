'use client'

import * as React from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, RefreshCcw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  PageHeader,
  Panel,
  StatusTag,
  NativeSelect,
} from '@/components/layout/page-frame'
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
  removeComments,
  setCommentHidden,
  useContent,
  type BatchResult,
} from '@/lib/content-store'
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

const STATE_OPTIONS = ['全部状态', '显示中', '已隐藏']

export default function CommentsPage() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromNews = searchParams.get('news') ?? ''
  const { comments } = useContent()

  const [newsTitle, setNewsTitle] = React.useState(fromNews)
  const [content, setContent] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [state, setState] = React.useState('全部状态')
  const [query, setQuery] = React.useState({
    newsTitle: fromNews,
    content: '',
    phone: '',
    state: '全部状态',
  })

  const [results, setResults] = React.useState<BatchResult[] | null>(null)
  const [resultAction, setResultAction] = React.useState('批量操作')

  const rows = React.useMemo(
    () =>
      comments.filter((c) => {
        const hitNews = c.newsTitle.includes(query.newsTitle.trim())
        const hitContent = c.content.includes(query.content.trim())
        const hitPhone = c.phone.includes(query.phone.trim())
        const hitState =
          query.state === '全部状态' ||
          (query.state === '已隐藏' ? c.hidden : !c.hidden)
        return hitNews && hitContent && hitPhone && hitState
      }),
    [comments, query],
  )

  const table = useTableState(rows)

  function search() {
    setQuery({ newsTitle, content, phone, state })
    table.setPage(1)
  }

  function reset() {
    setNewsTitle('')
    setContent('')
    setPhone('')
    setState('全部状态')
    setQuery({ newsTitle: '', content: '', phone: '', state: '全部状态' })
  }

  function batch(action: string, fn: () => BatchResult[]) {
    if (table.selected.length === 0) {
      toast.error('请先勾选需要处理的评论')
      return
    }
    setResultAction(action)
    setResults(fn())
    table.clear()
  }

  const hiddenCount = comments.filter((c) => c.hidden).length

  return (
    <>
      <PageHeader
        breadcrumb={breadcrumbFor(pathname)}
        title="资讯评论管理"
        actions={
          <Button variant="outline" onClick={() => toast.success('列表已刷新')}>
            <RefreshCcw className="size-4" />
            刷新
          </Button>
        }
      />

      <FilterBar onSearch={search} onReset={reset}>
        <FilterField label="所属资讯">
          <Input
            value={newsTitle}
            placeholder="请输入所属资讯"
            onChange={(e) => setNewsTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) search()
            }}
          />
        </FilterField>
        <FilterField label="评论内容">
          <Input
            value={content}
            placeholder="请输入评论内容"
            onChange={(e) => setContent(e.target.value)}
          />
        </FilterField>
        <FilterField label="会员手机号">
          <Input
            value={phone}
            placeholder="请输入会员手机号"
            onChange={(e) => setPhone(e.target.value)}
          />
        </FilterField>
        <FilterField label="评论状态">
          <NativeSelect
            aria-label="评论状态"
            value={state}
            onChange={setState}
            options={STATE_OPTIONS}
          />
        </FilterField>
      </FilterBar>

      <Panel bodyClassName="p-0">
        <Toolbar>
          <Button
            size="sm"
            variant="outline"
            onClick={() => batch('隐藏评论', () => setCommentHidden(table.selected, true))}
          >
            <EyeOff className="size-3.5" />
            批量隐藏
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              batch('恢复显示', () => setCommentHidden(table.selected, false))
            }
          >
            <Eye className="size-3.5" />
            批量显示
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => batch('删除评论', () => removeComments(table.selected))}
          >
            <Trash2 className="size-3.5" />
            批量删除
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">
            共 {comments.length} 条评论 · 已隐藏 {hiddenCount} 条 · 已选{' '}
            {table.selected.length} 条
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
              <TableHead className="min-w-56">所属资讯</TableHead>
              <TableHead className="min-w-64">评论内容</TableHead>
              <TableHead className="w-32">会员手机号</TableHead>
              <TableHead className="w-28">评论者</TableHead>
              <TableHead className="w-28">所属部门</TableHead>
              <TableHead className="w-44">评论时间</TableHead>
              <TableHead className="w-20">状态</TableHead>
              <TableHead className="w-24 pr-4 text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.pageRows.length === 0 && (
              <TableEmpty colSpan={10} text="没有符合条件的评论" />
            )}
            {table.pageRows.map((c, i) => (
              <TableRow key={c.id}>
                <TableCell className="pl-4 text-muted-foreground">
                  {(table.page - 1) * table.pageSize + i + 1}
                </TableCell>
                <TableCell>
                  <Checkbox
                    aria-label={`选择评论 ${c.id}`}
                    checked={table.selected.includes(c.id)}
                    onCheckedChange={(v) => table.toggleRow(c.id, Boolean(v))}
                  />
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    title={c.newsTitle}
                    onClick={() => router.push(`/content/news/${c.newsId}`)}
                    className="max-w-56 truncate text-left text-brand hover:underline"
                  >
                    {c.newsTitle}
                  </button>
                </TableCell>
                <TableCell>
                  <span className="line-clamp-2 whitespace-normal">{c.content}</span>
                </TableCell>
                <TableCell className="font-mono text-xs">{c.phone}</TableCell>
                <TableCell>{c.author}</TableCell>
                <TableCell className="text-muted-foreground">{c.dept}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {c.createdAt}
                </TableCell>
                <TableCell>
                  <StatusTag tone={c.hidden ? 'warning' : 'success'}>
                    {c.hidden ? '已隐藏' : '显示中'}
                  </StatusTag>
                </TableCell>
                <TableCell className="pr-4">
                  <div className="flex items-center justify-center gap-0.5">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={c.hidden ? '恢复显示' : '隐藏评论'}
                      onClick={() => {
                        setCommentHidden([c.id], !c.hidden)
                        toast.success(c.hidden ? '评论已恢复显示' : '评论已隐藏')
                      }}
                    >
                      {c.hidden ? <EyeOff /> : <Eye />}
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="删除评论"
                      onClick={() => {
                        removeComments([c.id])
                        toast.success('评论已删除')
                      }}
                    >
                      <Trash2 className="text-destructive" />
                    </Button>
                  </div>
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

      <BatchResultDialog
        open={results !== null}
        onOpenChange={(v) => !v && setResults(null)}
        action={resultAction}
        results={results ?? []}
      />
    </>
  )
}
