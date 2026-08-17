'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { Download, MessageSquareReply, RefreshCcw } from 'lucide-react'
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
  FEEDBACK_STATUSES,
  feedbackStatusTone,
  REPLY_MAX,
  replyFeedback,
  useOps,
  type Feedback,
} from '@/lib/ops-store'
import { Button } from '@/components/ui/button'
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
  nickname: '',
  employee: '',
  keyword: '',
  start: '',
  end: '',
}

export default function FeedbackPage() {
  const pathname = usePathname()
  const { feedback } = useOps()
  const { role } = useApp()

  const [status, setStatus] = React.useState('全部状态')
  const [nickname, setNickname] = React.useState('')
  const [employee, setEmployee] = React.useState('')
  const [keyword, setKeyword] = React.useState('')
  const [start, setStart] = React.useState('')
  const [end, setEnd] = React.useState('')
  const [query, setQuery] = React.useState(EMPTY_QUERY)

  const [target, setTarget] = React.useState<Feedback | null>(null)
  const [reply, setReply] = React.useState('')

  const rows = React.useMemo(
    () =>
      feedback.filter((f) => {
        const hitStatus = query.status === '全部状态' || f.status === query.status
        const hitNickname = f.nickname.includes(query.nickname.trim())
        const hitEmployee = f.employee.includes(query.employee.trim())
        const hitKeyword = f.content.includes(query.keyword.trim())
        const day = f.createdAt.slice(0, 10)
        const hitStart = !query.start || day >= query.start
        const hitEnd = !query.end || day <= query.end
        return (
          hitStatus && hitNickname && hitEmployee && hitKeyword && hitStart && hitEnd
        )
      }),
    [feedback, query],
  )

  const table = useTableState(rows)
  const pending = feedback.filter((f) => f.status === '待回复').length

  function search() {
    setQuery({ status, nickname, employee, keyword, start, end })
    table.setPage(1)
  }

  function reset() {
    setStatus('全部状态')
    setNickname('')
    setEmployee('')
    setKeyword('')
    setStart('')
    setEnd('')
    setQuery(EMPTY_QUERY)
  }

  function open(f: Feedback) {
    setTarget(f)
    setReply(f.reply)
  }

  /** 保存回复即完成处理：状态立即由待回复变为已处理，无二次审核 */
  function submitReply() {
    if (!target) return
    const res = replyFeedback(target.id, reply, role.person)
    if (!res.ok) {
      toast.error(res.message)
      return
    }
    setTarget(null)
    setReply('')
    toast.success(res.message)
  }

  return (
    <>
      <PageHeader
        breadcrumb={breadcrumbFor(pathname)}
        title="意见反馈管理"
        actions={
          <Button variant="outline" onClick={() => toast.success('列表已刷新')}>
            <RefreshCcw className="size-4" />
            刷新
          </Button>
        }
      />

      <FilterBar onSearch={search} onReset={reset}>
        <FilterField label="处理状态">
          <NativeSelect
            aria-label="处理状态"
            value={status}
            onChange={setStatus}
            options={['全部状态', ...FEEDBACK_STATUSES]}
          />
        </FilterField>
        <FilterField label="昵称">
          <Input
            value={nickname}
            placeholder="请输入昵称"
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) search()
            }}
          />
        </FilterField>
        <FilterField label="员工姓名">
          <Input
            value={employee}
            placeholder="请输入员工姓名"
            onChange={(e) => setEmployee(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) search()
            }}
          />
        </FilterField>
        <FilterField label="反馈内容">
          <Input
            value={keyword}
            placeholder="请输入关键字"
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) search()
            }}
          />
        </FilterField>
        <label className="flex items-center gap-2">
          <span className="shrink-0 text-[13px] text-muted-foreground">反馈时间</span>
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
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                downloadCsv(
                  '意见反馈',
                  [
                    '反馈编号',
                    '处理状态',
                    '昵称',
                    '员工姓名',
                    '所属部门',
                    '反馈内容',
                    '反馈时间',
                    '回复内容',
                    '处理人',
                    '处理时间',
                  ],
                  rows.map((f) => [
                    f.code,
                    f.status,
                    f.nickname,
                    f.employee,
                    f.dept,
                    f.content,
                    f.createdAt,
                    f.reply || '—',
                    f.replyBy || '—',
                    f.replyAt || '—',
                  ]),
                )
                toast.success(`已导出 ${rows.length} 条反馈`)
              }}
            >
              <Download className="size-3.5" />
              导出
            </Button>
            <span className="ml-auto text-xs text-muted-foreground">
              待回复 {pending} 条 · 反馈仅含文字，填写回复并保存后立即置为已处理
            </span>
          </Toolbar>

          <Table className="text-[13px]">
            <TableHeader>
              <TableRow className="bg-muted/60">
                <TableHead className="w-14 pl-4">序号</TableHead>
                <TableHead className="w-20">处理状态</TableHead>
                <TableHead className="w-36">反馈编号</TableHead>
                <TableHead className="w-24">昵称</TableHead>
                <TableHead className="w-24">员工姓名</TableHead>
                <TableHead className="min-w-64">反馈内容</TableHead>
                <TableHead className="w-40">反馈时间</TableHead>
                <TableHead className="min-w-56">回复内容</TableHead>
                <TableHead className="w-20">处理人</TableHead>
                <TableHead className="w-40">处理时间</TableHead>
                <TableHead className="w-24 pr-4 text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.pageRows.length === 0 && (
                <TableEmpty colSpan={11} text="没有符合条件的反馈" />
              )}
              {table.pageRows.map((f, i) => (
                <TableRow key={f.id}>
                  <TableCell className="pl-4 text-muted-foreground">
                    {(table.page - 1) * table.pageSize + i + 1}
                  </TableCell>
                  <TableCell>
                    <StatusTag tone={feedbackStatusTone(f.status)}>{f.status}</StatusTag>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {f.code}
                  </TableCell>
                  <TableCell>
                    <span className="block truncate" title={f.nickname}>
                      {f.nickname}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="block truncate" title={`${f.employee} · ${f.dept}`}>
                      {f.employee}
                    </span>
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      className="line-clamp-2 whitespace-normal text-left hover:text-brand"
                      title={f.content}
                      onClick={() => open(f)}
                    >
                      {f.content}
                    </button>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {f.createdAt}
                  </TableCell>
                  <TableCell>
                    {f.reply ? (
                      <span
                        className="line-clamp-2 whitespace-normal text-muted-foreground"
                        title={f.reply}
                      >
                        {f.reply}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {f.replyBy || '—'}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {f.replyAt || '—'}
                  </TableCell>
                  <TableCell className="pr-4 text-center">
                    <Button size="xs" variant="outline" onClick={() => open(f)}>
                      <MessageSquareReply className="size-3.5" />
                      {f.status === '待回复' ? '回复' : '查看'}
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
          />
        </Panel>
      </div>

      <Dialog
        open={target !== null}
        onOpenChange={(v) => {
          if (!v) {
            setTarget(null)
            setReply('')
          }
        }}
      >
        {/* 无描述文案，显式置空 aria-describedby 以免 Radix 指向不存在的节点 */}
        <DialogContent className="sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>
              {target?.status === '待回复' ? '回复反馈' : '反馈详情'}
            </DialogTitle>
          </DialogHeader>

          {target && (
            <div className="grid gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <StatusTag tone={feedbackStatusTone(target.status)}>
                  {target.status}
                </StatusTag>
                <span>
                  {target.employee}（{target.nickname}） · {target.dept}
                </span>
                <span className="font-mono">{target.createdAt}</span>
              </div>

              <div className="grid gap-1.5">
                <span className="text-[13px] text-muted-foreground">反馈内容</span>
                <p className="rounded-md border border-border bg-muted/40 px-3 py-2.5 text-[13px] leading-relaxed text-pretty">
                  {target.content}
                </p>
              </div>

              {target.status === '待回复' ? (
                <div className="grid gap-1.5">
                  <label htmlFor="reply-text" className="text-[13px]">
                    <span className="text-destructive">*</span>回复内容
                  </label>
                  <textarea
                    id="reply-text"
                    rows={5}
                    value={reply}
                    maxLength={REPLY_MAX}
                    placeholder="请输入回复内容（纯文字，至少 5 个字）"
                    onChange={(e) => setReply(e.target.value)}
                    className="scroll-thin w-full rounded-md border border-input bg-surface px-3 py-2 text-[13px] leading-relaxed text-foreground focus:border-ring focus:outline-none"
                  />
                  <span className="text-xs text-muted-foreground">
                    {reply.length} / {REPLY_MAX} 字 · 保存后处理人将记录为{' '}
                    <span className="text-foreground">{role.person}</span>
                  </span>
                </div>
              ) : (
                <div className="grid gap-1.5">
                  <span className="text-[13px] text-muted-foreground">回复内容</span>
                  <p className="rounded-md border border-border bg-surface px-3 py-2.5 text-[13px] leading-relaxed text-pretty">
                    {target.reply}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    处理人 {target.replyBy} ·{' '}
                    <span className="font-mono">{target.replyAt}</span>
                  </span>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTarget(null)
                setReply('')
              }}
            >
              {target?.status === '待回复' ? '取消' : '关闭'}
            </Button>
            {target?.status === '待回复' && (
              <Button onClick={submitReply}>保存回复并置为已处理</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
