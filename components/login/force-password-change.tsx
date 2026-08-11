'use client'

import * as React from 'react'
import { Check, KeyRound, Loader2, X } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { INITIAL_PASSWORD, checkPasswordRules } from '@/lib/login-security'

type Props = {
  open: boolean
  account: string
  /** 触发原因：首次登录 或 密码已被重置 */
  reason: 'first-login' | 'password-reset'
  onConfirm: (nextPassword: string) => void
  onCancel: () => void
}

export function ForcePasswordChange({ open, account, reason, onConfirm, onCancel }: Props) {
  const [oldPwd, setOldPwd] = React.useState('')
  const [next, setNext] = React.useState('')
  const [confirm, setConfirm] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setOldPwd('')
      setNext('')
      setConfirm('')
      setError(null)
      setSaving(false)
    }
  }, [open])

  const rules = checkPasswordRules(next)
  const rulesPass = rules.every((r) => r.pass)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (oldPwd !== INITIAL_PASSWORD) {
      setError('原密码不正确，请输入公司下发的初始密码。')
      return
    }
    if (!rulesPass) {
      setError('新密码不符合密码复杂度要求。')
      return
    }
    if (next !== confirm) {
      setError('两次输入的新密码不一致。')
      return
    }
    setSaving(true)
    window.setTimeout(() => onConfirm(next), 500)
  }

  return (
    <Dialog open={open} dismissible={false}>
      <DialogContent showCloseButton={false} className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-4 text-brand" />
            修改初始密码
          </DialogTitle>
          <DialogDescription className="leading-relaxed">
            {reason === 'first-login'
              ? `账号 ${account} 为首次登录，`
              : `账号 ${account} 的密码已被管理员重置，`}
            按安全策略必须先修改初始密码后才能进入平台。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="old-pwd">原密码（初始密码）</Label>
            <Input
              id="old-pwd"
              type="password"
              value={oldPwd}
              onChange={(e) => setOldPwd(e.target.value)}
              placeholder="请输入初始密码"
              className="h-9"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-pwd">新密码</Label>
            <Input
              id="new-pwd"
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              placeholder="请输入新密码"
              className="h-9"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm-pwd">确认新密码</Label>
            <Input
              id="confirm-pwd"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="请再次输入新密码"
              className="h-9"
            />
          </div>

          <ul className="flex flex-col gap-1 rounded-md border border-border bg-surface px-3 py-2.5">
            {rules.map((r) => (
              <li
                key={r.label}
                className={`flex items-center gap-2 text-xs leading-relaxed ${
                  r.pass ? 'text-brand-green' : 'text-muted-foreground'
                }`}
              >
                {r.pass ? (
                  <Check className="size-3.5 shrink-0" />
                ) : (
                  <X className="size-3.5 shrink-0" />
                )}
                {r.label}
              </li>
            ))}
          </ul>

          {error && (
            <p role="alert" className="text-[13px] text-destructive">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
              退出登录
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {saving ? '正在保存…' : '确认修改并登录'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
