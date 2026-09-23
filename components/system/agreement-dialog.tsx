'use client'

import * as React from 'react'
import { toast } from 'sonner'

import { useApp } from '@/components/app-store'
import { RichTextEditor } from '@/components/content/rich-text-editor'
import {
  EMPTY_AGREEMENT_DRAFT,
  createAgreement,
  updateAgreement,
  type Agreement,
  type AgreementDraft,
} from '@/lib/system-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/** 协议新增/编辑弹窗：基本信息 + 富文本协议内容 */
export function AgreementDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editing: Agreement | null
}) {
  const { role } = useApp()
  const [draft, setDraft] = React.useState<AgreementDraft>(EMPTY_AGREEMENT_DRAFT)

  React.useEffect(() => {
    if (!open) return
    setDraft(
      editing
        ? {
            title: editing.title,
            code: editing.code,
            content: editing.content,
            systemShown: editing.systemShown,
          }
        : EMPTY_AGREEMENT_DRAFT,
    )
  }, [open, editing])

  function patch(p: Partial<AgreementDraft>) {
    setDraft((d) => ({ ...d, ...p }))
  }

  function submit() {
    const res = editing
      ? updateAgreement(editing.id, draft, role.person)
      : createAgreement(draft, role.person)
    if (!res.ok) {
      toast.error(res.message)
      return
    }
    toast.success(res.message)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88vh] flex-col sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{editing ? `${editing.title}详情` : '新增协议'}</DialogTitle>
        </DialogHeader>

        <div className="scroll-thin -mx-1 flex-1 overflow-y-auto px-1">
          <div className="mb-3 flex items-center gap-2">
            <span className="airflow-line h-3.5 w-[2px] rounded-full" />
            <h4 className="text-sm font-medium">基本信息</h4>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-right text-[13px] text-muted-foreground">
                <span className="text-destructive">*</span>协议标题
              </span>
              <Input
                value={draft.title}
                placeholder="请输入协议标题"
                onChange={(e) => patch({ title: e.target.value })}
              />
            </label>
            <label className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-right text-[13px] text-muted-foreground">
                <span className="text-destructive">*</span>协议编号
              </span>
              <Input
                value={draft.code}
                placeholder="如 PRIVACY-POLICY"
                onChange={(e) => patch({ code: e.target.value })}
              />
            </label>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <span className="w-20 shrink-0 text-right text-[13px] text-muted-foreground">
              系统展示
            </span>
            <div className="flex items-center gap-2">
              <Switch
                checked={draft.systemShown}
                onCheckedChange={(v) => patch({ systemShown: Boolean(v) })}
              />
              <span className="text-[13px] text-muted-foreground">
                {draft.systemShown
                  ? '是（APP 端引用，不可删除）'
                  : '否（仅后台留存）'}
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-start gap-3">
            <span className="w-20 shrink-0 pt-1.5 text-right text-[13px] text-muted-foreground">
              <span className="text-destructive">*</span>协议内容
            </span>
            <div className="min-w-0 flex-1">
              <RichTextEditor
                value={draft.content}
                onChange={(html) => patch({ content: html })}
                placeholder="请输入协议正文，可使用上方工具栏设置格式"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
          <Button onClick={submit}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
