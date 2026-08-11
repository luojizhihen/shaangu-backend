'use client'

import * as React from 'react'
import Image from 'next/image'
import { Paperclip, Trash2, Upload } from 'lucide-react'

import {
  IMAGE_LIBRARY,
  NOTICE_CATEGORY,
  type Attachment,
  type Category,
} from '@/lib/content-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Panel, NativeSelect } from '@/components/layout/page-frame'
import { cn } from '@/lib/utils'

export type NewsFormValues = {
  title: string
  category: string
  summary: string
  body: string
  cover: string
  sort: number
  top: boolean
  allowComment: boolean
  attachments: Attachment[]
}

export const EMPTY_NEWS_FORM: NewsFormValues = {
  title: '',
  category: '要闻',
  summary: '',
  body: '',
  cover: '',
  sort: 99,
  top: false,
  allowComment: true,
  attachments: [],
}

function FormRow({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-[104px_1fr] sm:items-start sm:gap-3">
      <span className="pt-1.5 text-[13px] text-muted-foreground sm:text-right">
        {required && <span className="text-destructive">*</span>}
        {label}
      </span>
      <div className="min-w-0">
        {children}
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  )
}

export function NewsForm({
  values,
  onChange,
  categories,
}: {
  values: NewsFormValues
  onChange: (patch: Partial<NewsFormValues>) => void
  categories: Category[]
}) {
  const fileRef = React.useRef<HTMLInputElement>(null)
  const current = categories.find((c) => c.name === values.category)
  const attachmentEnabled = Boolean(current?.withAttachment)
  const isNotice = values.category === NOTICE_CATEGORY

  function addFiles(files: FileList | null) {
    if (!files?.length) return
    const added: Attachment[] = Array.from(files).map((f, i) => ({
      id: `ATT-${Date.now()}-${i}`,
      name: f.name,
      size:
        f.size > 1024 * 1024
          ? `${(f.size / 1024 / 1024).toFixed(1)} MB`
          : `${Math.max(1, Math.round(f.size / 1024))} KB`,
    }))
    onChange({ attachments: [...values.attachments, ...added] })
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Panel title="正文内容">
        <div className="grid gap-4">
          <FormRow label="标题" required>
            <Input
              value={values.title}
              maxLength={80}
              placeholder="请输入资讯标题（不超过 80 字）"
              onChange={(e) => onChange({ title: e.target.value })}
            />
          </FormRow>

          <FormRow
            label="资讯类目"
            required
            hint={
              isNotice
                ? '“通知”属于资讯类目，在此维护正文与附件；与运营服务中的站内消息完全分开，两者互不影响。'
                : undefined
            }
          >
            <NativeSelect
              aria-label="资讯类目"
              value={values.category}
              onChange={(v) => onChange({ category: v })}
              options={categories.map((c) => c.name)}
              className="sm:w-60"
            />
          </FormRow>

          <FormRow label="摘要">
            <textarea
              value={values.summary}
              maxLength={160}
              rows={2}
              placeholder="用于列表与推荐位展示，建议 80 字以内"
              onChange={(e) => onChange({ summary: e.target.value })}
              className="scroll-thin w-full rounded-md border border-input bg-surface px-3 py-2 text-[13px] leading-relaxed text-foreground focus:border-ring focus:outline-none"
            />
          </FormRow>

          <FormRow label="正文" required>
            <textarea
              value={values.body}
              rows={14}
              placeholder="请输入正文内容，段落之间用回车分隔"
              onChange={(e) => onChange({ body: e.target.value })}
              className="scroll-thin w-full rounded-md border border-input bg-surface px-3 py-2 text-[13px] leading-relaxed text-foreground focus:border-ring focus:outline-none"
            />
          </FormRow>
        </div>
      </Panel>

      <div className="grid gap-4 self-start">
        <Panel title="封面图">
          <div className="grid grid-cols-2 gap-2">
            {IMAGE_LIBRARY.map((img) => (
              <button
                key={img.src}
                type="button"
                aria-pressed={values.cover === img.src}
                onClick={() => onChange({ cover: img.src })}
                className={cn(
                  'group relative aspect-[16/9] overflow-hidden rounded-md border transition-colors',
                  values.cover === img.src
                    ? 'border-brand ring-2 ring-brand/25'
                    : 'border-border hover:border-brand/40',
                )}
              >
                <Image
                  src={img.src || '/placeholder.svg'}
                  alt={img.name}
                  fill
                  sizes="160px"
                  className="object-cover"
                />
                <span className="absolute inset-x-0 bottom-0 bg-foreground/55 px-1.5 py-0.5 text-[11px] text-surface">
                  {img.name}
                </span>
              </button>
            ))}
          </div>
          {values.cover ? (
            <Button
              size="xs"
              variant="ghost"
              className="mt-2 px-0"
              onClick={() => onChange({ cover: '' })}
            >
              清除封面
            </Button>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
              未设置封面的稿件无法发布或上架。
            </p>
          )}
        </Panel>

        <Panel title="发布属性">
          <div className="grid gap-3">
            <FormRow label="排序号">
              <Input
                type="number"
                min={1}
                value={values.sort}
                onChange={(e) =>
                  onChange({ sort: Number.parseInt(e.target.value, 10) || 1 })
                }
                className="sm:w-28"
              />
            </FormRow>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] text-muted-foreground">置顶展示</span>
              <Switch
                checked={values.top}
                onCheckedChange={(v) => onChange({ top: v })}
                aria-label="置顶展示"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] text-muted-foreground">允许评论</span>
              <Switch
                checked={values.allowComment}
                onCheckedChange={(v) => onChange({ allowComment: v })}
                aria-label="允许评论"
              />
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              排序号越小越靠前；置顶仅对已发布内容生效，下架后自动取消置顶。
            </p>
          </div>
        </Panel>

        {attachmentEnabled && (
          <Panel
            title="附件"
            extra={
              <Button size="xs" variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload className="size-3.5" />
                添加附件
              </Button>
            }
          >
            <input
              ref={fileRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
            {values.attachments.length === 0 ? (
              <p className="text-xs leading-relaxed text-muted-foreground">
                “{values.category}”类目支持附件，可上传方案、名单、刊物等文件（PDF / Word / Excel）。
              </p>
            ) : (
              <ul className="space-y-1.5">
                {values.attachments.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-[13px]"
                  >
                    <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{a.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {a.size}
                    </span>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      aria-label={`删除附件 ${a.name}`}
                      onClick={() =>
                        onChange({
                          attachments: values.attachments.filter((x) => x.id !== a.id),
                        })
                      }
                    >
                      <Trash2 className="text-destructive" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}
      </div>
    </div>
  )
}
