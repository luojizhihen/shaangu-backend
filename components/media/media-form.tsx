'use client'

import * as React from 'react'
import {
  AudioLines,
  FileVideo,
  ImagePlus,
  Trash2,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  acceptOf,
  formatDuration,
  formatSize,
  MEDIA_KINDS,
  type MediaKind,
} from '@/lib/media-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { NativeSelect, Panel, StatusTag } from '@/components/layout/page-frame'

export type MediaFormValues = {
  title: string
  kind: MediaKind
  summary: string
  cover: string
  fileName: string
  fileSize: string
  duration: string
  sort: number
  top: boolean
}

export const EMPTY_MEDIA_FORM: MediaFormValues = {
  title: '',
  kind: '视频',
  summary: '',
  cover: '',
  fileName: '',
  fileSize: '—',
  duration: '—',
  sort: 99,
  top: false,
}

/** 读取媒体时长（视频不做转码，也不再截取首帧） */
async function probeDuration(file: File, kind: MediaKind): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const el =
      kind === '陕鼓之声'
        ? document.createElement('audio')
        : document.createElement('video')
    el.preload = 'metadata'
    el.src = url
    const label = kind === '陕鼓之声' ? '音频' : '视频'
    const seconds = await new Promise<number>((resolve, reject) => {
      el.onloadedmetadata = () => resolve(el.duration)
      el.onerror = () => reject(new Error(`${label}解码失败`))
      window.setTimeout(() => reject(new Error(`读取${label}信息超时`)), 10000)
    })
    return formatDuration(seconds)
  } finally {
    URL.revokeObjectURL(url)
  }
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
        {hint && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{hint}</p>}
      </div>
    </div>
  )
}

export function MediaForm({
  values,
  onChange,
  /** 已入库内容不允许切换视听类型，避免媒体文件与封面规则错配 */
  kindLocked = false,
}: {
  values: MediaFormValues
  onChange: (patch: Partial<MediaFormValues>) => void
  kindLocked?: boolean
}) {
  const mediaRef = React.useRef<HTMLInputElement>(null)
  const coverRef = React.useRef<HTMLInputElement>(null)
  const isVideo = values.kind === '视频'

  // 视频与音频均为直传，无转码环节，上传后仅读取时长
  async function upload(file: File) {
    const label = isVideo ? '视频' : '音频'
    const okExt = isVideo ? /\.mp4$/i : /\.mp3$/i
    const okType = isVideo ? 'video/mp4' : 'audio/mpeg'
    if (!okExt.test(file.name) && file.type !== okType) {
      toast.error(
        `${label}仅支持 ${isVideo ? 'MP4' : 'MP3'} 格式，请更换文件后重新上传`,
      )
      return
    }
    onChange({
      fileName: file.name,
      fileSize: formatSize(file.size),
      duration: '—',
    })
    try {
      onChange({ duration: await probeDuration(file, values.kind) })
      toast.success(`${label}已上传`)
    } catch {
      toast.success(`${label}已上传，未能读取时长`)
    }
  }

  function pickMedia(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    void upload(file)
    if (mediaRef.current) mediaRef.current.value = ''
  }

  function pickCover(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    onChange({ cover: URL.createObjectURL(file) })
    if (coverRef.current) coverRef.current.value = ''
    toast.success('封面已上传')
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="grid gap-4">
        <Panel title="基本信息">
          <div className="grid gap-4">
            <FormRow label="标题" required>
              <Input
                value={values.title}
                maxLength={80}
                placeholder="请输入视听内容标题（不超过 80 字）"
                onChange={(e) => onChange({ title: e.target.value })}
              />
            </FormRow>

            <FormRow label="视听类型" required>
              {kindLocked ? (
                <StatusTag tone="info">{values.kind}</StatusTag>
              ) : (
                <NativeSelect
                  aria-label="视听类型"
                  value={values.kind}
                  onChange={(v) =>
                    onChange({
                      kind: v as MediaKind,
                      cover: '',
                      fileName: '',
                      fileSize: '—',
                      duration: '—',
                    })
                  }
                  options={MEDIA_KINDS}
                  className="sm:w-60"
                />
              )}
            </FormRow>

            <FormRow label="简介">
              <textarea
                value={values.summary}
                maxLength={160}
                rows={3}
                placeholder="用于列表与详情展示，建议 80 字以内"
                onChange={(e) => onChange({ summary: e.target.value })}
                className="scroll-thin w-full rounded-md border border-input bg-surface px-3 py-2 text-[13px] leading-relaxed text-foreground focus:border-ring focus:outline-none"
              />
            </FormRow>
          </div>
        </Panel>

        <Panel
          title={isVideo ? '视频文件' : '音频文件'}
          extra={
            <Button
              size="xs"
              variant="outline"
              onClick={() => mediaRef.current?.click()}
            >
              <Upload className="size-3.5" />
              {values.fileName ? '重新上传' : '上传文件'}
            </Button>
          }
        >
          <input
            ref={mediaRef}
            type="file"
            accept={acceptOf(values.kind)}
            className="hidden"
            onChange={(e) => pickMedia(e.target.files)}
          />
          {values.fileName ? (
            <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5">
              {isVideo ? (
                <FileVideo className="size-5 shrink-0 text-brand" />
              ) : (
                <AudioLines className="size-5 shrink-0 text-brand" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px]">{values.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {values.fileSize} · 时长 {values.duration}
                </p>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => mediaRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border py-10 text-muted-foreground transition-colors hover:border-brand/50 hover:text-brand"
            >
              {isVideo ? (
                <FileVideo className="size-6" />
              ) : (
                <AudioLines className="size-6" />
              )}
              <span className="text-[13px]">
                点击上传{isVideo ? '视频文件（仅支持 MP4）' : '音频文件（仅支持 MP3）'}
              </span>
            </button>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 self-start">
        <Panel
          title="封面"
          extra={
            <Button
              size="xs"
              variant="outline"
              onClick={() => coverRef.current?.click()}
            >
              <Upload className="size-3.5" />
              上传封面
            </Button>
          }
        >
          <input
            ref={coverRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pickCover(e.target.files)}
          />
          {values.cover ? (
            <div className="relative aspect-video w-full max-w-80 overflow-hidden rounded-md border border-border">
              {/* 手动上传的封面为本地 blob，使用原生 img 渲染 */}
              <img
                src={values.cover || '/placeholder.svg'}
                alt={`${values.title || '视听内容'}封面`}
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
                  aria-label="删除封面"
                  className="text-surface hover:bg-surface/20 hover:text-surface"
                  onClick={() => onChange({ cover: '' })}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex aspect-video w-full max-w-80 flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border text-muted-foreground">
              <ImagePlus className="size-6" />
              <span className="px-4 text-center text-[13px] leading-relaxed">
                请手动上传封面图
              </span>
            </div>
          )}
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            封面需手动上传，建议 16:9；无封面无法发布或上架。
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
            <p className="text-xs leading-relaxed text-muted-foreground">
              置顶仅对已发布内容生效；发布权限由固定发布人员持有，发布前请确认外部审批已完成。
            </p>
          </div>
        </Panel>
      </div>
    </div>
  )
}
