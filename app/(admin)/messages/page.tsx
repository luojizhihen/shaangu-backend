'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import {
  Download,
  Eye,
  Plus,
  RefreshCcw,
  Send,
  SquarePen,
  Trash2,
  Users,
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
import { BatchResultDialog } from '@/components/content/batch-result-dialog'
import { breadcrumbFor } from '@/lib/nav'
import { downloadCsv } from '@/lib/export'
import {
  ADMIN_ROLE_NAMES,
  ADMIN_SCOPES,
  ADMIN_USERS,
  audienceTone,
  CLEAR_TEMPLATE_TEXT,
  CLEAR_TEMPLATES,
  createMessage,
  deliveryRecords,
  EMPLOYEE_STATUSES,
  EMPLOYEES,
  EMPTY_MESSAGE_DRAFT,
  MESSAGE_AUDIENCES,
  MESSAGE_CONTENT_MAX,
  MESSAGE_SCOPES,
  MESSAGE_STATUSES,
  MESSAGE_TITLE_MAX,
  MESSAGE_TYPES,
  messageStatusTone,
  messageTypeTone,
  plannedRecipients,
  removeMessages,
  scopeText,
  sendMessages,
  updateMessage,
  useOps,
  validateMessage,
  type AdminScope,
  type ClearTemplate,
  type MessageAudience,
  type MessageDraft,
  type MessageScope,
  type MessageType,
  type OpsMessage,
} from '@/lib/ops-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const EMPTY_QUERY = {
  type: '全部类型',
  audience: '全部接收端',
  status: '全部状态',
  title: '',
  start: '',
  end: '',
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
    <div className="grid gap-1.5">
      <span className="text-[13px]">
        {required && <span className="text-destructive">*</span>}
        {label}
      </span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  )
}

