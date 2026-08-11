'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowUpFromLine, Save } from 'lucide-react'
import { toast } from 'sonner'

import { useApp } from '@/components/app-store'
import { PageHeader } from '@/components/layout/page-frame'
import { ProductForm } from '@/components/mall/product-form'
import { BatchResultDialog } from '@/components/content/batch-result-dialog'
import { breadcrumbFor } from '@/lib/nav'
import {
  createProduct,
  EMPTY_PRODUCT_DRAFT,
  nextProductCode,
  putProductsOnline,
  validateProduct,
  type ProductDraft,
} from '@/lib/mall-store'
import type { BatchResult } from '@/lib/content-store'
import { Button } from '@/components/ui/button'

const BACK = '/mall/products'

export default function NewMallProductPage() {
  const router = useRouter()
  const { role } = useApp()

  const [values, setValues] = React.useState<ProductDraft>({
    ...EMPTY_PRODUCT_DRAFT,
    code: nextProductCode(),
  })
  const [results, setResults] = React.useState<BatchResult[] | null>(null)

  function patch(p: Partial<ProductDraft>) {
    setValues((v) => ({ ...v, ...p }))
  }

  function check() {
    const issues = validateProduct(values)
    if (issues.length > 0) {
      toast.error(issues[0])
      return false
    }
    return true
  }

  /** 仅保存：商品进入「待上架」，会员端还看不到 */
  function save() {
    if (!check()) return
    const product = createProduct(values, role.person)
    toast.success('商品已保存，当前为待上架状态')
    router.push(`/mall/products/${product.id}`)
  }

  /** 保存并上架：库存与图片齐备才会真正上架 */
  function saveAndOnline() {
    if (!check()) return
    const product = createProduct(values, role.person)
    setResults(putProductsOnline([product.id]))
  }

  return (
    <>
      <PageHeader
        breadcrumb={[...breadcrumbFor(BACK), '新增商品']}
        title="新增商品"
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
            <Button onClick={saveAndOnline}>
              <ArrowUpFromLine className="size-4" />
              保存并上架
            </Button>
          </>
        }
      />

      <ProductForm values={values} onChange={patch} />

      <BatchResultDialog
        open={results !== null}
        onOpenChange={(v) => {
          if (!v) {
            setResults(null)
            router.push(BACK)
          }
        }}
        action="上架"
        results={results ?? []}
      />
    </>
  )
}
