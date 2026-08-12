'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import {
  BadgeCheck,
  CircleSlash,
  Download,
  Pencil,
  Plus,
  RefreshCcw,
  Trash2,
} from 'lucide-react'
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
import { downloadCsv } from '@/lib/export'
import {
  ALL_DEPTS,
  COMPANIES,
  createPublisher,
  deptSignature,
  DEPTS_BY_COMPANY,
  EMPTY_PUBLISHER_DRAFT,
  PUBLISHER_STATUSES,
  removePublishers,
  statusTone,
  togglePublishers,
  updatePublisher,
  useStaff,
  validatePublisher,
  type DeptPublisher,
  type PublisherDraft,
  type PublisherStatus,
} from '@/lib/staff-store'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
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

const EMPTY_QUERY = {
  status: '全部状态',
  company: '全部公司',
  dept: '全部部门',
  keyword: '',
}

function FormRow({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3">
      <span className="w-24 shrink-0 pt-1.5 text-[13px] text-muted-foreground sm:text-right">
        {required && <span className="text-destructive">*</span>}
        {label}
      </span>
      <div className="flex-1">
        {children}
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  )
}

export default function StaffPage() {
  const pathname = usePathname()
  const { publishers } = useStaff()
  const { role } = useApp()

  const [status, setStatus] = React.useState('全部状态')
  const [company, setCompany] = React.useState('全部公司')
  const [dept, setDept] = React.useState('全部部门')
  const [keyword, setKeyword] = React.useState('')
  const [query, setQuery] = React.useState(EMPTY_QUERY)

  const [formOpen, setFormOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState<PublisherDraft>(EMPTY_PUBLISHER_DRAFT)
  const [confirmDelete, setConfirmDelete] = React.useState(false)

  const rows = React.useMemo(
    () =>
      publishers.filter((p) => {
        const kw = query.keyword.trim().toUpperCase()
        const hitStatus = query.status === '全部状态' || p.status === query.status
        const hitCompany = query.company === '全部公司' || p.company === query.company
        const hitDept = query.dept === '全部部门' || p.dept === query.dept
        const hitKw =
          !kw || p.code.includes(kw) || p.name.toUpperCase().includes(kw)
        return hitStatus && hitCompany && hitDept && hitKw
      }),
    [publishers, query],
  )

  const table = useTableState(rows)
  const active = publishers.filter((p) => p.status === '启用').length

  function search() {
    setQuery({ status, company, dept, keyword })
    table.setPage(1)
  }

  function reset() {
    setStatus('全部状态')
    setCompany('全部公司')
    setDept('全部部门')
    setKeyword('')
    setQuery(EMPTY_QUERY)
  }

  function openCreate() {
    setEditingId(null)
    setDraft(EMPTY_PUBLISHER_DRAFT)
    setFormOpen(true)
  }

  function openEdit(p: DeptPublisher) {
    setEditingId(p.id)
    setDraft({
      code: p.code,
      name: p.name,
      company: p.company,
      dept: p.dept,
      status: p.status,
      phone: p.phone,
      remark: p.remark,
    })
    setFormOpen(true)
  }

  /** 切换公司时部门跟着换到该公司下第一个，避免公司与部门对不上 */
  function changeCompany(next: string) {
    setDraft((d) => ({
      ...d,
      company: next,
      dept: DEPTS_BY_COMPANY[next]?.[0] ?? '',
    }))
  }

  function submit() {
    const res = editingId
      ? updatePublisher(editingId, draft)
      : createPublisher(draft, role.person)
    if (!res.ok) {
      toast.error(res.message)
      return
    }
    setFormOpen(false)
    toast.success(res.message)
  }

  function batchToggle(next: PublisherStatus) {
    const res = togglePublishers(table.selected, next)
    if (!res.ok) {
      toast.error(res.message)
      return
    }
    table.clear()
    toast.success(res.message)
  }

  function doDelete() {
    const res = removePublishers(table.selected)
    setConfirmDelete(false)
    if (!res.ok) {
      toast.error(res.message)
      return
    }
    table.clear()
    toast.success(res.message)
  }

  const issues = validatePublisher(draft, editingId ?? undefined)
  const deptOptions = DEPTS_BY_COMPANY[draft.company] ?? []

  return (
    <>
      <PageHeader
        breadcrumb={breadcrumbFor(pathname)}
        title="员工管理"
        actions={
          <>
            <Button variant="outline" onClick={() => toast.success('列表已刷新')}>
              <RefreshCcw className="size-4" />
              刷新
            </Button>
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              新增
            </Button>
          </>
        }
      />

      <FilterBar onSearch={search} onReset={reset}>
        <FilterField label="授权状态">
          <NativeSelect
            aria-label="授权状态"
            value={status}
            onChange={setStatus}
            options={['全部状态', ...PUBLISHER_STATUSES]}
          />
        </FilterField>
        <FilterField label="所属公司">
          <NativeSelect
            aria-label="所属公司"
            value={company}
            onChange={setCompany}
            options={['全部公司', ...COMPANIES]}
          />
        </FilterField>
        <FilterField label="所属部门">
          <NativeSelect
            aria-label="所属部门"
            value={dept}
            onChange={setDept}
            options={['全部部门', ...ALL_DEPTS]}
          />
        </FilterField>
        <FilterField label="编号/名称">
          <Input
            value={keyword}
            placeholder="请输入员工编号或名称"
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) search()
            }}
          />
        </FilterField>
      </FilterBar>

      <div className="pb-4">
        <Panel bodyClassName="p-0">
          <Toolbar>
            <Button
              size="sm"
              variant="outline"
              disabled={table.selected.length === 0}
              onClick={() => batchToggle('启用')}
            >
              <BadgeCheck className="size-3.5" />
              启用
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={table.selected.length === 0}
              onClick={() => batchToggle('停用')}
            >
              <CircleSlash className="size-3.5" />
              停用
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={table.selected.length === 0}
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="size-3.5" />
              删除
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                downloadCsv(
                  '员工管理',
                  [
                    '员工编号',
                    '发布人名称',
                    '所属公司',
                    '所属部门',
                    'APP署名',
                    '授权状态',
                    '联系电话',
                    '备注',
                    '创建人',
                    '创建时间',
                    '更新时间',
                  ],
                  rows.map((p) => [
                    p.code,
                    p.name,
                    p.company,
                    p.dept,
                    deptSignature(p),
                    p.status,
                    p.phone || '—',
                    p.remark || '—',
                    p.createdBy,
                    p.createdAt,
                    p.updatedAt,
                  ]),
                )
                toast.success(`已导出 ${rows.length} 条记录`)
              }}
            >
              <Download className="size-3.5" />
              导出
            </Button>
            <span className="ml-auto text-xs text-muted-foreground">
              启用中 <span className="font-mono">{active}</span> 个 ·
              员工主数据来自用友 NC，此处仅维护部门在 APP 的发布授权
            </span>
          </Toolbar>

          <Table className="text-[13px]">
            <TableHeader>
              <TableRow className="bg-muted/60">
                <TableHead className="w-10 pl-4">
                  <Checkbox
                    aria-label="全选本页"
                    checked={table.allChecked}
                    onCheckedChange={(v) => table.togglePage(Boolean(v))}
                  />
                </TableHead>
                <TableHead className="w-28">员工编号</TableHead>
                <TableHead className="w-32">发布人名称</TableHead>
                <TableHead className="min-w-52">APP 发布署名</TableHead>
                <TableHead className="w-20">授权状态</TableHead>
                <TableHead className="w-32">联系电话</TableHead>
                <TableHead className="w-40">更新时间</TableHead>
                <TableHead className="w-20 pr-4 text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.pageRows.length === 0 && (
                <TableEmpty colSpan={8} text="没有符合条件的部门发布账号" />
              )}
              {table.pageRows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="pl-4">
                    <Checkbox
                      aria-label={`选择 ${p.code}`}
                      checked={table.selected.includes(p.id)}
                      onCheckedChange={(v) => table.toggleRow(p.id, Boolean(v))}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{p.code}</TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>
                    {/* 停用后仍显示部门，但转为灰底以示当前不会附带到 APP 署名 */}
                    <StatusTag tone={p.status === '启用' ? 'info' : 'neutral'}>
                      {deptSignature(p)}
                    </StatusTag>
                  </TableCell>
                  <TableCell>
                    <StatusTag tone={statusTone(p.status)}>{p.status}</StatusTag>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {p.phone || '—'}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {p.updatedAt}
                  </TableCell>
                  <TableCell className="pr-4 text-center">
                    <Button size="xs" variant="outline" onClick={() => openEdit(p)}>
                      <Pencil className="size-3.5" />
                      编辑
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Pagination
            total={rows.length}
            page={table.page}
            pageSize={table.pageSize}
            onPageChange={table.setPage}
            onPageSizeChange={table.setPageSize}
            selectedCount={table.selected.length}
          />
        </Panel>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>
              {editingId ? '编辑部门发布账号' : '新增部门发布账号'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <FormRow
              label="员工编号"
              required
              hint="支持录入部门公用编号（如 BM-DQ001）或员工本人工号，全表唯一，作为 APP 登录账号。"
            >
              <Input
                value={draft.code}
                placeholder="如 BM-DQ001"
                className="font-mono"
                onChange={(e) =>
                  setDraft((d) => ({ ...d, code: e.target.value.toUpperCase() }))
                }
              />
            </FormRow>

            <FormRow label="发布人名称" required hint="APP 署名中显示的名字，可填部门名或本人姓名。">
              <Input
                value={draft.name}
                placeholder="如 党群工作部"
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              />
            </FormRow>

            <FormRow label="所属公司" required>
              <NativeSelect
                aria-label="所属公司"
                className="w-48"
                value={draft.company}
                onChange={changeCompany}
                options={COMPANIES}
              />
            </FormRow>

            <FormRow label="所属部门" required>
              <NativeSelect
                aria-label="所属部门"
                className="w-56"
                value={draft.dept}
                onChange={(v) => setDraft((d) => ({ ...d, dept: v }))}
                options={deptOptions}
              />
            </FormRow>

            <FormRow label="授权状态" required hint="停用后立即失去 APP 发布资格，历史已发布内容署名保持不变。">
              <NativeSelect
                aria-label="授权状态"
                className="w-32"
                value={draft.status}
                onChange={(v) =>
                  setDraft((d) => ({ ...d, status: v as PublisherStatus }))
                }
                options={PUBLISHER_STATUSES}
              />
            </FormRow>

            <FormRow label="联系电话">
              <Input
                value={draft.phone}
                placeholder="选填，便于停用前核实"
                onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
              />
            </FormRow>

            <FormRow label="备注">
              <textarea
                rows={2}
                value={draft.remark}
                aria-label="备注"
                placeholder="选填，说明该账号的发布用途"
                onChange={(e) => setDraft((d) => ({ ...d, remark: e.target.value }))}
                className="scroll-thin w-full rounded-md border border-input bg-surface px-3 py-2 text-[13px] leading-relaxed text-foreground focus:border-ring focus:outline-none"
              />
            </FormRow>

            <div className="rounded-md border border-border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">APP 发布署名预览</p>
              <p className="mt-1.5 text-[13px]">
                <span className="font-medium">{draft.name.trim() || '发布人名称'}</span>
                <span className="mx-1.5 text-muted-foreground">·</span>
                <StatusTag tone="info">
                  {deptSignature({ company: draft.company, dept: draft.dept })}
                </StatusTag>
              </p>
              {issues.length > 0 && (
                <p className="mt-2 text-xs text-destructive">{issues[0]}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              取消
            </Button>
            <Button disabled={issues.length > 0} onClick={submit}>
              {editingId ? '保存' : '新增'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>删除部门发布账号</DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-muted-foreground">
            将删除所选 <span className="font-mono">{table.selected.length}</span>{' '}
            个账号的发布授权。仅移除 APP 发布资格，不影响用友 NC
            员工主数据与历史已发布内容。
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={doDelete}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
