'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import {
  BadgeCheck,
  CircleSlash,
  Download,
  KeyRound,
  Pencil,
  Plus,
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
  ACCOUNT_STATUSES,
  accountStatusTone,
  ALL_DEPTS,
  COMPANIES,
  createStaff,
  DEPT_PUBLISHER_POSITION,
  DEPTS_BY_COMPANY,
  EMPLOYEE_STATUSES,
  employeeStatusTone,
  EMPTY_STAFF_DRAFT,
  isEditable,
  removeStaff,
  resetStaffPassword,
  sourceTone,
  STAFF_SOURCES,
  toggleStaff,
  updateStaff,
  useStaff,
  validateStaff,
  type AccountStatus,
  type EmployeeStatus,
  type Staff,
  type StaffDraft,
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
  employeeStatus: '全部员工状态',
  accountStatus: '全部账号状态',
  source: '全部来源',
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
      <span className="w-20 shrink-0 pt-1.5 text-[13px] text-muted-foreground sm:text-right">
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
  const { staff } = useStaff()
  const { role } = useApp()

  const [employeeStatus, setEmployeeStatus] = React.useState('全部员工状态')
  const [accountStatus, setAccountStatus] = React.useState('全部账号状态')
  const [source, setSource] = React.useState('全部来源')
  const [company, setCompany] = React.useState('全部公司')
  const [dept, setDept] = React.useState('全部部门')
  const [keyword, setKeyword] = React.useState('')
  const [query, setQuery] = React.useState(EMPTY_QUERY)

  const [formOpen, setFormOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState<StaffDraft>(EMPTY_STAFF_DRAFT)
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  /** 重置密码确认与结果：resetTarget 为待确认对象，resetDone 为生成的初始密码 */
  const [resetTarget, setResetTarget] = React.useState<Staff | null>(null)
  const [resetDone, setResetDone] = React.useState<{ code: string; pwd: string } | null>(
    null,
  )

  const rows = React.useMemo(
    () =>
      staff.filter((s) => {
        const kw = query.keyword.trim().toUpperCase()
        const hitEmp =
          query.employeeStatus === '全部员工状态' ||
          s.employeeStatus === query.employeeStatus
        const hitAcc =
          query.accountStatus === '全部账号状态' ||
          s.accountStatus === query.accountStatus
        const hitSource = query.source === '全部来源' || s.source === query.source
        const hitCompany = query.company === '全部公司' || s.company === query.company
        const hitDept = query.dept === '全部部门' || s.dept === query.dept
        const hitKw =
          !kw ||
          s.code.includes(kw) ||
          s.name.toUpperCase().includes(kw) ||
          s.nickname.toUpperCase().includes(kw)
        return hitEmp && hitAcc && hitSource && hitCompany && hitDept && hitKw
      }),
    [staff, query],
  )

  const table = useTableState(rows)
  const customCount = staff.filter((s) => s.source === '系统新建').length

  function search() {
    setQuery({ employeeStatus, accountStatus, source, company, dept, keyword })
    table.setPage(1)
  }

  function reset() {
    setEmployeeStatus('全部员工状态')
    setAccountStatus('全部账号状态')
    setSource('全部来源')
    setCompany('全部公司')
    setDept('全部部门')
    setKeyword('')
    setQuery(EMPTY_QUERY)
  }

  function openCreate() {
    setEditingId(null)
    setDraft(EMPTY_STAFF_DRAFT)
    setFormOpen(true)
  }

  function openEdit(s: Staff) {
    // 双保险：NC 同步员工不允许进入编辑表单
    if (!isEditable(s)) {
      toast.error('NC 同步的员工不允许修改信息，只能启用/停用或重置密码')
      return
    }
    setEditingId(s.id)
    setDraft({
      code: s.code,
      name: s.name,
      nickname: s.nickname,
      company: s.company,
      dept: s.dept,
      position: s.position,
      employeeStatus: s.employeeStatus,
      accountStatus: s.accountStatus,
      remark: s.remark,
    })
    setFormOpen(true)
  }

  /**
   * 切换公司：部门跟着换到该公司下第一个，并把仍等于旧部门名的
   * 姓名/昵称一并更新，保持「默认取部门名称」的口径。
   */
  function changeCompany(next: string) {
    setDraft((d) => {
      const nextDept = DEPTS_BY_COMPANY[next]?.[0] ?? ''
      return {
        ...d,
        company: next,
        dept: nextDept,
        name: d.name === d.dept || !d.name.trim() ? nextDept : d.name,
        nickname: d.nickname === d.dept || !d.nickname.trim() ? nextDept : d.nickname,
      }
    })
  }

  /** 切换部门：未手工改过的姓名与昵称自动跟随部门名称 */
  function changeDept(next: string) {
    setDraft((d) => ({
      ...d,
      dept: next,
      name: d.name === d.dept || !d.name.trim() ? next : d.name,
      nickname: d.nickname === d.dept || !d.nickname.trim() ? next : d.nickname,
    }))
  }

  function submit() {
    const res = editingId ? updateStaff(editingId, draft) : createStaff(draft, role.person)
    if (!res.ok) {
      toast.error(res.message)
      return
    }
    setFormOpen(false)
    toast.success(res.message)
  }

  function batchToggle(next: AccountStatus) {
    const res = toggleStaff(table.selected, next)
    if (!res.ok) {
      toast.error(res.message)
      return
    }
    table.clear()
    toast.success(res.message)
  }

  /** 单行启用/停用账号：两种来源都允许 */
  function toggleOne(s: Staff, next: AccountStatus) {
    const res = toggleStaff([s.id], next)
    if (!res.ok) {
      toast.error(res.message)
      return
    }
    toast.success(`${s.code} 已${next}`)
  }

  function doDelete() {
    const res = removeStaff(table.selected)
    setConfirmDelete(false)
    if (!res.ok) {
      toast.error(res.message)
      return
    }
    table.clear()
    toast.success(res.message)
  }

  function doReset() {
    if (!resetTarget) return
    const res = resetStaffPassword(resetTarget.id)
    setResetTarget(null)
    if (!res.ok) {
      toast.error(res.message)
      return
    }
    setResetDone({ code: resetTarget.code, pwd: res.password })
  }

  const issues = validateStaff(draft, editingId ?? undefined)
  const deptOptions = DEPTS_BY_COMPANY[draft.company] ?? []

  return (
    <>
      <PageHeader
        breadcrumb={breadcrumbFor(pathname)}
        title="员工管理"
      />

      <FilterBar onSearch={search} onReset={reset}>
        <FilterField label="员工状态">
          <NativeSelect
            aria-label="员工状态"
            value={employeeStatus}
            onChange={setEmployeeStatus}
            options={['全部员工状态', ...EMPLOYEE_STATUSES]}
          />
        </FilterField>
        <FilterField label="账号状态">
          <NativeSelect
            aria-label="账号状态"
            value={accountStatus}
            onChange={setAccountStatus}
            options={['全部账号状态', ...ACCOUNT_STATUSES]}
          />
        </FilterField>
        <FilterField label="数据来源">
          <NativeSelect
            aria-label="数据来源"
            value={source}
            onChange={setSource}
            options={['全部来源', ...STAFF_SOURCES]}
          />
        </FilterField>
        <FilterField label="公司">
          <NativeSelect
            aria-label="公司"
            value={company}
            onChange={setCompany}
            options={['全部公司', ...COMPANIES]}
          />
        </FilterField>
        <FilterField label="部门">
          <NativeSelect
            aria-label="部门"
            value={dept}
            onChange={setDept}
            options={['全部部门', ...ALL_DEPTS]}
          />
        </FilterField>
        <FilterField label="工号/姓名">
          <Input
            value={keyword}
            placeholder="请输入工号、姓名或昵称"
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
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-3.5" />
              新增
            </Button>
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
                    '员工工号',
                    '员工姓名',
                    '昵称',
                    '公司',
                    '部门',
                    '岗位',
                    '员工状态',
                    '账号状态',
                    '同步时间',
                    '创建时间',
                    '备注',
                  ],
                  rows.map((s) => [
                    s.code,
                    s.name,
                    s.nickname || '—',
                    s.company,
                    s.dept,
                    s.position,
                    s.employeeStatus,
                    s.accountStatus,
                    s.syncedAt || '—',
                    s.createdAt,
                    s.source,
                  ]),
                )
                toast.success(`已导出 ${rows.length} 条记录`)
              }}
            >
              <Download className="size-3.5" />
              导出
            </Button>
            <span className="ml-auto text-xs text-muted-foreground">
              系统新建 <span className="font-mono">{customCount}</span> 个 · NC
              同步的员工只读，仅可启用/停用与重置密码
            </span>
          </Toolbar>

          <Table className="min-w-[1380px] text-[13px]">
            <TableHeader>
              <TableRow className="bg-muted/60">
                <TableHead className="w-10 pl-4">
                  <Checkbox
                    aria-label="全选本页"
                    checked={table.allChecked}
                    onCheckedChange={(v) => table.togglePage(Boolean(v))}
                  />
                </TableHead>
                <TableHead className="w-28">员工工号</TableHead>
                <TableHead className="w-28">员工姓名</TableHead>
                <TableHead className="w-28">昵称</TableHead>
                <TableHead className="w-24">公司</TableHead>
                <TableHead className="w-32">部门</TableHead>
                <TableHead className="w-28">岗位</TableHead>
                <TableHead className="w-20">员工状态</TableHead>
                <TableHead className="w-20">账号状态</TableHead>
                <TableHead className="w-36">同步时间</TableHead>
                <TableHead className="w-36">创建时间</TableHead>
                <TableHead className="w-28">备注</TableHead>
                <TableHead className="w-44 pr-4 text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.pageRows.length === 0 && (
                <TableEmpty colSpan={13} text="没有符合条件的员工" />
              )}
              {table.pageRows.map((s) => {
                const editable = isEditable(s)
                return (
                  <TableRow key={s.id}>
                    <TableCell className="pl-4">
                      <Checkbox
                        aria-label={`选择 ${s.code}`}
                        checked={table.selected.includes(s.id)}
                        onCheckedChange={(v) => table.toggleRow(s.id, Boolean(v))}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{s.code}</TableCell>
                    <TableCell>{s.name}</TableCell>
                    <TableCell className={s.nickname ? '' : 'text-muted-foreground'}>
                      {s.nickname || '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{s.company}</TableCell>
                    <TableCell className="text-muted-foreground">{s.dept}</TableCell>
                    <TableCell className="text-muted-foreground">{s.position}</TableCell>
                    <TableCell>
                      <StatusTag tone={employeeStatusTone(s.employeeStatus)}>
                        {s.employeeStatus}
                      </StatusTag>
                    </TableCell>
                    <TableCell>
                      <StatusTag tone={accountStatusTone(s.accountStatus)}>
                        {s.accountStatus}
                      </StatusTag>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {s.syncedAt || '—'}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {s.createdAt}
                    </TableCell>
                    {/* 备注列只显示数据来源；备注正文移到悬浮提示，避免列内信息过载 */}
                    <TableCell title={s.remark || undefined}>
                      <StatusTag tone={sourceTone(s.source)}>{s.source}</StatusTag>
                    </TableCell>
                    <TableCell className="pr-4">
                      <div className="flex items-center justify-center gap-1">
                        {/* NC 同步员工不可编辑，按钮置灰并说明原因 */}
                        <Button
                          size="xs"
                          variant="outline"
                          disabled={!editable}
                          title={editable ? '编辑员工信息' : 'NC 同步的员工不允许修改信息'}
                          onClick={() => openEdit(s)}
                        >
                          <Pencil className="size-3.5" />
                          编辑
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() =>
                            toggleOne(s, s.accountStatus === '启用' ? '停用' : '启用')
                          }
                        >
                          {s.accountStatus === '启用' ? '停用' : '启用'}
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          title="重置该员工的 APP 登录密码"
                          onClick={() => setResetTarget(s)}
                        >
                          <KeyRound className="size-3.5" />
                          重置密码
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
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
            <DialogTitle>{editingId ? '编辑员工' : '新增员工'}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <FormRow label="员工工号" required>
              <Input
                value={draft.code}
                placeholder="如 BM-DQ001"
                className="font-mono"
                onChange={(e) =>
                  setDraft((d) => ({ ...d, code: e.target.value.toUpperCase() }))
                }
              />
            </FormRow>

            <FormRow label="公司" required>
              <NativeSelect
                aria-label="公司"
                className="w-48"
                value={draft.company}
                onChange={changeCompany}
                options={COMPANIES}
              />
            </FormRow>

            <FormRow label="部门" required>
              <NativeSelect
                aria-label="部门"
                className="w-56"
                value={draft.dept}
                onChange={changeDept}
                options={deptOptions}
              />
            </FormRow>

            <FormRow label="员工姓名" required>
              <Input
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              />
            </FormRow>

            <FormRow label="昵称" required>
              <Input
                value={draft.nickname}
                onChange={(e) => setDraft((d) => ({ ...d, nickname: e.target.value }))}
              />
            </FormRow>

            <FormRow label="岗位" required>
              <Input
                value={draft.position}
                placeholder={DEPT_PUBLISHER_POSITION}
                onChange={(e) => setDraft((d) => ({ ...d, position: e.target.value }))}
              />
            </FormRow>

            <FormRow label="员工状态" required>
              <NativeSelect
                aria-label="员工状态"
                className="w-32"
                value={draft.employeeStatus}
                onChange={(v) =>
                  setDraft((d) => ({ ...d, employeeStatus: v as EmployeeStatus }))
                }
                options={EMPLOYEE_STATUSES}
              />
            </FormRow>

            <FormRow label="账号状态" required>
              <NativeSelect
                aria-label="账号状态"
                className="w-32"
                value={draft.accountStatus}
                onChange={(v) =>
                  setDraft((d) => ({ ...d, accountStatus: v as AccountStatus }))
                }
                options={ACCOUNT_STATUSES}
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

            {issues.length > 0 && (
              <p className="text-xs text-destructive sm:pl-23">{issues[0]}</p>
            )}
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
            <DialogTitle>删除员工</DialogTitle>
          </DialogHeader>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            将删除所选 <span className="font-mono">{table.selected.length}</span>{' '}
            条记录。仅支持删除系统新建的员工，若选中了 NC
            同步数据将整批拒绝；删除不影响历史已发布内容。
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

      <Dialog open={Boolean(resetTarget)} onOpenChange={(v) => !v && setResetTarget(null)}>
        <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>重置登录密码</DialogTitle>
          </DialogHeader>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            将重置 <span className="font-mono">{resetTarget?.code}</span>（
            {resetTarget?.name}）的 APP 登录密码为初始密码，该员工下次登录须修改。
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetTarget(null)}>
              取消
            </Button>
            <Button onClick={doReset}>确认重置</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(resetDone)} onOpenChange={(v) => !v && setResetDone(null)}>
        <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>密码已重置</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <p className="text-[13px] text-muted-foreground">
              <span className="font-mono">{resetDone?.code}</span> 的初始密码如下，
              请通过线下渠道告知本人：
            </p>
            <p className="rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-sm">
              {resetDone?.pwd}
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setResetDone(null)}>知道了</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
