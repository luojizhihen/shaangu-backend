'use client'

import * as React from 'react'
import { AlertTriangle, CheckCircle2, Lock, ShieldAlert } from 'lucide-react'

import type { ValidationIssue } from '@/lib/forum-store'
import { StatusTag } from '@/components/layout/page-frame'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/** 表单内的校验结果提示：命中敏感词一律阻止提交，不提供替换或送审 */
export function ValidationNotice({
  issues,
  checked,
}: {
  issues: ValidationIssue[]
  checked: boolean
}) {
  if (!checked) {
    return (
      <div className="flex items-start gap-2 rounded-md border border-border bg-muted/50 px-3 py-2.5">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          保存草稿或发布时将执行必填、格式与敏感词校验。命中敏感词会阻止提交并提示修改，不做自动替换，也不进入人工审核。
        </p>
      </div>
    )
  }
  if (issues.length === 0) {
    return (
      <div className="flex items-start gap-2 rounded-md border border-brand-green/30 bg-brand-green/8 px-3 py-2.5">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-green" />
        <p className="text-xs leading-relaxed text-brand-green">
          必填、格式与敏感词校验全部通过，可直接发布。
        </p>
      </div>
    )
  }
  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/8 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-4 shrink-0 text-destructive" />
        <p className="text-xs text-destructive">
          校验未通过，共 {issues.length} 项需要修改后重新提交
        </p>
      </div>
      <ul className="mt-2 grid gap-1">
        {issues.map((issue, i) => (
          <li
            key={`${issue.field}-${i}`}
            className="flex items-start gap-2 text-xs leading-relaxed text-destructive"
          >
            <span className="mt-1 size-1 shrink-0 rounded-full bg-destructive" />
            <span>
              <span className="font-medium">{issue.field}</span>：{issue.message}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** 直接发布前的影响确认：明确发布后永久只读 */
export function PublishConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  kind,
  title,
  issues,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onConfirm: () => void
  kind: '普通图文帖' | '投票帖'
  title: string
  issues: ValidationIssue[]
}) {
  const [ack, setAck] = React.useState(false)
  const blocked = issues.length > 0

  React.useEffect(() => {
    if (open) setAck(false)
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>确认直接发布{kind}</DialogTitle>
          <DialogDescription>
            校验通过后内容立即对全体员工可见，不经过人工审核环节。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="rounded-md border border-border bg-muted/50 px-3 py-2.5">
            <p className="text-[13px] text-foreground">{title || '（未填写标题）'}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              发布来源：管理端发布 · 内容类型：{kind === '投票帖' ? '投票' : '普通图文'}
            </p>
          </div>

          <ValidationNotice issues={issues} checked />

          <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/8 px-3 py-2.5">
            <Lock className="mt-0.5 size-4 shrink-0 text-warning" />
            <div className="text-xs leading-relaxed text-warning">
              <p>发布影响确认：</p>
              <ul className="mt-1 grid gap-0.5">
                <li>· 发布后内容永久只读，没有编辑、保存修改、撤回发布或退回草稿。</li>
                {kind === '投票帖' && (
                  <li>· 投票选项、单/多选、截止时间与投票结果全部锁定，不可修改或清空。</li>
                )}
                <li>· 需要修正时只能隐藏或逻辑删除原帖，再新建并发布新帖。</li>
                <li>· 新帖生成新的内容 ID，浏览、点赞、评论与投票结果均不迁移。</li>
              </ul>
            </div>
          </div>

          {!blocked && (
            <label className="flex items-start gap-2 text-[13px] leading-relaxed">
              <Checkbox
                checked={ack}
                onCheckedChange={(v) => setAck(Boolean(v))}
                aria-label="确认已了解发布后只读"
                className="mt-0.5"
              />
              <span>我已了解发布后内容不可编辑，修正需隐藏或逻辑删除原帖后重新发布。</span>
            </label>
          )}
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>返回修改</DialogClose>
          <Button disabled={blocked || !ack} onClick={onConfirm}>
            确认发布
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** 隐藏 / 逻辑删除：必须填写原因并二次确认 */
export function GovernReasonDialog({
  open,
  onOpenChange,
  action,
  targets,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  action: '隐藏' | '逻辑删除'
  targets: string[]
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = React.useState('')
  const [ack, setAck] = React.useState(false)
  const isDelete = action === '逻辑删除'
  const tooShort = reason.trim().length < 5

  React.useEffect(() => {
    if (open) {
      setReason('')
      setAck(false)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{action}确认</DialogTitle>
          <DialogDescription>
            {isDelete
              ? '逻辑删除为软删除：原始内容、互动数据与投票结果全部保留，不做物理删除。'
              : '隐藏后用户端不再展示，可随时恢复；隐藏原因会一并留痕。'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="rounded-md border border-border bg-muted/50 px-3 py-2.5">
            <p className="mb-1 text-xs text-muted-foreground">
              待处理对象（{targets.length} 条）
            </p>
            <ul className="scroll-thin max-h-28 overflow-y-auto text-[13px]">
              {targets.map((t, i) => (
                <li key={`${t}-${i}`} className="truncate py-0.5">
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="govern-reason" className="text-[13px]">
              <span className="text-destructive">*</span>
              {action}原因
            </label>
            <textarea
              id="govern-reason"
              rows={3}
              maxLength={200}
              value={reason}
              placeholder={`请填写${action}原因（不少于 5 个字），原因将写入治理日志`}
              onChange={(e) => setReason(e.target.value)}
              className="scroll-thin w-full rounded-md border border-input bg-surface px-3 py-2 text-[13px] leading-relaxed text-foreground focus:border-ring focus:outline-none"
            />
            <p className="text-xs text-muted-foreground">{reason.trim().length} / 200</p>
          </div>

          <label className="flex items-start gap-2 text-[13px] leading-relaxed">
            <Checkbox
              checked={ack}
              onCheckedChange={(v) => setAck(Boolean(v))}
              aria-label={`二次确认${action}`}
              className="mt-0.5"
            />
            <span>
              {isDelete
                ? '我确认执行逻辑删除，理解该操作不可恢复，需要修正时应新建并发布修正版内容。'
                : '我确认执行隐藏操作，理解隐藏期间用户端不再展示该内容。'}
            </span>
          </label>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>取消</DialogClose>
          <Button
            variant={isDelete ? 'destructive' : 'default'}
            disabled={tooShort || !ack}
            onClick={() => onConfirm(reason.trim())}
          >
            确认{action}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** 官方回复：以官方身份追加回复，不修改原帖正文 */
export function OfficialReplyDialog({
  open,
  onOpenChange,
  postTitle,
  existing,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  postTitle: string
  existing?: string
  onConfirm: (content: string) => void
}) {
  const [content, setContent] = React.useState('')

  React.useEffect(() => {
    if (open) setContent(existing ?? '')
  }, [open, existing])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>官方回复</DialogTitle>
          <DialogDescription>
            以「陕鼓融媒官方」身份在帖子下方追加回复，不修改原帖正文。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="rounded-md border border-border bg-muted/50 px-3 py-2">
            <p className="mb-0.5 text-xs text-muted-foreground">所属内容</p>
            <p className="truncate text-[13px]">{postTitle}</p>
          </div>
          {existing && <StatusTag tone="info">该内容已有官方回复，提交后将覆盖</StatusTag>}
          <div className="grid gap-1.5">
            <label htmlFor="official-reply" className="text-[13px]">
              <span className="text-destructive">*</span>回复内容
            </label>
            <textarea
              id="official-reply"
              rows={4}
              maxLength={300}
              value={content}
              placeholder="请输入官方回复内容，提交前将执行敏感词校验"
              onChange={(e) => setContent(e.target.value)}
              className="scroll-thin w-full rounded-md border border-input bg-surface px-3 py-2 text-[13px] leading-relaxed text-foreground focus:border-ring focus:outline-none"
            />
            <p className="text-xs text-muted-foreground">{content.trim().length} / 300</p>
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>取消</DialogClose>
          <Button
            disabled={content.trim().length < 5}
            onClick={() => onConfirm(content.trim())}
          >
            发布官方回复
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** 真实人员信息抽屉内容共用的字段行 */
export function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border py-2 last:border-b-0">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-[13px]">{value}</span>
    </div>
  )
}
