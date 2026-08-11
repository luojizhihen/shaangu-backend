'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Send } from 'lucide-react'
import { toast } from 'sonner'

import { useApp } from '@/components/app-store'
import { PageHeader } from '@/components/layout/page-frame'
import {
  EMPTY_MEDIA_FORM,
  MediaForm,
  type MediaFormValues,
} from '@/components/media/media-form'
import { BatchResultDialog } from '@/components/content/batch-result-dialog'
import { createMediaItem, publishMedia, type BatchResult } from '@/lib/media-store'
import { breadcrumbFor } from '@/lib/nav'
import { Button } from '@/components/ui/button'

export default function NewMediaPage() {
  const router = useRouter()
  const { role, allow } = useApp()
  const canPublish = allow('media.publish')

  const [values, setValues] = React.useState<MediaFormValues>(EMPTY_MEDIA_FORM)
  const [results, setResults] = React.useState<BatchResult[] | null>(null)

  function patch(p: Partial<MediaFormValues>) {
    setValues((v) => ({ ...v, ...p }))
  }

  function validate() {
    if (!values.title.trim()) {
      toast.error('请填写视听内容标题')
      return false
    }
    return true
  }

  function saveDraft() {
    if (!validate()) return
    const item = createMediaItem({
      ...values,
      author: role.person,
      dept: role.scope,
    })
    toast.success('已保存为草稿')
    router.push(`/media/${item.id}`)
  }

  function publish() {
    if (!validate()) return
    if (values.process !== '处理完成') {
      toast.error(
        values.process === '处理失败'
          ? '媒体文件处理失败，请重试处理后再发布'
          : '请先上传媒体文件并等待处理完成',
      )
      return
    }
    if (!values.cover) {
      toast.error(
        values.kind === '视频'
          ? '发布前请重新截取视频第一帧作为封面'
          : '发布前请手动上传“陕鼓之声”封面',
      )
      return
    }
    const item = createMediaItem({ ...values, author: role.person, dept: role.scope })
    setResults(publishMedia([item.id], role.person))
  }

  return (
    <>
      <PageHeader
        breadcrumb={[...breadcrumbFor('/media/list'), '新增视听内容']}
        title="新增视听内容"
        actions={
          <>
            <Button variant="outline" onClick={() => router.push('/media/list')}>
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

      <MediaForm values={values} onChange={patch} />

      <BatchResultDialog
        open={results !== null}
        onOpenChange={(v) => {
          if (!v) {
            setResults(null)
            router.push('/media/list')
          }
        }}
        action="发布"
        results={results ?? []}
      />
    </>
  )
}
