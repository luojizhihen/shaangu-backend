'use client'

import * as React from 'react'
import { toast } from 'sonner'

import {
  EMPTY_AD_DRAFT,
  createAdSlot,
  updateAdSlot,
  type AdSlot,
  type AdSlotDraft,
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

/** 广告组件新增/编辑弹窗 */
export function AdSlotDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editing: AdSlot | null
}) {
  const [draft, setDraft] = React.useState<AdSlotDraft>(EMPTY_AD_DRAFT)

  React.useEffect(() => {
    if (!open) return
    setDraft(
      editing
        ? {
            instance: editing.instance,
            component: editing.component,
            remark: editing.remark,
          }
        : EMPTY_AD_DRAFT,
    )
  }, [open, editing])

  function patch(p: Partial<AdSlotDraft>) {
    setDraft((d) => ({ ...d, ...p }))
  }

  function submit() {
    const res = editing ? updateAdSlot(editing.id, draft) : createAdSlot(draft)
    if (!res.ok) {
      toast.error(res.message)
      return
    }
    toast.success(res.message)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? '编辑广告组件' : '新增广告组件'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          <label className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-right text-[13px] text-muted-foreground">
              <span className="text-destructive">*</span>实例名称
            </span>
            <Input
              value={draft.instance}
              placeholder="大写字母与下划线，如 INDEX_BANNER"
              onChange={(e) => patch({ instance: e.target.value.toUpperCase() })}
            />
          </label>

          <label className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-right text-[13px] text-muted-foreground">
              <span className="text-destructive">*</span>系统组件名称
            </span>
            <Input
              value={draft.component}
              placeholder="如 APP 首页顶部轮播"
              onChange={(e) => patch({ component: e.target.value })}
            />
          </label>

          <label className="flex items-start gap-3">
            <span className="w-24 shrink-0 pt-1.5 text-right text-[13px] text-muted-foreground">
              备注
            </span>
            <textarea
              value={draft.remark}
              rows={3}
              placeholder="请输入该广告位的用途说明与投放约束"
              onChange={(e) => patch({ remark: e.target.value })}
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
