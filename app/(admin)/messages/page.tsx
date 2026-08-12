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
  audienceTone,
  CLEAR_TEMPLATE_TEXT,
  CLEAR_TEMPLATES,
  createMessage,
  EMPTY_MESSAGE_DRAFT,
  MESSAGE_AUDIENCES,
  MESSAGE_CONTENT_MAX,
  MESSAGE_STATUSES,
  MESSAGE_TITLE_MAX,
  MESSAGE_TYPES,
  messageStatusTone,
  messageTypeTone,
  removeMessages,
  sendMessages,
  updateMessage,
  useOps,
  validateMessage,
  type ClearTemplate,
  type MessageAudience,
  type MessageDraft,
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
  const pending = messages.filter((m) => m.status === '待发送').length

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
      title: m.title,
      content: m.content,
      clearTemplate: m.clearTemplate,
    })
    setFormOpen(true)
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
          <>
            <Button variant="outline" onClick={() => toast.success('列表已刷新')}>
              <RefreshCcw className="size-4" />
              刷新
            </Button>
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              新增消息
            </Button>
          </>
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
                  '站内消息',
                  [
                    '消息编号',
                    '消息类型',
                    '接收端',
                    '消息标题',
                    '清零提醒模板',
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
                    m.title,
                    m.clearTemplate || '—',
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
            <span className="ml-auto text-xs text-muted-foreground">
              待发送 {pending} 条 · 站内消息独立于资讯「通知」，不占用资讯类目
            </span>
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
                <TableHead className="w-24">接收端</TableHead>
                <TableHead className="min-w-52">消息标题</TableHead>
                <TableHead className="w-40">消息编号</TableHead>
                <TableHead className="w-24">清零模板</TableHead>
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
                <TableEmpty colSpan={14} text="没有符合条件的消息" />
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
                    {m.clearTemplate || '—'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {m.origin}
                  </TableCell>
                  <TableCell>
                    <StatusTag tone={messageStatusTone(m.status)}>{m.status}</StatusTag>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {m.status === '已发送' ? m.recipients : '—'}
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
            <DialogDescription>
              站内消息与资讯「通知」相互独立，只在消息中心内推送，不会进入资讯列表。
              新增后先进入「待发送」，确认无误再发送。
            </DialogDescription>
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
              <FormRow label="接收端" required hint="决定消息推送给员工还是管理员">
                <NativeSelect
                  aria-label="接收端"
                  value={draft.audience}
                  onChange={(v) =>
                    setDraft((d) => ({ ...d, audience: v as MessageAudience }))
                  }
                  options={MESSAGE_AUDIENCES}
                />
              </FormRow>
            </div>

            {draft.type === '年度清零' && (
              <FormRow
                label="清零提醒模板"
                required
                hint="年度清零仅提前 30 天与提前 7 天两次提醒，选择后自动填入文案，可继续微调"
              >
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
                  {viewing.audience}
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

      <BatchResultDialog
        open={results !== null}
        onOpenChange={(v) => !v && setResults(null)}
        action={resultAction}
        results={results ?? []}
      />
    </>
  )
}
