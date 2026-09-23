'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpFromLine,
  Save,
} from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader, Panel, StatusTag } from '@/components/layout/page-frame'
import { ProductForm } from '@/components/mall/product-form'
import { BatchResultDialog } from '@/components/content/batch-result-dialog'
import { TableEmpty, useTableState } from '@/components/content/table-shell'
import { breadcrumbFor } from '@/lib/nav'
import {
  getProduct,
  limitText,
  orderStatusTone,
  productStatusTone,
  putProductsOnline,
  qtyText,
  takeProductsOffline,
  updateProduct,
  useMall,
  validateProduct,
  type ProductDraft,
} from '@/lib/mall-store'
import type { BatchResult } from '@/lib/content-store'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const BACK = '/mall/products'

export default function MallProductDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params.id
  const { products, orders } = useMall()

  const product = products.find((p) => p.id === id)
  const [values, setValues] = React.useState<ProductDraft | null>(null)
  const [results, setResults] = React.useState<BatchResult[] | null>(null)
  const [resultAction, setResultAction] = React.useState('操作')
  const [tab, setTab] = React.useState('info')

  // 首次进入按当前商品初始化表单
  React.useEffect(() => {
    const target = getProduct(id)
    if (!target) return
    setValues({
      image: target.image,
      name: target.name,
      code: target.code,
      points: target.points,
      stock: target.stock,
      unit: target.unit,
      perPersonLimit: target.perPersonLimit,
      limitCycle: target.limitCycle,
      intro: target.intro,
    })
  }, [id])

  const rows = React.useMemo(
    () => orders.filter((o) => o.productId === id),
    [orders, id],
  )
  const table = useTableState(rows)

  if (!product || !values) {
    return (
      <Panel bodyClassName="p-8">
        <p className="text-[13px] text-muted-foreground">
          未找到该商品，可能已被移除。
        </p>
        <Button className="mt-4" onClick={() => router.push(BACK)}>
          返回商品管理
        </Button>
      </Panel>
    )
  }

  function patch(p: Partial<ProductDraft>) {
    setValues((v) => (v ? { ...v, ...p } : v))
  }

  function check() {
    if (!values) return false
    const issues = validateProduct(values, id)
    if (issues.length > 0) {
      toast.error(issues[0])
      return false
    }
    return true
  }

  function save() {
    if (!check() || !values) return
    updateProduct(id, values)
    toast.success('商品已保存')
  }

  /** 上下架前先落盘表单，避免图片、库存改动未生效就参与校验 */
  function run(action: string, fn: () => BatchResult[]) {
    if (!check() || !values) return
    updateProduct(id, values)
    setResultAction(action)
    setResults(fn())
  }

  return (
    <>
      <PageHeader
        breadcrumb={[...breadcrumbFor(BACK), '商品详情']}
        title={product.name}
        actions={
          <>
            <Button variant="outline" onClick={() => router.push(BACK)}>
              <ArrowLeft className="size-4" />
              返回列表
            </Button>
            <Button variant="outline" onClick={save}>
              <Save className="size-4" />
              保存
            </Button>
            {product.status === '已上架' ? (
              <Button
                variant="outline"
                onClick={() => run('下架', () => takeProductsOffline([id]))}
              >
                <ArrowDownToLine className="size-4" />
                下架
              </Button>
            ) : (
              <Button onClick={() => run('上架', () => putProductsOnline([id]))}>
                <ArrowUpFromLine className="size-4" />
                上架
              </Button>
            )}
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3">
        <StatusTag tone={productStatusTone(product.status)}>{product.status}</StatusTag>
        {product.stock === 0 && <StatusTag tone="danger">库存为 0</StatusTag>}
        <span className="text-xs text-muted-foreground">
          {product.code} · 创建人 {product.creator} · 创建时间 {product.createdAt} ·
          最近修改 {product.updatedAt}
        </span>
        <span className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
          <span>所需积分 {product.points}</span>
          <span>库存量 {qtyText(product.stock, product.unit)}</span>
          <span>已兑换 {qtyText(product.redeemed, product.unit)}</span>
          <span>
            每人限兑 {limitText(product.perPersonLimit, product.unit, product.limitCycle)}
          </span>
        </span>
      </div>

      {product.stock === 0 && product.status === '已上架' && (
        <p className="mb-4 rounded-lg border border-warning/30 bg-warning/8 px-4 py-2.5 text-xs leading-relaxed text-warning">
          当前库存为 0，会员端已无法继续兑换；补充库存后即可恢复兑换。
        </p>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as string)}>
        <TabsList variant="line">
          <TabsTrigger value="info">商品编辑</TabsTrigger>
          <TabsTrigger value="orders">兑换订单（{rows.length}）</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="pt-2">
          <ProductForm values={values} onChange={patch} product={product} />
        </TabsContent>

        <TabsContent value="orders" className="pt-2">
          <Panel bodyClassName="p-0">
            <Table className="text-[13px]">
              <TableHeader>
                <TableRow className="bg-muted/60">
                  <TableHead className="w-40 pl-4">订单编号</TableHead>
                  <TableHead className="w-20">订单状态</TableHead>
                  <TableHead className="w-24">员工姓名</TableHead>
                  <TableHead className="w-20">数量</TableHead>
                  <TableHead className="w-24">订单消耗积分</TableHead>
                  <TableHead className="w-40">兑换时间</TableHead>
                  <TableHead className="w-40 pr-4">确认领取时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.pageRows.length === 0 && (
                  <TableEmpty colSpan={7} text="该商品暂无兑换订单" />
                )}
                {table.pageRows.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="pl-4 font-mono text-xs">{o.orderNo}</TableCell>
                    <TableCell>
                      <StatusTag tone={orderStatusTone(o.status)}>{o.status}</StatusTag>
                    </TableCell>

                    <TableCell>{o.employee}</TableCell>
                    <TableCell className="text-xs">
                      <span className="font-mono">{o.quantity}</span> {o.unit}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{o.totalPoints}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {o.createdAt}
                    </TableCell>
                    <TableCell className="pr-4 font-mono text-xs text-muted-foreground">
                      {o.receivedAt || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>
        </TabsContent>
      </Tabs>

      <BatchResultDialog
        open={results !== null}
        onOpenChange={(v) => !v && setResults(null)}
        action={resultAction}
        results={results ?? []}
      />
    </>
  )
}
