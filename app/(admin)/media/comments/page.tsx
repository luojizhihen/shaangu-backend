'use client'

import * as React from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

import { NativeSelect, PageHeader, Panel, StatusTag } from '@/components/layout/page-frame'
import {
  FilterBar,
  FilterField,
  Pagination,
  TableEmpty,
  Toolbar,
  useTableState,
} from '@/components/content/table-shell'
import { BatchResultDialog } from '@/components/content/batch-result-dialog'
import {
  MEDIA_KINDS,
  setMediaCommentHidden,
  useMedia,
  type BatchResult,
} from '@/lib/media-store'
import { breadcrumbFor } from '@/lib/nav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const STATE_OPTIONS = ['全部状态', '显示中', '已隐藏']

export default function MediaCommentsPage() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromMedia = searchParams.get('media') ?? ''
  const { comments } = useMedia()

  const [mediaTitle, setMediaTitle] = React.useState(fromMedia)
  const [content, setContent] = React.useState('')
  const [author, setAuthor] = React.useState('')
  const [kind, setKind] = React.useState('全部类型')
  const [state, setState] = React.useState('全部状态')
  const [query, setQuery] = React.useState({
    mediaTitle: fromMedia,
    content: '',
    author: '',
    kind: '全部类型',
    state: '全部状态',
  })

  const [results, setResults] = React.useState<BatchResult[] | null>(null)
  const [resultAction, setResultAction] = React.useState('批量操作')

  const rows = React.useMemo(
    () =>
      comments.filter((c) => {
        const hitMedia = c.mediaTitle.includes(query.mediaTitle.trim())
        const hitContent = c.content.includes(query.content.trim())
        const hitAuthor = c.author.includes(query.author.trim())
        const hitKind = query.kind === '全部类型' || c.mediaKind === query.kind
        const hitState =
          query.state === '全部状态' ||
          (query.state === '已隐藏' ? c.hidden : !c.hidden)
        return hitMedia && hitContent && hitAuthor && hitKind && hitState
      }),
    [comments, query],
  )

  const table = useTableState(rows)

  function search() {
    setQuery({ mediaTitle, content, author, kind, state })
    table.setPage(1)
  }

  function reset() {
    setMediaTitle('')
    setContent('')
    setAuthor('')
    setKind('全部类型')
    setState('全部状态')
    setQuery({
      mediaTitle: '',
      content: '',
      author: '',
      kind: '全部类型',
      state: '全部状态',
    })
  }

  function batch(action: string, fn: () => BatchResult[]) {
    if (table.selected.length === 0) {
      toast.error('请先勾选需要处理的评论')
      return
    }
    setResultAction(action)
    setResults(fn())
    table.clear()
  }

  const hiddenCount = comments.filter((c) => c.hidden).length

  return (
    <>
      <PageHeader
        breadcrumb={breadcrumbFor(pathname)}
        title="视听评论管理"
      />

      <FilterBar onSearch={search} onReset={reset}>
        <FilterField label="所属视听内容">
          <Input
            value={mediaTitle}
            placeholder="请输入所属视听内容"
            onChange={(e) => setMediaTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) search()
            }}
          />
        </FilterField>
        <FilterField label="视听类型">
          <NativeSelect
            aria-label="视听类型"
            value={kind}
            onChange={setKind}
            options={['全部类型', ...MEDIA_KINDS]}
          />
        </FilterField>
        <FilterField label="评论内容">
          <Input
            value={content}
            placeholder="请输入评论内容"
            onChange={(e) => setContent(e.target.value)}
          />
        </FilterField>

        <FilterField label="员工姓名">
          <Input
            value={author}
            placeholder="请输入员工姓名"
            onChange={(e) => setAuthor(e.target.value)}
          />
        </FilterField>
        <FilterField label="评论状态">
          <NativeSelect
            aria-label="评论状态"
            value={state}
            onChange={setState}
            options={STATE_OPTIONS}
          />
        </FilterField>
      </FilterBar>

      <Panel bodyClassName="p-0">
        <Toolbar>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              batch('隐藏评论', () => setMediaCommentHidden(table.selected, true))
            }
          >
            <EyeOff className="size-3.5" />
            批量隐藏
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              batch('恢复显示', () => setMediaCommentHidden(table.selected, false))
            }
          >
            <Eye className="size-3.5" />
            批量显示
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">
            共 {comments.length} 条评论 · 已隐藏 {hiddenCount} 条 · 已选{' '}
            {table.selected.length} 条
          </span>
        </Toolbar>

        <Table className="text-[13px]">
          <TableHeader>
            <TableRow className="bg-muted/60">
              <TableHead className="w-14 pl-4">序号</TableHead>
              <TableHead className="w-10">
                <Checkbox
                  aria-label="全选本页"
                  checked={table.allChecked}
                  onCheckedChange={(v) => table.togglePage(Boolean(v))}
                />
              </TableHead>
              <TableHead className="min-w-56">所属视听内容</TableHead>
              <TableHead className="w-24">视听类型</TableHead>
              <TableHead className="min-w-64">评论内容</TableHead>
              <TableHead className="w-28">员工姓名</TableHead>
              <TableHead className="w-28">所属部门</TableHead>
              <TableHead className="w-44">评论时间</TableHead>
              <TableHead className="w-20">状态</TableHead>
              <TableHead className="w-24 pr-4 text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.pageRows.length === 0 && (
              <TableEmpty colSpan={10} text="没有符合条件的评论" />
            )}
            {table.pageRows.map((c, i) => (
              <TableRow key={c.id}>
                <TableCell className="pl-4 text-muted-foreground">
                  {(table.page - 1) * table.pageSize + i + 1}
                </TableCell>
                <TableCell>
                  <Checkbox
                    aria-label={`选择评论 ${c.id}`}
                    checked={table.selected.includes(c.id)}
                    onCheckedChange={(v) => table.toggleRow(c.id, Boolean(v))}
                  />
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    title={c.mediaTitle}
                    onClick={() => router.push(`/media/${c.mediaId}`)}
                    className="max-w-56 truncate text-left text-brand hover:underline"
                  >
                    {c.mediaTitle}
                  </button>
                </TableCell>
                <TableCell>
                  <StatusTag tone={c.mediaKind === '视频' ? 'info' : 'success'}>
                    {c.mediaKind}
                  </StatusTag>
                </TableCell>
                <TableCell>
                  <span className="line-clamp-2 whitespace-normal">{c.content}</span>
                </TableCell>
                <TableCell>{c.author}</TableCell>
                <TableCell className="text-muted-foreground">{c.dept}</TableCell>
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
