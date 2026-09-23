'use client'

import * as React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  EMPTY_CODE_TYPE_DRAFT,
  createCodeType,
  newCodeItem,
  updateCodeType,
  type CodeItem,
  type CodeType,
  type CodeTypeDraft,
} from '@/lib/system-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
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
import { TableEmpty } from '@/components/content/table-shell'

/** 通用代码弹窗：主表单 + 明细行内编辑，提交时整体写回 store */
export function CodeTypeDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editing: CodeType | null
}) {
  const [draft, setDraft] = React.useState<CodeTypeDraft>(EMPTY_CODE_TYPE_DRAFT)

  React.useEffect(() => {
    if (!open) return
    setDraft(
      editing
        ? {
            code: editing.code,
            name: editing.name,
            sort: editing.sort,
            remark: editing.remark,
            // 复制一份明细，避免行内编辑直接改到 store 里的对象
            items: editing.items.map((i) => ({ ...i })),
          }
        : { ...EMPTY_CODE_TYPE_DRAFT, items: [] },
    )
  }, [open, editing])

  function patch(p: Partial<CodeTypeDraft>) {
    setDraft((d) => ({ ...d, ...p }))
  }

  function patchItem(id: string, p: Partial<CodeItem>) {
    setDraft((d) => ({
      ...d,
      items: d.items.map((i) => (i.id === id ? { ...i, ...p } : i)),
    }))
  }

  function addItem() {
    setDraft((d) => ({ ...d, items: [...d.items, newCodeItem(d.items.length)] }))
  }

  function removeItem(id: string) {
    setDraft((d) => ({ ...d, items: d.items.filter((i) => i.id !== id) }))
  }

  function submit() {
    const res = editing ? updateCodeType(editing.id, draft) : createCodeType(draft)
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
          <DialogTitle>{editing ? '编辑通用代码' : '新增通用代码'}</DialogTitle>
        </DialogHeader>

        <div className="scroll-thin -mx-1 flex-1 overflow-y-auto px-1">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex items-center gap-2">
              <span className="w-20 shrink-0 text-right text-[13px] text-muted-foreground">
                <span className="text-destructive">*</span>类型编号
              </span>
              <Input
                value={draft.code}
                placeholder="如 ORDER_STATUS"
                onChange={(e) => patch({ code: e.target.value })}
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="w-20 shrink-0 text-right text-[13px] text-muted-foreground">
                <span className="text-destructive">*</span>类型名称
              </span>
              <Input
                value={draft.name}
                placeholder="请输入类型名称"
                onChange={(e) => patch({ name: e.target.value })}
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="w-20 shrink-0 text-right text-[13px] text-muted-foreground">
                显示顺序
              </span>
              <Input
                type="number"
                min={0}
                value={draft.sort}
                onChange={(e) =>
                  patch({ sort: Number.parseInt(e.target.value, 10) || 0 })
                }
              />
            </label>
          </div>

          <label className="mt-3 flex items-start gap-2">
            <span className="w-20 shrink-0 pt-1.5 text-right text-[13px] text-muted-foreground">
              备注
            </span>
            <textarea
              value={draft.remark}
              rows={2}
              placeholder="请输入该代码类型的用途说明"
              onChange={(e) => patch({ remark: e.target.value })}
              className="scroll-thin w-full rounded-md border border-input bg-surface px-3 py-2 text-[13px] leading-relaxed text-foreground focus:border-ring focus:outline-none"
            />
          </label>

          <Tabs defaultValue="items" className="mt-4">
            <TabsList variant="line">
              <TabsTrigger value="items">明细（{draft.items.length}）</TabsTrigger>
            </TabsList>
            <TabsContent value="items" className="pt-2">
              <div className="mb-2">
                <Button size="sm" variant="outline" onClick={addItem}>
                  <Plus className="size-3.5" />
                  新增
                </Button>
              </div>

              <div className="rounded-md border border-border">
                <Table className="text-[13px]">
                  <TableHeader>
                    <TableRow className="bg-muted/60">
                      <TableHead className="w-32 pl-4">代码 Id</TableHead>
                      <TableHead className="w-40">
                        <span className="text-destructive">*</span>代码名称
                      </TableHead>
                      <TableHead className="w-24">是否使用</TableHead>
                      <TableHead className="w-40">代码值</TableHead>
                      <TableHead className="w-24">显示顺序</TableHead>
                      <TableHead className="min-w-48">备注</TableHead>
                      <TableHead className="w-16 pr-4 text-center">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {draft.items.length === 0 && (
                      <TableEmpty colSpan={7} text="暂无明细，可点击「新增」添加" />
                    )}
                    {draft.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="pl-4 font-mono text-xs text-muted-foreground">
                          {item.codeId}
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.name}
                            placeholder="代码名称"
                            onChange={(e) => patchItem(item.id, { name: e.target.value })}
                          />
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={item.enabled}
                            onCheckedChange={(v) =>
                              patchItem(item.id, { enabled: Boolean(v) })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.value}
                            placeholder="代码值"
                            onChange={(e) =>
                              patchItem(item.id, { value: e.target.value })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            value={item.sort}
                            onChange={(e) =>
                              patchItem(item.id, {
                                sort: Number.parseInt(e.target.value, 10) || 0,
                              })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.remark}
                            placeholder="备注"
                            onChange={(e) =>
                              patchItem(item.id, { remark: e.target.value })
                            }
                          />
                        </TableCell>
                        <TableCell className="pr-4 text-center">
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label={`删除明细 ${item.codeId}`}
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
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
