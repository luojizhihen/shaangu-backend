'use client'

import * as React from 'react'
import { FileUp, ImagePlus, Paperclip, Trash2, Upload } from 'lucide-react'

import { NOTICE_CATEGORY, type Attachment, type Category } from '@/lib/content-store'
import { RichTextEditor } from '@/components/content/rich-text-editor'
import { WordImportDialog } from '@/components/content/word-import-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Panel, NativeSelect } from '@/components/layout/page-frame'

export type NewsFormValues = {
  title: string
  category: string
  summary: string
  body: string
  cover: string
  sort: number
  top: boolean
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
  const coverRef = React.useRef<HTMLInputElement>(null)
  const [wordOpen, setWordOpen] = React.useState(false)
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

  /** 封面图仅保留一张：始终取第一个文件并覆盖原有封面 */
  function pickCover(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    onChange({ cover: URL.createObjectURL(file) })
    if (coverRef.current) coverRef.current.value = ''
  }

  return (
    <>
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
            <div className="grid gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  可直接编辑，也可从 Word 文档导入后继续修改
                </span>
                <Button size="xs" variant="outline" onClick={() => setWordOpen(true)}>
                  <FileUp className="size-3.5" />
                  导入 Word
                </Button>
              </div>
              <RichTextEditor
                value={values.body}
                onChange={(html) => onChange({ body: html })}
              />
            </div>
          </FormRow>
        </div>
      </Panel>

      <div className="grid gap-4 self-start">
        <Panel title="封面图">
          <input
            ref={coverRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pickCover(e.target.files)}
          />
          {values.cover ? (
            <div className="relative aspect-[16/9] w-full max-w-80 overflow-hidden rounded-md border border-border">
              {/* 本地上传得到的是 blob 地址，使用原生 img 直接渲染 */}
              <img
                src={values.cover || '/placeholder.svg'}
                alt="资讯封面图"
                className="absolute inset-0 size-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 bg-foreground/55 px-1.5 py-1">
                <Button
                  size="xs"
                  variant="ghost"
                  className="h-6 text-surface hover:bg-surface/20 hover:text-surface"
                  onClick={() => coverRef.current?.click()}
                >
                  重新上传
                </Button>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label="删除封面图"
                  className="text-surface hover:bg-surface/20 hover:text-surface"
                  onClick={() => onChange({ cover: '' })}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => coverRef.current?.click()}
              className="flex aspect-[16/9] w-full max-w-80 flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border text-muted-foreground transition-colors hover:border-brand/50 hover:text-brand"
            >
              <ImagePlus className="size-6" />
              <span className="text-[13px]">点击上传封面图</span>
            </button>
          )}
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            封面图仅支持上传一张，建议尺寸 16:9；未设置封面的稿件无法发布或上架。
          </p>
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

    <WordImportDialog
      open={wordOpen}
      onOpenChange={setWordOpen}
      currentBody={values.body}
      onImport={(html) => onChange({ body: html })}
    />
    </>
  )
}
