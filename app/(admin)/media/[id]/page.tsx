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
  RefreshCcw,
  Save,
  Send,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

import { useApp } from '@/components/app-store'
import { PageHeader, Panel, StatusTag } from '@/components/layout/page-frame'
import { MediaForm, type MediaFormValues } from '@/components/media/media-form'
import { BatchResultDialog } from '@/components/content/batch-result-dialog'
import { TableEmpty, useTableState } from '@/components/content/table-shell'
import {
  getMediaItem,
  processTone,
  publishMedia,
  putMediaOnline,
  removeMediaItems,
  retryProcess,
  setMediaCommentHidden,
  setMediaTop,
  statusTone,
  takeMediaOffline,
  updateMediaItem,
  useMedia,
  type BatchResult,
} from '@/lib/media-store'
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

export default function MediaDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params.id
  const { media, comments } = useMedia()
  const { role, allow } = useApp()
  const canPublish = allow('media.publish')

  const item = media.find((m) => m.id === id)
  const [values, setValues] = React.useState<MediaFormValues | null>(null)
  const [results, setResults] = React.useState<BatchResult[] | null>(null)
  const [resultAction, setResultAction] = React.useState('操作')
  const [tab, setTab] = React.useState('content')

  // 首次进入按当前稿件初始化表单
  React.useEffect(() => {
    const target = getMediaItem(id)
    if (!target) return
    setValues({
      title: target.title,
      kind: target.kind,
      summary: target.summary,
      cover: target.cover,
      coverFromFrame: target.coverFromFrame,
      fileName: target.fileName,
      fileSize: target.fileSize,
      duration: target.duration,
      process: target.process,
      failReason: target.failReason,
      sort: target.sort,
      top: target.top,
    })
  }, [id])

  // 转码任务在后台异步完成，处理结果回填到表单
  const processSnapshot = item
    ? `${item.process}|${item.duration}|${item.fileName}|${item.fileSize}|${item.failReason}|${item.cover}`
    : ''
  React.useEffect(() => {
    const target = getMediaItem(id)
    if (!target) return
    setValues((v) =>
      v
        ? {
            ...v,
            fileName: target.fileName,
            fileSize: target.fileSize,
            duration: target.duration,
            process: target.process,
            failReason: target.failReason,
            cover: target.cover || v.cover,
            coverFromFrame: target.coverFromFrame || v.coverFromFrame,
          }
        : v,
    )
  }, [id, processSnapshot])

  const rows = React.useMemo(
    () => comments.filter((c) => c.mediaId === id),
    [comments, id],
  )
  const table = useTableState(rows)

  if (!item || !values) {
    return (
      <Panel bodyClassName="p-8">
        <p className="text-[13px] text-muted-foreground">
          未找到该视听内容，可能已被删除。
        </p>
        <Button className="mt-4" onClick={() => router.push('/media/list')}>
          返回视听列表
        </Button>
      </Panel>
    )
  }

  function patch(p: Partial<MediaFormValues>) {
    setValues((v) => (v ? { ...v, ...p } : v))
  }

  function save() {
    if (!values) return
    if (!values.title.trim()) {
      toast.error('标题不能为空')
      return
    }
    updateMediaItem(id, values)
    toast.success('视听内容已保存')
  }

  function run(action: string, fn: () => BatchResult[]) {
    if (!values) return
    updateMediaItem(id, values)
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

  return (
    <>
      <PageHeader
        breadcrumb={[...breadcrumbFor('/media/list'), '视听内容详情']}
        title={item.title}
        actions={
          <>
            <Button variant="outline" onClick={() => router.push('/media/list')}>
              <ArrowLeft className="size-4" />
              返回列表
            </Button>
            <Button variant="outline" onClick={save}>
              <Save className="size-4" />
              保存
            </Button>
            {item.process === '处理失败' && (
              <Button
                variant="outline"
                onClick={() => run('重试处理', () => retryProcess([id]))}
              >
                <RefreshCcw className="size-4" />
                重试处理
              </Button>
            )}
            {canPublish && item.status === '草稿' && (
              <Button onClick={() => run('发布', () => publishMedia([id], role.person))}>
                <Send className="size-4" />
                发布
              </Button>
            )}
            {item.status === '已发布' && (
              <Button
                variant="outline"
                onClick={() => run('下架', () => takeMediaOffline([id]))}
              >
                <ArrowDownToLine className="size-4" />
                下架
              </Button>
            )}
            {item.status === '已下架' && (
              <Button
                variant="outline"
                onClick={() => run('上架', () => putMediaOnline([id]))}
              >
                <ArrowUpFromLine className="size-4" />
                上架
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() =>
                run(item.top ? '取消置顶' : '置顶', () => setMediaTop([id], !item.top))
              }
            >
              {item.top ? <PinOff className="size-4" /> : <Pin className="size-4" />}
              {item.top ? '取消置顶' : '置顶'}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const res = removeMediaItems([id])
                if (res[0]?.ok) {
                  toast.success('视听内容已删除')
                  router.push('/media/list')
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
        <StatusTag tone={statusTone(item.status)}>{item.status}</StatusTag>
        <StatusTag tone={item.kind === '视频' ? 'info' : 'success'}>{item.kind}</StatusTag>
        <StatusTag tone={processTone(item.process)}>{item.process}</StatusTag>
        {item.top && <StatusTag tone="danger">置顶</StatusTag>}
        <span className="text-xs text-muted-foreground">
          {item.id} · {item.dept} · {item.author} · 时长 {item.duration} · 发布时间{' '}
          {item.publishedAt || '—'}
          {item.publisher ? ` · 发布人 ${item.publisher}` : ''}
        </span>
        <span className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
          <span>播放 {item.plays.toLocaleString('zh-CN')}</span>
          <span>点赞 {item.likes.toLocaleString('zh-CN')}</span>
          <span>评论 {rows.length}</span>
        </span>
      </div>

      {item.status === '已下架' && (
        <p className="mb-4 rounded-lg border border-warning/30 bg-warning/8 px-4 py-2.5 text-xs leading-relaxed text-warning">
          当前内容已下架，用户端不再展示，也无法播放；补齐内容后可点击「上架」恢复。
        </p>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as string)}>
        <TabsList variant="line">
          <TabsTrigger value="content">内容编辑</TabsTrigger>
          <TabsTrigger value="comments">评论治理（{rows.length}）</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="pt-2">
          <MediaForm
            values={values}
            onChange={patch}
            kindLocked
            onRetry={() => run('重试处理', () => retryProcess([id]))}
          />
        </TabsContent>

        <TabsContent value="comments" className="pt-2">
          <Panel bodyClassName="p-0">
            <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  governComments('隐藏评论', () =>
                    setMediaCommentHidden(table.selected, true),
                  )
                }
              >
                <EyeOff className="size-3.5" />
                批量隐藏
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  governComments('恢复显示', () =>
                    setMediaCommentHidden(table.selected, false),
                  )
                }
              >
                <Eye className="size-3.5" />
                批量显示
              </Button>
              <span className="ml-auto text-xs text-muted-foreground">
                共 {rows.length} 条评论 · 已选 {table.selected.length} 条
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
                  <TableHead className="w-32">昵称</TableHead>
                  <TableHead className="w-28">员工姓名</TableHead>
                  <TableHead className="w-44">评论时间</TableHead>
                  <TableHead className="w-20">状态</TableHead>
                  <TableHead className="w-24 pr-4 text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.pageRows.length === 0 && (
                  <TableEmpty colSpan={7} text="该视听内容暂无评论" />
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
                    <TableCell>{c.nickname}</TableCell>
                    <TableCell>{c.author}</TableCell>
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
                            setMediaCommentHidden([c.id], !c.hidden)
                            toast.success(c.hidden ? '评论已恢复显示' : '评论已隐藏')
                          }}
                        >
                          {c.hidden ? <EyeOff /> : <Eye />}
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

      <BatchResultDialog
        open={results !== null}
        onOpenChange={(v) => !v && setResults(null)}
        action={resultAction}
        results={results ?? []}
      />
    </>
  )
}
