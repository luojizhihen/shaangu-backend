'use client'

import * as React from 'react'
import {
  ChevronLeft,
  Copy,
  MessageCircle,
  Paperclip,
  Star,
  ThumbsUp,
  Wifi,
} from 'lucide-react'
import { toast } from 'sonner'

import type { Attachment, NewsItem } from '@/lib/content-store'
import { RichText } from '@/components/content/rich-text-editor'
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

export type PreviewData = {
  title: string
  category: string
  summary: string
  body: string
  author: string
  dept: string
  publishedAt: string
  status: string
  attachments: Attachment[]
  /** 为真表示内容尚未发布，预览的是发布后的效果模拟 */
  simulated: boolean
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

/** 与 store 一致的时间戳格式 */
function nowStamp() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/**
 * 已发布 / 已下架内容：按 store 中的实际发布版本预览。
 */
export function previewFromItem(item: NewsItem): PreviewData {
  const unpublished = item.status === '草稿'
  return {
    title: item.title,
    category: item.category,
    summary: item.summary,
    body: item.body,
    author: item.author,
    dept: item.dept,
    // 尚未发布时用当前时间模拟发布后的展示效果
    publishedAt: item.publishedAt || (unpublished ? nowStamp() : ''),
    status: item.status,
    attachments: item.attachments,
    simulated: unpublished,
  }
}

/**
 * 编辑中 / 草稿：按当前表单数据预览，模拟保存或发布后的最终展示效果。
 */
export function previewFromForm(
  values: {
    title: string
    category: string
    summary: string
    body: string
    attachments: Attachment[]
  },
  meta: { author: string; dept: string; status: string; publishedAt?: string },
): PreviewData {
  return {
    title: values.title,
    category: values.category,
    summary: values.summary,
    body: values.body,
    author: meta.author,
    dept: meta.dept,
    publishedAt: meta.publishedAt || nowStamp(),
    status: meta.status,
    attachments: values.attachments,
    simulated: true,
  }
}

/** 互动控件仅展示样式，点击只作说明提示 */
function ActionButton({
  icon: Icon,
  label,
}: {
  icon: React.ElementType
  label: string
}) {
  return (
    <button
      type="button"
      onClick={() =>
        toast.info('预览模式：互动控件仅展示样式，不会产生阅读量、积分或统计数据', {
          id: 'preview-readonly',
        })
      }
      className="flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:text-brand"
    >
      <Icon className="size-4" />
      {label}
    </button>
  )
}

/**
 * 发布效果预览：以约 390×844 的移动端视口渲染 APP 端资讯详情页。
 * 纯展示，不改变任何状态、不产生阅读量与统计数据。
 */
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
      <DialogContent className="gap-3 sm:max-w-[452px]">
        <DialogHeader>
          <DialogTitle>预览</DialogTitle>
          <DialogDescription className="text-xs">
            {data?.simulated
              ? '发布后的 APP 端展示效果模拟，预览不改变发布状态。'
              : 'APP 端当前实际发布版本，预览不产生阅读量与统计。'}
          </DialogDescription>
        </DialogHeader>

        {data && (
          <div className="flex justify-center rounded-lg bg-nav/95 py-3">
            {/*
              移动端视口：宽 390，高度理想值 844。
              高度用 min() 直接算出确定值，不依赖父级百分比高度传递，
              屏高不足时自动压缩，内部正文区滚动。
            */}
            <div className="flex h-[min(844px,calc(100vh_-_18rem))] w-[390px] shrink-0 flex-col overflow-hidden rounded-[1.75rem] border-[6px] border-foreground/80 bg-surface">
              {/* 状态栏 */}
              <div className="flex shrink-0 items-center justify-between bg-surface px-5 pb-1 pt-2 text-[11px] font-medium text-foreground">
                <span>9:41</span>
                <span className="flex items-center gap-1">
                  <Wifi className="size-3" />
                  <span className="inline-block h-2.5 w-5 rounded-sm border border-foreground/60 pr-px">
                    <span className="block h-full w-3/4 rounded-[1px] bg-foreground/70" />
                  </span>
                </span>
              </div>

              {/* APP 导航栏 */}
              <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2.5">
                <ChevronLeft className="size-4 text-muted-foreground" aria-hidden />
                <span className="text-sm font-medium">资讯详情</span>
              </div>

              {/* 正文滚动区 */}
              <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-4 py-3.5">
                <h4 className="text-[17px] font-medium leading-relaxed text-pretty">
                  {data.title || '（未填写标题）'}
                </h4>

                <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                  <span className="rounded bg-accent px-1.5 py-0.5 text-brand">
                    {data.category}
                  </span>
                  <span>{data.dept}</span>
                  <span>·</span>
                  <span>{data.author}</span>
                  <span>·</span>
                  <span>{data.publishedAt}</span>
                </div>

                {/* 封面图仅用于列表与推荐位，不在详情正文中展示 */}

                {data.summary && (
                  <p className="mt-3 rounded-md bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                    {data.summary}
                  </p>
                )}

                <RichText html={data.body} className="mt-3" />

                {data.attachments.length > 0 && (
                  <div className="mt-4 border-t border-border pt-3">
                    <p className="mb-2 text-xs text-muted-foreground">
                      附件（{data.attachments.length}）
                    </p>
                    <ul className="space-y-1.5">
                      {data.attachments.map((a) => (
                        <li
                          key={a.id}
                          className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs"
                        >
                          <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1 truncate">{a.name}</span>
                          <span className="shrink-0 text-muted-foreground">{a.size}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="mt-5 text-center text-[11px] text-muted-foreground">
                  — 陕鼓融媒 —
                </p>
              </div>

              {/* 底部互动栏：仅样式 */}
              <div className="flex shrink-0 items-stretch border-t border-border bg-surface px-2 py-1">
                <ActionButton icon={ThumbsUp} label="点赞" />
                <ActionButton icon={Star} label="收藏" />
                <ActionButton icon={MessageCircle} label="评论" />
                <ActionButton icon={Copy} label="复制" />
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>关闭</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
