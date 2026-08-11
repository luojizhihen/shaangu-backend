'use client'

import * as React from 'react'
import { Suspense } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { BadgeCheck, Eye, EyeOff, RefreshCcw, Trash2 } from 'lucide-react'
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
import { GovernReasonDialog } from '@/components/forum/forum-dialogs'
import {
  FORUM_TYPES,
  FORUM_VISIBILITIES,
  hideForumComments,
  restoreForumComments,
  softDeleteForumComments,
  useForum,
  visibilityTone,
  type BatchResult,
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

const LEVEL_OPTIONS = ['全部层级', '一级评论', '二级回复']

function ForumCommentsView() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromPost = searchParams.get('post') ?? ''
  const { comments, posts } = useForum()
  const { role } = useApp()
  const actor = { person: role.person, role: role.name }

  const [postTitle, setPostTitle] = React.useState(fromPost)
  const [content, setContent] = React.useState('')
  const [person, setPerson] = React.useState('')
  const [type, setType] = React.useState('全部')
  const [level, setLevel] = React.useState('全部层级')
  const [visibility, setVisibility] = React.useState('全部展示状态')
  const [query, setQuery] = React.useState({
    postTitle: fromPost,
    content: '',
    person: '',
    type: '全部',
    level: '全部层级',
    visibility: '全部展示状态',
  })

  const [results, setResults] = React.useState<BatchResult[] | null>(null)
  const [resultAction, setResultAction] = React.useState('批量操作')
  const [govern, setGovern] = React.useState<{
    action: '隐藏' | '逻辑删除'
    ids: string[]
  } | null>(null)

  const rows = React.useMemo(
    () =>
      comments.filter((c) => {
        const hitPost = c.postTitle.includes(query.postTitle.trim())
        const hitContent = c.content.includes(query.content.trim())
        const kw = query.person.trim()
        const hitPerson = !kw || c.nickname.includes(kw) || c.author.includes(kw)
        const hitType = query.type === '全部' || c.postType === query.type
        const hitLevel =
          query.level === '全部层级' ||
          (query.level === '二级回复' ? c.parentId !== null : c.parentId === null)
        const hitVisibility =
          query.visibility === '全部展示状态' || c.visibility === query.visibility
        return hitPost && hitContent && hitPerson && hitType && hitLevel && hitVisibility
      }),
    [comments, query],
  )

  const table = useTableState(rows)

  function search() {
    setQuery({ postTitle, content, person, type, level, visibility })
    table.setPage(1)
  }

  function reset() {
    setPostTitle('')
    setContent('')
    setPerson('')
    setType('全部')
    setLevel('全部层级')
    setVisibility('全部展示状态')
    setQuery({
      postTitle: '',
      content: '',
      person: '',
      type: '全部',
      level: '全部层级',
      visibility: '全部展示状态',
    })
  }

  function show(action: string, list: BatchResult[]) {
    setResultAction(action)
    setResults(list)
    table.clear()
  }

  function askGovern(action: '隐藏' | '逻辑删除', ids: string[]) {
    if (ids.length === 0) {
      toast.error('请先勾选需要处理的评论或回复')
      return
    }
    setGovern({ action, ids })
  }

  function runRestore(ids: string[]) {
    if (ids.length === 0) {
      toast.error('请先勾选需要处理的评论或回复')
      return
    }
    show('恢复显示', restoreForumComments(ids, actor))
  }

  function openPost(id: string) {
    const target = posts.find((p) => p.id === id)
    if (!target) {
      toast.error('原帖不存在或已被移除')
      return
    }
    router.push(target.type === '投票' ? `/forum/polls/${id}` : `/forum/posts/${id}`)
  }

  const governTargets =
    govern?.ids.map((id) => {
      const c = comments.find((x) => x.id === id)
      return c ? `${c.parentId ? '回复' : '评论'}：${c.content.slice(0, 30)}` : id
    }) ?? []

  const hiddenCount = comments.filter((c) => c.visibility === '已隐藏').length
  const deletedCount = comments.filter((c) => c.visibility === '已删除').length

  return (
    <>
      <PageHeader
        breadcrumb={breadcrumbFor(pathname)}
        title="评论与回复管理"
        actions={
          <Button variant="outline" onClick={() => toast.success('列表已刷新')}>
            <RefreshCcw className="size-4" />
            刷新
          </Button>
        }
      />

      <p className="mb-4 rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-xs leading-relaxed text-muted-foreground">
        评论与回复仅支持隐藏、恢复与逻辑删除三类事后治理，不提供人工审核与物理删除。逻辑删除为软删除，原文与关联关系全部保留。
      </p>

      <FilterBar onSearch={search} onReset={reset}>
        <FilterField label="所属内容">
          <Input
            value={postTitle}
            placeholder="请输入所属帖子或投票标题"
            onChange={(e) => setPostTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) search()
            }}
          />
        </FilterField>
        <FilterField label="内容类型">
          <NativeSelect
            aria-label="内容类型"
            value={type}
            onChange={setType}
            options={['全部', ...FORUM_TYPES]}
          />
        </FilterField>
        <FilterField label="评论层级">
          <NativeSelect
            aria-label="评论层级"
            value={level}
            onChange={setLevel}
            options={LEVEL_OPTIONS}
          />
        </FilterField>
        <FilterField label="评论内容">
          <Input
            value={content}
            placeholder="请输入评论内容"
            onChange={(e) => setContent(e.target.value)}
          />
        </FilterField>
        <FilterField label="评论人">
          <Input
            value={person}
            placeholder="请输入昵称或员工姓名"
            onChange={(e) => setPerson(e.target.value)}
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
          <Button
            size="sm"
            variant="outline"
            onClick={() => askGovern('逻辑删除', table.selected)}
          >
            <Trash2 className="size-3.5" />
            批量逻辑删除
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">
            共 {comments.length} 条 · 已隐藏 {hiddenCount} 条 · 已逻辑删除 {deletedCount} 条
            · 已选 {table.selected.length} 条
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
              <TableHead className="min-w-56">所属内容</TableHead>
              <TableHead className="w-24">内容类型</TableHead>
              <TableHead className="w-20">层级</TableHead>
              <TableHead className="min-w-64">评论内容</TableHead>
              <TableHead className="w-32">评论人</TableHead>
              <TableHead className="w-28">所属部门</TableHead>
              <TableHead className="w-44">评论时间</TableHead>
              <TableHead className="w-24">展示状态</TableHead>
              <TableHead className="w-28 pr-4 text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.pageRows.length === 0 && (
              <TableEmpty colSpan={11} text="没有符合条件的评论或回复" />
            )}
            {table.pageRows.map((c, i) => {
              const hidden = c.visibility === '已隐藏'
              const deleted = c.visibility === '已删除'
              return (
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
                      title={c.postTitle}
                      onClick={() => openPost(c.postId)}
                      className="max-w-56 truncate text-left text-brand hover:underline"
                    >
                      {c.postTitle}
                    </button>
                  </TableCell>
                  <TableCell>
                    <StatusTag tone={c.postType === '投票' ? 'warning' : 'info'}>
                      {c.postType}
                    </StatusTag>
                  </TableCell>
                  <TableCell>
                    <StatusTag tone="neutral">{c.parentId ? '二级' : '一级'}</StatusTag>
                  </TableCell>
                  <TableCell>
                    <span className="line-clamp-2 whitespace-normal">{c.content}</span>
                    {(c.hiddenReason || c.deletedReason) && (
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        原因：{c.deletedReason || c.hiddenReason}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1">
                      {c.official && <BadgeCheck className="size-3.5 shrink-0 text-brand" />}
                      <span className="truncate">{c.nickname}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {c.author} · {c.personStatus}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.dept}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {c.createdAt}
                  </TableCell>
                  <TableCell>
                    <StatusTag tone={visibilityTone(c.visibility)}>
                      {c.visibility}
                    </StatusTag>
                  </TableCell>
                  <TableCell className="pr-4">
                    <div className="flex items-center justify-center gap-0.5">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={hidden ? '恢复显示' : '隐藏'}
                        disabled={deleted}
                        onClick={() =>
                          hidden ? runRestore([c.id]) : askGovern('隐藏', [c.id])
                        }
                      >
                        {hidden ? <Eye /> : <EyeOff />}
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label="逻辑删除"
                        disabled={deleted}
                        onClick={() => askGovern('逻辑删除', [c.id])}
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
              ? hideForumComments(govern.ids, reason, actor)
              : softDeleteForumComments(govern.ids, reason, actor)
          show(govern.action, list)
          setGovern(null)
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

export default function ForumCommentsPage() {
  return (
    <Suspense fallback={null}>
      <ForumCommentsView />
    </Suspense>
  )
}
