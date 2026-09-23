'use client'

import * as React from 'react'
import { toast } from 'sonner'

import {
  EMPTY_USER_DRAFT,
  USER_DEPTS,
  createUser,
  roleNameOptions,
  updateUser,
  type SysUser,
  type UserDraft,
} from '@/lib/system-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const selectClass =
  'h-8 w-full rounded-md border border-input bg-surface px-2 text-[13px] text-foreground focus:border-ring focus:outline-none'

function Row({ label, required, children }: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-right text-[13px] text-muted-foreground">
        {required && <span className="text-destructive">*</span>}
        {label}
      </span>
      {children}
    </label>
  )
}

/** 后台用户新增/编辑弹窗 */
export function UserDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editing: SysUser | null
}) {
  const [draft, setDraft] = React.useState<UserDraft>(EMPTY_USER_DRAFT)
  const roles = roleNameOptions()

  React.useEffect(() => {
    if (!open) return
    if (editing) {
      setDraft({
        account: editing.account,
        name: editing.name,
        dept: editing.dept,
        position: editing.position,
        email: editing.email,
        enabled: editing.enabled,
        roleNames: editing.roleNames,
      })
    } else {
      setDraft(EMPTY_USER_DRAFT)
    }
  }, [open, editing])

  function patch(p: Partial<UserDraft>) {
    setDraft((d) => ({ ...d, ...p }))
  }

  function toggleRole(name: string, checked: boolean) {
    patch({
      roleNames: checked
        ? [...new Set([...draft.roleNames, name])]
        : draft.roleNames.filter((r) => r !== name),
    })
  }

  function submit() {
    const res = editing ? updateUser(editing.id, draft) : createUser(draft)
    if (!res.ok) {
      toast.error(res.message)
      return
    }
    toast.success(res.message)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? '编辑用户' : '新增用户'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <Row label="用户账号" required>
            <Input
              value={draft.account}
              placeholder="请输入用户账号"
              onChange={(e) => patch({ account: e.target.value })}
            />
          </Row>
          <Row label="用户名称" required>
            <Input
              value={draft.name}
              placeholder="请输入用户名称"
              onChange={(e) => patch({ name: e.target.value })}
            />
          </Row>
          <Row label="部门">
            <select
              value={draft.dept}
              aria-label="部门"
              onChange={(e) => patch({ dept: e.target.value })}
              className={selectClass}
            >
              {USER_DEPTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Row>
          <Row label="职位">
            <Input
              value={draft.position}
              placeholder="请输入职位"
              onChange={(e) => patch({ position: e.target.value })}
            />
          </Row>
          <Row label="邮箱">
            <Input
              value={draft.email}
              placeholder="name@shaangu.com"
              onChange={(e) => patch({ email: e.target.value })}
            />
          </Row>

        </div>

        <div className="flex items-center gap-3">
          <span className="w-20 shrink-0 text-right text-[13px] text-muted-foreground">
            是否使用
          </span>
          <div className="flex items-center gap-2">
            <Switch
              checked={draft.enabled}
              onCheckedChange={(v) => patch({ enabled: Boolean(v) })}
            />
            <span className="text-[13px] text-muted-foreground">
              {draft.enabled ? '是（可登录管理端）' : '否（停用后无法登录）'}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="w-20 shrink-0 pt-1 text-right text-[13px] text-muted-foreground">
            关联角色
          </span>
          <div className="grid flex-1 grid-cols-2 gap-y-2 rounded-md border border-border bg-muted/40 px-3 py-2.5 sm:grid-cols-3">
            {roles.map((r) => (
              <label key={r} className="flex items-center gap-1.5 text-[13px]">
                <Checkbox
                  checked={draft.roleNames.includes(r)}
                  onCheckedChange={(v) => toggleRole(r, Boolean(v))}
                />
                {r}
              </label>
            ))}
          </div>
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
