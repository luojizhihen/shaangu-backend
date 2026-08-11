'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  BadgeCheck,
  Eye,
  EyeOff,
  FileText,
  Lock,
  MessageSquare,
  MessageSquareReply,
  Pin,
  PinOff,
  Plus,
  RefreshCcw,
  ScrollText,
  Trash2,
  Vote,
} from 'lucide-react'
import { toast } from 'sonner'

import { useApp } from '@/components/app-store'
import { NativeSelect, PageHeader, Panel, StatusTag } from '@/components/layout/page-frame'
import {
  FilterBar,
  FilterField,
  Pagination,
  TableEmpty,
  Toolbar,
  useTableState,
} from '@/components/content/table-shell'
import { BatchResultDialog } from '@/components/content/batch-result-dialog'
import { GovernReasonDialog, OfficialReplyDialog } from '@/components/forum/forum-dialogs'
import {
  FORUM_SOURCES,
  FORUM_TYPES,
  FORUM_VISIBILITIES,
  hideForumPosts,
  pollClosed,
  replyOfficial,
  restoreForumPosts,
  setForumPostTop,
  softDeleteForumPosts,
  statusTone,
  useForum,
  visibilityTone,
  type BatchResult,
  type ForumPost,
} from '@/lib/forum-store'
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

/** 投票内容管理只看投票帖，帖子管理看全部两类内容 */
export type ForumListScope = 'all' | 'poll'

const EMPTY_QUERY = {
  title: '',
  person: '',
  source: '全部',
  type: '全部',
  status: '全部状态',
  visibility: '全部展示状态',
}

