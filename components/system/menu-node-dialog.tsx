'use client'

import * as React from 'react'
import { toast } from 'sonner'

import {
  EMPTY_MENU_DRAFT,
  MENU_NODE_TYPES,
  createMenuNode,
  menuParentOptions,
  updateMenuNode,
  type MenuDraft,
  type MenuNode,
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

const selectClass =
  'h-8 w-full rounded-md border border-input bg-surface px-2 text-[13px] text-foreground focus:border-ring focus:outline-none'

/** 菜单节点新增/编辑弹窗 */
export function MenuNodeDialog({
  open,
  onOpenChange,
  editing,
  defaultParentId,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  /** 传 null 表示新增 */
  editing: MenuNode | null
  /** 新增时预设的父节点 */
  defaultParentId?: string | null
}) {
  const [draft, setDraft] = React.useState<MenuDraft>(EMPTY_MENU_DRAFT)
  const parents = menuParentOptions().filter((p) => p.id !== editing?.id)

  // 每次打开按当前编辑对象初始化表单
  React.useEffect(() => {
    if (!open) return
    if (editing) {
      setDraft({
        parentId: editing.parentId,
        name: editing.name,
        url: editing.url,
        sort: editing.sort,
        type: editing.type,
        enabled: editing.enabled,
        icon: editing.icon,
      })
    } else {
      setDraft({ ...EMPTY_MENU_DRAFT, parentId: defaultParentId ?? null })
    }
  }, [open, editing, defaultParentId])

  function patch(p: Partial<MenuDraft>) {
    setDraft((d) => ({ ...d, ...p }))
  }

  function submit() {
    const res = editing ? updateMenuNode(editing.id, draft) : createMenuNode(draft)
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
          <DialogTitle>{editing ? '编辑节点' : '新增节点'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="flex items-center gap-4">
            <span className="w-20 shrink-0 text-right text-[13px] text-muted-foreground">
              菜单类型
            </span>
            <div className="flex items-center gap-5">
              {MENU_NODE_TYPES.map((t) => (
                <label key={t} className="flex items-center gap-1.5 text-[13px]">
                  <input
                    type="radio"
                    name="menu-node-type"
                    value={t}
                    checked={draft.type === t}
                    onChange={() => patch({ type: t })}
                    className="size-3.5 accent-brand"
                  />
                  {t}
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-4">
            <span className="w-20 shrink-0 text-right text-[13px] text-muted-foreground">
              <span className="text-destructive">*</span>名称
            </span>
            <Input
              value={draft.name}
              placeholder="请输入菜单名称"
              onChange={(e) => patch({ name: e.target.value })}
            />
          </label>

          <label className="flex items-center gap-4">
            <span className="w-20 shrink-0 text-right text-[13px] text-muted-foreground">
              上级节点
            </span>
            <select
              value={draft.parentId ?? ''}
              aria-label="上级节点"
              onChange={(e) => patch({ parentId: e.target.value || null })}
              className={selectClass}
            >
              <option value="">顶级节点</option>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-4">
            <span className="w-20 shrink-0 text-right text-[13px] text-muted-foreground">
              url
            </span>
            <Input
              value={draft.url}
              placeholder="菜单类型为「菜单」时必填，如 /system/users"
              onChange={(e) => patch({ url: e.target.value })}
            />
          </label>

          <div className="flex items-center gap-4">
            <span className="w-20 shrink-0 text-right text-[13px] text-muted-foreground">
              是否使用
            </span>
            <div className="flex items-center gap-2">
              <Switch
                checked={draft.enabled}
                onCheckedChange={(v) => patch({ enabled: Boolean(v) })}
              />
              <span className="text-[13px] text-muted-foreground">
                {draft.enabled ? '是' : '否'}
              </span>
            </div>
          </div>

          <label className="flex items-center gap-4">
            <span className="w-20 shrink-0 text-right text-[13px] text-muted-foreground">
              排序号
            </span>
            <Input
              type="number"
              min={0}
              value={draft.sort}
              onChange={(e) => patch({ sort: Number.parseInt(e.target.value, 10) || 0 })}
            />
          </label>

          <label className="flex items-center gap-4">
            <span className="w-20 shrink-0 text-right text-[13px] text-muted-foreground">
              图标
            </span>
            <Input
              value={draft.icon}
              placeholder="lucide 图标名，如 Settings"
              onChange={(e) => patch({ icon: e.target.value })}
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
