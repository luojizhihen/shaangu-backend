'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { CircleSlash, Plus, ShieldCheck, SquarePen, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { useApp } from '@/components/app-store'
import {
  NativeSelect,
  PageHeader,
  Panel,
  StatusTag,
} from '@/components/layout/page-frame'
import {
  FilterBar,
  FilterField,
  Pagination,
  TableEmpty,
  Toolbar,
  useTableState,
} from '@/components/content/table-shell'
import { breadcrumbFor } from '@/lib/nav'
import {
  createRule,
  removeRules,
  toggleRules,
  updateRule,
  usePoints,
  validateRule,
  type PointsRule,
  type RuleDraft,
} from '@/lib/points-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

const EMPTY_QUERY = { name: '', code: '', enabled: '全部状态' }

const EMPTY_DRAFT: RuleDraft = {
  sort: 1,
  name: '',
  code: '',
  expression: '',
  dailyLimit: 10,
  remark: '',
  enabled: true,
}

export default function PointsRulesPage() {
  const pathname = usePathname()
  const { role } = useApp()
  const { rules } = usePoints()

  const [name, setName] = React.useState('')
  const [code, setCode] = React.useState('')
  const [enabled, setEnabled] = React.useState('全部状态')
  const [query, setQuery] = React.useState(EMPTY_QUERY)

  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<PointsRule | null>(null)
  const [draft, setDraft] = React.useState<RuleDraft>(EMPTY_DRAFT)
  const [issues, setIssues] = React.useState<string[]>([])

  const [removing, setRemoving] = React.useState<string[]>([])

  const rows = React.useMemo(
    () =>
      rules.filter((r) => {
        const hitName = r.name.includes(query.name.trim())
        const hitCode = r.code.toUpperCase().includes(query.code.trim().toUpperCase())
        const hitEnabled =
          query.enabled === '全部状态' ||
          (query.enabled === '已启用' ? r.enabled : !r.enabled)
        return hitName && hitCode && hitEnabled
      }),
    [rules, query],
  )

  const table = useTableState(rows)

  function search() {
    setQuery({ name, code, enabled })
    table.setPage(1)
  }

  function reset() {
    setName('')
    setCode('')
    setEnabled('全部状态')
    setQuery(EMPTY_QUERY)
  }

  function openCreate() {
    setEditing(null)
    setDraft({ ...EMPTY_DRAFT, sort: rules.length + 1 })
    setIssues([])
    setFormOpen(true)
  }

  function openEdit(r: PointsRule) {
    setEditing(r)
    setDraft({
      sort: r.sort,
      name: r.name,
      code: r.code,
      expression: r.expression,
      dailyLimit: r.dailyLimit,
      remark: r.remark,
      enabled: r.enabled,
    })
    setIssues([])
    setFormOpen(true)
  }

  function submit() {
    const found = validateRule(draft, rules, editing?.id)
    setIssues(found)
    if (found.length > 0) {
      toast.error(`校验未通过，共 ${found.length} 项`)
      return
    }
    if (editing) {
      updateRule(editing.id, draft, role.person)
      toast.success(`已保存规则「${draft.name}」，仅对此后产生的积分生效`)
    } else {
      createRule(draft, role.person)
      toast.success(`已新增规则「${draft.name}」`)
    }
    setFormOpen(false)
  }

  function batchToggle(on: boolean) {
    const hit = toggleRules(table.selected, on, role.person)
    toast.success(`已${on ? '启用' : '停用'} ${hit.length} 条规则`)
    table.clear()
  }

  return (
    <>
      <PageHeader
        breadcrumb={breadcrumbFor(pathname)}
        title="积分规则"
      />

      <FilterBar onSearch={search} onReset={reset}>
        <FilterField label="积分名称">
          <Input
            value={name}
            placeholder="请输入积分名称"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) search()
            }}
          />
        </FilterField>
        <FilterField label="积分编码">
          <Input
            value={code}
            placeholder="请输入积分编码"
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) search()
            }}
          />
        </FilterField>
        <FilterField label="启用状态">
          <NativeSelect
            aria-label="启用状态"
            value={enabled}
            onChange={setEnabled}
            options={['全部状态', '已启用', '已停用']}
          />
        </FilterField>
      </FilterBar>

      <Panel bodyClassName="p-0">
        <Toolbar>
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-3.5" />
            新增
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={table.selected.length === 0}
            onClick={() => batchToggle(true)}
          >
            <ShieldCheck className="size-3.5" />
            批量启用
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={table.selected.length === 0}
            onClick={() => batchToggle(false)}
          >
            <CircleSlash className="size-3.5" />
            批量停用
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={table.selected.length === 0}
            onClick={() => setRemoving(table.selected)}
          >
            <Trash2 className="size-3.5" />
            删除
          </Button>
        </Toolbar>

        <Table className="text-[13px]">
          <TableHeader>
            <TableRow className="bg-muted/60">
              <TableHead className="w-14 pl-4">序号</TableHead>
              <TableHead className="w-10">
                <Checkbox
                  aria-label="全选本页"
                  checked={table.allChecked}
                  onCheckedChange={(v) => table.togglePage(Boolean(v))}
                />
              </TableHead>
              <TableHead className="w-14">排序</TableHead>
              <TableHead className="w-32">积分名称</TableHead>
              <TableHead className="w-28">积分编码</TableHead>
              <TableHead className="w-24">规则表达式</TableHead>
              <TableHead className="w-24">单人每日上限</TableHead>
              <TableHead>备注</TableHead>
              <TableHead className="w-20">启用状态</TableHead>
              <TableHead className="w-16 pr-4 text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.pageRows.length === 0 && (
              <TableEmpty colSpan={10} text="没有符合条件的积分规则" />
            )}
            {table.pageRows.map((r, i) => (
              <TableRow key={r.id}>
                <TableCell className="pl-4 text-muted-foreground">
                  {(table.page - 1) * table.pageSize + i + 1}
                </TableCell>
                <TableCell>
                  <Checkbox
                    aria-label={`选择 ${r.name}`}
                    checked={table.selected.includes(r.id)}
                    onCheckedChange={(v) => table.toggleRow(r.id, Boolean(v))}
                  />
                </TableCell>
                <TableCell className="text-muted-foreground">{r.sort}</TableCell>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="font-mono text-xs">{r.code}</TableCell>
                <TableCell className="font-mono text-xs">{r.expression}</TableCell>
                <TableCell className="text-xs">
                  {r.dailyLimit < 0 ? (
                    '不限'
                  ) : (
                    <>
                      <span className="font-mono">{r.dailyLimit}</span> 分
                    </>
                  )}
                </TableCell>
                <TableCell>
                  <span className="line-clamp-2 whitespace-normal text-muted-foreground">
                    {r.remark || '—'}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusTag tone={r.enabled ? 'success' : 'neutral'}>
                    {r.enabled ? '已启用' : '已停用'}
                  </StatusTag>
                </TableCell>
                <TableCell className="pr-4">
                  <div className="flex items-center justify-center">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="编辑"
                      onClick={() => openEdit(r)}
                    >
                      <SquarePen />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Pagination
          total={rows.length}
          page={table.page}
          pageSize={table.pageSize}
          selectedCount={table.selected.length}
          onPageChange={table.setPage}
          onPageSizeChange={table.setPageSize}
        />
      </Panel>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? '编辑积分规则' : '新增积分规则'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label htmlFor="rule-name" className="text-[13px]">
                  <span className="text-destructive">*</span>积分名称
                </label>
                <Input
                  id="rule-name"
                  value={draft.name}
                  placeholder="请输入积分名称"
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="rule-code" className="text-[13px]">
                  <span className="text-destructive">*</span>积分编码
                </label>
                <Input
                  id="rule-code"
                  value={draft.code}
                  placeholder="如 HYJF_DZ"
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, code: e.target.value.toUpperCase() }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="grid gap-1.5">
                <label htmlFor="rule-expression" className="text-[13px]">
                  <span className="text-destructive">*</span>规则表达式
                </label>
                <Input
                  id="rule-expression"
                  value={draft.expression}
                  placeholder="如 1"
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, expression: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="rule-limit" className="text-[13px]">
                  <span className="text-destructive">*</span>单人每日上限
                </label>
                <Input
                  id="rule-limit"
                  type="number"
                  value={draft.dailyLimit}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, dailyLimit: Number(e.target.value) }))
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="rule-sort" className="text-[13px]">
                  排序
                </label>
                <Input
                  id="rule-sort"
                  type="number"
                  min={1}
                  value={draft.sort}
                  onChange={(e) => setDraft((d) => ({ ...d, sort: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="rule-remark" className="text-[13px]">
                备注
              </label>
              <textarea
                id="rule-remark"
                rows={4}
                value={draft.remark}
                placeholder="如 停留时长 ≥ 10 秒，滑动至底部触发，同一内容仅算 1 次"
                onChange={(e) => setDraft((d) => ({ ...d, remark: e.target.value }))}
                className="scroll-thin w-full rounded-md border border-input bg-surface px-3 py-2 text-[13px] leading-relaxed text-foreground focus:border-ring focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px]">启用状态</span>
              <div className="flex items-center gap-2">
                <Switch
                  checked={draft.enabled}
                  aria-label="启用状态"
                  onCheckedChange={(v) => setDraft((d) => ({ ...d, enabled: v }))}
                />
                <span className="text-[13px] text-muted-foreground">
                  {draft.enabled ? '已启用' : '已停用'}
                </span>
              </div>
            </div>

            {issues.length > 0 && (
              <ul className="grid gap-1 rounded-md border border-destructive/30 bg-destructive/8 px-3 py-2.5">
                {issues.map((s) => (
                  <li key={s} className="text-xs text-destructive">
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              取消
            </Button>
            <Button onClick={submit}>{editing ? '保存' : '新增'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={removing.length > 0} onOpenChange={(o) => !o && setRemoving([])}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>删除积分规则</DialogTitle>
            <DialogDescription>
              删除后该行为此后不再自动计分，已入账的历史积分与流水保持不变。
            </DialogDescription>
          </DialogHeader>
          <ul className="grid gap-1">
            {rules
              .filter((r) => removing.includes(r.id))
              .map((r) => (
                <li key={r.id} className="text-[13px]">
                  {r.name} · <span className="font-mono text-xs">{r.code}</span>
                </li>
              ))}
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoving([])}>
              取消
            </Button>
            <Button
              onClick={() => {
                const hit = removeRules(removing)
                toast.success(`已删除 ${hit.length} 条规则`)
                setRemoving([])
                table.clear()
              }}
            >
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
