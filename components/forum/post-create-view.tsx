'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, ImagePlus, Lock, Save, Send, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

import { useApp } from '@/components/app-store'
import { PageHeader, Panel, StatusTag } from '@/components/layout/page-frame'
import { RichTextEditor } from '@/components/content/rich-text-editor'
import { PublishConfirmDialog, ValidationNotice } from '@/components/forum/forum-dialogs'
import { ForumPreviewDialog } from '@/components/forum/forum-preview'
import {
  createForumPost,
  validatePost,
  type PostDraftInput,
  type ValidationIssue,
} from '@/lib/forum-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

void _unusedGovern

const MAX_IMAGES = 9

/**
 * 新建普通图文帖子：标题、正文、可选图片。
 * 校验通过后直接发布，没有提交审核 / 待审核 / 审批人 / 驳回。
 */
export function PostCreateView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { role } = useApp()
  const imageRef = React.useRef<HTMLInputElement>(null)

  const [title, setTitle] = React.useState('')
  const [body, setBody] = React.useState('')
  const [images, setImages] = React.useState<string[]>([])
  const [official, setOfficial] = React.useState(searchParams.get('official') === '1')
  const [issues, setIssues] = React.useState<ValidationIssue[] | null>(null)
  const [preview, setPreview] = React.useState(false)
  const [confirm, setConfirm] = React.useState(false)

  const input: PostDraftInput = { title, body, images, official }
  const actor = { person: role.person, role: role.name }

  function runCheck(): ValidationIssue[] {
    const found = validatePost(input)
    setIssues(found)
    return found
  }

  function pickImages(files: FileList | null) {
    if (!files || files.length === 0) return
    const picked = Array.from(files).map((f) => URL.createObjectURL(f))
    setImages((prev) => {
      const next = [...prev, ...picked].slice(0, MAX_IMAGES)
      if (prev.length + picked.length > MAX_IMAGES) {
        toast.error(`图片最多上传 ${MAX_IMAGES} 张，超出部分已忽略`)
      }
      return next
    })
    if (imageRef.current) imageRef.current.value = ''
  }

  function saveDraft() {
    const found = runCheck()
    const blocking = found.filter((i) => i.field === '敏感词' || i.field === '标题')
    if (blocking.length > 0) {
      toast.error('校验未通过，请按提示修改后再保存草稿')
      return
    }
    const post = createForumPost(input, false, actor)
    toast.success('已保存为草稿')
    router.push(`/forum/posts/${post.id}`)
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
    const post = createForumPost(input, true, actor)
    setConfirm(false)
    toast.success('图文帖已直接发布，发布后内容只读')
    router.push(`/forum/posts/${post.id}`)
  }

  return (
    <>
      <PageHeader
        breadcrumb={['论坛管理', '帖子管理', '新建普通图文帖子']}
        title="新建普通图文帖子"
        actions={<StatusTag tone="neutral">当前角色：{role.name}</StatusTag>}
      />

      <p className="mb-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/8 px-4 py-2.5 text-xs leading-relaxed text-warning">
        <Lock className="mt-0.5 size-3.5 shrink-0" />
        普通图文帖发布后不可编辑；如需修正，请先隐藏或逻辑删除原帖，再新建并发布修正版。新帖生成新的内容
        ID，原帖浏览、点赞与评论数据不会迁移。
      </p>

      <div className="grid gap-4 pb-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-4">
          <Panel title="帖子内容">
            <div className="grid gap-4">
              <div className="grid gap-1.5">
                <label htmlFor="post-title" className="text-[13px]">
                  <span className="text-destructive">*</span>标题
                </label>
                <Input
                  id="post-title"
                  value={title}
                  maxLength={60}
                  placeholder="请输入帖子标题（4-60 字）"
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
                  placeholder="请输入正文内容（不少于 10 字），可使用上方工具栏设置格式"
                />
              </div>
            </div>
          </Panel>

          <Panel
            title="图片（可选）"
            extra={
              <Button
                size="xs"
                variant="outline"
                onClick={() => imageRef.current?.click()}
                disabled={images.length >= MAX_IMAGES}
              >
                <ImagePlus className="size-3.5" />
                上传图片
              </Button>
            }
          >
            <input
              ref={imageRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => pickImages(e.target.files)}
            />
            {images.length === 0 ? (
              <button
                type="button"
                onClick={() => imageRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border py-10 text-muted-foreground transition-colors hover:border-brand/50 hover:text-brand"
              >
                <ImagePlus className="size-6" />
                <span className="text-[13px]">点击上传图片，最多 {MAX_IMAGES} 张（可选）</span>
              </button>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {images.map((src, i) => (
                  <div
                    key={`${src}-${i}`}
                    className="relative aspect-square overflow-hidden rounded-md border border-border"
                  >
                    {/* 本地上传图片为 blob 地址，使用原生 img */}
                    <img
                      src={src || '/placeholder.svg'}
                      alt={`帖子图片 ${i + 1}`}
                      className="absolute inset-0 size-full object-cover"
                    />
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      aria-label={`移除图片 ${i + 1}`}
                      className="absolute top-1 right-1 bg-foreground/55 text-surface hover:bg-foreground/70 hover:text-surface"
                      onClick={() => setImages((p) => p.filter((_, idx) => idx !== i))}
                    >
                      <X />
                    </Button>
                  </div>
                ))}
                {images.length < MAX_IMAGES && (
                  <button
                    type="button"
                    onClick={() => imageRef.current?.click()}
                    className="flex aspect-square flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-muted-foreground transition-colors hover:border-brand/50 hover:text-brand"
                  >
                    <ImagePlus className="size-5" />
                    <span className="text-xs">添加</span>
                  </button>
                )}
              </div>
            )}
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              图片为可选项，建议单张不超过 5 MB；图文帖不含投票选项、截止时间等投票字段。
            </p>
          </Panel>
        </div>

        <div className="grid gap-4 self-start">
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
                <StatusTag tone="neutral">普通图文</StatusTag>
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
          发布后只读 · 修正需隐藏或逻辑删除原帖后重新发布
        </span>
        <Button variant="outline" onClick={() => router.push('/forum/posts')}>
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
          type: '普通图文',
          title,
          body,
          images,
          cover: '',
          official,
          nickname: official ? '陕鼓融媒官方' : role.person,
          dept: '党群工作部',
        }}
      />

      <PublishConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        onConfirm={publish}
        kind="普通图文帖"
        title={title}
        issues={issues ?? []}
      />
    </>
  )
}
