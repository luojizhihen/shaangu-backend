'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  ArrowDownToLine,
  ArrowDownUp,
  ArrowUpFromLine,
  AudioLines,
  FileVideo,
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
  NativeSelect,
  PageHeader,
  Panel,
  StatusTag,
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
  MEDIA_STATUSES,
  publishMedia,
  putMediaOnline,
  removeMediaItems,
  setMediaSort,
  setMediaTop,
  statusTone,
  takeMediaOffline,
  useMedia,
  type BatchResult,
  type MediaKind,
} from '@/lib/media-store'
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

type SortKey = 'sort' | 'plays' | 'likes' | 'commentCount' | 'publishedAt'

const TOP_OPTIONS = ['全部', '是', '否']

const EMPTY_QUERY = {
  title: '',
  status: '全部状态',
  author: '',
  top: '全部',
}

/**
 * 视频管理与「陕鼓之声」共用同一套列表逻辑，仅按视听类型隔离数据。
 * 因此列表内不再提供视听类型筛选与类型列，避免与菜单入口重复。
 */
export function MediaListView({
  kind,
  title: pageTitle,
}: {
  kind: MediaKind
  title: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { media } = useMedia()
  const { role, allow } = useApp()
  const canPublish = allow('media.publish')
  const isVideo = kind === '视频'

  const [title, setTitle] = React.useState('')
  const [status, setStatus] = React.useState('全部状态')
  const [author, setAuthor] = React.useState('')
  const [top, setTopFilter] = React.useState('全部')
  const [query, setQuery] = React.useState(EMPTY_QUERY)

  const [sortKey, setSortKey] = React.useState<SortKey>('sort')
  const [asc, setAsc] = React.useState(true)

  const [results, setResults] = React.useState<BatchResult[] | null>(null)
  const [resultAction, setResultAction] = React.useState('批量操作')
  const [confirm, setConfirm] = React.useState<{
    action: string
    tip: string
    run: () => BatchResult[]
  } | null>(null)

  const scoped = React.useMemo(
    () => media.filter((m) => m.kind === kind),
    [media, kind],
  )

  const rows = React.useMemo(() => {
    const filtered = scoped.filter((m) => {
      const hitTitle = m.title.includes(query.title.trim())
      const hitStatus = query.status === '全部状态' || m.status === query.status
      const hitAuthor = m.author.includes(query.author.trim())
      const hitTop = query.top === '全部' || (query.top === '是' ? m.top : !m.top)
      return hitTitle && hitStatus && hitAuthor && hitTop
    })
    const dir = asc ? 1 : -1
    return [...filtered].sort((a, b) => {
      if (a.top !== b.top) return a.top ? -1 : 1
      if (sortKey === 'publishedAt') {
        return a.publishedAt.localeCompare(b.publishedAt) * dir
      }
      return (a[sortKey] - b[sortKey]) * dir
    })
  }, [scoped, query, sortKey, asc])

  const table = useTableState(rows)
  const selectedRows = scoped.filter((m) => table.selected.includes(m.id))

  function search() {
    setQuery({ title, status, author, top })
    table.setPage(1)
  }

  function reset() {
    setTitle('')
    setStatus('全部状态')
    setAuthor('')
    setTopFilter('全部')
    setQuery(EMPTY_QUERY)
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setAsc((v) => !v)
      return
    }
    setSortKey(key)
    setAsc(key === 'sort')
  }

  function ask(action: string, tip: string, run: () => BatchResult[]) {
    if (table.selected.length === 0) {
      toast.error(`请先在列表中勾选${isVideo ? '视频' : '音频'}内容`)
      return
    }
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
        className={
          sortKey === k ? 'size-3 text-brand' : 'size-3 text-muted-foreground'
        }
      />
    </button>
  )

  // 两个功能各有独立的新增路由，视听类型由路由决定
  const newHref = isVideo ? '/media/videos/new' : '/media/audios/new'

  return (
    <>
      <PageHeader
        breadcrumb={breadcrumbFor(pathname)}
        title={pageTitle}
        actions={
          <>
            <Button variant="outline" onClick={() => toast.success('列表已刷新')}>
              <RefreshCcw className="size-4" />
              刷新
            </Button>
            <Button onClick={() => router.push(newHref)}>
              <Plus className="size-4" />
              新增{isVideo ? '视频' : '音频'}
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
        <FilterField label="内容状态">
          <NativeSelect
            aria-label="内容状态"
            value={status}
            onChange={setStatus}
            options={['全部状态', ...MEDIA_STATUSES]}
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
          <Button size="sm" onClick={() => router.push(newHref)}>
            <Plus className="size-3.5" />
            新增
          </Button>
          {canPublish && (
            <Button
              size="sm"
              onClick={() =>
                ask(
                  '发布',
                  `仅草稿可发布，需已上传${isVideo ? '视频' : '音频'}且已有封面；发布后默认上架。请确认外部审批已完成。`,
                  () => publishMedia(table.selected, role.person),
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
              ask('上架', '仅已下架内容可重新上架。', () =>
                putMediaOnline(table.selected),
              )
            }
          >
            <ArrowUpFromLine className="size-3.5" />
            上架
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              ask('下架', '下架后用户端停止展示与播放，可随时重新上架。', () =>
                takeMediaOffline(table.selected),
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
              ask('置顶', '仅已发布内容可置顶。', () =>
                setMediaTop(table.selected, true),
              )
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
                setMediaTop(table.selected, false),
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
                removeMediaItems(table.selected),
              )
            }
          >
            <Trash2 className="size-3.5" />
            批量删除
          </Button>
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
              <TableHead className="w-20">时长</TableHead>
              <TableHead className="w-24">内容状态</TableHead>
              <TableHead className="w-24">是否置顶</TableHead>
              <TableHead className="w-24">创建人</TableHead>
              <TableHead className="w-44">发布时间</TableHead>
              <TableHead className="w-24">
                <SortHead label="排序" k="sort" />
              </TableHead>
              <TableHead className="w-24 text-right">
                <SortHead label="播放量" k="plays" />
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
              <TableEmpty
                colSpan={13}
                text={`没有符合条件的${isVideo ? '视频' : '音频'}内容`}
              />
            )}
            {table.pageRows.map((m, i) => (
              <TableRow key={m.id}>
                <TableCell className="pl-4 text-muted-foreground">
                  {(table.page - 1) * table.pageSize + i + 1}
                </TableCell>
                <TableCell>
                  <Checkbox
                    aria-label={`选择 ${m.title}`}
                    checked={table.selected.includes(m.id)}
                    onCheckedChange={(v) => table.toggleRow(m.id, Boolean(v))}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-10 w-16 shrink-0 items-center justify-center overflow-hidden rounded border border-border bg-muted text-muted-foreground">
                      {m.cover ? (
                        // 封面为手动上传（本地 blob 或静态图），统一用原生 img 渲染
                        <img
                          src={m.cover || '/placeholder.svg'}
                          alt={`${m.title}封面`}
                          className="absolute inset-0 size-full object-cover"
                        />
                      ) : isVideo ? (
                        <FileVideo className="size-4" />
                      ) : (
                        <AudioLines className="size-4" />
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => router.push(`/media/${m.id}`)}
                      className="max-w-72 truncate text-left text-brand hover:underline"
                      title={m.title}
                    >
                      {m.title}
                    </button>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {m.duration}
                </TableCell>
                <TableCell>
                  <StatusTag tone={statusTone(m.status)}>{m.status}</StatusTag>
                </TableCell>
                <TableCell>
                  {/* 是表示置顶，否表示不置顶 */}
                  <StatusTag tone={m.top ? 'danger' : 'neutral'}>
                    {m.top ? '是' : '否'}
                  </StatusTag>
                </TableCell>
                <TableCell>{m.author}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {m.publishedAt || '—'}
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={1}
                    aria-label={`${m.title} 排序号`}
                    value={m.sort}
                    className="h-7 w-16 px-2 text-xs"
                    onChange={(e) =>
                      setMediaSort(m.id, Number.parseInt(e.target.value, 10) || 1)
                    }
                  />
                </TableCell>
                <TableCell className="text-right">
                  {m.plays.toLocaleString('zh-CN')}
                </TableCell>
                <TableCell className="text-right">
                  {m.likes.toLocaleString('zh-CN')}
                </TableCell>
                <TableCell className="text-right">{m.commentCount}</TableCell>
                <TableCell className="pr-4">
                  <div className="flex items-center justify-center gap-0.5">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`编辑 ${m.title}`}
                      onClick={() => router.push(`/media/${m.id}`)}
                    >
                      <SquarePen />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`查看 ${m.title} 的评论`}
                      onClick={() =>
                        router.push(
                          `/media/comments?media=${encodeURIComponent(m.title)}`,
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
            {selectedRows.map((m) => (
              <li key={m.id} className="flex items-center gap-2 px-3 py-1.5">
                <span className="min-w-0 flex-1 truncate">{m.title}</span>
                <StatusTag tone={statusTone(m.status)}>{m.status}</StatusTag>
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
                setResultAction(confirm.action)
                setResults(confirm.run())
                table.clear()
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
