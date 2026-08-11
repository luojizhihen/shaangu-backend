'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeft, Eye, Save, Send } from 'lucide-react'
import { toast } from 'sonner'

import { useApp } from '@/components/app-store'
import { PageHeader } from '@/components/layout/page-frame'
import {
  EMPTY_NEWS_FORM,
  NewsForm,
  type NewsFormValues,
} from '@/components/content/news-form'
import {
  NewsPreviewDialog,
  type PreviewData,
} from '@/components/content/news-preview'
import { BatchResultDialog } from '@/components/content/batch-result-dialog'
import {
  createNews,
  publishNews,
  useContent,
  type BatchResult,
} from '@/lib/content-store'
import { breadcrumbFor } from '@/lib/nav'
import { Button } from '@/components/ui/button'

export default function NewNewsPage() {
  const pathname = usePathname()
  const router = useRouter()
  const { categories } = useContent()
  const { role, allow } = useApp()
  const canPublish = allow('content.publish')

  const [values, setValues] = React.useState<NewsFormValues>(EMPTY_NEWS_FORM)
  const [preview, setPreview] = React.useState<PreviewData | null>(null)
  const [results, setResults] = React.useState<BatchResult[] | null>(null)

  function patch(p: Partial<NewsFormValues>) {
    setValues((v) => ({ ...v, ...p }))
  }

  function validate() {
    if (!values.title.trim()) {
      toast.error('请填写资讯标题')
      return false
    }
    if (!values.body.trim()) {
      toast.error('请填写资讯正文')
      return false
    }
    return true
  }

  function saveDraft() {
    if (!validate()) return
    const item = createNews({
      ...values,
      author: role.person,
      dept: role.scope,
    })
    toast.success('已保存为草稿')
    router.push(`/content/news/${item.id}`)
  }

  function publish() {
    if (!validate()) return
    if (!values.cover) {
      toast.error('发布前请设置封面图')
      return
    }
    const item = createNews({ ...values, author: role.person, dept: role.scope })
    setResults(publishNews([item.id], role.person))
  }

  return (
    <>
      <PageHeader
        breadcrumb={[...breadcrumbFor('/content/news'), '新增资讯']}
        title="新增资讯"
        description={
          canPublish
            ? '保存后为草稿状态；发布后默认上架，可在列表中下架或重新上架。'
            : '保存后为草稿状态，发布动作由固定发布人员执行。'
        }
        actions={
          <>
            <Button variant="outline" onClick={() => router.push('/content/news')}>
              <ArrowLeft className="size-4" />
              返回列表
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                setPreview({
                  ...values,
                  author: role.person,
                  dept: role.scope,
                  publishedAt: '',
                  status: '草稿',
                })
              }
            >
              <Eye className="size-4" />
              预览
            </Button>
            <Button variant="outline" onClick={saveDraft}>
              <Save className="size-4" />
              保存草稿
            </Button>
            {canPublish && (
              <Button onClick={publish}>
                <Send className="size-4" />
                发布
              </Button>
            )}
          </>
        }
      />

      <NewsForm values={values} onChange={patch} categories={categories} />

      <NewsPreviewDialog
        open={preview !== null}
        onOpenChange={(v) => !v && setPreview(null)}
        data={preview}
      />

      <BatchResultDialog
        open={results !== null}
        onOpenChange={(v) => {
          if (!v) {
            setResults(null)
            router.push('/content/news')
          }
        }}
        action="发布"
        results={results ?? []}
      />
    </>
  )
}
