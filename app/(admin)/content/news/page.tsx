'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  ArrowDownUp,
  ArrowUpFromLine,
  ArrowDownToLine,
  MessageSquare,
  Pin,
  PinOff,
  Plus,
  RefreshCcw,
  Send,
  SquarePen,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

import { useApp } from '@/components/app-store'
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
  NEWS_STATUSES,
  publishNews,
  putOnline,
  removeNews,
  setSort,
  setTop,
  takeOffline,
  useContent,
  type BatchResult,
  type NewsItem,
} from '@/lib/content-store'
import { breadcrumbFor } from '@/lib/nav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

type SortKey = 'sort' | 'views' | 'likes' | 'commentCount' | 'publishedAt'

const TOP_OPTIONS = ['全部', '是', '否']

function statusTone(status: NewsItem['status']) {
  if (status === '已发布') return 'success' as const
  if (status === '草稿') return 'neutral' as const
  return 'warning' as const
}

export default function NewsListPage() {
  const pathname = usePathname()
  const router = useRouter()
  const { news, categories } = useContent()
  const { role, allow } = useApp()
  const canPublish = allow('content.publish')

  const categoryOptions = ['全部分类', ...categories.map((c) => c.name)]
  const statusOptions = ['全部状态', ...NEWS_STATUSES]

  const [title, setTitle] = React.useState('')
  const [status, setStatus] = React.useState('全部状态')
  const [category, setCategory] = React.useState('全部分类')
  const [author, setAuthor] = React.useState('')
  const [top, setTopFilter] = React.useState('全部')
  const [query, setQuery] = React.useState({
    title: '',
    status: '全部状态',
    category: '全部分类',
    author: '',
    top: '全部',
  })
  const [sortKey, setSortKey] = React.useState<SortKey>('sort')
  const [asc, setAsc] = React.useState(true)

  const [results, setResults] = React.useState<BatchResult[] | null>(null)
  const [resultAction, setResultAction] = React.useState('批量操作')
  const [confirm, setConfirm] = React.useState<{
    action: string
    tip: string
    run: () => BatchResult[]
  } | null>(null)

  const rows = React.useMemo(() => {
    const filtered = news.filter((n) => {
      const hitTitle = n.title.includes(query.title.trim())
      const hitStatus = query.status === '全部状态' || n.status === query.status
      const hitCategory =
        query.category === '全部分类' || n.category === query.category
      const hitAuthor = n.author.includes(query.author.trim())
      const hitTop =
        query.top === '全部' || (query.top === '是' ? n.top : !n.top)
      return hitTitle && hitStatus && hitCategory && hitAuthor && hitTop
    })
    const dir = asc ? 1 : -1
    return [...filtered].sort((a, b) => {
      if (a.top !== b.top) return a.top ? -1 : 1
      if (sortKey === 'publishedAt') {
        return a.publishedAt.localeCompare(b.publishedAt) * dir
      }
      return (a[sortKey] - b[sortKey]) * dir
    })
  }, [news, query, sortKey, asc])

  const table = useTableState(rows)
  const selectedRows = news.filter((n) => table.selected.includes(n.id))

  function search() {
    setQuery({ title, status, category, author, top })
    table.setPage(1)
  }

  function reset() {
    setTitle('')
    setStatus('全部状态')
    setCategory('全部分类')
    setAuthor('')
    setTopFilter('全部')
    setQuery({
      title: '',
      status: '全部状态',
      category: '全部分类',
      author: '',
      top: '全部',
    })
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setAsc((v) => !v)
      return
    }
    setSortKey(key)
    setAsc(key === 'sort')
  }

  function requireSelection() {
    if (table.selected.length === 0) {
      toast.error('请先在列表中勾选资讯')
      return false
    }
    return true
  }

  function runBatch(action: string, run: () => BatchResult[]) {
    const res = run()
    setResultAction(action)
    setResults(res)
    table.clear()
  }

  function ask(action: string, tip: string, run: () => BatchResult[]) {
    if (!requireSelection()) return
    setConfirm({ action, tip, run })
  }

  const SortHead = ({ label, k }: { label: string; k: SortKey }) => (
    <button
      type="button"
      onClick={() => toggleSort(k)}
      className="inline-flex items-center gap-1 text-[13px] font-medium hover:text-brand"
      aria-label={`按${label}排序`}
    >
      {label}
      <ArrowDownUp
        className={sortKey === k ? 'size-3 text-brand' : 'size-3 text-muted-foreground'}
      />
    </button>
  )

  return (
    <>
      <PageHeader
        breadcrumb={breadcrumbFor(pathname)}
        title="资讯管理"
        actions={
          <>
            <Button variant="outline" onClick={() => toast.success('列表已刷新')}>
              <RefreshCcw className="size-4" />
              刷新
            </Button>
            <Button onClick={() => router.push('/content/news/new')}>
              <Plus className="size-4" />
              新增资讯
            </Button>
          </>
        }
      />

      <FilterBar onSearch={search} onReset={reset}>
        <FilterField label="标题">
          <Input
            value={title}
            placeholder="请输入标题"
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) search()
            }}
          />
        </FilterField>
        <FilterField label="资讯状态">
          <NativeSelect
            aria-label="资讯状态"
            value={status}
            onChange={setStatus}
            options={statusOptions}
          />
        </FilterField>
        <FilterField label="分类">
          <NativeSelect
            aria-label="分类"
            value={category}
            onChange={setCategory}
            options={categoryOptions}
          />
        </FilterField>
        <FilterField label="创建人">
          <Input
            value={author}
            placeholder="请输入创建人"
            onChange={(e) => setAuthor(e.target.value)}
          />
        </FilterField>
        <FilterField label="是否置顶">
          <NativeSelect
            aria-label="是否置顶"
            value={top}
            onChange={setTopFilter}
            options={TOP_OPTIONS}
          />
        </FilterField>
      </FilterBar>

      <Panel bodyClassName="p-0">
        <Toolbar>
          <Button size="sm" onClick={() => router.push('/content/news/new')}>
            <Plus className="size-3.5" />
            新增资讯
          </Button>
          {canPublish && (
            <Button
              size="sm"
              onClick={() =>
                ask(
                  '发布',
                  '仅草稿可发布，发布后默认上架。已下架内容请使用「上架」。',
                  () => publishNews(table.selected, role.person),
                )
              }
            >
              <Send className="size-3.5" />
              发布
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              ask('上架', '仅已下架内容可重新上架。', () => putOnline(table.selected))
            }
          >
            <ArrowUpFromLine className="size-3.5" />
            上架
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              ask('下架', '下架后内容在前台不可见，可随时重新上架。', () =>
                takeOffline(table.selected),
              )
            }
          >
            <ArrowDownToLine className="size-3.5" />
            下架
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              ask('置顶', '仅已发布内容可置顶。', () => setTop(table.selected, true))
            }
          >
            <Pin className="size-3.5" />
            置顶
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              ask('取消置顶', '取消后按排序号展示。', () =>
                setTop(table.selected, false),
              )
            }
          >
            <PinOff className="size-3.5" />
            取消置顶
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              ask('批量删除', '已发布内容需先下架才能删除，删除后不可恢复。', () =>
                removeNews(table.selected),
              )
            }
          >
            <Trash2 className="size-3.5" />
            批量删除
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">
            已选 {table.selected.length} 条
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
              <TableHead className="min-w-72">标题</TableHead>
              <TableHead className="w-24">分类</TableHead>
              <TableHead className="w-24">创建人</TableHead>
              <TableHead className="w-24">资讯状态</TableHead>
              <TableHead className="w-24">是否置顶</TableHead>
              <TableHead className="w-44">发布时间</TableHead>
              <TableHead className="w-24">
                <SortHead label="排序" k="sort" />
              </TableHead>
              <TableHead className="w-24 text-right">
                <SortHead label="浏览量" k="views" />
              </TableHead>
              <TableHead className="w-24 text-right">
                <SortHead label="点赞量" k="likes" />
              </TableHead>
              <TableHead className="w-24 text-right">
                <SortHead label="评论量" k="commentCount" />
              </TableHead>
              <TableHead className="w-32 pr-4 text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.pageRows.length === 0 && (
              <TableEmpty colSpan={13} text="没有符合条件的资讯" />
            )}
            {table.pageRows.map((n, i) => (
              <TableRow key={n.id}>
                <TableCell className="pl-4 text-muted-foreground">
                  {(table.page - 1) * table.pageSize + i + 1}
                </TableCell>
                <TableCell>
                  <Checkbox
                    aria-label={`选择 ${n.title}`}
                    checked={table.selected.includes(n.id)}
                    onCheckedChange={(v) => table.toggleRow(n.id, Boolean(v))}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => router.push(`/content/news/${n.id}`)}
                      className="max-w-80 truncate text-left text-brand hover:underline"
                      title={n.title}
                    >
                      {n.title}
                    </button>
                    {n.attachments.length > 0 && (
                      <StatusTag tone="neutral">附件 {n.attachments.length}</StatusTag>
                    )}
                  </div>
                </TableCell>
                <TableCell>{n.category}</TableCell>
                <TableCell>{n.author}</TableCell>
                <TableCell>
                  <StatusTag tone={statusTone(n.status)}>{n.status}</StatusTag>
                </TableCell>
                <TableCell>
                  {/* 是表示置顶，否表示不置顶 */}
                  <StatusTag tone={n.top ? 'danger' : 'neutral'}>
                    {n.top ? '是' : '否'}
                  </StatusTag>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {n.publishedAt || '—'}
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={1}
                    aria-label={`${n.title} 排序号`}
                    value={n.sort}
                    className="h-7 w-16 px-2 text-xs"
                    onChange={(e) =>
                      setSort(n.id, Number.parseInt(e.target.value, 10) || 1)
                    }
                  />
                </TableCell>
                <TableCell className="text-right">
                  {n.views.toLocaleString('zh-CN')}
                </TableCell>
                <TableCell className="text-right">
                  {n.likes.toLocaleString('zh-CN')}
                </TableCell>
                <TableCell className="text-right">{n.commentCount}</TableCell>
                <TableCell className="pr-4">
                  <div className="flex items-center justify-center gap-0.5">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`编辑 ${n.title}`}
                      onClick={() => router.push(`/content/news/${n.id}`)}
                    >
                      <SquarePen />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`查看 ${n.title} 的评论`}
                      onClick={() =>
                        router.push(
                          `/content/comments?news=${encodeURIComponent(n.title)}`,
                        )
                      }
                    >
                      <MessageSquare />
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

      <Dialog open={confirm !== null} onOpenChange={(v) => !v && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认{confirm?.action}</DialogTitle>
            <DialogDescription>{confirm?.tip}</DialogDescription>
          </DialogHeader>
          <ul className="scroll-thin max-h-48 divide-y divide-border overflow-y-auto rounded-md border border-border text-[13px]">
            {selectedRows.map((n) => (
              <li key={n.id} className="flex items-center gap-2 px-3 py-1.5">
                <span className="min-w-0 flex-1 truncate">{n.title}</span>
                <StatusTag tone={statusTone(n.status)}>{n.status}</StatusTag>
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)}>
              取消
            </Button>
            <Button
              onClick={() => {
                if (!confirm) return
                runBatch(confirm.action, confirm.run)
                setConfirm(null)
              }}
            >
              确认{confirm?.action}（{table.selected.length} 条）
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BatchResultDialog
        open={results !== null}
        onOpenChange={(v) => !v && setResults(null)}
        action={resultAction}
        results={results ?? []}
      />
    </>
  )
}