export default function MessagesPage() {
  const pathname = usePathname()
  const { messages } = useOps()
  const { role } = useApp()

  const [type, setType] = React.useState('全部类型')
  const [audience, setAudience] = React.useState('全部接收端')
  const [status, setStatus] = React.useState('全部状态')
  const [title, setTitle] = React.useState('')
  const [start, setStart] = React.useState('')
  const [end, setEnd] = React.useState('')
  const [query, setQuery] = React.useState(EMPTY_QUERY)

  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<OpsMessage | null>(null)
  const [draft, setDraft] = React.useState<MessageDraft>(EMPTY_MESSAGE_DRAFT)
  const [viewing, setViewing] = React.useState<OpsMessage | null>(null)
  /** 点击接收人数后展示的发送明细 */
  const [delivery, setDelivery] = React.useState<OpsMessage | null>(null)
  /** 选择员工弹窗：打开状态、已勾选、筛选关键字与状态 */
  const [pickerOpen, setPickerOpen] = React.useState(false)
  const [picked, setPicked] = React.useState<string[]>([])
  const [pickKeyword, setPickKeyword] = React.useState('')
  const [pickStatus, setPickStatus] = React.useState('全部状态')
  /** 选择后台用户弹窗：打开状态、已勾选、关键字与角色筛选 */
  const [userPickerOpen, setUserPickerOpen] = React.useState(false)
  const [pickedUsers, setPickedUsers] = React.useState<string[]>([])
  const [userKeyword, setUserKeyword] = React.useState('')
  const [userRole, setUserRole] = React.useState('全部角色')
  const [results, setResults] = React.useState<
    { id: string; label: string; ok: boolean; message: string }[] | null
  >(null)
  const [resultAction, setResultAction] = React.useState('批量操作')

  const rows = React.useMemo(
    () =>
      messages.filter((m) => {
        const hitType = query.type === '全部类型' || m.type === query.type
        const hitAudience =
          query.audience === '全部接收端' || m.audience === query.audience
        const hitStatus = query.status === '全部状态' || m.status === query.status
        const hitTitle = m.title.includes(query.title.trim())
        const day = m.createdAt.slice(0, 10)
        const hitStart = !query.start || day >= query.start
        const hitEnd = !query.end || day <= query.end
        return hitType && hitAudience && hitStatus && hitTitle && hitStart && hitEnd
      }),
    [messages, query],
  )

  const table = useTableState(rows)

  const deliveryRows = React.useMemo(
    () => (delivery ? deliveryRecords(delivery) : []),
    [delivery],
  )

  const pickerRows = React.useMemo(() => {
    const kw = pickKeyword.trim()
    return EMPLOYEES.filter((e) => {
      const hitKw =
        !kw ||
        e.no.includes(kw) ||
        e.name.includes(kw) ||
        e.company.includes(kw) ||
        e.dept.includes(kw)
      const hitStatus = pickStatus === '全部状态' || e.status === pickStatus
      return hitKw && hitStatus
    })
  }, [pickKeyword, pickStatus])

  const userPickerRows = React.useMemo(() => {
    const kw = userKeyword.trim()
    return ADMIN_USERS.filter((u) => {
      const hitKw =
        !kw || u.account.includes(kw) || u.name.includes(kw) || u.dept.includes(kw)
      const hitRole = userRole === '全部角色' || u.role === userRole
      return hitKw && hitRole
    })
  }, [userKeyword, userRole])

  function search() {
    setQuery({ type, audience, status, title, start, end })
    table.setPage(1)
  }

  function reset() {
    setType('全部类型')
    setAudience('全部接收端')
    setStatus('全部状态')
    setTitle('')
    setStart('')
    setEnd('')
    setQuery(EMPTY_QUERY)
  }

  function show(action: string, list: typeof results) {
    setResultAction(action)
    setResults(list)
    table.clear()
  }

  function openCreate() {
    setEditing(null)
    setDraft(EMPTY_MESSAGE_DRAFT)
    setFormOpen(true)
  }

  function openEdit(m: OpsMessage) {
    if (m.status === '已发送') {
      toast.error('消息已发送，不可再编辑')
      return
    }
    setEditing(m)
    setDraft({
      type: m.type,
      audience: m.audience,
      scope: m.scope,
      employeeIds: m.employeeIds,
      adminScope: m.adminScope,
      adminUserIds: m.adminUserIds,
      title: m.title,
      content: m.content,
      clearTemplate: m.clearTemplate,
    })
    setFormOpen(true)
  }

  /** 切换接收端：两端各自维护接收范围，切走时清空另一端的范围与名单 */
  function changeAudience(next: MessageAudience) {
    setDraft((d) => ({
      ...d,
      audience: next,
      scope: next === 'APP' ? d.scope || '全部' : '',
      employeeIds: next === 'APP' ? d.employeeIds : [],
      adminScope: next === '管理端后台' ? d.adminScope || '全部' : '',
      adminUserIds: next === '管理端后台' ? d.adminUserIds : [],
    }))
  }

  /** 切换后台用户范围：非「选择用户」时清空已选名单 */
  function changeAdminScope(next: AdminScope) {
    setDraft((d) => ({
      ...d,
      adminScope: next,
      adminUserIds: next === '选择用户' ? d.adminUserIds : [],
    }))
  }

  /** 切换员工范围：非「选择员工」时清空已选名单 */
  function changeScope(next: MessageScope) {
    setDraft((d) => ({
      ...d,
      scope: next,
      employeeIds: next === '选择员工' ? d.employeeIds : [],
    }))
  }

  function openPicker() {
    setPicked(draft.employeeIds)
    setPickKeyword('')
    setPickStatus('全部状态')
    setPickerOpen(true)
  }

  function confirmPicker() {
    if (picked.length === 0) {
      toast.error('请至少选择一名员工')
      return
    }
    setDraft((d) => ({ ...d, employeeIds: picked }))
    setPickerOpen(false)
    toast.success(`已选择 ${picked.length} 名员工`)
  }

  function openUserPicker() {
    setPickedUsers(draft.adminUserIds)
    setUserKeyword('')
    setUserRole('全部角色')
    setUserPickerOpen(true)
  }

  function confirmUserPicker() {
    if (pickedUsers.length === 0) {
      toast.error('请至少选择一名后台用户')
      return
    }
    setDraft((d) => ({ ...d, adminUserIds: pickedUsers }))
    setUserPickerOpen(false)
    toast.success(`已选择 ${pickedUsers.length} 名后台用户`)
  }

  /** 切换消息类型时清掉不适用的清零模板，避免残留脏数据 */
  function changeType(next: MessageType) {
    setDraft((d) => ({
      ...d,
      type: next,
      clearTemplate: next === '年度清零' ? d.clearTemplate : '',
    }))
  }

  /** 选中清零模板后自动带入标题与正文，仍可继续微调 */
  function applyTemplate(next: ClearTemplate) {
    const preset = CLEAR_TEMPLATE_TEXT[next]
    setDraft((d) => ({
      ...d,
      clearTemplate: next,
      title: preset.title,
      content: preset.content,
    }))
  }

  function submitForm() {
    const issues = validateMessage(draft)
    if (issues.length > 0) {
      toast.error(issues[0])
      return
    }
    if (editing) {
      const res = updateMessage(editing.id, draft)
      toast[res.ok ? 'success' : 'error'](res.message)
      if (res.ok) setFormOpen(false)
      return
    }
    const created = createMessage(draft, role.person)
    toast.success(`已新增消息「${created.title}」，当前为待发送`)
    setFormOpen(false)
  }

  function batchSend() {
    if (table.selected.length === 0) {
      toast.error('请先勾选需要发送的消息')
      return
    }
    show('发送消息', sendMessages(table.selected, role.person))
  }

  function batchRemove() {
    if (table.selected.length === 0) {
      toast.error('请先勾选需要删除的消息')
      return
    }
    show('删除消息', removeMessages(table.selected))
  }

  return (
    <>
      <PageHeader
        breadcrumb={breadcrumbFor(pathname)}
        title="消息管理"
        actions={
          <Button variant="outline" onClick={() => toast.success('列表已刷新')}>
            <RefreshCcw className="size-4" />
            刷新
          </Button>
        }
      />

      <FilterBar onSearch={search} onReset={reset}>
        <FilterField label="消息类型">
          <NativeSelect
            aria-label="消息类型"
            value={type}
            onChange={setType}
            options={['全部类型', ...MESSAGE_TYPES]}
          />
        </FilterField>
        <FilterField label="接收端">
          <NativeSelect
            aria-label="接收端"
            value={audience}
            onChange={setAudience}
            options={['全部接收端', ...MESSAGE_AUDIENCES]}
          />
        </FilterField>
        <FilterField label="发送状态">
          <NativeSelect
            aria-label="发送状态"
            value={status}
            onChange={setStatus}
            options={['全部状态', ...MESSAGE_STATUSES]}
          />
        </FilterField>
        <FilterField label="消息标题">
          <Input
            value={title}
            placeholder="请输入消息标题"
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) search()
            }}
          />
        </FilterField>
        <label className="flex items-center gap-2">
          <span className="shrink-0 text-[13px] text-muted-foreground">创建时间</span>
          <span className="flex items-center gap-1">
            <Input
              type="date"
              aria-label="开始时间"
              className="w-36"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
            <span className="text-xs text-muted-foreground">~</span>
            <Input
              type="date"
              aria-label="结束时间"
              className="w-36"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </span>
        </label>
      </FilterBar>

      <div className="pb-4">
        <Panel bodyClassName="p-0">
          <Toolbar>
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-3.5" />
              新增
            </Button>
            <Button size="sm" variant="outline" onClick={batchSend}>
              <Send className="size-3.5" />
              发送
            </Button>
            <Button size="sm" variant="outline" onClick={batchRemove}>
              <Trash2 className="size-3.5" />
              删除
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                downloadCsv(
                  '消息管理',
                  [
                    '消息编号',
                    '消息类型',
                    '接收端',
                    '接收范围',
                    '消息标题',
                    '消息来源',
                    '发送状态',
                    '接收人数',
                    '创建时间',
                    '创建人',
                    '发送时间',
                    '发送人',
                  ],
                  rows.map((m) => [
                    m.code,
                    m.type,
                    m.audience,
                    scopeText(m),
                    m.title,
                    m.origin,
                    m.status,
                    m.status === '已发送' ? m.recipients : '—',
                    m.createdAt,
                    m.creator,
                    m.sentAt || '—',
                    m.sender || '—',
                  ]),
                )
                toast.success(`已导出 ${rows.length} 条消息`)
              }}
            >
              <Download className="size-3.5" />
              导出
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
                <TableHead className="w-24">消息类型</TableHead>
                <TableHead className="w-20">接收端</TableHead>
                <TableHead className="w-32">接收范围</TableHead>
                <TableHead className="min-w-52">消息标题</TableHead>
                <TableHead className="w-40">消息编号</TableHead>
                <TableHead className="w-20">消息来源</TableHead>
                <TableHead className="w-20">发送状态</TableHead>
                <TableHead className="w-20">接收人数</TableHead>
                <TableHead className="w-40">创建时间</TableHead>
                <TableHead className="w-40">发送时间</TableHead>
                <TableHead className="w-20">发送人</TableHead>
                <TableHead className="w-24 pr-4 text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.pageRows.length === 0 && (
                <TableEmpty colSpan={13} text="没有符合条件的消息" />
              )}
              {table.pageRows.map((m, i) => (
                <TableRow key={m.id}>
                  <TableCell className="pl-4 text-muted-foreground">
                    {(table.page - 1) * table.pageSize + i + 1}
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      aria-label={`选择消息 ${m.title}`}
                      checked={table.selected.includes(m.id)}
                      onCheckedChange={(v) => table.toggleRow(m.id, Boolean(v))}
                    />
                  </TableCell>
                  <TableCell>
                    <StatusTag tone={messageTypeTone(m.type)}>{m.type}</StatusTag>
                  </TableCell>
                  <TableCell>
                    <StatusTag tone={audienceTone(m.audience)}>{m.audience}</StatusTag>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {scopeText(m)}
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      className="block max-w-full truncate text-left font-medium hover:text-brand"
                      title={m.title}
                      onClick={() => setViewing(m)}
                    >
                      {m.title}
                    </button>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {m.code}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {m.origin}
                  </TableCell>
                  <TableCell>
                    <StatusTag tone={messageStatusTone(m.status)}>{m.status}</StatusTag>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {m.status === '已发送' ? (
                      <button
                        type="button"
                        className="text-brand underline-offset-2 hover:underline"
                        onClick={() => setDelivery(m)}
                      >
                        {m.recipients}
                      </button>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {m.createdAt}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {m.sentAt || '—'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {m.sender || '—'}
                  </TableCell>
                  <TableCell className="pr-4">
                    <div className="flex items-center justify-center gap-0.5">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`查看消息 ${m.title}`}
                        onClick={() => setViewing(m)}
                      >
                        <Eye />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`编辑消息 ${m.title}`}
                        disabled={m.status === '已发送'}
                        onClick={() => openEdit(m)}
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
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? '编辑消息' : '新增消息'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormRow label="消息类型" required>
                <NativeSelect
                  aria-label="消息类型"
                  value={draft.type}
                  onChange={(v) => changeType(v as MessageType)}
                  options={MESSAGE_TYPES}
                />
              </FormRow>
              <FormRow label="接收端" required>
                <NativeSelect
                  aria-label="接收端"
                  value={draft.audience}
                  onChange={(v) => changeAudience(v as MessageAudience)}
                  options={MESSAGE_AUDIENCES}
                />
              </FormRow>
            </div>

            {draft.audience === 'APP' && (
              <FormRow label="接收员工" required>
                <div className="flex flex-wrap items-center gap-2">
                  <NativeSelect
                    aria-label="接收员工"
                    className="w-40"
                    value={draft.scope || '全部'}
                    onChange={(v) => changeScope(v as MessageScope)}
                    options={MESSAGE_SCOPES}
                  />
                  {draft.scope === '选择员工' && (
                    <>
                      <Button size="sm" variant="outline" onClick={openPicker}>
                        <Users className="size-3.5" />
                        选择员工
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        已选 {draft.employeeIds.length} 人
                      </span>
                    </>
                  )}
                  {draft.scope !== '选择员工' && (
                    <span className="text-xs text-muted-foreground">
                      预计接收{' '}
                      <span className="font-mono">
                        {plannedRecipients(draft.audience, draft.scope, draft.employeeIds)}
                      </span>{' '}
                      人
                    </span>
                  )}
                </div>
              </FormRow>
            )}

            {draft.audience === '管理端后台' && (
              <FormRow label="接收用户" required>
                <div className="flex flex-wrap items-center gap-2">
                  <NativeSelect
                    aria-label="接收用户"
                    className="w-40"
                    value={draft.adminScope || '全部'}
                    onChange={(v) => changeAdminScope(v as AdminScope)}
                    options={ADMIN_SCOPES}
                  />
                  {draft.adminScope === '选择用户' ? (
                    <>
                      <Button size="sm" variant="outline" onClick={openUserPicker}>
                        <Users className="size-3.5" />
                        选择用户
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        已选 {draft.adminUserIds.length} 人
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      全部管理员共{' '}
                      <span className="font-mono">{ADMIN_USERS.length}</span> 人
                    </span>
                  )}
                </div>
              </FormRow>
            )}

            {draft.type === '年度清零' && (
              <FormRow label="清零提醒模板" required>
                <div className="flex flex-wrap gap-2">
                  {CLEAR_TEMPLATES.map((t) => (
                    <Button
                      key={t}
                      size="sm"
                      variant={draft.clearTemplate === t ? 'default' : 'outline'}
                      onClick={() => applyTemplate(t)}
                    >
                      {t}
                    </Button>
                  ))}
                </div>
              </FormRow>
            )}

            <FormRow label="消息标题" required>
              <Input
                value={draft.title}
                maxLength={MESSAGE_TITLE_MAX}
                placeholder={`请输入消息标题（不超过 ${MESSAGE_TITLE_MAX} 字）`}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              />
            </FormRow>

            <FormRow
              label="消息内容"
              required
              hint={`${draft.content.length} / ${MESSAGE_CONTENT_MAX} 字`}
            >
              <textarea
                rows={5}
                value={draft.content}
                maxLength={MESSAGE_CONTENT_MAX}
                aria-label="消息内容"
                placeholder="请输入消息内容"
                onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
                className="scroll-thin w-full rounded-md border border-input bg-surface px-3 py-2 text-[13px] leading-relaxed text-foreground focus:border-ring focus:outline-none"
              />
            </FormRow>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              取消
            </Button>
            <Button onClick={submitForm}>{editing ? '保存' : '新增'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewing !== null} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>消息详情</DialogTitle>
          </DialogHeader>

          {viewing && (
            <div className="grid gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusTag tone={messageTypeTone(viewing.type)}>
                  {viewing.type}
                </StatusTag>
                <StatusTag tone={audienceTone(viewing.audience)}>
                  {scopeText(viewing)}
                </StatusTag>
                <StatusTag tone={messageStatusTone(viewing.status)}>
                  {viewing.status}
                </StatusTag>
                {viewing.clearTemplate && (
                  <StatusTag tone="warning">{viewing.clearTemplate}</StatusTag>
                )}
              </div>

              <h4 className="text-sm font-medium text-balance">{viewing.title}</h4>

              <p className="rounded-md border border-border bg-muted/40 px-3 py-2.5 text-[13px] leading-relaxed text-pretty">
                {viewing.content}
              </p>

              <dl className="grid gap-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between gap-3">
                  <dt>消息编号</dt>
                  <dd className="font-mono">{viewing.code}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>消息来源</dt>
                  <dd>{viewing.origin}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>创建信息</dt>
                  <dd>
                    {viewing.creator} · <span className="font-mono">{viewing.createdAt}</span>
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>发送信息</dt>
                  <dd>
                    {viewing.sentAt
                      ? `${viewing.sender} · ${viewing.sentAt} · 接收 ${viewing.recipients} 人`
                      : '尚未发送'}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>关闭</DialogClose>
            {viewing?.status === '待发送' && (
              <Button
                onClick={() => {
                  const res = sendMessages([viewing.id], role.person)
                  setViewing(null)
                  toast[res[0].ok ? 'success' : 'error'](res[0].message)
                }}
              >
                <Send className="size-4" />
                立即发送
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 发送明细：点击接收人数后按员工逐条展示投递结果 */}
      <Dialog open={delivery !== null} onOpenChange={(v) => !v && setDelivery(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>发送明细</DialogTitle>
            <DialogDescription>
              {delivery
                ? `${delivery.title} · ${scopeText(delivery)} · 接收 ${delivery.recipients} 人`
                : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="scroll-thin max-h-[52vh] overflow-auto rounded-md border border-border">
            <Table className="text-[13px]">
              <TableHeader>
                <TableRow className="bg-muted/60">
                  <TableHead className="w-32 pl-4">
                    {delivery?.audience === '管理端后台' ? '用户账号' : '员工工号'}
                  </TableHead>
                  <TableHead className="w-24">
                    {delivery?.audience === '管理端后台' ? '用户姓名' : '员工姓名'}
                  </TableHead>
                  <TableHead className="w-28">
                    {delivery?.audience === '管理端后台' ? '角色' : '员工公司'}
                  </TableHead>
                  <TableHead className="min-w-36">
                    {delivery?.audience === '管理端后台' ? '用户部门' : '员工部门'}
                  </TableHead>
                  <TableHead className="w-40">发送时间</TableHead>
                  <TableHead className="w-24 pr-4">是否成功</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveryRows.length === 0 && (
                  <TableEmpty colSpan={6} text="暂无发送明细" />
                )}
                {deliveryRows.map((d) => (
                  <TableRow key={d.key}>
                    <TableCell className="pl-4 font-mono text-xs">{d.no}</TableCell>
                    <TableCell>{d.name}</TableCell>
                    <TableCell className="text-muted-foreground">{d.org}</TableCell>
                    <TableCell className="text-muted-foreground">{d.dept}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {d.sentAt}
                    </TableCell>
                    <TableCell className="pr-4">
                      <StatusTag tone={d.success ? 'success' : 'danger'}>
                        {d.success ? '成功' : '失败'}
                      </StatusTag>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>关闭</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 选择员工：支持工号/姓名/公司/部门关键字与在职状态筛选，可多选 */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>选择员工</DialogTitle>
          </DialogHeader>

          <div className="flex flex-wrap items-center gap-2">
            <Input
              className="w-56"
              value={pickKeyword}
              placeholder="工号 / 姓名 / 公司 / 部门"
              aria-label="员工关键字"
              onChange={(e) => setPickKeyword(e.target.value)}
            />
            <NativeSelect
              aria-label="员工状态"
              className="w-32"
              value={pickStatus}
              onChange={setPickStatus}
              options={['全部状态', ...EMPLOYEE_STATUSES]}
            />
            <span className="ml-auto text-xs text-muted-foreground">
              已选 {picked.length} 人
            </span>
          </div>

          <div className="scroll-thin max-h-[46vh] overflow-auto rounded-md border border-border">
            <Table className="text-[13px]">
              <TableHeader>
                <TableRow className="bg-muted/60">
                  <TableHead className="w-10 pl-4">
                    <Checkbox
                      aria-label="全选筛选结果"
                      checked={
                        pickerRows.length > 0 &&
                        pickerRows.every((e) => picked.includes(e.id))
                      }
                      onCheckedChange={(v) =>
                        setPicked((prev) =>
                          v
                            ? Array.from(
                                new Set([...prev, ...pickerRows.map((e) => e.id)]),
                              )
                            : prev.filter((id) => !pickerRows.some((e) => e.id === id)),
                        )
                      }
                    />
                  </TableHead>
                  <TableHead className="w-28">员工工号</TableHead>
                  <TableHead className="w-24">员工姓名</TableHead>
                  <TableHead className="w-28">员工公司</TableHead>
                  <TableHead className="min-w-36">员工部门</TableHead>
                  <TableHead className="w-24 pr-4">员工状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pickerRows.length === 0 && (
                  <TableEmpty colSpan={6} text="没有符合条件的员工" />
                )}
                {pickerRows.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="pl-4">
                      <Checkbox
                        aria-label={`选择员工 ${e.name}`}
                        checked={picked.includes(e.id)}
                        onCheckedChange={(v) =>
                          setPicked((prev) =>
                            v ? [...prev, e.id] : prev.filter((id) => id !== e.id),
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{e.no}</TableCell>
                    <TableCell>{e.name}</TableCell>
                    <TableCell className="text-muted-foreground">{e.company}</TableCell>
                    <TableCell className="text-muted-foreground">{e.dept}</TableCell>
                    <TableCell className="pr-4">
                      <StatusTag tone={e.status === '在职' ? 'success' : 'neutral'}>
                        {e.status}
                      </StatusTag>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPickerOpen(false)}>
              取消
            </Button>
            <Button onClick={confirmPicker}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 选择后台用户：支持账号/姓名/部门关键字与角色筛选，可多选 */}
      <Dialog open={userPickerOpen} onOpenChange={setUserPickerOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>选择后台用户</DialogTitle>
            <DialogDescription>
              勾选后仅这些管理端账号会收到该消息，未勾选的账号不会收到提醒。
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap items-center gap-2">
            <Input
              className="w-56"
              value={userKeyword}
              placeholder="账号 / 姓名 / 部门"
              aria-label="用户关键字"
              onChange={(e) => setUserKeyword(e.target.value)}
            />
            <NativeSelect
              aria-label="用户角色"
              className="w-40"
              value={userRole}
              onChange={setUserRole}
              options={['全部角色', ...ADMIN_ROLE_NAMES]}
            />
            <span className="ml-auto text-xs text-muted-foreground">
              已选 {pickedUsers.length} 人
            </span>
          </div>

          <div className="scroll-thin max-h-[46vh] overflow-auto rounded-md border border-border">
            <Table className="text-[13px]">
              <TableHeader>
                <TableRow className="bg-muted/60">
                  <TableHead className="w-10 pl-4">
                    <Checkbox
                      aria-label="全选筛选结果"
                      checked={
                        userPickerRows.length > 0 &&
                        userPickerRows.every((u) => pickedUsers.includes(u.id))
                      }
                      onCheckedChange={(v) =>
                        setPickedUsers((prev) =>
                          v
                            ? Array.from(
                                new Set([...prev, ...userPickerRows.map((u) => u.id)]),
                              )
                            : prev.filter(
                                (id) => !userPickerRows.some((u) => u.id === id),
                              ),
                        )
                      }
                    />
                  </TableHead>
                  <TableHead className="w-40">用户账号</TableHead>
                  <TableHead className="w-24">用户姓名</TableHead>
                  <TableHead className="min-w-36">用户部门</TableHead>
                  <TableHead className="w-32 pr-4">角色</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userPickerRows.length === 0 && (
                  <TableEmpty colSpan={5} text="没有符合条件的后台用户" />
                )}
                {userPickerRows.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="pl-4">
                      <Checkbox
                        aria-label={`选择用户 ${u.name}`}
                        checked={pickedUsers.includes(u.id)}
                        onCheckedChange={(v) =>
                          setPickedUsers((prev) =>
                            v ? [...prev, u.id] : prev.filter((id) => id !== u.id),
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{u.account}</TableCell>
                    <TableCell>{u.name}</TableCell>
                    <TableCell className="text-muted-foreground">{u.dept}</TableCell>
                    <TableCell className="pr-4 text-muted-foreground">{u.role}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUserPickerOpen(false)}>
              取消
            </Button>
            <Button onClick={confirmUserPicker}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BatchResultDialog
        open={results !== null}
        onOpenChange={(v) => !v && setResults(null)}
        action={resultAction}
        results={results ?? []}
      />
    </>
  )
}
