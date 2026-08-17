'use client'

import * as React from 'react'
import { Info } from 'lucide-react'
import { toast } from 'sonner'

import { useApp } from '@/components/app-store'
import {
  EMPTY_ROLE_DRAFT,
  PERM_MODULES,
  ROLE_ACTIONS,
  createRole,
  updateRole,
  type RoleDraft,
  type SysRole,
} from '@/lib/system-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

/** 角色新增/编辑弹窗：基本信息 + 按模块分组的权限矩阵 */
export function RoleDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editing: SysRole | null
}) {
  const { role } = useApp()
  const [draft, setDraft] = React.useState<RoleDraft>(EMPTY_ROLE_DRAFT)
  const [tab, setTab] = React.useState(PERM_MODULES[0]?.title ?? '')

  React.useEffect(() => {
    if (!open) return
    setTab(PERM_MODULES[0]?.title ?? '')
    if (editing) {
      setDraft({
        code: editing.code,
        name: editing.name,
        system: editing.system,
        remark: editing.remark,
        perms: editing.perms,
      })
    } else {
      setDraft(EMPTY_ROLE_DRAFT)
    }
  }, [open, editing])

  function patch(p: Partial<RoleDraft>) {
    setDraft((d) => ({ ...d, ...p }))
  }

  function has(perm: string, action: string) {
    return draft.perms.includes(`${perm}:${action}`)
  }

  function toggle(perm: string, action: string, checked: boolean) {
    const code = `${perm}:${action}`
    patch({
      perms: checked
        ? [...new Set([...draft.perms, code])]
        : draft.perms.filter((p) => p !== code),
    })
  }

  /** 当前 Tab 内的全选 / 全不选 */
  function toggleModule(moduleTitle: string, checked: boolean) {
    const module = PERM_MODULES.find((m) => m.title === moduleTitle)
    if (!module) return
    const codes = module.items.flatMap((i) =>
      ROLE_ACTIONS.map((a) => `${i.perm}:${a.key}`),
    )
    patch({
      perms: checked
        ? [...new Set([...draft.perms, ...codes])]
        : draft.perms.filter((p) => !codes.includes(p)),
    })
  }

  function submit() {
    const res = editing
      ? updateRole(editing.id, draft, role.person)
      : createRole(draft, role.person)
    if (!res.ok) {
      toast.error(res.message)
      return
    }
    toast.success(res.message)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88vh] flex-col sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{editing ? '编辑角色' : '新增角色'}</DialogTitle>
        </DialogHeader>

        <div className="scroll-thin -mx-1 flex-1 overflow-y-auto px-1">
          <div className="flex items-start gap-2 rounded-md border border-border bg-accent/60 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0 text-brand" />
            <span>
              此处配置的是角色的细粒度功能权限，保存后立即生效。原型演示阶段，
              该配置不会改变你当前登录的演示角色实际可见的菜单，菜单与路由权限仍由右上角的
              「角色切换（仅供原型演示）」控制。
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-right text-[13px] text-muted-foreground">
                <span className="text-destructive">*</span>角色编号
              </span>
              <Input
                value={draft.code}
                placeholder="请输入角色编号，如 news"
                onChange={(e) => patch({ code: e.target.value })}
              />
            </label>
            <label className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-right text-[13px] text-muted-foreground">
                <span className="text-destructive">*</span>角色名称
              </span>
              <Input
                value={draft.name}
                placeholder="请输入角色名称"
                onChange={(e) => patch({ name: e.target.value })}
              />
            </label>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <span className="w-20 shrink-0 text-right text-[13px] text-muted-foreground">
              系统角色
            </span>
            <div className="flex items-center gap-2">
              <Switch
                checked={draft.system}
                onCheckedChange={(v) => patch({ system: Boolean(v) })}
              />
              <span className="text-[13px] text-muted-foreground">
                {draft.system ? '是（系统角色不可删除）' : '否'}
              </span>
            </div>
          </div>

          <label className="mt-3 flex items-start gap-3">
            <span className="w-20 shrink-0 pt-1.5 text-right text-[13px] text-muted-foreground">
              备注
            </span>
            <textarea
              value={draft.remark}
              rows={2}
              placeholder="请输入角色说明，便于其他管理员理解该角色职责"
              onChange={(e) => patch({ remark: e.target.value })}
              className="scroll-thin w-full rounded-md border border-input bg-surface px-3 py-2 text-[13px] leading-relaxed text-foreground focus:border-ring focus:outline-none"
            />
          </label>

          <div className="mt-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="airflow-line h-3.5 w-[2px] rounded-full" />
              <h4 className="text-sm font-medium">功能权限</h4>
              <span className="text-xs text-muted-foreground">
                已选 {draft.perms.length} 项
              </span>
            </div>

            <Tabs value={tab} onValueChange={(v) => setTab(v as string)}>
              <TabsList variant="line" className="flex-wrap">
                {PERM_MODULES.map((m) => (
                  <TabsTrigger key={m.title} value={m.title}>
                    {m.title}
                  </TabsTrigger>
                ))}
              </TabsList>

              {PERM_MODULES.map((m) => (
                <TabsContent key={m.title} value={m.title} className="pt-2">
                  <div className="mb-2 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleModule(m.title, true)}
                    >
                      全选
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleModule(m.title, false)}
                    >
                      全不选
                    </Button>
                  </div>

                  <div className="rounded-md border border-border">
                    <Table className="text-[13px]">
                      <TableHeader>
                        <TableRow className="bg-muted/60">
                          <TableHead className="w-44 pl-4">业务名称</TableHead>
                          <TableHead className="w-48">业务编号</TableHead>
                          <TableHead>权限</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {m.items.map((item) => (
                          <TableRow key={item.perm}>
                            <TableCell className="pl-4 font-medium">
                              {item.title}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {item.perm}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                                {ROLE_ACTIONS.map((a) => (
                                  <label
                                    key={a.key}
                                    className="flex items-center gap-1.5"
                                  >
                                    <Checkbox
                                      aria-label={`${item.title} ${a.label}`}
                                      checked={has(item.perm, a.key)}
                                      onCheckedChange={(v) =>
                                        toggle(item.perm, a.key, Boolean(v))
                                      }
                                    />
                                    {a.label}
                                  </label>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
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
