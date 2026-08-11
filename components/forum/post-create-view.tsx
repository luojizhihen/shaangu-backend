'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ImagePlus, Save, Send, X } from 'lucide-react'
import { toast } from 'sonner'

import { useApp } from '@/components/app-store'
import { PageHeader, Panel, StatusTag } from '@/components/layout/page-frame'
import { RichTextEditor } from '@/components/content/rich-text-editor'
import { PublishConfirmDialog } from '@/components/forum/forum-dialogs'
import {
  createForumPost,
  validatePost,
  type PostDraftInput,
  type ValidationIssue,
} from '@/lib/forum-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

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
          </Panel>
        </div>

        <div className="grid gap-4 self-start">
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
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13px] text-muted-foreground">发布人</span>
                <span className="text-[13px]">{role.person}</span>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <div className="sticky bottom-0 -mx-6 flex flex-wrap items-center justify-end gap-2 border-t border-border bg-surface/95 px-6 py-3 backdrop-blur-sm">
        <Button variant="outline" onClick={() => router.push('/forum/posts')}>
          取消
        </Button>
        <Button variant="outline" onClick={saveDraft}>
          <Save className="size-4" />
          保存草稿
        </Button>
        <Button onClick={openPublish}>
          <Send className="size-4" />
          直接发布
        </Button>
      </div>

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
