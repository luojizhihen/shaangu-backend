'use client'

import { BadgeCheck, CalendarClock, ThumbsUp, Users } from 'lucide-react'

import type { PollMode, PollOptionMode } from '@/lib/forum-store'
import { RichText } from '@/components/content/rich-text-editor'
import { StatusTag } from '@/components/layout/page-frame'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export type ForumPreviewData = {
  type: '普通图文' | '投票'
  title: string
  body: string
  images: string[]
  cover: string
  official: boolean
  nickname: string
  dept: string
  poll?: {
    mode: PollMode
    optionMode: PollOptionMode
    deadline: string
    options: { id: string; label: string; image: string }[]
  }
}

/** 预览：按 APP 论坛阅读页渲染，不改变任何状态、不产生浏览与互动数据 */
export function ForumPreviewDialog({
  open,
  onOpenChange,
  data,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  data: ForumPreviewData | null
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>APP 论坛阅读预览</DialogTitle>
          <DialogDescription>
            预览按草稿态渲染，不产生浏览量、不改变发布状态，也不生成投票数据。
          </DialogDescription>
        </DialogHeader>

        {data && (
          <div className="scroll-thin max-h-[60vh] overflow-y-auto rounded-lg border border-border bg-page p-4">
            <div className="mx-auto max-w-sm rounded-lg bg-surface p-4 shadow-[0_1px_2px_rgba(23,32,43,0.06)]">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <StatusTag tone={data.type === '投票' ? 'warning' : 'info'}>
                  {data.type}
                </StatusTag>
                <StatusTag tone="neutral">草稿预览</StatusTag>
              </div>

              <h4 className="text-base leading-relaxed font-medium text-pretty">
                {data.title || '（未填写标题）'}
              </h4>

              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                {data.official && <BadgeCheck className="size-3.5 text-brand" />}
                <span>
                  {data.nickname} · {data.dept}
                </span>
              </p>

              {data.type === '投票' && data.cover && (
                <div className="relative mt-3 aspect-[16/9] overflow-hidden rounded-md">
                  {/* 本地上传的封面为 blob 地址，统一用原生 img 渲染 */}
                  <img
                    src={data.cover || '/placeholder.svg'}
                    alt={`${data.title || '投票'}封面`}
                    className="absolute inset-0 size-full object-cover"
                  />
                </div>
              )}

              <RichText html={data.body} className="mt-3" />

              {data.type === '普通图文' && data.images.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-1.5">
                  {data.images.map((src, i) => (
                    <div
                      key={`${src}-${i}`}
                      className="relative aspect-square overflow-hidden rounded"
                    >
                      <img
                        src={src || '/placeholder.svg'}
                        alt={`帖子图片 ${i + 1}`}
                        className="absolute inset-0 size-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              {data.type === '投票' && data.poll && (
                <div className="mt-3 rounded-md border border-border p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <StatusTag tone="info">{data.poll.mode}</StatusTag>
                    <span className="flex items-center gap-1">
                      <CalendarClock className="size-3.5" />
                      截止 {data.poll.deadline || '未设置'}
                    </span>
                  </div>
                  <ul className="grid gap-1.5">
                    {data.poll.options.map((o, i) => (
                      <li
                        key={o.id}
                        className="flex items-center gap-2 rounded border border-border px-2.5 py-2"
                      >
                        {data.poll?.optionMode === '图片' && (
                          <span className="relative size-10 shrink-0 overflow-hidden rounded bg-muted">
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
                          {o.label || `（选项 ${i + 1} 未填写）`}
                        </span>
                        <span className="size-4 shrink-0 rounded-full border border-input" />
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="size-3.5" />
                    参与人数与投票结果在发布后由用户端产生，发布即锁定
                  </p>
                </div>
              )}

              <div className="mt-4 flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ThumbsUp className="size-3.5" />点赞
                </span>
                <span>评论</span>
                <span className="ml-auto">论坛不分板块、不计积分</span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>关闭预览</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
