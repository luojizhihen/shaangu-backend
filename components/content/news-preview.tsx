'use client'

import Image from 'next/image'
import { Paperclip } from 'lucide-react'

import type { Attachment } from '@/lib/content-store'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { StatusTag } from '@/components/layout/page-frame'

export type PreviewData = {
  title: string
  category: string
  summary: string
  body: string
  cover: string
  author: string
  dept: string
  publishedAt: string
  status: string
  attachments: Attachment[]
}

/** 预览：按移动端阅读页样式渲染当前稿件，不改变任何状态 */
export function NewsPreviewDialog({
  open,
  onOpenChange,
  data,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  data: PreviewData | null
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>移动端阅读预览</DialogTitle>
          <DialogDescription>
            预览为草稿态渲染效果，不产生浏览量、不改变发布状态。
          </DialogDescription>
        </DialogHeader>

        {data && (
          <div className="scroll-thin max-h-[60vh] overflow-y-auto rounded-lg border border-border bg-page p-4">
            <div className="mx-auto max-w-sm rounded-lg bg-surface p-4 shadow-[0_1px_2px_rgba(23,32,43,0.06)]">
              <div className="mb-2 flex items-center gap-2">
                <StatusTag tone="info">{data.category}</StatusTag>
                <StatusTag tone="neutral">{data.status}</StatusTag>
              </div>
              <h4 className="text-base leading-relaxed font-medium text-pretty">
                {data.title || '（未填写标题）'}
              </h4>
              <p className="mt-2 text-xs text-muted-foreground">
                {data.dept} · {data.author}
                {data.publishedAt ? ` · ${data.publishedAt}` : ' · 尚未发布'}
              </p>

              {data.cover ? (
                <div className="relative mt-3 aspect-[16/9] overflow-hidden rounded-md">
                  <Image
                    src={data.cover || '/placeholder.svg'}
                    alt={`${data.title} 封面图`}
                    fill
                    sizes="384px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="mt-3 flex aspect-[16/9] items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
                  未设置封面图
                </div>
              )}

              {data.summary && (
                <p className="mt-3 rounded-md bg-muted px-3 py-2 text-[13px] leading-relaxed text-muted-foreground">
                  {data.summary}
                </p>
              )}

              <div className="mt-3 space-y-3 text-[13px] leading-relaxed text-foreground">
                {data.body.split('\n').filter(Boolean).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>

              {data.attachments.length > 0 && (
                <div className="mt-4 border-t border-border pt-3">
                  <p className="mb-2 text-xs text-muted-foreground">附件</p>
                  <ul className="space-y-1.5">
                    {data.attachments.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-[13px]"
                      >
                        <Paperclip className="size-3.5 text-muted-foreground" />
                        <span className="flex-1 truncate">{a.name}</span>
                        <span className="text-xs text-muted-foreground">{a.size}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
