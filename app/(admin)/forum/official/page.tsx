'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ExternalLink, Lock, ShieldCheck } from 'lucide-react'

import {
  FilterBar,
  FilterField,
  Pagination,
  TableEmpty,
  useTableState,
} from '@/components/content/table-shell'
import {
  NativeSelect,
  PageHeader,
  Panel,
  StatusTag,
} from '@/components/layout/page-frame'
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
import {
  FORUM_TYPES,
  plainText,
  useForum,
  visibilityTone,
  type ForumPost,
} from '@/lib/forum-store'

const EMPTY = { keyword: '', type: '全部' }

/** 官方账号发布的帖子/投票，以及挂在员工帖下的官方回复，统一只读汇总 */
export default function ForumOfficialPage() {
  const router = useRouter()
  const { posts } = useForum()

  const [keyword, setKeyword] = React.useState('')
  const [type, setType] = React.useState('全部')
  const [query, setQuery] = React.useState(EMPTY)

  const officialPosts = React.useMemo(
    () =>
      posts
        .filter((p) => p.official && p.status === '已发布')
        .filter((p) => {
          const hitKeyword =
            p.title.includes(query.keyword.trim()) ||
            p.id.includes(query.keyword.trim())
          const hitType = query.type === '全部' || p.type === query.type
          return hitKeyword && hitType
        })
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
    [posts, query],
  )

  const replies = React.useMemo(
    () =>
      posts
        .filter((p) => p.officialReply)
        .filter((p) => {
          const kw = query.keyword.trim()
          const hitKeyword =
            p.title.includes(kw) ||
            p.id.includes(kw) ||
            (p.officialReply?.content ?? '').includes(kw)
          const hitType = query.type === '全部' || p.type === query.type
          return hitKeyword && hitType
        })
        .sort((a, b) =>
          (b.officialReply?.at ?? '').localeCompare(a.officialReply?.at ?? ''),
        ),
    [posts, query],
  )

  const postTable = useTableState(officialPosts)
  const replyTable = useTableState(replies)

  function search() {
    setQuery({ keyword, type })
  }

  function reset() {
    setKeyword('')
    setType('全部')
    setQuery(EMPTY)
  }

  function detailPath(p: ForumPost) {
    return p.type === '投票' ? `/forum/polls/${p.id}` : `/forum/posts/${p.id}`
  }

  return (
    <>
      <PageHeader
        breadcrumb={['论坛管理', '官方内容']}
        title="官方内容"
        actions={
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push('/forum/posts/new')}
            >
              新建官方图文
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push('/forum/polls/new')}
            >
              新建官方投票
            </Button>
          </>
        }
      />

      <p className="mb-3 flex items-start gap-2 rounded-md border border-brand/25 bg-brand/6 px-3 py-2 text-xs leading-relaxed text-brand">
        <Lock className="mt-0.5 size-3.5 shrink-0" />
        官方帖与官方投票发布后永久只读，本页仅用于查看与追溯。需要修正时请在帖子管理中隐藏或逻辑删除原帖，再从新建入口重新发布。
      </p>

      <FilterBar onSearch={search} onReset={reset}>
        <FilterField label="标题/ID">
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="标题、内容 ID 或回复内容"
            className="h-8"
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
      </FilterBar>

      <Panel
        title="官方账号发布"
        extra={
          <span className="text-xs text-muted-foreground">
            共 {officialPosts.length} 条
          </span>
        }
        bodyClassName="p-0"
      >
        <Table className="text-[13px]">
          <TableHeader>
            <TableRow className="bg-muted/60">
              <TableHead className="w-36 pl-4">内容 ID</TableHead>
              <TableHead>标题</TableHead>
              <TableHead className="w-20">类型</TableHead>
              <TableHead className="w-24">可见状态</TableHead>
              <TableHead className="w-16">置顶</TableHead>
              <TableHead className="w-28">发布时间</TableHead>
              <TableHead className="w-32">互动</TableHead>
              <TableHead className="w-16 pr-4 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {postTable.pageRows.length === 0 && (
              <TableEmpty colSpan={8} text="暂无官方发布内容" />
            )}
            {postTable.pageRows.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="pl-4 font-mono text-xs">{p.id}</TableCell>
                <TableCell>
                  <Link
                    href={detailPath(p)}
                    className="line-clamp-1 whitespace-normal text-brand hover:underline"
                  >
                    {p.title}
                  </Link>
                  <p className="mt-0.5 line-clamp-1 whitespace-normal text-xs text-muted-foreground">
                    {plainText(p.body)}
                  </p>
                </TableCell>
                <TableCell>
                  <StatusTag tone={p.type === '投票' ? 'warning' : 'info'}>
                    {p.type}
                  </StatusTag>
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
                  {p.publishedAt.slice(0, 10)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {p.type === '投票'
                    ? `参与 ${p.poll?.participants ?? 0} · 评论 ${p.commentCount}`
                    : `浏览 ${p.views} · 评论 ${p.commentCount}`}
                </TableCell>
                <TableCell className="pr-4 text-right">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`查看 ${p.title}`}
                    onClick={() => router.push(detailPath(p))}
                  >
                    <ExternalLink />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Pagination
          total={officialPosts.length}
          page={postTable.page}
          pageSize={postTable.pageSize}
          onPageChange={postTable.setPage}
          onPageSizeChange={postTable.setPageSize}
        />
      </Panel>

      <Panel
        title="官方回复记录"
        className="mt-4"
        extra={
          <span className="text-xs text-muted-foreground">
            共 {replies.length} 条
          </span>
        }
        bodyClassName="p-0"
      >
        <Table className="text-[13px]">
          <TableHeader>
            <TableRow className="bg-muted/60">
              <TableHead className="w-36 pl-4">原帖 ID</TableHead>
              <TableHead className="w-48">原帖标题</TableHead>
              <TableHead className="min-w-56">官方回复内容</TableHead>
              <TableHead className="w-24">回复人</TableHead>
              <TableHead className="w-28">回复时间</TableHead>
              <TableHead className="w-16 pr-4 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {replyTable.pageRows.length === 0 && (
              <TableEmpty colSpan={6} text="暂无官方回复记录" />
            )}
            {replyTable.pageRows.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="pl-4 font-mono text-xs">{p.id}</TableCell>
                <TableCell>
                  <Link
                    href={detailPath(p)}
                    className="line-clamp-2 whitespace-normal text-brand hover:underline"
                  >
                    {p.title}
                  </Link>
                </TableCell>
                <TableCell>
                  <span className="flex items-start gap-1.5 leading-relaxed">
                    <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-brand" />
                    <span className="line-clamp-2 whitespace-normal">
                      {p.officialReply?.content}
                    </span>
                  </span>
                </TableCell>
                <TableCell>{p.officialReply?.operator}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {p.officialReply?.at.slice(0, 10)}
                </TableCell>
                <TableCell className="pr-4 text-right">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`查看 ${p.title} 的官方回复`}
                    onClick={() => router.push(detailPath(p))}
                  >
                    <ExternalLink />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Pagination
          total={replies.length}
          page={replyTable.page}
          pageSize={replyTable.pageSize}
          onPageChange={replyTable.setPage}
          onPageSizeChange={replyTable.setPageSize}
        />
      </Panel>
    </>
  )
}
