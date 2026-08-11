'use client'

import * as React from 'react'
import { ImagePlus, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'

import { NativeSelect, Panel, StatusTag } from '@/components/layout/page-frame'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  limitText,
  LIMIT_CYCLES,
  PRODUCT_UNITS,
  type LimitCycle,
  type MallProduct,
  type ProductDraft,
} from '@/lib/mall-store'

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
    <div className="grid gap-1.5 sm:grid-cols-[104px_1fr] sm:items-start sm:gap-3">
      <span className="pt-1.5 text-[13px] text-muted-foreground sm:text-right">
        {required && <span className="text-destructive">*</span>}
        {label}
      </span>
      <div className="min-w-0">
        {children}
        {hint && (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{hint}</p>
        )}
      </div>
    </div>
  )
}

/**
 * 商品表单：库存直接在商品上维护，不做独立库存模块，
 * 也不涉及 SKU、领取地点、联系人与物流等信息。
 */
export function ProductForm({
  values,
  onChange,
  /** 已入库商品：已兑换数量只读展示 */
  product,
}: {
  values: ProductDraft
  onChange: (patch: Partial<ProductDraft>) => void
  product?: MallProduct
}) {
  const imageRef = React.useRef<HTMLInputElement>(null)

  function pickImage(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('商品图片仅支持图片格式')
      return
    }
    onChange({ image: URL.createObjectURL(file) })
    if (imageRef.current) imageRef.current.value = ''
    toast.success('商品图片已上传')
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="grid gap-4">
        <Panel title="商品信息">
          <div className="grid gap-4">
            <FormRow label="商品名称" required>
              <Input
                value={values.name}
                maxLength={60}
                placeholder="请输入商品名称（不超过 60 字）"
                onChange={(e) => onChange({ name: e.target.value })}
              />
            </FormRow>

            <FormRow label="商品编号" required hint="全局唯一，用于对账与查询">
              <Input
                value={values.code}
                placeholder="如 NO20260806000001"
                onChange={(e) => onChange({ code: e.target.value })}
                className="sm:w-72"
              />
            </FormRow>

            <FormRow label="商品简介">
              <textarea
                value={values.intro}
                maxLength={200}
                rows={3}
                placeholder="用于会员端商品详情展示，建议 100 字以内"
                onChange={(e) => onChange({ intro: e.target.value })}
                className="scroll-thin w-full rounded-md border border-input bg-surface px-3 py-2 text-[13px] leading-relaxed text-foreground focus:border-ring focus:outline-none"
              />
            </FormRow>
          </div>
        </Panel>

        <Panel title="兑换设置">
          <div className="grid gap-4">
            <FormRow label="所需积分" required hint="会员兑换 1 件所需消耗的积分">
              <Input
                type="number"
                min={1}
                value={values.points}
                onChange={(e) =>
                  onChange({ points: Number.parseInt(e.target.value, 10) || 0 })
                }
                className="sm:w-40"
              />
            </FormRow>

            <FormRow
              label="库存"
              required
              hint="库存直接在商品上维护；库存为 0 时无法上架，会员端也无法继续兑换"
            >
              <span className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  aria-label="库存数量"
                  value={values.stock}
                  onChange={(e) =>
                    onChange({ stock: Number.parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-32"
                />
                <NativeSelect
                  aria-label="计量单位"
                  value={values.unit}
                  onChange={(v) => onChange({ unit: v })}
                  options={PRODUCT_UNITS}
                  className="w-24"
                />
              </span>
            </FormRow>

            <FormRow
              label="每人限兑"
              required
              hint={`当前口径：${limitText(values.perPersonLimit, values.unit, values.limitCycle)}；填 -1 表示不限制单人兑换数量`}
            >
              <span className="flex items-center gap-2">
                <Input
                  type="number"
                  min={-1}
                  aria-label="每人限兑数量"
                  value={values.perPersonLimit}
                  onChange={(e) =>
                    onChange({
                      perPersonLimit: Number.parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-32"
                />
                <span className="text-[13px] text-muted-foreground">
                  {values.unit} 每
                </span>
                <NativeSelect
                  aria-label="限兑周期"
                  value={values.limitCycle}
                  onChange={(v) => onChange({ limitCycle: v as LimitCycle })}
                  options={LIMIT_CYCLES}
                  className="w-24"
                />
              </span>
            </FormRow>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 self-start">
        <Panel
          title="商品图片"
          extra={
            <Button
              size="xs"
              variant="outline"
              onClick={() => imageRef.current?.click()}
            >
              <Upload className="size-3.5" />
              {values.image ? '重新上传' : '上传图片'}
            </Button>
          }
        >
          <input
            ref={imageRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pickImage(e.target.files)}
          />
          {values.image ? (
            <div className="relative aspect-square w-full max-w-64 overflow-hidden rounded-md border border-border">
              {/* 上传后的图片可能是本地 blob，统一用原生 img 渲染 */}
              <img
                src={values.image || '/placeholder.svg'}
                alt={`${values.name || '商品'}图片`}
                className="absolute inset-0 size-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 bg-foreground/55 px-1.5 py-1">
                <Button
                  size="xs"
                  variant="ghost"
                  className="h-6 text-surface hover:bg-surface/20 hover:text-surface"
                  onClick={() => imageRef.current?.click()}
                >
                  重新上传
                </Button>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label="删除商品图片"
                  className="text-surface hover:bg-surface/20 hover:text-surface"
                  onClick={() => onChange({ image: '' })}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex aspect-square w-full max-w-64 flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border text-muted-foreground">
              <ImagePlus className="size-6" />
              <span className="px-4 text-center text-[13px] leading-relaxed">
                请上传商品图片
              </span>
            </div>
          )}
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            建议 1:1 正方形；无图片无法上架。
          </p>
        </Panel>

        {product && (
          <Panel title="兑换情况">
            <div className="grid gap-2.5 text-[13px]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">商品状态</span>
                <StatusTag
                  tone={
                    product.status === '已上架'
                      ? 'success'
                      : product.status === '已下架'
                        ? 'neutral'
                        : 'warning'
                  }
                >
                  {product.status}
                </StatusTag>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">当前库存</span>
                <span className="text-xs">
                  <span className="font-mono">{product.stock}</span> {product.unit}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">已兑换数量</span>
                <span className="text-xs">
                  <span className="font-mono">{product.redeemed}</span> {product.unit}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">每人限兑</span>
                <span className="text-xs">
                  {limitText(product.perPersonLimit, product.unit, product.limitCycle)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">上架时间</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {product.onlineAt || '—'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">下架时间</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {product.offlineAt || '—'}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                已兑换数量由订单累计，不可手工修改；下架只影响此后兑换，
                已产生的订单与已扣积分不受影响。
              </p>
            </div>
          </Panel>
        )}
      </div>
    </div>
  )
}
