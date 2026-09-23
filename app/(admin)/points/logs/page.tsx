'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { Download } from 'lucide-react'
import { toast } from 'sonner'

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
  logTypeTone,
  signedAmount,
  usePoints,
  type PointsLogType,
} from '@/lib/points-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const TYPES: PointsLogType[] = ['增加', '扣减', '年度清零']

const EMPTY_QUERY = {
  nickname: '',
  employee: '',
  type: '全部类型',
  start: '',
  end: '',
}

export default function PointsLogsPage() {
  const pathname = usePathname()
  const { logs } = usePoints()

  const [nickname, setNickname] = React.useState('')
  const [employee, setEmployee] = React.useState('')
  const [type, setType] = React.useState('全部类型')
  const [start, setStart] = React.useState('')
  const [end, setEnd] = React.useState('')
  const [query, setQuery] = React.useState(EMPTY_QUERY)

  const rows = React.useMemo(
    () =>
      logs.filter((l) => {
        const hitNickname = l.nickname.includes(query.nickname.trim())
        const hitEmployee = l.employee.includes(query.employee.trim())
        const hitType = query.type === '全部类型' || l.type === query.type
        const day = l.at.slice(0, 10)
        const hitStart = !query.start || day >= query.start
        const hitEnd = !query.end || day <= query.end
        return hitNickname && hitEmployee && hitType && hitStart && hitEnd
      }),
    [logs, query],
  )

  const table = useTableState(rows)

  function search() {
    setQuery({ nickname, employee, type, start, end })
    table.setPage(1)
  }

  function reset() {
    setNickname('')
    setEmployee('')
    setType('全部类型')
    setStart('')
    setEnd('')
    setQuery(EMPTY_QUERY)
  }

  return (
    <>
      <PageHeader
        breadcrumb={breadcrumbFor(pathname)}
        title="积分日志"
      />

      <FilterBar onSearch={search} onReset={reset}>
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
        <FilterField label="类型">
          <NativeSelect
            aria-label="类型"
            value={type}
            onChange={setType}
            options={['全部类型', ...TYPES]}
          />
        </FilterField>
        <label className="flex items-center gap-2">
          <span className="shrink-0 text-[13px] text-muted-foreground">变更时间</span>
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

      <Panel bodyClassName="p-0">
        <Toolbar>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              downloadCsv(
                '积分日志',
                [
                  '积分流水ID',
                  '昵称',
                  '员工姓名',
                  '所属部门',
                  '积分数量',
                  '类型',
                  '积分变更来源',
                  '变更后余额',
                  '变更时间',
                ],
                rows.map((l) => [
                  l.serial,
                  l.nickname,
                  l.employee,
                  l.dept,
                  signedAmount(l),
                  l.type,
                  l.source,
                  l.balance,
                  l.at,
                ]),
              )
              toast.success(`已导出 ${rows.length} 条积分流水`)
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
              <TableHead className="w-24">积分流水ID</TableHead>
              <TableHead className="w-28">昵称</TableHead>
              <TableHead className="w-24">员工姓名</TableHead>
              <TableHead className="w-20">积分数量</TableHead>
              <TableHead className="w-20">类型</TableHead>
              <TableHead className="min-w-48">积分变更来源</TableHead>
              <TableHead className="w-24">变更后余额</TableHead>
              <TableHead className="w-28 pr-4">变更时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.pageRows.length === 0 && (
              <TableEmpty colSpan={9} text="没有符合条件的积分流水" />
            )}
            {table.pageRows.map((l, i) => (
              <TableRow key={l.id}>
                <TableCell className="pl-4 text-muted-foreground">
                  {(table.page - 1) * table.pageSize + i + 1}
                </TableCell>
                <TableCell className="font-mono text-xs">{l.serial}</TableCell>
                <TableCell>
                  <span className="block truncate" title={l.nickname}>
                    {l.nickname}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="block truncate" title={`${l.employee} · ${l.dept}`}>
                    {l.employee}
                  </span>
                </TableCell>
                <TableCell
                  className={
                    l.type === '增加'
                      ? 'font-mono text-xs text-brand-green'
                      : 'font-mono text-xs text-warning'
                  }
                >
                  {signedAmount(l)}
                </TableCell>
                <TableCell>
                  <StatusTag tone={logTypeTone(l.type)}>{l.type}</StatusTag>
                </TableCell>
                <TableCell>
                  <span className="line-clamp-2 whitespace-normal text-muted-foreground">
                    {l.source}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-xs">{l.balance}</TableCell>
                <TableCell
                  className="pr-4 font-mono text-xs text-muted-foreground"
                  title={l.at}
                >
                  {l.at.slice(0, 10)}
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
    </>
  )
}
