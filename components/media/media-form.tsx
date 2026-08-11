'use client'

import * as React from 'react'
import {
  AudioLines,
  Crop,
  FileVideo,
  ImagePlus,
  Loader2,
  RefreshCcw,
  Trash2,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  acceptOf,
  formatDuration,
  formatSize,
  processTone,
  MEDIA_KINDS,
  type MediaKind,
  type ProcessState,
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
  coverFromFrame: boolean
  fileName: string
  fileSize: string
  duration: string
  process: ProcessState
  failReason: string
  sort: number
  top: boolean
}

export const EMPTY_MEDIA_FORM: MediaFormValues = {
  title: '',
  kind: '视频',
  summary: '',
  cover: '',
  coverFromFrame: false,
  fileName: '',
  fileSize: '—',
  duration: '—',
  process: '待上传',
  failReason: '',
  sort: 99,
  top: false,
}

/** 读取媒体时长；视频同时截取第一帧作为封面 */
async function probeMedia(
  file: File,
  kind: MediaKind,
): Promise<{ duration: string; frame: string }> {
  const url = URL.createObjectURL(file)
  try {
    if (kind === '陕鼓之声') {
      const audio = document.createElement('audio')
      audio.preload = 'metadata'
      audio.src = url
      const seconds = await new Promise<number>((resolve, reject) => {
        audio.onloadedmetadata = () => resolve(audio.duration)
        audio.onerror = () => reject(new Error('音频解码失败'))
        window.setTimeout(() => reject(new Error('读取音频信息超时')), 8000)
      })
      return { duration: formatDuration(seconds), frame: '' }
    }

    const video = document.createElement('video')
    video.preload = 'auto'
    video.muted = true
    video.playsInline = true
    video.src = url
    const seconds = await new Promise<number>((resolve, reject) => {
      video.onloadeddata = () => resolve(video.duration)
      video.onerror = () => reject(new Error('视频解码失败'))
      window.setTimeout(() => reject(new Error('读取视频信息超时')), 10000)
    })

    // 跳到起始位置后绘制首帧
    await new Promise<void>((resolve) => {
      const done = () => resolve()
      video.onseeked = done
      window.setTimeout(done, 2500)
      try {
        video.currentTime = Math.min(0.1, Math.max(0, video.duration - 0.05))
      } catch {
        done()
      }
    })

    let frame = ''
    try {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth || 1280
      canvas.height = video.videoHeight || 720
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        frame = canvas.toDataURL('image/jpeg', 0.82)
      }
    } catch {
      frame = ''
    }
    return { duration: formatDuration(seconds), frame }
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
  /** 已入库内容的重试由服务端任务完成，由外部接管 */
  onRetry,
}: {
  values: MediaFormValues
  onChange: (patch: Partial<MediaFormValues>) => void
  kindLocked?: boolean
  onRetry?: () => void
}) {
  const mediaRef = React.useRef<HTMLInputElement>(null)
  const coverRef = React.useRef<HTMLInputElement>(null)
  const fileRef = React.useRef<File | null>(null)
  const isVideo = values.kind === '视频'

  async function process(file: File) {
    onChange({
      fileName: file.name,
      fileSize: formatSize(file.size),
      duration: '—',
      process: '处理中',
      failReason: '',
      ...(isVideo ? { cover: '', coverFromFrame: false } : {}),
    })
    try {
      const { duration, frame } = await probeMedia(file, values.kind)
      if (isVideo) {
        onChange({
          duration,
          process: '处理完成',
          failReason: '',
          cover: frame,
          coverFromFrame: Boolean(frame),
        })
        toast.success(
          frame ? '媒体处理完成，已自动截取第一帧作为封面' : '媒体处理完成，但首帧截取失败，请点击重新截取',
        )
        return
      }
      onChange({ duration, process: '处理完成', failReason: '' })
      toast.success('媒体处理完成，请手动上传“陕鼓之声”封面')
    } catch (err) {
      const reason =
        err instanceof Error ? err.message : '媒体处理服务未返回结果'
      onChange({ process: '处理失败', failReason: `${reason}，转码任务已中断` })
      toast.error('媒体处理失败，可点击「重试处理」重新提交')
    }
  }

  function pickMedia(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    fileRef.current = file
    void process(file)
    if (mediaRef.current) mediaRef.current.value = ''
  }

  function retry() {
    if (onRetry) {
      onRetry()
      return
    }
    if (!fileRef.current) {
      toast.error('原始文件已失效，请重新上传媒体文件')
      return
    }
    void process(fileRef.current)
  }

  async function recapture() {
    if (!isVideo) return
    if (!fileRef.current) {
      toast.error('原始视频已失效，请重新上传后再截取')
      return
    }
    const { frame } = await probeMedia(fileRef.current, '视频')
    if (!frame) {
      toast.error('首帧截取失败，请确认视频文件是否可正常解码')
      return
    }
    onChange({ cover: frame, coverFromFrame: true })
    toast.success('已重新截取视频第一帧')
  }

  function pickCover(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    onChange({ cover: URL.createObjectURL(file), coverFromFrame: false })
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

            <FormRow
              label="视听类型"
              required
              hint={
                isVideo
                  ? '视频封面由系统自动截取第一帧，无需手动上传。'
                  : '“陕鼓之声”为音频栏目，封面需手动上传。'
              }
            >
              {kindLocked ? (
                <div className="flex items-center gap-2">
                  <StatusTag tone="info">{values.kind}</StatusTag>
                  <span className="text-xs text-muted-foreground">
                    已入库内容不支持切换类型
                  </span>
                </div>
              ) : (
                <NativeSelect
                  aria-label="视听类型"
                  value={values.kind}
                  onChange={(v) => {
                    const kind = v as MediaKind
                    fileRef.current = null
                    onChange({
                      kind,
                      cover: '',
                      coverFromFrame: false,
                      fileName: '',
                      fileSize: '—',
                      duration: '—',
                      process: '待上传',
                      failReason: '',
                    })
                  }}
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
            <div className="flex items-center gap-2">
              {values.process === '处理失败' && (
                <Button size="xs" variant="outline" onClick={retry}>
                  <RefreshCcw className="size-3.5" />
                  重试处理
                </Button>
              )}
              <Button
                size="xs"
                variant="outline"
                disabled={values.process === '处理中'}
                onClick={() => mediaRef.current?.click()}
              >
                <Upload className="size-3.5" />
                {values.fileName ? '重新上传' : '上传文件'}
              </Button>
            </div>
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
            <div className="grid gap-3">
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
                <StatusTag tone={processTone(values.process)}>
                  {values.process === '处理中' ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="size-3 animate-spin" />
                      处理中
                    </span>
                  ) : (
                    values.process
                  )}
                </StatusTag>
              </div>
              {values.process === '处理失败' && (
                <p className="rounded-md border border-destructive/30 bg-destructive/8 px-3 py-2 text-xs leading-relaxed text-destructive">
                  处理失败：{values.failReason || '媒体处理服务未返回结果'}。请点击「重试处理」，或更换源文件后重新上传。
                </p>
              )}
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
                点击上传{isVideo ? '视频文件（MP4 / MOV / AVI）' : '音频文件（MP3 / M4A / WAV）'}
              </span>
            </button>
          )}
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            上传后系统自动完成转码处理；处理完成才能发布或上架，处理失败可重试。
          </p>
        </Panel>
      </div>

      <div className="grid gap-4 self-start">
        <Panel
          title="封面"
          extra={
            isVideo ? (
              <Button
                size="xs"
                variant="outline"
                disabled={values.process !== '处理完成'}
                onClick={() => void recapture()}
              >
                <Crop className="size-3.5" />
                重新截取
              </Button>
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
              {/* 首帧截图与本地上传均为 blob/dataURL，使用原生 img 渲染 */}
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
                {isVideo ? '上传视频后自动截取第一帧' : '请手动上传封面图'}
              </span>
            </div>
          )}
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {isVideo
              ? '视频封面取自第一帧，可在处理完成后重新截取；无封面无法发布或上架。'
              : '“陕鼓之声”封面需手动上传，建议 16:9；无封面无法发布或上架。'}
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
