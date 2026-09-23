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

/** 读取音频时长 */
async function probeAudioDuration(file: File): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const el = document.createElement('audio')
    el.preload = 'metadata'
    el.src = url
    const seconds = await new Promise<number>((resolve, reject) => {
      el.onloadedmetadata = () => resolve(el.duration)
      el.onerror = () => reject(new Error('音频解码失败'))
      window.setTimeout(() => reject(new Error('读取音频信息超时')), 10000)
    })
    return formatDuration(seconds)
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * 读取视频时长并截取首帧作为封面。
 *
 * 真实环境由服务端转码时截帧，原型下用 canvas 在浏览器内截取，效果一致：
 * 封面不再需要人工上传。跳到 0.1 秒再截，避开部分视频起始的纯黑帧。
 */
async function probeVideo(file: File): Promise<{ duration: string; cover: string }> {
  const url = URL.createObjectURL(file)
  const el = document.createElement('video')
  el.preload = 'auto'
  el.muted = true
  el.src = url

  try {
    const seconds = await new Promise<number>((resolve, reject) => {
      el.onloadeddata = () => resolve(el.duration)
      el.onerror = () => reject(new Error('视频解码失败'))
      window.setTimeout(() => reject(new Error('读取视频信息超时')), 15000)
    })

    // 定位到首帧后再绘制，否则可能拿到空画面
    await new Promise<void>((resolve, reject) => {
      el.onseeked = () => resolve()
      el.onerror = () => reject(new Error('视频定位失败'))
      el.currentTime = Math.min(0.1, Number.isFinite(el.duration) ? el.duration / 2 : 0.1)
      window.setTimeout(() => reject(new Error('截取封面超时')), 15000)
    })

    const canvas = document.createElement('canvas')
    canvas.width = el.videoWidth
    canvas.height = el.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx || !canvas.width || !canvas.height) {
      throw new Error('当前浏览器无法截取视频封面')
    }
    ctx.drawImage(el, 0, 0, canvas.width, canvas.height)

    // 用 blob 地址与其他上传口径保持一致，不写入 base64
    const cover = await new Promise<string>((resolve, reject) => {
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(URL.createObjectURL(blob))
            : reject(new Error('封面生成失败')),
        'image/jpeg',
        0.85,
      )
    })

    return { duration: formatDuration(seconds), cover }
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

    if (!isVideo) {
      try {
        onChange({ duration: await probeAudioDuration(file) })
        toast.success('音频已上传')
      } catch {
        toast.success('音频已上传，未能读取时长')
      }
      return
    }

    // 视频封面由系统自动截取首帧，无需人工上传
    try {
      const { duration, cover } = await probeVideo(file)
      onChange({ duration, cover })
      toast.success('视频已上传，已自动截取首帧作为封面')
    } catch (e) {
      toast.warning(
        `视频已上传，但未能自动生成封面：${
          e instanceof Error ? e.message : '未知原因'
        }`,
      )
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
            // 视频封面由系统截取首帧生成，不提供上传入口；音频仍需手动上传
            isVideo ? (
              <StatusTag tone="info">系统自动生成</StatusTag>
            ) : (
              <Button
                size="xs"
                variant="outline"
                onClick={() => coverRef.current?.click()}
              >
                <Upload className="size-3.5" />
                上传封面
              </Button>
            )
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
              {/* 封面为本地 blob（视频截帧或音频上传），使用原生 img 渲染 */}
              <img
                src={values.cover || '/placeholder.svg'}
                alt={`${values.title || '视听内容'}封面`}
                className="absolute inset-0 size-full object-cover"
              />
              {!isVideo && (
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
              )}
            </div>
          ) : (
            <div className="flex aspect-video w-full max-w-80 flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border text-muted-foreground">
              <ImagePlus className="size-6" />
              <span className="px-4 text-center text-[13px] leading-relaxed">
                {isVideo ? '上传视频后自动生成封面' : '请手动上传封面图'}
              </span>
            </div>
          )}
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {isVideo
              ? '封面由系统自动截取视频第一帧生成，无需人工上传；无封面无法发布或上架。'
              : '封面需手动上传，建议 16:9；无封面无法发布或上架。'}
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
