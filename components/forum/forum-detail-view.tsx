'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  Eye,
  EyeOff,
  Lock,
  MessageSquare,
  MessageSquareReply,
  Pin,
  PinOff,
  Send,
  Trash2,
  Users,
  Vote,
} from 'lucide-react'
import { toast } from 'sonner'

import { useApp } from '@/components/app-store'
import { PageHeader, Panel, StatusTag } from '@/components/layout/page-frame'
import { RichText } from '@/components/content/rich-text-editor'
import { BatchResultDialog } from '@/components/content/batch-result-dialog'
import {
  GovernReasonDialog,
  InfoRow,
  OfficialReplyDialog,
} from '@/components/forum/forum-dialogs'
import {
  hideForumPosts,
  pollClosed,
  publishForumDraft,
  replyOfficial,
  restoreForumPosts,
  setForumPostTop,
  softDeleteForumPosts,
  statusTone,
  useForum,
  visibilityTone,
  type BatchResult,
  type ForumContentType,
} from '@/lib/forum-store'
import { Button } from '@/components/ui/button'

/** 帖子与投票共用的只读详情页：不提供编辑、保存修改、撤回发布或退回草稿 */
export function ForumDetailView({
  id,
  expect,
}: {
  id: string
  expect: ForumContentType
}) {
  const router = useRouter()
  const { posts, comments, logs } = useForum()
  const { role, allow } = useApp()
  const actor = { person: role.person, role: role.name }
  const canPublish = allow('forum.publish')

  const post = posts.find((p) => p.id === id)
  const [govern, setGovern] = React.useState<'隐藏' | '逻辑删除' | null>(null)
  const [replyOpen, setReplyOpen] = React.useState(false)
  const [results, setResults] = React.useState<BatchResult[] | null>(null)
  const [resultAction, setResultAction] = React.useState('操作')

  const backHref = expect === '投票' ? '/forum/polls' : '/forum/posts'

  if (!post) {
    return (
      <>
        <PageHeader
          breadcrumb={['论坛管理', '帖子管理', '内容详情']}
          title="内容详情"
        />
        <Panel title="未找到内容">
          <p className="text-[13px] text-muted-foreground">
            未找到 ID 为 {id} 的内容，可能已被移除或链接有误。
          </p>
          <Button variant="outline" className="mt-3" onClick={() => router.push(backHref)}>
            <ArrowLeft className="size-4" />
            返回列表
          </Button>
        </Panel>
      </>
    )
  }

  const isPoll = post.type === '投票'
  const published = post.status === '已发布'
  const deleted = post.visibility === '已删除'
  const hidden = post.visibility === '已隐藏'
  const postComments = comments.filter((c) => c.postId === post.id)
  const history = logs.filter((l) => l.objectId === post.id)
  const totalVotes = post.poll?.options.reduce((s, o) => s + o.votes, 0) ?? 0

  function show(action: string, list: BatchResult[]) {
    setResultAction(action)
    setResults(list)
  }

  return (
    <>
      <PageHeader
        breadcrumb={[
          '论坛管理',
          '帖子管理',
          isPoll ? '投票内容详情' : '帖子详情',
        ]}
        title={post.title}
        actions={
          <>
            <Button variant="outline" onClick={() => router.push(backHref)}>
              <ArrowLeft className="size-4" />
              返回列表
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/forum/comments?post=${encodeURIComponent(post.title)}`)
              }
            >
              <MessageSquare className="size-4" />
              查看评论（{postComments.length}）
            </Button>
            {!published && canPublish && (
              <Button
                onClick={() => {
                  const res = publishForumDraft(post.id, actor)
                  toast[res.ok ? 'success' : 'error'](res.message)
                  if (!res.ok && res.issues.length > 0) {
                    show(
                      '草稿发布校验',
                      res.issues.map((issue, i) => ({
                        id: `${issue.field}-${i}`,
                        label: issue.field,
                        ok: false,
                        message: issue.message,
                      })),
                    )
                  }
                }}
              >
                <Send className="size-4" />
                直接发布
              </Button>
            )}
          </>
        }
      />

      {published ? (
        <p className="mb-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/8 px-4 py-2.5 text-xs leading-relaxed text-warning">
          <Lock className="mt-0.5 size-3.5 shrink-0" />
          该内容已发布，永久只读：没有编辑、保存修改、撤回发布或退回草稿。
          {isPoll &&
            '投票选项、单/多选、截止时间与投票结果全部锁定，不可修改、不可清空、不可延期。'}
          需要修正时只能隐藏或逻辑删除本帖，再从新建入口重新发布；新帖生成新 ID，浏览、点赞、评论
          {isPoll && '、参与人数与投票结果'}均不迁移。
        </p>
      ) : (
        <p className="mb-4 flex items-start gap-2 rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-xs leading-relaxed text-muted-foreground">
          <Lock className="mt-0.5 size-3.5 shrink-0" />
          当前为草稿，尚未对员工可见。校验通过后可直接发布，不经过人工审核；一经发布即永久只读。
        </p>
      )}

      <div className="grid gap-4 pb-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-4">
          <Panel
            title={isPoll ? '投票内容（只读）' : '帖子内容（只读）'}
            extra={
              <div className="flex items-center gap-1.5">
                <StatusTag tone={isPoll ? 'warning' : 'info'}>{post.type}</StatusTag>
                <StatusTag tone={statusTone(post.status)}>{post.status}</StatusTag>
                <StatusTag tone={visibilityTone(post.visibility)}>
                  {post.visibility}
                </StatusTag>
              </div>
            }
          >
            <h3 className="text-base leading-relaxed font-medium text-pretty">
              {post.title}
            </h3>
            <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              {post.official && <BadgeCheck className="size-3.5 text-brand" />}
              <span>{post.nickname}</span>
              <span>·</span>
              <span>
                {post.author}（{post.employeeNo}） · {post.dept}
              </span>
              <StatusTag tone={post.personStatus === '在职' ? 'success' : 'neutral'}>
                {post.personStatus}
              </StatusTag>
            </p>

            {isPoll && post.cover && (
              <div className="relative mt-3 aspect-[16/9] max-w-lg overflow-hidden rounded-md border border-border">
                {/* 封面可能来自本地上传，统一使用原生 img */}
                <img
                  src={post.cover || '/placeholder.svg'}
                  alt={`${post.title}封面`}
                  className="absolute inset-0 size-full object-cover"
                />
              </div>
            )}

            <RichText html={post.body} className="mt-3" />

            {!isPoll && post.images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {post.images.map((src, i) => (
                  <div
                    key={`${src}-${i}`}
                    className="relative aspect-[4/3] overflow-hidden rounded-md border border-border"
                  >
                    <img
                      src={src || '/placeholder.svg'}
                      alt={`${post.title} 图片 ${i + 1}`}
                      className="absolute inset-0 size-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {isPoll && post.poll && (
            <Panel
              title="投票设置与结果（发布后锁定）"
              extra={
                <StatusTag tone={pollClosed(post.poll) ? 'neutral' : 'success'}>
                  {published ? (pollClosed(post.poll) ? '已截止' : '进行中') : '未发布'}
                </StatusTag>
              }
            >
              <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Vote className="size-3.5" />
                  {post.poll.mode} · {post.poll.optionMode}选项
                </span>
                <span className="flex items-center gap-1">
                  <CalendarClock className="size-3.5" />
                  截止 {post.poll.deadline}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="size-3.5" />
                  参与 {post.poll.participants.toLocaleString('zh-CN')} 人 · 累计{' '}
                  {totalVotes.toLocaleString('zh-CN')} 票
                </span>
              </div>

              <ul className="grid gap-2">
                {post.poll.options.map((o, i) => {
                  const pct = totalVotes > 0 ? Math.round((o.votes / totalVotes) * 100) : 0
                  return (
                    <li key={o.id} className="rounded-md border border-border p-2.5">
                      <div className="flex items-center gap-2">
                        {post.poll?.optionMode === '图片' && (
                          <span className="relative size-12 shrink-0 overflow-hidden rounded bg-muted">
                            {o.image && (
                              <img
                                src={o.image || '/placeholder.svg'}
                                alt={`选项 ${i + 1} 图片`}
                                className="absolute inset-0 size-full object-cover"
                              />
                            )}
                          </span>
                        )}
                        <span className="min-w-0 flex-1 truncate text-[13px]">
                          {o.label}
                        </span>
                        <span className="shrink-0 font-mono text-xs text-muted-foreground">
                          {o.votes.toLocaleString('zh-CN')} 票 · {pct}%
                        </span>
                      </div>
                      <div
                        className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
                        role="presentation"
                      >
                        <div
                          className="h-full rounded-full bg-brand"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>

              <p className="mt-3 flex items-start gap-2 rounded-md border border-warning/30 bg-warning/8 px-3 py-2 text-xs leading-relaxed text-warning">
                <Lock className="mt-0.5 size-3.5 shrink-0" />
                选项内容、选项形式、单/多选与截止时间已锁定；投票结果不可修改、不可清空、不可重置。
              </p>
            </Panel>
          )}

          {post.officialReply && (
            <Panel title="官方回复">
              <div className="rounded-md border border-brand/25 bg-brand/6 px-3 py-2.5">
                <p className="text-[13px] leading-relaxed">{post.officialReply.content}</p>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {post.officialReply.operator} · {post.officialReply.at}
                </p>
              </div>
            </Panel>
          )}

          <Panel title={`治理记录（${history.length}）`}>
            {history.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">该内容暂无治理记录。</p>
            ) : (
              <ul className="grid gap-2">
                {history.map((l) => (
                  <li key={l.id} className="rounded-md border border-border px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusTag tone="info">{l.action}</StatusTag>
                      <span className="text-xs text-muted-foreground">
                        {l.operator}（{l.role}） · {l.at}
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed">原因：{l.reason}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {l.before} → {l.after}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="grid gap-4 self-start">
          <Panel title="内容信息">
            <InfoRow label="内容 ID" value={<span className="font-mono">{post.id}</span>} />
            <InfoRow label="内容类型" value={post.type} />
            <InfoRow label="发布来源" value={post.source} />
            <InfoRow label="发布状态" value={post.status} />
            <InfoRow label="展示状态" value={post.visibility} />
            <InfoRow label="是否置顶" value={post.top ? '是' : '否'} />
            <InfoRow label="创建时间" value={post.createdAt} />
            <InfoRow label="发布时间" value={post.publishedAt || '—'} />
            {post.hiddenReason && <InfoRow label="隐藏原因" value={post.hiddenReason} />}
            {post.deletedReason && (
              <InfoRow label="逻辑删除原因" value={post.deletedReason} />
            )}
          </Panel>

          <Panel title="互动数据（只读）">
            <InfoRow label="浏览量" value={post.views.toLocaleString('zh-CN')} />
            <InfoRow label="点赞量" value={post.likes.toLocaleString('zh-CN')} />
            <InfoRow label="评论量" value={post.commentCount} />
            {isPoll && post.poll && (
              <>
                <InfoRow
                  label="参与人数"
                  value={post.poll.participants.toLocaleString('zh-CN')}
                />
                <InfoRow label="累计票数" value={totalVotes.toLocaleString('zh-CN')} />
              </>
            )}
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              逻辑删除为软删除，上述互动数据{isPoll && '与投票结果'}
              全部保留；重新发布的新内容从零开始统计。
            </p>
          </Panel>

          <Panel title="事后治理">
            <div className="grid gap-2">
              {hidden ? (
                <Button
                  variant="outline"
                  disabled={deleted}
                  onClick={() => show('恢复显示', restoreForumPosts([post.id], actor))}
                >
                  <Eye className="size-4" />
                  恢复显示
                </Button>
              ) : (
                <Button
                  variant="outline"
                  disabled={!published || deleted}
                  onClick={() => setGovern('隐藏')}
                >
                  <EyeOff className="size-4" />
                  隐藏
                </Button>
              )}
              <Button
                variant="outline"
                disabled={!published || deleted || hidden}
                onClick={() =>
                  show(
                    post.top ? '取消置顶' : '置顶',
                    setForumPostTop([post.id], !post.top, actor),
                  )
                }
              >
                {post.top ? <PinOff className="size-4" /> : <Pin className="size-4" />}
                {post.top ? '取消置顶' : '置顶'}
              </Button>
              <Button
                variant="outline"
                disabled={!published || deleted}
                onClick={() => setReplyOpen(true)}
              >
                <MessageSquareReply className="size-4" />
                {post.officialReply ? '更新官方回复' : '官方回复'}
              </Button>
              <Button
                variant="destructive"
                disabled={deleted}
                onClick={() => setGovern('逻辑删除')}
              >
                <Trash2 className="size-4" />
                逻辑删除
              </Button>
              <p className="text-xs leading-relaxed text-muted-foreground">
                逻辑删除为软删除，不做物理删除；所有治理操作均记录操作人、时间与原因。
              </p>
            </div>
          </Panel>
        </div>
      </div>

      <GovernReasonDialog
        open={govern !== null}
        onOpenChange={(v) => !v && setGovern(null)}
        action={govern ?? '隐藏'}
        targets={[`${post.title}（${post.type} · ${post.id}）`]}
        onConfirm={(reason) => {
          if (!govern) return
          const list =
            govern === '隐藏'
              ? hideForumPosts([post.id], reason, actor)
              : softDeleteForumPosts([post.id], reason, actor)
          show(govern, list)
          setGovern(null)
        }}
      />

      <OfficialReplyDialog
        open={replyOpen}
        onOpenChange={setReplyOpen}
        postTitle={post.title}
        existing={post.officialReply?.content}
        onConfirm={(content) => {
          const res = replyOfficial(post.id, content, actor)
          toast[res.ok ? 'success' : 'error'](res.message)
          if (res.ok) setReplyOpen(false)
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
