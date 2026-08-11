'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { CheckCircle2, Download, RefreshCcw } from 'lucide-react'
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
  confirmReceive,
  ORDER_STATUSES,
  orderStatusTone,
  qtyText,
  useMall,
  type MallOrder,
} from '@/lib/mall-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  status: '全部状态',
  orderNo: '',
  nickname: '',
  employee: '',
}

/** 确认领取弹窗核对项：只核对员工、订单、商品、数量与消耗积分 */
function ConfirmRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-3 py-2">
      <span className="shrink-0 text-[13px] text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right text-[13px]">{value}</span>
    </div>
  )
}

export default function MallOrdersPage() {
  const pathname = usePathname()
  const { orders } = useMall()
  const { role } = useApp()

  const [status, setStatus] = React.useState('全部状态')
  const [orderNo, setOrderNo] = React.useState('')
  const [nickname, setNickname] = React.useState('')
  const [employee, setEmployee] = React.useState('')
  const [query, setQuery] = React.useState(EMPTY_QUERY)
  const [target, setTarget] = React.useState<MallOrder | null>(null)

  const rows = React.useMemo(
    () =>
      orders.filter((o) => {
        const hitStatus = query.status === '全部状态' || o.status === query.status
        const hitOrderNo = o.orderNo.includes(query.orderNo.trim())
        const hitNickname = o.nickname.includes(query.nickname.trim())
        const hitEmployee = o.employee.includes(query.employee.trim())
        return hitStatus && hitOrderNo && hitNickname && hitEmployee
      }),
    [orders, query],
  )

  const table = useTableState(rows)
  const pending = orders.filter((o) => o.status === '待领取').length

  function search() {
    setQuery({ status, orderNo, nickname, employee })
    table.setPage(1)
  }

  function reset() {
    setStatus('全部状态')
    setOrderNo('')
    setNickname('')
    setEmployee('')
    setQuery(EMPTY_QUERY)
  }

  /** 二次确认后流转为已领取，系统自动记录当前管理员与确认时间 */
  function submitConfirm() {
    if (!target) return
    const result = confirmReceive(target.id, role.person)
    setTarget(null)
    if (result.ok) toast.success(`${result.label} ${result.message}`)
    else toast.error(result.message)
  }

  return (
    <>
      <PageHeader
        breadcrumb={breadcrumbFor(pathname)}
        title="订单管理"
        actions={
          <Button variant="outline" onClick={() => toast.success('列表已刷新')}>
            <RefreshCcw className="size-4" />
            刷新
          </Button>
        }
      />

      <FilterBar onSearch={search} onReset={reset}>
        <FilterField label="订单状态">
          <NativeSelect
            aria-label="订单状态"
            value={status}
            onChange={setStatus}
            options={['全部状态', ...ORDER_STATUSES]}
          />
        </FilterField>
        <FilterField label="订单编号">
          <Input
            value={orderNo}
            placeholder="请输入订单编号"
            onChange={(e) => setOrderNo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) search()
            }}
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
      </FilterBar>

      <Panel bodyClassName="p-0">
        <Toolbar>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              downloadCsv(
                '积分订单',
                [
                  '订单编号',
                  '订单状态',
                  '昵称',
                  '员工姓名',
                  '所属部门',
                  '商品名称',
                  '商品编号',
                  '数量',
                  '消耗积分（单价）',
                  '订单消耗积分',
                  '兑换时间',
                  '确认领取人',
                  '确认领取时间',
                ],
                rows.map((o) => [
                  o.orderNo,
                  o.status,
                  o.nickname,
                  o.employee,
                  o.dept,
                  o.productName,
                  o.productCode,
                  qtyText(o.quantity, o.unit),
                  o.unitPoints,
                  o.totalPoints,
                  o.createdAt,
                  o.receiver || '—',
                  o.receivedAt || '—',
                ]),
              )
              toast.success(`已导出 ${rows.length} 条订单`)
            }}
          >
            <Download className="size-3.5" />
            导出
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">
            待领取 {pending} 条，请通过企业微信联系员工后再确认领取
          </span>
        </Toolbar>

        <Table className="text-[13px]">
          <TableHeader>
            <TableRow className="bg-muted/60">
              <TableHead className="w-14 pl-4">序号</TableHead>
              <TableHead className="w-20">订单状态</TableHead>
              <TableHead className="w-40">订单编号</TableHead>
              <TableHead className="w-28">昵称</TableHead>
              <TableHead className="w-24">员工姓名</TableHead>
              <TableHead className="min-w-36">商品名称</TableHead>
              <TableHead className="w-40">商品编号</TableHead>
              <TableHead className="w-16">数量</TableHead>
              <TableHead className="w-28">消耗积分（单价）</TableHead>
              <TableHead className="w-24">订单消耗积分</TableHead>
              <TableHead className="w-40">兑换时间</TableHead>
              <TableHead className="w-24">确认领取人</TableHead>
              <TableHead className="w-40">确认领取时间</TableHead>
              <TableHead className="w-28 pr-4 text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.pageRows.length === 0 && (
              <TableEmpty colSpan={14} text="没有符合条件的订单" />
            )}
            {table.pageRows.map((o, i) => (
              <TableRow key={o.id}>
                <TableCell className="pl-4 text-muted-foreground">
                  {(table.page - 1) * table.pageSize + i + 1}
                </TableCell>
                <TableCell>
                  <StatusTag tone={orderStatusTone(o.status)}>{o.status}</StatusTag>
                </TableCell>
                <TableCell className="font-mono text-xs">{o.orderNo}</TableCell>
                <TableCell>
                  <span className="block truncate" title={o.nickname}>
                    {o.nickname}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="block truncate" title={`${o.employee} · ${o.dept}`}>
                    {o.employee}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="block truncate" title={o.productName}>
                    {o.productName}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {o.productCode}
                </TableCell>
                <TableCell className="text-xs">
                  <span className="font-mono">{o.quantity}</span> {o.unit}
                </TableCell>
                <TableCell className="font-mono text-xs">{o.unitPoints}</TableCell>
                <TableCell className="font-mono text-xs text-warning">
                  {o.totalPoints}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {o.createdAt}
                </TableCell>
                <TableCell className="text-xs">{o.receiver || '—'}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {o.receivedAt || '—'}
                </TableCell>
                <TableCell className="pr-4 text-center">
                  {o.status === '待领取' ? (
                    <Button size="xs" variant="outline" onClick={() => setTarget(o)}>
                      <CheckCircle2 className="size-3.5" />
                      确认领取
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">已完成</span>
                  )}
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

      <Dialog open={target !== null} onOpenChange={(v) => !v && setTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>确认领取</DialogTitle>
            <DialogDescription>
              请核对以下信息，确认员工已实际领取后再提交。提交后订单流转为「已领取」，
              系统自动记录确认人与确认时间。
            </DialogDescription>
          </DialogHeader>

          {target && (
            <div className="divide-y divide-border rounded-md border border-border">
              <ConfirmRow
                label="员工"
                value={
                  <>
                    {target.employee}
                    <span className="text-muted-foreground">（{target.nickname}）</span>
                  </>
                }
              />
              <ConfirmRow
                label="订单"
                value={<span className="font-mono text-xs">{target.orderNo}</span>}
              />
              <ConfirmRow label="商品" value={target.productName} />
              <ConfirmRow
                label="数量"
                value={
                  <span className="text-xs">
                    <span className="font-mono">{target.quantity}</span> {target.unit}
                  </span>
                }
              />
              <ConfirmRow
                label="消耗积分"
                value={
                  <span className="font-mono text-xs text-warning">
                    {target.totalPoints}
                  </span>
                }
              />
            </div>
          )}

          <p className="rounded-md border border-border bg-muted/50 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            积分与库存已在会员兑换时结算，本次确认��登记领取事实，不会再次改动积分或库存；
            确认人将记录为 <span className="text-foreground">{role.person}</span>。
          </p>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>取消</DialogClose>
            <Button onClick={submitConfirm}>确认领取</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