export function ForumListView({ scope }: { scope: ForumListScope }) {
  const pathname = usePathname()
  const router = useRouter()
  const { posts } = useForum()
  const { role, allow } = useApp()
  const canPublish = allow('forum.publish')
  const isPoll = scope === 'poll'
  const actor = { person: role.person, role: role.name }

  const [title, setTitle] = React.useState('')
  const [person, setPerson] = React.useState('')
  const [source, setSource] = React.useState('全部')
  const [type, setType] = React.useState('全部')
  const [status, setStatus] = React.useState('全部状态')
  const [visibility, setVisibility] = React.useState('全部展示状态')
  const [query, setQuery] = React.useState(EMPTY_QUERY)

  const [results, setResults] = React.useState<BatchResult[] | null>(null)
  const [resultAction, setResultAction] = React.useState('批量操作')
  const [govern, setGovern] = React.useState<{
    action: '隐藏' | '逻辑删除'
    ids: string[]
  } | null>(null)
  const [reply, setReply] = React.useState<ForumPost | null>(null)

  const scoped = React.useMemo(
    () => (isPoll ? posts.filter((p) => p.type === '投票') : posts),
    [posts, isPoll],
  )

  const rows = React.useMemo(() => {
    const filtered = scoped.filter((p) => {
      const hitTitle = p.title.includes(query.title.trim())
      const kw = query.person.trim()
      const hitPerson = !kw || p.nickname.includes(kw) || p.author.includes(kw)
      // 发布来源与内容类型是两个完全独立的筛选维度
      const hitSource = query.source === '全部' || p.source === query.source
      const hitType = query.type === '全部' || p.type === query.type
      const hitStatus = query.status === '全部状态' || p.status === query.status
      const hitVisibility =
        query.visibility === '全部展示状态' || p.visibility === query.visibility
      return hitTitle && hitPerson && hitSource && hitType && hitStatus && hitVisibility
    })
    return [...filtered].sort((a, b) => {
      if (a.top !== b.top) return a.top ? -1 : 1
      return (b.publishedAt || b.createdAt).localeCompare(a.publishedAt || a.createdAt)
    })
  }, [scoped, query])

  const table = useTableState(rows)

  function search() {
    setQuery({ title, person, source, type, status, visibility })
    table.setPage(1)
  }

  function reset() {
    setTitle('')
    setPerson('')
    setSource('全部')
    setType('全部')
    setStatus('全部状态')
    setVisibility('全部展示状态')
    setQuery(EMPTY_QUERY)
  }

  function show(action: string, list: BatchResult[]) {
    setResultAction(action)
    setResults(list)
    table.clear()
  }

  function askGovern(action: '隐藏' | '逻辑删除', ids: string[]) {
    if (ids.length === 0) {
      toast.error('请先勾选需要处理的内容')
      return
    }
    setGovern({ action, ids })
  }

  function runTop(ids: string[], top: boolean) {
    if (ids.length === 0) {
      toast.error('请先勾选需要处理的内容')
      return
    }
    show(top ? '置顶' : '取消置顶', setForumPostTop(ids, top, actor))
  }

  function runRestore(ids: string[]) {
    if (ids.length === 0) {
      toast.error('请先勾选需要处理的内容')
      return
    }
    show('恢复显示', restoreForumPosts(ids, actor))
  }

  function detailHref(p: ForumPost) {
    return p.type === '投票' ? `/forum/polls/${p.id}` : `/forum/posts/${p.id}`
  }

  const governTargets =
    govern?.ids.map((id) => {
      const p = scoped.find((x) => x.id === id)
      return p ? `${p.title}（${p.type} · ${p.id}）` : id
    }) ?? []

  const publishedCount = scoped.filter((p) => p.status === '已发布').length
  const hiddenCount = scoped.filter((p) => p.visibility === '已隐藏').length
  const deletedCount = scoped.filter((p) => p.visibility === '已删除').length

  return (
    <>
      <PageHeader
        breadcrumb={breadcrumbFor(pathname)}
        title={isPoll ? '投票内容管理' : '帖子管理'}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => router.push('/forum/governance-logs')}
            >
              <ScrollText className="size-4" />
              治理日志
            </Button>
            <Button variant="outline" onClick={() => toast.success('列表已刷新')}>
              <RefreshCcw className="size-4" />
              刷新
            </Button>
            {canPublish && !isPoll && (
              <>
                <Button variant="outline" onClick={() => router.push('/forum/polls/new')}>
                  <Vote className="size-4" />
                  新建投票帖子
                </Button>
                <Button onClick={() => router.push('/forum/posts/new')}>
                  <Plus className="size-4" />
                  新建图文帖子
                </Button>
              </>
            )}
            {canPublish && isPoll && (
              <Button onClick={() => router.push('/forum/polls/new')}>
                <Plus className="size-4" />
                新建投票帖子
              </Button>
            )}
          </>
        }
      />

      <p className="mb-4 flex items-start gap-2 rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-xs leading-relaxed text-muted-foreground">
        <Lock className="mt-0.5 size-3.5 shrink-0" />
        已发布内容永久只读，不提供编辑、保存修改、撤回发布或退回草稿；投票发布后选项、单/多选、截止时间与结果全部锁定。事后治理仅支持隐藏、恢复、逻辑删除（软删除，保留原始内容与互动数据）、置顶、取消置顶与官方回复。
      </p>

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
        <FilterField label="发布来源">
          <NativeSelect
            aria-label="发布来源"
            value={source}
            onChange={setSource}
            options={['全部', ...FORUM_SOURCES]}
          />
        </FilterField>
        {!isPoll && (
          <FilterField label="内容类型">
            <NativeSelect
              aria-label="内容类型"
              value={type}
              onChange={setType}
              options={['全部', ...FORUM_TYPES]}
            />
          </FilterField>
        )}
        <FilterField label="发布状态">
          <NativeSelect
            aria-label="发布状态"
            value={status}
            onChange={setStatus}
            options={['全部状态', '草稿', '已发布']}
          />
        </FilterField>
        <FilterField label="展示状态">
          <NativeSelect
            aria-label="展示状态"
            value={visibility}
            onChange={setVisibility}
            options={['全部展示状态', ...FORUM_VISIBILITIES]}
          />
        </FilterField>
        <FilterField label="发帖人">
          <Input
            value={person}
            placeholder="请输入昵称或员工姓名"
            onChange={(e) => setPerson(e.target.value)}
          />
        </FilterField>
      </FilterBar>

      <Panel bodyClassName="p-0">
        <Toolbar>
          <Button
            size="sm"
            variant="outline"
            onClick={() => askGovern('隐藏', table.selected)}
          >
            <EyeOff className="size-3.5" />
            批量隐藏
          </Button>
          <Button size="sm" variant="outline" onClick={() => runRestore(table.selected)}>
            <Eye className="size-3.5" />
            批量恢复
          </Button>
          <Button size="sm" variant="outline" onClick={() => runTop(table.selected, true)}>
            <Pin className="size-3.5" />
            批量置顶
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => runTop(table.selected, false)}
          >
            <PinOff className="size-3.5" />
            取消置顶
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => askGovern('逻辑删除', table.selected)}
          >
            <Trash2 className="size-3.5" />
            批量逻辑删除
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">
            共 {scoped.length} 条 · 已发布 {publishedCount} 条 · 已隐藏 {hiddenCount} 条 ·
            已逻辑删除 {deletedCount} 条 · 已选 {table.selected.length} 条
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
              {!isPoll && <TableHead className="w-24">内容类型</TableHead>}
              <TableHead className="w-28">发布来源</TableHead>
              <TableHead className="w-32">发帖人</TableHead>
              <TableHead className="w-24">发布状态</TableHead>
              <TableHead className="w-24">展示状态</TableHead>
              <TableHead className="w-20">置顶</TableHead>
              <TableHead className="w-44">发布时间</TableHead>
              <TableHead className="w-20 text-right">浏览</TableHead>
              <TableHead className="w-20 text-right">点赞</TableHead>
              <TableHead className="w-20 text-right">
                {isPoll ? '参与' : '评论'}
              </TableHead>
              <TableHead className="w-44 pr-4 text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.pageRows.length === 0 && (
              <TableEmpty
                colSpan={isPoll ? 13 : 14}
                text={isPoll ? '没有符合条件的投票内容' : '没有符合条件的帖子'}
              />
            )}
            {table.pageRows.map((p, i) => {
              const published = p.status === '已发布'
              const deleted = p.visibility === '已删除'
              const hidden = p.visibility === '已隐藏'
              return (
                <TableRow key={p.id}>
                  <TableCell className="pl-4 text-muted-foreground">
                    {(table.page - 1) * table.pageSize + i + 1}
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      aria-label={`选择 ${p.title}`}
                      checked={table.selected.includes(p.id)}
                      onCheckedChange={(v) => table.toggleRow(p.id, Boolean(v))}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {p.official && (
                        <BadgeCheck
                          className="size-3.5 shrink-0 text-brand"
                          aria-label="官方发布"
                        />
                      )}
                      <button
                        type="button"
                        title={p.title}
                        onClick={() => router.push(detailHref(p))}
                        className="max-w-72 truncate text-left text-brand hover:underline"
                      >
                        {p.title}
                      </button>
                      {p.officialReply && (
                        <StatusTag tone="info">已官方回复</StatusTag>
                      )}
                      {p.type === '投票' && p.poll && published && (
                        <StatusTag tone={pollClosed(p.poll) ? 'neutral' : 'success'}>
                          {pollClosed(p.poll) ? '已截止' : '进行中'}
                        </StatusTag>
                      )}
                    </div>
                  </TableCell>
                  {!isPoll && (
                    <TableCell>
                      <StatusTag tone={p.type === '投票' ? 'warning' : 'info'}>
                        {p.type}
                      </StatusTag>
                    </TableCell>
                  )}
                  <TableCell>
                    <StatusTag tone={p.source === '管理端发布' ? 'info' : 'neutral'}>
                      {p.source}
                    </StatusTag>
                  </TableCell>
                  <TableCell>
                    <span className="block truncate" title={`${p.nickname} / ${p.author}`}>
                      {p.nickname}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {p.author} · {p.dept}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusTag tone={statusTone(p.status)}>{p.status}</StatusTag>
                  </TableCell>
                  <TableCell>
                    <StatusTag tone={visibilityTone(p.visibility)}>
                      {p.visibility}
                    </StatusTag>
                  </TableCell>
                  <TableCell>
                    <StatusTag tone={p.top ? 'danger' : 'neutral'}>
                      {p.top ? '是' : '否'}
                    </StatusTag>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {p.publishedAt || '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    {p.views.toLocaleString('zh-CN')}
                  </TableCell>
                  <TableCell className="text-right">
                    {p.likes.toLocaleString('zh-CN')}
                  </TableCell>
                  <TableCell className="text-right">
                    {isPoll ? (p.poll?.participants ?? 0) : p.commentCount}
                  </TableCell>
                  <TableCell className="pr-4">
                    <div className="flex items-center justify-center gap-0.5">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`查看 ${p.title}`}
                        onClick={() => router.push(detailHref(p))}
                      >
                        <FileText />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={hidden ? `恢复 ${p.title}` : `隐藏 ${p.title}`}
                        disabled={!published || deleted}
                        onClick={() =>
                          hidden ? runRestore([p.id]) : askGovern('隐藏', [p.id])
                        }
                      >
                        {hidden ? <Eye /> : <EyeOff />}
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={p.top ? `取消置顶 ${p.title}` : `置顶 ${p.title}`}
                        disabled={!published || deleted || hidden}
                        onClick={() => runTop([p.id], !p.top)}
                      >
                        {p.top ? <PinOff /> : <Pin />}
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`对 ${p.title} 官方回复`}
                        disabled={!published || deleted}
                        onClick={() => setReply(p)}
                      >
                        <MessageSquareReply />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`查看 ${p.title} 的评论`}
                        onClick={() =>
                          router.push(
                            `/forum/comments?post=${encodeURIComponent(p.title)}`,
                          )
                        }
                      >
                        <MessageSquare />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`逻辑删除 ${p.title}`}
                        disabled={deleted}
                        onClick={() => askGovern('逻辑删除', [p.id])}
                      >
                        <Trash2 />
                      </Button>
                    </div>
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

      <GovernReasonDialog
        open={govern !== null}
        onOpenChange={(v) => !v && setGovern(null)}
        action={govern?.action ?? '隐藏'}
        targets={governTargets}
        onConfirm={(reason) => {
          if (!govern) return
          const list =
            govern.action === '隐藏'
              ? hideForumPosts(govern.ids, reason, actor)
              : softDeleteForumPosts(govern.ids, reason, actor)
          show(govern.action, list)
          setGovern(null)
        }}
      />

      <OfficialReplyDialog
        open={reply !== null}
        onOpenChange={(v) => !v && setReply(null)}
        postTitle={reply?.title ?? ''}
        existing={reply?.officialReply?.content}
        onConfirm={(content) => {
          if (!reply) return
          const res = replyOfficial(reply.id, content, actor)
          toast[res.ok ? 'success' : 'error'](res.message)
          if (res.ok) setReply(null)
        }}
      />

      <BatchResultDialog
        open={results !== null}
        onOpenChange={(v) => !v && setResults(null)}
        action={resultAction}
        results={results ?? []}
      />
    </>
  )
}
