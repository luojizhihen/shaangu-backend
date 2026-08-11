'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeft, Save, Send } from 'lucide-react'
import { toast } from 'sonner'

import { useApp } from '@/components/app-store'
import { PageHeader } from '@/components/layout/page-frame'
import {
  EMPTY_NEWS_FORM,
  NewsForm,
  type NewsFormValues,
} from '@/components/content/news-form'
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
  const [results, setResults] = React.useState<BatchResult[] | null>(null)

  function patch(p: Partial<NewsFormValues>) {
    setValues((v) => ({ ...v, ...p }))
  }

  function validate() {
    if (!values.title.trim()) {
      toast.error('请填写资讯标题')
      return false
    }
    // 正文为富文本 HTML，去标签后判断是否有实际内容
    if (!values.body.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim()) {
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
        actions={
          <>
            <Button variant="outline" onClick={() => router.push('/content/news')}>
              <ArrowLeft className="size-4" />
              返回列表
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
