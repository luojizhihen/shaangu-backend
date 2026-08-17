'use client'

import * as React from 'react'
import { ImagePlus, X } from 'lucide-react'
import { toast } from 'sonner'

import {
  EMPTY_PARAM_DRAFT,
  createParam,
  updateParam,
  type ParamDraft,
  type SysParam,
} from '@/lib/system-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/** 系统参数新增/编辑弹窗 */
export function ParamDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editing: SysParam | null
}) {
  const [draft, setDraft] = React.useState<ParamDraft>(EMPTY_PARAM_DRAFT)

  React.useEffect(() => {
    if (!open) return
    setDraft(
      editing
        ? {
            key: editing.key,
            value: editing.value,
            image: editing.image,
            description: editing.description,
          }
        : EMPTY_PARAM_DRAFT,
    )
  }, [open, editing])

  function patch(p: Partial<ParamDraft>) {
    setDraft((d) => ({ ...d, ...p }))
  }

  function submit() {
    const res = editing ? updateParam(editing.id, draft) : createParam(draft)
    if (!res.ok) {
      toast.error(res.message)
      return
    }
    toast.success(res.message)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? '编辑参数' : '新增参数'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          <label className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-right text-[13px] text-muted-foreground">
              <span className="text-destructive">*</span>参数名
            </span>
            <Input
              value={draft.key}
              placeholder="请输入参数名，如 image.size"
              onChange={(e) => patch({ key: e.target.value })}
            />
          </label>

          <label className="flex items-start gap-3">
            <span className="w-20 shrink-0 pt-1.5 text-right text-[13px] text-muted-foreground">
              <span className="text-destructive">*</span>参数值
            </span>
            <textarea
              value={draft.value}
              rows={3}
              placeholder="请输入参数值，支持 JSON 等长文本"
              onChange={(e) => patch({ value: e.target.value })}
              className="scroll-thin w-full rounded-md border border-input bg-surface px-3 py-2 font-mono text-xs leading-relaxed text-foreground focus:border-ring focus:outline-none"
            />
          </label>

          <div className="flex items-start gap-3">
            <span className="w-20 shrink-0 pt-1.5 text-right text-[13px] text-muted-foreground">
              参数图片
            </span>
            {draft.image ? (
              <div className="flex items-center gap-2">
                <span className="rounded-md border border-border bg-muted px-2.5 py-1.5 font-mono text-xs text-muted-foreground">
                  {draft.image}
                </span>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="移除图片"
                  onClick={() => patch({ image: '' })}
                >
                  <X />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  // 原型环境不接对象存储，用占位路径模拟上传结果
                  patch({ image: `/images/param-${Date.now()}.png` })
                  toast.success('已选择图片（原型环境为占位路径，不做真实上传）')
                }}
                className="flex size-24 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-input bg-muted/40 text-xs text-muted-foreground transition-colors hover:border-brand hover:text-brand"
              >
                <ImagePlus className="size-5" />
                上传
              </button>
            )}
          </div>

          <label className="flex items-start gap-3">
            <span className="w-20 shrink-0 pt-1.5 text-right text-[13px] text-muted-foreground">
              描述
            </span>
            <textarea
              value={draft.description}
              rows={2}
              placeholder="请输入参数用途说明"
              onChange={(e) => patch({ description: e.target.value })}
              className="scroll-thin w-full rounded-md border border-input bg-surface px-3 py-2 text-[13px] leading-relaxed text-foreground focus:border-ring focus:outline-none"
            />
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={submit}>提交</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
