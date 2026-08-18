'use client'

import * as React from 'react'
import { Suspense } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { BadgeCheck, Eye, EyeOff } from 'lucide-react'
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
  const [visibility, setVisibility] = React.useState('全部展示状态')
  const [query, setQuery] = React.useState({
    postTitle: fromPost,
    content: '',
    person: '',
    type: '全部',
    visibility: '全部展示状态',
  })

  const [results, setResults] = React.useState<BatchResult[] | null>(null)
  const [resultAction, setResultAction] = React.useState('批量操作')
  const [govern, setGovern] = React.useState<{ action: '隐藏'; ids: string[] } | null>(
    null,
  )

  const rows = React.useMemo(
    () =>
      comments.filter((c) => {
        const hitPost = c.postTitle.includes(query.postTitle.trim())
        const hitContent = c.content.includes(query.content.trim())
        const kw = query.person.trim()
        const hitPerson = !kw || c.nickname.includes(kw)
        const hitType = query.type === '全部' || c.postType === query.type
        const hitVisibility =
          query.visibility === '全部展示状态' || c.visibility === query.visibility
        return hitPost && hitContent && hitPerson && hitType && hitVisibility
      }),
    [comments, query],
  )

  const table = useTableState(rows)

  function search() {
    setQuery({ postTitle, content, person, type, visibility })
    table.setPage(1)
  }

  function reset() {
    setPostTitle('')
    setContent('')
    setPerson('')
    setType('全部')
    setVisibility('全部展示状态')
    setQuery({
      postTitle: '',
      content: '',
      person: '',
      type: '全部',
      visibility: '全部展示状态',
    })
  }

  function show(action: string, list: BatchResult[]) {
    setResultAction(action)
    setResults(list)
    table.clear()
  }

  function askGovern(action: '隐藏', ids: string[]) {
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
      return c ? `${c.nickname}：${c.content.slice(0, 30)}` : id
    }) ?? []

  return (
    <>
      <PageHeader
        breadcrumb={breadcrumbFor(pathname)}
        title="评论与回复管理"
      />

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
            placeholder="请输入评论人昵称"
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
              <TableHead className="w-44">所属内容</TableHead>
              <TableHead className="w-20">内容类型</TableHead>
              <TableHead>评论内容</TableHead>
              <TableHead className="w-28">评论人昵称</TableHead>
              <TableHead className="w-28">评论时间</TableHead>
              <TableHead className="w-24">展示状态</TableHead>
              <TableHead className="w-20 pr-4 text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.pageRows.length === 0 && (
              <TableEmpty colSpan={9} text="没有符合条件的评论或回复" />
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
                      className="block w-40 truncate text-left text-brand hover:underline"
                    >
                      {c.postTitle}
                    </button>
                  </TableCell>
                  <TableCell>
                    <StatusTag tone={c.postType === '投票' ? 'warning' : 'info'}>
                      {c.postType}
                    </StatusTag>
                  </TableCell>
                  <TableCell className="min-w-48">
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
                      <span className="truncate" title={c.nickname}>
                        {c.nickname}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {c.personStatus}
                    </span>
                  </TableCell>
                  <TableCell
                    className="font-mono text-xs text-muted-foreground"
                    title={c.createdAt}
                  >
                    {c.createdAt.slice(0, 10)}
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
          show(govern.action, hideForumComments(govern.ids, reason, actor))
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
