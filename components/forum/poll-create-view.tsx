'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Eye,
  GripVertical,
  ImagePlus,
  Lock,
  Plus,
  Save,
  Send,
  Trash2,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'

import { useApp } from '@/components/app-store'
import {
  NativeSelect,
  PageHeader,
  Panel,
  StatusTag,
} from '@/components/layout/page-frame'
import { RichTextEditor } from '@/components/content/rich-text-editor'
import { PublishConfirmDialog, ValidationNotice } from '@/components/forum/forum-dialogs'
import { ForumPreviewDialog } from '@/components/forum/forum-preview'
import {
  createForumPoll,
  validatePoll,
  type PollDraftInput,
  type PollMode,
  type PollOptionMode,
  type ValidationIssue,
} from '@/lib/forum-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

const MAX_OPTIONS = 8
const MIN_OPTIONS = 2

type DraftOption = { id: string; label: string; image: string }

let optionSeq = 0
function newOption(): DraftOption {
  optionSeq += 1
  return { id: `draft-opt-${optionSeq}`, label: '', image: '' }
}

/** 默认截止时间：次日 18:00，便于填写 */
function defaultDeadline() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T18:00`
}

/**
 * 新建投票帖子：标题、正文、可选封面、文字/图片选项、单选/多选与截止时间。
 * 校验通过后直接发布；发布即锁定选项、模式、截止时间与结果。
 */
export function PollCreateView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { role } = useApp()
  const coverRef = React.useRef<HTMLInputElement>(null)
  const optionFileRef = React.useRef<HTMLInputElement>(null)
  const pendingOption = React.useRef<string>('')

  const [title, setTitle] = React.useState('')
  const [body, setBody] = React.useState('')
  const [cover, setCover] = React.useState('')
  const [mode, setMode] = React.useState<PollMode>('单选')
  const [optionMode, setOptionMode] = React.useState<PollOptionMode>('文字')
  const [deadline, setDeadline] = React.useState(defaultDeadline())
  const [options, setOptions] = React.useState<DraftOption[]>([newOption(), newOption()])
  const [official, setOfficial] = React.useState(searchParams.get('official') === '1')
  const [issues, setIssues] = React.useState<ValidationIssue[] | null>(null)
  const [preview, setPreview] = React.useState(false)
  const [confirm, setConfirm] = React.useState(false)

  const input: PollDraftInput = {
    title,
    body,
    cover,
    mode,
    optionMode,
    deadline: deadline.replace('T', ' '),
    options,
    official,
  }
  const actor = { person: role.person, role: role.name }

  function runCheck(): ValidationIssue[] {
    const found = validatePoll(input)
    setIssues(found)
    return found
  }

  function patchOption(id: string, patch: Partial<DraftOption>) {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)))
  }

  function addOption() {
    if (options.length >= MAX_OPTIONS) {
      toast.error(`最多支持 ${MAX_OPTIONS} 个选项`)
      return
    }
    setOptions((prev) => [...prev, newOption()])
  }

  function removeOption(id: string) {
    if (options.length <= MIN_OPTIONS) {
      toast.error(`至少需要 ${MIN_OPTIONS} 个选项`)
      return
    }
    setOptions((prev) => prev.filter((o) => o.id !== id))
  }

  function pickOptionImage(files: FileList | null) {
    const file = files?.[0]
    const id = pendingOption.current
    if (file && id) patchOption(id, { image: URL.createObjectURL(file) })
    if (optionFileRef.current) optionFileRef.current.value = ''
    pendingOption.current = ''
  }

  function saveDraft() {
    const found = runCheck()
    // 草稿允许选项、截止时间暂不完整，但标题与敏感词必须先通过
    const blocking = found.filter((i) => i.field === '敏感词' || i.field === '标题')
    if (blocking.length > 0) {
      toast.error('校验未通过，请按提示修改后再保存草稿')
      return
    }
    const post = createForumPoll(input, false, actor)
    toast.success('已保存为草稿')
    router.push(`/forum/polls/${post.id}`)
  }

  function openPreview() {
    runCheck()
    setPreview(true)
  }

  function openPublish() {
    const found = runCheck()
    if (found.length > 0) {
      toast.error('校验未通过，请按提示修改后再发布')
      return
    }
    setConfirm(true)
  }

  function publish() {
    const post = createForumPoll(input, true, actor)
    setConfirm(false)
    toast.success('投票帖已直接发布，选项与截止时间已锁定')
    router.push(`/forum/polls/${post.id}`)
  }

  return (
    <>
      <PageHeader
        breadcrumb={['论坛管理', '帖子管理', '新建投票帖子']}
        title="新建投票帖子"
        actions={<StatusTag tone="neutral">当前角色：{role.name}</StatusTag>}
      />

      <p className="mb-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/8 px-4 py-2.5 text-xs leading-relaxed text-warning">
        <Lock className="mt-0.5 size-3.5 shrink-0" />
        投票帖发布后永久只读：选项、单/多选、截止时间与投票结果全部锁定，不可修改、不可清空、不可延期。如需调整，请先隐藏或逻辑删除原投票，再新建并发布新投票；新投票生成新的内容
        ID，参与人数与投票结果不迁移。
      </p>

      <div className="grid gap-4 pb-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-4">
          <Panel title="投票内容">
            <div className="grid gap-4">
              <div className="grid gap-1.5">
                <label htmlFor="poll-title" className="text-[13px]">
                  <span className="text-destructive">*</span>标题
                </label>
                <Input
                  id="poll-title"
                  value={title}
                  maxLength={60}
                  placeholder="请输入投票标题（4-60 字）"
                  onChange={(e) => setTitle(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">{title.trim().length} / 60</p>
              </div>

              <div className="grid gap-1.5">
                <span className="text-[13px]">
                  <span className="text-destructive">*</span>正文
                </span>
                <RichTextEditor
                  value={body}
                  onChange={setBody}
                  placeholder="请说明投票背景与规则（不少于 10 字）"
                />
              </div>
            </div>
          </Panel>

          <Panel
            title="投票选项"
            extra={
              <Button
                size="xs"
                variant="outline"
                onClick={addOption}
                disabled={options.length >= MAX_OPTIONS}
              >
                <Plus className="size-3.5" />
                添加选项
              </Button>
            }
          >
            <input
              ref={optionFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pickOptionImage(e.target.files)}
            />

            <div className="mb-3 grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label className="text-[13px]" htmlFor="poll-option-mode">
                  <span className="text-destructive">*</span>选项形式
                </label>
                <NativeSelect
                  id="poll-option-mode"
                  aria-label="选项形式"
                  value={optionMode}
                  onChange={(v) => setOptionMode(v as PollOptionMode)}
                  options={['文字', '图片']}
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-[13px]" htmlFor="poll-mode">
                  <span className="text-destructive">*</span>投票模式
                </label>
                <NativeSelect
                  id="poll-mode"
                  aria-label="投票模式"
                  value={mode}
                  onChange={(v) => setMode(v as PollMode)}
                  options={['单选', '多选']}
                />
              </div>
            </div>

            <ul className="grid gap-2">
              {options.map((o, i) => (
                <li
                  key={o.id}
                  className="flex items-start gap-2 rounded-md border border-border px-2.5 py-2.5"
                >
                  <GripVertical
                    className="mt-2 size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1 grid gap-2">
                    <Input
                      value={o.label}
                      maxLength={30}
                      aria-label={`选项 ${i + 1} 文字`}
                      placeholder={`选项 ${i + 1} 文字（不超过 30 字）`}
                      onChange={(e) => patchOption(o.id, { label: e.target.value })}
                    />
                    {optionMode === '图片' && (
                      <div className="flex items-center gap-2">
                        <div className="relative size-14 shrink-0 overflow-hidden rounded border border-border bg-muted">
                          {o.image ? (
                            /* 本地上传为 blob 地址，使用原生 img */
                            <img
                              src={o.image || '/placeholder.svg'}
                              alt={`选项 ${i + 1} 图片`}
                              className="absolute inset-0 size-full object-cover"
                            />
                          ) : (
                            <span className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                              <ImagePlus className="size-4" />
                            </span>
                          )}
                        </div>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => {
                            pendingOption.current = o.id
                            optionFileRef.current?.click()
                          }}
                        >
                          <Upload className="size-3.5" />
                          {o.image ? '重新上传' : '上传图片'}
                        </Button>
                        {o.image && (
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => patchOption(o.id, { image: '' })}
                          >
                            移除
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`删除选项 ${i + 1}`}
                    disabled={options.length <= MIN_OPTIONS}
                    onClick={() => removeOption(o.id)}
                  >
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>

            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              选项数量 {MIN_OPTIONS}-{MAX_OPTIONS} 个，文字不可重复；选择「图片」形式时每个选项都需上传图片。发布后选项与形式即锁定。
            </p>
          </Panel>

          <Panel
            title="封面（可选）"
            extra={
              <Button size="xs" variant="outline" onClick={() => coverRef.current?.click()}>
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
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) setCover(URL.createObjectURL(file))
                if (coverRef.current) coverRef.current.value = ''
              }}
            />
            {cover ? (
              <div className="relative aspect-[16/9] max-w-md overflow-hidden rounded-md border border-border">
                <img
                  src={cover || '/placeholder.svg'}
                  alt={`${title || '投票'}封面`}
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
                    onClick={() => setCover('')}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => coverRef.current?.click()}
                className="flex w-full max-w-md flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border py-10 text-muted-foreground transition-colors hover:border-brand/50 hover:text-brand"
              >
                <ImagePlus className="size-6" />
                <span className="text-[13px]">点击上传封面图（可选，建议 16:9）</span>
              </button>
            )}
          </Panel>
        </div>

        <div className="grid gap-4 self-start">
          <Panel title="截止时间">
            <div className="grid gap-1.5">
              <label htmlFor="poll-deadline" className="text-[13px]">
                <span className="text-destructive">*</span>投票截止时间
              </label>
              <Input
                id="poll-deadline"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
              <p className="text-xs leading-relaxed text-muted-foreground">
                须晚于当前时间。发布后截止时间锁定，不支持延期或提前结束。
              </p>
            </div>
          </Panel>

          <Panel title="校验结果">
            <ValidationNotice issues={issues ?? []} checked={issues !== null} />
            <Button
              size="sm"
              variant="outline"
              className="mt-3 w-full"
              onClick={() => {
                const found = runCheck()
                toast[found.length === 0 ? 'success' : 'error'](
                  found.length === 0 ? '校验通过' : `校验未通过，共 ${found.length} 项`,
                )
              }}
            >
              执行必填、格式与敏感词校验
            </Button>
          </Panel>

          <Panel title="发布信息">
            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13px] text-muted-foreground">发布来源</span>
                <StatusTag tone="info">管理端发布</StatusTag>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13px] text-muted-foreground">内容类型</span>
                <StatusTag tone="warning">投票</StatusTag>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13px] text-muted-foreground">以官方账号发布</span>
                <Switch
                  checked={official}
                  onCheckedChange={setOfficial}
                  aria-label="以官方账号发布"
                />
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                发布人：{role.person}（{role.name}）。校验通过后直接发布，不存在提交审核、待审核、审批人或驳回环节。
              </p>
            </div>
          </Panel>
        </div>
      </div>

      <div className="sticky bottom-0 -mx-6 flex flex-wrap items-center justify-end gap-2 border-t border-border bg-surface/95 px-6 py-3 backdrop-blur-sm">
        <span className="mr-auto text-xs text-muted-foreground">
          发布后选项、模式、截止时间与结果全部锁定
        </span>
        <Button variant="outline" onClick={() => router.push('/forum/polls')}>
          取消
        </Button>
        <Button variant="outline" onClick={saveDraft}>
          <Save className="size-4" />
          保存草稿
        </Button>
        <Button variant="outline" onClick={openPreview}>
          <Eye className="size-4" />
          预览
        </Button>
        <Button onClick={openPublish}>
          <Send className="size-4" />
          直接发布
        </Button>
      </div>

      <ForumPreviewDialog
        open={preview}
        onOpenChange={setPreview}
        data={{
          type: '投票',
          title,
          body,
          images: [],
          cover,
          official,
          nickname: official ? '陕鼓融媒官方' : role.person,
          dept: '党群工作部',
          poll: { mode, optionMode, deadline: deadline.replace('T', ' '), options },
        }}
      />

      <PublishConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        onConfirm={publish}
        kind="投票帖"
        title={title}
        issues={issues ?? []}
      />
    </>
  )
}
