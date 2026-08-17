'use client'

import * as React from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  RotateCcw,
  Upload,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import { StatusTag } from '@/components/layout/page-frame'
import { RichText } from '@/components/content/rich-text-editor'
import {
  ACCEPT_EXT,
  ACCEPT_MIME,
  MAX_DOC_MB,
  formatBytes,
  importWordDocument,
  mergeBody,
  restoreRetriedImage,
  retryImage,
  validateWordFile,
  type ImportOutcome,
  type ImportPhase,
  type ImportedImage,
} from '@/lib/word-import'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const PHASE_TEXT: Record<ImportPhase, string> = {
  idle: '',
  validating: '正在校验文件…',
  uploading: '正在上传文档…',
  parsing: '正在解析文档…',
  success: '解析成功',
  partial: '部分成功',
  failed: '导入失败',
}

/** 进行中的阶段指示 */
function PhaseSteps({ phase, percent, imageDone, imageTotal }: {
  phase: ImportPhase
  percent: number
  imageDone: number
  imageTotal: number
}) {
  const steps: { key: ImportPhase; label: string }[] = [
    { key: 'validating', label: '文件校验' },
    { key: 'uploading', label: '上传文档' },
    { key: 'parsing', label: '解析内容' },
  ]
  const order: ImportPhase[] = ['validating', 'uploading', 'parsing']
  const currentIndex = order.indexOf(phase)

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2">
        {steps.map((s, i) => {
          const done = currentIndex > i
          const active = currentIndex === i
          return (
            <React.Fragment key={s.key}>
              <span
                className={cn(
                  'flex items-center gap-1.5 text-[13px]',
                  done && 'text-brand-green',
                  active && 'text-brand',
                  !done && !active && 'text-muted-foreground',
                )}
              >
                {done ? (
                  <CheckCircle2 className="size-3.5" />
                ) : active ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <span className="size-3.5 rounded-full border border-current" />
                )}
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <span className="h-px w-8 bg-border" aria-hidden />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {phase === 'uploading' && (
        <div className="grid gap-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-brand transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{percent}%</span>
        </div>
      )}

      {phase === 'parsing' && imageTotal > 0 && (
        <span className="text-xs text-muted-foreground">
          正在上传文档内图片 {imageDone}/{imageTotal}
        </span>
      )}
    </div>
  )
}

export function WordImportDialog({
  open,
  onOpenChange,
  currentBody,
  onImport,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  /** 当前正文，用于决定「替换」还是「追加」 */
  currentBody: string
  onImport: (html: string) => void
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [phase, setPhase] = React.useState<ImportPhase>('idle')
  const [percent, setPercent] = React.useState(0)
  const [imageDone, setImageDone] = React.useState(0)
  const [imageTotal, setImageTotal] = React.useState(0)
  const [file, setFile] = React.useState<File | null>(null)
  const [error, setError] = React.useState('')
  const [outcome, setOutcome] = React.useState<ImportOutcome | null>(null)
  const [dragging, setDragging] = React.useState(false)

  const busy = phase === 'validating' || phase === 'uploading' || phase === 'parsing'
  const finished = phase === 'success' || phase === 'partial'

  function reset() {
    setPhase('idle')
    setPercent(0)
    setImageDone(0)
    setImageTotal(0)
    setFile(null)
    setError('')
    setOutcome(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  // 关闭后清空，避免下次打开残留上一次的结果
  React.useEffect(() => {
    if (!open) reset()
  }, [open])

  async function run(target: File) {
    setFile(target)
    setError('')
    setOutcome(null)
    setPercent(0)
    setImageDone(0)
    setImageTotal(0)

    try {
      const result = await importWordDocument(target, {
        onPhase: setPhase,
        onProgress: setPercent,
        onImageProgress: (done, total) => {
          setImageDone(done)
          setImageTotal(total)
        },
      })
      setOutcome(result)
    } catch (e) {
      setPhase('failed')
      setError(e instanceof Error ? e.message : '导入失败，请重试')
    }
  }

  function pick(files: FileList | null) {
    const target = files?.[0]
    if (!target) return
    const check = validateWordFile(target)
    if (!check.ok) {
      setFile(target)
      setPhase('failed')
      setError(check.message)
      return
    }
    void run(target)
  }

  async function doRetryImage(image: ImportedImage) {
    if (!outcome) return
    const next = await retryImage(image)
    const images = outcome.images.map((i) => (i.id === next.id ? next : i))
    const html = next.ok ? restoreRetriedImage(outcome.html, next) : outcome.html
    setOutcome({ ...outcome, images, html })
    setPhase(images.some((i) => !i.ok) ? 'partial' : 'success')
    toast[next.ok ? 'success' : 'error'](
      next.ok ? `图片 ${next.name} 已重新上传` : `重试失败：${next.message}`,
    )
  }

  function confirm(mode: 'replace' | 'append') {
    if (!outcome) return
    onImport(mergeBody(currentBody, outcome.html, mode))
    toast.success(
      mode === 'replace' ? '已替换正文，请检查后再发布' : '已追加到正文末尾，请检查后再发布',
    )
    onOpenChange(false)
  }

  const failedImages = outcome?.images.filter((i) => !i.ok) ?? []
  const okImages = outcome?.images.filter((i) => i.ok) ?? []
  const hasBody = Boolean(currentBody.trim())

  return (
    <Dialog open={open} onOpenChange={(v) => (busy ? undefined : onOpenChange(v))}>
      <DialogContent className="flex max-h-[88vh] flex-col sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>导入 Word</DialogTitle>
        </DialogHeader>

        <div className="scroll-thin -mx-1 flex-1 overflow-y-auto px-1">
          <input
            ref={inputRef}
            type="file"
            accept={`${ACCEPT_EXT},${ACCEPT_MIME}`}
            className="hidden"
            onChange={(e) => pick(e.target.files)}
          />

          {/* 选择文件 */}
          {phase === 'idle' && (
            <>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragging(false)
                  pick(e.dataTransfer.files)
                }}
                className={cn(
                  'flex w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed px-4 py-10 transition-colors',
                  dragging
                    ? 'border-brand bg-accent text-brand'
                    : 'border-input text-muted-foreground hover:border-brand/50 hover:text-brand',
                )}
              >
                <Upload className="size-6" />
                <span className="text-[13px]">点击选择或拖拽 .docx 文件到此处</span>
                <span className="text-xs text-muted-foreground">
                  仅支持 .docx，单个文档不超过 {MAX_DOC_MB} MB
                </span>
              </button>

              <div className="mt-3 rounded-md border border-border bg-muted/40 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
                <p className="mb-1 font-medium text-foreground">导入说明</p>
                <p>
                  将尽量保留标题层级、段落、加粗、斜体、列表、超链接、基础表格与图片顺序；
                  文档内图片会自动上传到系统文件存储后插入正文。
                </p>
                <p className="mt-1">
                  文本框、艺术字、SmartArt、复杂图表、页眉页脚、批注、修订记录与复杂分页
                  不保证完全还原，导入后会列出未还原的内容。
                </p>
                <p className="mt-1">
                  不支持 .doc 与 .docm，请在 Word 中另存为 .docx。导入后需人工检查，
                  <span className="text-foreground">不会自动发布</span>。
                </p>
              </div>
            </>
          )}

          {/* 进行中 */}
          {busy && (
            <div className="grid gap-3">
              <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2.5">
                <FileText className="size-4 shrink-0 text-brand" />
                <span className="min-w-0 flex-1 truncate text-[13px]">{file?.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {file ? formatBytes(file.size) : ''}
                </span>
              </div>
              <PhaseSteps
                phase={phase}
                percent={percent}
                imageDone={imageDone}
                imageTotal={imageTotal}
              />
            </div>
          )}

          {/* 失败 */}
          {phase === 'failed' && (
            <div className="grid gap-3">
              <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2.5">
                <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                <div className="min-w-0 grid gap-0.5">
                  <span className="text-[13px] font-medium text-destructive">
                    {PHASE_TEXT.failed}
                  </span>
                  <span className="text-xs leading-relaxed text-muted-foreground">
                    {error}
                  </span>
                  {file && (
                    <span className="text-xs text-muted-foreground">
                      文件：{file.name}（{formatBytes(file.size)}）
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
                  重新选择文件
                </Button>
                {file && validateWordFile(file).ok && (
                  <Button size="sm" onClick={() => void run(file)}>
                    <RotateCcw className="size-3.5" />
                    重试
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* 成功 / 部分成功 */}
          {finished && outcome && (
            <div className="grid gap-3">
              <div
                className={cn(
                  'flex items-start gap-2 rounded-md border px-3 py-2.5',
                  phase === 'success'
                    ? 'border-brand-green/40 bg-brand-green/5'
                    : 'border-warning/40 bg-warning/5',
                )}
              >
                {phase === 'success' ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-green" />
                ) : (
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                )}
                <div className="grid min-w-0 gap-0.5">
                  <span className="text-[13px] font-medium">
                    {PHASE_TEXT[phase]}
                    <span className="ml-1.5 font-normal text-muted-foreground">
                      {file?.name}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    标题 {outcome.stats.headings} · 段落 {outcome.stats.paragraphs} · 列表{' '}
                    {outcome.stats.lists} · 表格 {outcome.stats.tables} · 链接{' '}
                    {outcome.stats.links} · 图片 {okImages.length}
                    {failedImages.length > 0 ? ` 成功 / ${failedImages.length} 失败` : ''}
                  </span>
                </div>
              </div>

              {/* 图片清单 */}
              {outcome.images.length > 0 && (
                <div className="rounded-md border border-border">
                  <div className="border-b border-border bg-muted/50 px-3 py-1.5 text-xs font-medium">
                    文档图片（{outcome.images.length}）
                  </div>
                  <ul className="divide-y divide-border">
                    {outcome.images.map((img) => (
                      <li key={img.id} className="flex items-center gap-2 px-3 py-2">
                        <StatusTag tone={img.ok ? 'success' : 'danger'}>
                          {img.ok ? '已上传' : '失败'}
                        </StatusTag>
                        <span className="min-w-0 flex-1 truncate text-[13px]">
                          {img.name}
                          <span className="ml-1.5 text-xs text-muted-foreground">
                            {img.sizeText}
                          </span>
                        </span>
                        {img.ok ? (
                          <span
                            title={img.storagePath}
                            className="hidden max-w-56 shrink-0 truncate font-mono text-xs text-muted-foreground sm:block"
                          >
                            {img.storagePath}
                          </span>
                        ) : (
                          <>
                            <span className="shrink-0 text-xs text-destructive">
                              {img.message}
                            </span>
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => void doRetryImage(img)}
                            >
                              <RotateCcw className="size-3" />
                              重试
                            </Button>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 未还原内容 */}
              {outcome.unsupported.length > 0 && (
                <div className="rounded-md border border-warning/40 bg-warning/5 px-3 py-2.5">
                  <p className="text-[13px] font-medium text-warning">
                    以下内容未能还原，请在正文中手动补充
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {outcome.unsupported.map((u) => (
                      <StatusTag key={u} tone="warning">
                        {u}
                      </StatusTag>
                    ))}
                  </div>
                </div>
              )}

              {/* 解析器警告 */}
              {outcome.warnings.length > 0 && (
                <details className="rounded-md border border-border px-3 py-2">
                  <summary className="cursor-pointer text-xs text-muted-foreground">
                    解析器提示（{outcome.warnings.length}）
                  </summary>
                  <ul className="mt-1.5 grid gap-1">
                    {outcome.warnings.map((w) => (
                      <li key={w} className="text-xs leading-relaxed text-muted-foreground">
                        · {w}
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              {/* 正文预览 */}
              <div className="rounded-md border border-border">
                <div className="border-b border-border bg-muted/50 px-3 py-1.5 text-xs font-medium">
                  正文预览（插入后仍可继续编辑）
                </div>
                <div className="scroll-thin max-h-72 overflow-y-auto px-3 py-2.5">
                  <RichText html={outcome.html} />
                </div>
              </div>

              <p className="text-xs leading-relaxed text-muted-foreground">
                原型环境未接入对象存储，图片地址为本地临时地址，刷新页面后失效；
                接入存储后将自动替换为上方列出的目标路径。
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {finished ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              {hasBody && (
                <Button variant="outline" onClick={() => confirm('append')}>
                  追加到正文末尾
                </Button>
              )}
              <Button onClick={() => confirm('replace')}>
                {hasBody ? '替换正文' : '插入正文'}
              </Button>
            </>
          ) : (
            <Button variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
              {busy ? '处理中…' : '关闭'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
