'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Download,
  Plus,
  RefreshCcw,
  SquarePen,
} from 'lucide-react'
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
import { BatchResultDialog } from '@/components/content/batch-result-dialog'
import { breadcrumbFor } from '@/lib/nav'
import { downloadCsv } from '@/lib/export'
import {
  limitText,
  productStatusTone,
  PRODUCT_STATUSES,
  putProductsOnline,
  takeProductsOffline,
  useMall,
} from '@/lib/mall-store'
import type { BatchResult } from '@/lib/content-store'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
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
  name: '',
  onlineStart: '',
  onlineEnd: '',
  createdStart: '',
  createdEnd: '',
}

export default function MallProductsPage() {
  const pathname = usePathname()
  const router = useRouter()
  const { products } = useMall()

  const [status, setStatus] = React.useState('全部状态')
  const [name, setName] = React.useState('')
  const [onlineStart, setOnlineStart] = React.useState('')
  const [onlineEnd, setOnlineEnd] = React.useState('')
  const [createdStart, setCreatedStart] = React.useState('')
  const [createdEnd, setCreatedEnd] = React.useState('')
  const [query, setQuery] = React.useState(EMPTY_QUERY)
  const [results, setResults] = React.useState<BatchResult[] | null>(null)
  const [resultAction, setResultAction] = React.useState('操作')

  const rows = React.useMemo(
    () =>
      products.filter((p) => {
        const hitStatus = query.status === '全部状态' || p.status === query.status
        const hitName = p.name.includes(query.name.trim())
        const onlineDay = p.onlineAt.slice(0, 10)
        const hitOnlineStart =
          !query.onlineStart || (onlineDay && onlineDay >= query.onlineStart)
        const hitOnlineEnd =
          !query.onlineEnd || (onlineDay && onlineDay <= query.onlineEnd)
        const createdDay = p.createdAt.slice(0, 10)
        const hitCreatedStart = !query.createdStart || createdDay >= query.createdStart
        const hitCreatedEnd = !query.createdEnd || createdDay <= query.createdEnd
        return (
          hitStatus &&
          hitName &&
          hitOnlineStart &&
          hitOnlineEnd &&
          hitCreatedStart &&
          hitCreatedEnd
        )
      }),
    [products, query],
  )

  const table = useTableState(rows)

  function search() {
    setQuery({ status, name, onlineStart, onlineEnd, createdStart, createdEnd })
    table.setPage(1)
  }

  function reset() {
    setStatus('全部状态')
    setName('')
    setOnlineStart('')
    setOnlineEnd('')
    setCreatedStart('')
    setCreatedEnd('')
    setQuery(EMPTY_QUERY)
  }

  function runBatch(action: string, fn: (ids: string[]) => BatchResult[]) {
    if (table.selected.length === 0) {
      toast.error('请先勾选商品')
      return
    }
    setResultAction(action)
    setResults(fn(table.selected))
    table.clear()
  }

  return (
    <>
      <PageHeader
        breadcrumb={breadcrumbFor(pathname)}
        title="商品管理"
        actions={
          <Button variant="outline" onClick={() => toast.success('列表已刷新')}>
            <RefreshCcw className="size-4" />
            刷新
          </Button>
        }
      />

      <FilterBar onSearch={search} onReset={reset}>
        <FilterField label="商品状态">
          <NativeSelect
            aria-label="商品状态"
            value={status}
            onChange={setStatus}
            options={['全部状态', ...PRODUCT_STATUSES]}
          />
        </FilterField>
        <FilterField label="商品名称">
          <Input
            value={name}
            placeholder="请输入商品名称"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) search()
            }}
          />
        </FilterField>
        <label className="flex items-center gap-2">
          <span className="shrink-0 text-[13px] text-muted-foreground">上架时间</span>
          <span className="flex items-center gap-1">
            <Input
              type="date"
              aria-label="上架开始时间"
              className="w-36"
              value={onlineStart}
              onChange={(e) => setOnlineStart(e.target.value)}
            />
            <span className="text-xs text-muted-foreground">~</span>
            <Input
              type="date"
              aria-label="上架结束时间"
              className="w-36"
              value={onlineEnd}
              onChange={(e) => setOnlineEnd(e.target.value)}
            />
          </span>
        </label>
        <label className="flex items-center gap-2">
          <span className="shrink-0 text-[13px] text-muted-foreground">创建时间</span>
          <span className="flex items-center gap-1">
            <Input
              type="date"
              aria-label="创建开始时间"
              className="w-36"
              value={createdStart}
              onChange={(e) => setCreatedStart(e.target.value)}
            />
            <span className="text-xs text-muted-foreground">~</span>
            <Input
              type="date"
              aria-label="创建结束时间"
              className="w-36"
              value={createdEnd}
              onChange={(e) => setCreatedEnd(e.target.value)}
            />
          </span>
        </label>
      </FilterBar>

      <Panel bodyClassName="p-0">
        <Toolbar>
          <Button size="sm" onClick={() => router.push('/mall/products/new')}>
            <Plus className="size-3.5" />
            新增
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={table.selected.length === 0}
            onClick={() => runBatch('上架', putProductsOnline)}
          >
            <ArrowUpFromLine className="size-3.5" />
            上架
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={table.selected.length === 0}
            onClick={() => runBatch('下架', takeProductsOffline)}
          >
            <ArrowDownToLine className="size-3.5" />
            下架
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto"
            onClick={() => {
              downloadCsv(
                '积分商城商品',
                [
                  '商品名称',
                  '商品编号',
                  '所需积分',
                  '库存',
                  '已兑换数量',
                  '每人限兑',
                  '商品状态',
                  '上架时间',
                  '下架时间',
                  '创建时间',
                  '创建人',
                ],
                rows.map((p) => [
                  p.name,
                  p.code,
                  p.points,
                  p.stock,
                  p.redeemed,
                  limitText(p.perPersonLimit),
                  p.status,
                  p.onlineAt || '—',
                  p.offlineAt || '—',
                  p.createdAt,
                  p.creator,
                ]),
              )
              toast.success(`已导出 ${rows.length} 条商品`)
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
                  aria-label="全选本页商品"
                  checked={table.allChecked}
                  onCheckedChange={(v) => table.togglePage(Boolean(v))}
                />
              </TableHead>
              <TableHead className="w-16">图片</TableHead>
              <TableHead className="min-w-40">商品名称</TableHead>
              <TableHead className="w-40">商品编号</TableHead>
              <TableHead className="w-20">所需积分</TableHead>
              <TableHead className="w-16">库存</TableHead>
              <TableHead className="w-24">已兑换数量</TableHead>
              <TableHead className="w-20">每人限兑</TableHead>
              <TableHead className="w-20">商品状态</TableHead>
              <TableHead className="w-40">上架时间</TableHead>
              <TableHead className="w-40">下架时间</TableHead>
              <TableHead className="w-40">创建时间</TableHead>
              <TableHead className="w-20">创建人</TableHead>
              <TableHead className="w-20 pr-4 text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.pageRows.length === 0 && (
              <TableEmpty colSpan={15} text="没有符合条件的商品" />
            )}
            {table.pageRows.map((p, i) => (
              <TableRow key={p.id}>
                <TableCell className="pl-4 text-muted-foreground">
                  {(table.page - 1) * table.pageSize + i + 1}
                </TableCell>
                <TableCell>
                  <Checkbox
                    aria-label={`选择商品 ${p.name}`}
                    checked={table.selected.includes(p.id)}
                    onCheckedChange={(v) => table.toggleRow(p.id, Boolean(v))}
                  />
                </TableCell>
                <TableCell>
                  <span className="block size-10 overflow-hidden rounded border border-border bg-muted">
                    {/* 商品图片可能为上传后的本地 blob，统一用原生 img 渲染 */}
                    <img
                      src={p.image || '/placeholder.svg'}
                      alt={`${p.name}图片`}
                      className="size-full object-cover"
                    />
                  </span>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/mall/products/${p.id}`}
                    className="block truncate text-brand hover:underline"
                    title={p.name}
                  >
                    {p.name}
                  </Link>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {p.code}
                </TableCell>
                <TableCell className="font-mono text-xs">{p.points}</TableCell>
                <TableCell
                  className={
                    p.stock === 0 ? 'font-mono text-xs text-warning' : 'font-mono text-xs'
                  }
                >
                  {p.stock}
                </TableCell>
                <TableCell className="font-mono text-xs">{p.redeemed}</TableCell>
                <TableCell className="text-xs">{limitText(p.perPersonLimit)}</TableCell>
                <TableCell>
                  <StatusTag tone={productStatusTone(p.status)}>{p.status}</StatusTag>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {p.onlineAt || '—'}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {p.offlineAt || '—'}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {p.createdAt}
                </TableCell>
                <TableCell className="text-xs">{p.creator}</TableCell>
                <TableCell className="pr-4">
                  <div className="flex items-center justify-center gap-0.5">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`编辑 ${p.name}`}
                      onClick={() => router.push(`/mall/products/${p.id}`)}
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

      <BatchResultDialog
        open={results !== null}
        onOpenChange={(v) => !v && setResults(null)}
        action={resultAction}
        results={results ?? []}
      />
    </>
  )
}
