'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpFromLine,
  Eye,
  EyeOff,
  Pin,
  PinOff,
  Save,
  Send,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

import { useApp } from '@/components/app-store'
import { PageHeader, Panel, StatusTag } from '@/components/layout/page-frame'
import { NewsForm, type NewsFormValues } from '@/components/content/news-form'
import {
  NewsPreviewDialog,
  type PreviewData,
} from '@/components/content/news-preview'
import { BatchResultDialog } from '@/components/content/batch-result-dialog'
import { TableEmpty, useTableState } from '@/components/content/table-shell'
import {
  getNews,
  publishNews,
  putOnline,
  removeComments,
  removeNews,
  setCommentHidden,
  setTop,
  takeOffline,
  updateNews,
  useContent,
  type BatchResult,
} from '@/lib/content-store'
import { breadcrumbFor } from '@/lib/nav'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function NewsDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params.id
  const { news, categories, comments } = useContent()
  const { role, allow } = useApp()
  const canPublish = allow('content.publish')

  const item = news.find((n) => n.id === id)
  const [values, setValues] = React.useState<NewsFormValues | null>(null)
  const [preview, setPreview] = React.useState<PreviewData | null>(null)
  const [results, setResults] = React.useState<BatchResult[] | null>(null)
  const [resultAction, setResultAction] = React.useState('操作')
  const [tab, setTab] = React.useState('content')

  // 首次进入按当前稿件初始化表单
  React.useEffect(() => {
    const target = getNews(id)
    if (!target) return
    setValues({
      title: target.title,
      category: target.category,
      summary: target.summary,
      body: target.body,
      cover: target.cover,
      sort: target.sort,
      top: target.top,
      allowComment: target.allowComment,
      attachments: target.attachments,
    })
  }, [id])

  const rows = React.useMemo(
    () => comments.filter((c) => c.newsId === id),
    [comments, id],
  )
  const table = useTableState(rows)

  if (!item || !values) {
    return (
      <Panel bodyClassName="p-8">
        <p className="text-[13px] text-muted-foreground">
          未找到该资讯，可能已被删除。
        </p>
        <Button className="mt-4" onClick={() => router.push('/content/news')}>
          返回资讯列表
        </Button>
      </Panel>
    )
  }

  function patch(p: Partial<NewsFormValues>) {
    setValues((v) => (v ? { ...v, ...p } : v))
  }

  function save() {
    if (!values) return
    if (!values.title.trim() || !values.body.trim()) {
      toast.error('标题与正文不能为空')
      return
    }
    updateNews(id, values)
    toast.success('稿件已保存')
  }

  function run(action: string, fn: () => BatchResult[]) {
    if (!values) return
    updateNews(id, values)
    setResultAction(action)
    setResults(fn())
  }

  function governComments(action: string, fn: () => BatchResult[]) {
    if (table.selected.length === 0) {
      toast.error('请先勾选评论')
      return
    }
    setResultAction(action)
    setResults(fn())
    table.clear()
  }

  const statusTone =
    item.status === '已发布' ? 'success' : item.status === '草稿' ? 'neutral' : 'warning'

  return (
    <>
      <PageHeader
        breadcrumb={[...breadcrumbFor('/content/news'), '资讯详情']}
        title={item.title}
        description={`${item.id} · ${item.dept} · ${item.author} · 创建 ${item.createdAt} · 最近更新 ${item.updatedAt}`}
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
                  author: item.author,
                  dept: item.dept,
                  publishedAt: item.publishedAt,
                  status: item.status,
                })
              }
            >
              <Eye className="size-4" />
              预览
            </Button>
            <Button variant="outline" onClick={save}>
              <Save className="size-4" />
              保存
            </Button>
            {canPublish && item.status === '草稿' && (
              <Button onClick={() => run('发布', () => publishNews([id], role.person))}>
                <Send className="size-4" />
                发布
              </Button>
            )}
            {item.status === '已发布' && (
              <Button variant="outline" onClick={() => run('下架', () => takeOffline([id]))}>
                <ArrowDownToLine className="size-4" />
                下架
              </Button>
            )}
            {item.status === '已下架' && (
              <Button variant="outline" onClick={() => run('上架', () => putOnline([id]))}>
                <ArrowUpFromLine className="size-4" />
                上架
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() =>
                run(item.top ? '取消置顶' : '置顶', () => setTop([id], !item.top))
              }
            >
              {item.top ? <PinOff className="size-4" /> : <Pin className="size-4" />}
              {item.top ? '取消置顶' : '置顶'}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const res = removeNews([id])
                if (res[0]?.ok) {
                  toast.success('稿件已删除')
                  router.push('/content/news')
                  return
                }
                setResultAction('删除')
                setResults(res)
              }}
            >
              <Trash2 className="size-4" />
              删除
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3">
        <StatusTag tone={statusTone}>{item.status}</StatusTag>
        <StatusTag tone="info">{item.category}</StatusTag>
        {item.top && <StatusTag tone="danger">置顶</StatusTag>}
        <span className="text-xs text-muted-foreground">
          发布时间 {item.publishedAt || '—'}
          {item.publisher ? ` · 发布人 ${item.publisher}` : ''}
        </span>
        <span className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
          <span>浏览 {item.views.toLocaleString('zh-CN')}</span>
          <span>点赞 {item.likes.toLocaleString('zh-CN')}</span>
          <span>评论 {rows.length}</span>
        </span>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as string)}>
        <TabsList variant="line">
          <TabsTrigger value="content">内容编辑</TabsTrigger>
          <TabsTrigger value="comments">评论治理（{rows.length}）</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="pt-2">
          <NewsForm values={values} onChange={patch} categories={categories} />
        </TabsContent>

        <TabsContent value="comments" className="pt-2">
          <Panel bodyClassName="p-0">
            <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  governComments('隐藏评论', () => setCommentHidden(table.selected, true))
                }
              >
                <EyeOff className="size-3.5" />
                批量隐藏
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  governComments('恢复显示', () => setCommentHidden(table.selected, false))
                }
              >
                <Eye className="size-3.5" />
                批量显示
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  governComments('删除评论', () => removeComments(table.selected))
                }
              >
                <Trash2 className="size-3.5" />
                批量删除
              </Button>
              <span className="ml-auto text-xs text-muted-foreground">
                该资讯{item.allowComment ? '允许' : '已关闭'}评论 · 已选{' '}
                {table.selected.length} 条
              </span>
            </div>
            <Table className="text-[13px]">
              <TableHeader>
                <TableRow className="bg-muted/60">
                  <TableHead className="w-10 pl-4">
                    <Checkbox
                      aria-label="全选本页评论"
                      checked={table.allChecked}
                      onCheckedChange={(v) => table.togglePage(Boolean(v))}
                    />
                  </TableHead>
                  <TableHead className="min-w-72">评论内容</TableHead>
                  <TableHead className="w-28">评论者</TableHead>
                  <TableHead className="w-32">会员手机号</TableHead>
                  <TableHead className="w-44">评论时间</TableHead>
                  <TableHead className="w-20">状态</TableHead>
                  <TableHead className="w-24 pr-4 text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.pageRows.length === 0 && (
                  <TableEmpty colSpan={7} text="该资讯暂无评论" />
                )}
                {table.pageRows.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="pl-4">
                      <Checkbox
                        aria-label={`选择评论 ${c.id}`}
                        checked={table.selected.includes(c.id)}
                        onCheckedChange={(v) => table.toggleRow(c.id, Boolean(v))}
                      />
                    </TableCell>
                    <TableCell>
                      <span className="line-clamp-2 whitespace-normal">{c.content}</span>
                    </TableCell>
                    <TableCell>{c.author}</TableCell>
                    <TableCell className="font-mono text-xs">{c.phone}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {c.createdAt}
                    </TableCell>
                    <TableCell>
                      <StatusTag tone={c.hidden ? 'warning' : 'success'}>
                        {c.hidden ? '已隐藏' : '显示中'}
                      </StatusTag>
                    </TableCell>
                    <TableCell className="pr-4">
                      <div className="flex items-center justify-center gap-0.5">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={c.hidden ? '恢复显示' : '隐藏评论'}
                          onClick={() => {
                            setCommentHidden([c.id], !c.hidden)
                            toast.success(c.hidden ? '评论已恢复显示' : '评论已隐藏')
                          }}
                        >
                          {c.hidden ? <EyeOff /> : <Eye />}
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label="删除评论"
                          onClick={() => {
                            removeComments([c.id])
                            toast.success('评论已删除')
                          }}
                        >
                          <Trash2 className="text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>
        </TabsContent>
      </Tabs>

      <NewsPreviewDialog
        open={preview !== null}
        onOpenChange={(v) => !v && setPreview(null)}
        data={preview}
      />

      <BatchResultDialog
        open={results !== null}
        onOpenChange={(v) => !v && setResults(null)}
        action={resultAction}
        results={results ?? []}
      />
    </>
  )
}
