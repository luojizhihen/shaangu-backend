'use client'

import * as React from 'react'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  ArrowDownToLine,
  ArrowUpToLine,
  Pencil,
  Plus,
  RefreshCcw,
  Trash2,
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
import { useApp } from '@/components/app-store'
import { breadcrumbFor } from '@/lib/nav'
import {
  BANNER_SLOTS,
  IMAGE_LIBRARY,
  removeBanners,
  saveBanner,
  setBannerOnline,
  setBannerSort,
  useContent,
  type Banner,
  type BatchResult,
} from '@/lib/content-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const SLOT_OPTIONS = ['全部位置', ...BANNER_SLOTS]
const ONLINE_OPTIONS = ['全部状态', '已上架', '已下架']

export default function BannersPage() {
  const pathname = usePathname()
  const router = useRouter()
  const { role } = useApp()
  const { banners, news } = useContent()

  const [title, setTitle] = React.useState('')
  const [slot, setSlot] = React.useState('全部位置')
  const [online, setOnline] = React.useState('全部状态')
  const [query, setQuery] = React.useState({
    title: '',
    slot: '全部位置',
    online: '全部状态',
  })

  const [results, setResults] = React.useState<BatchResult[] | null>(null)
  const [resultAction, setResultAction] = React.useState('批量操作')
  const [editing, setEditing] = React.useState<Banner | null>(null)
  const [formOpen, setFormOpen] = React.useState(false)

  /** 只有已发布的资讯才能被轮播位引用 */
  const publishedNews = React.useMemo(
    () => news.filter((n) => n.status === '已发布'),
    [news],
  )

  const rows = React.useMemo(
    () =>
      banners
        .filter((b) => {
          const hitTitle = b.title.includes(query.title.trim())
          const hitSlot = query.slot === '全部位置' || b.slot === query.slot
          const hitOnline =
            query.online === '全部状态' ||
            (query.online === '已上架' ? b.online : !b.online)
          return hitTitle && hitSlot && hitOnline
        })
        .sort((a, b) => a.sort - b.sort || a.createdAt.localeCompare(b.createdAt)),
    [banners, query],
  )

  const table = useTableState(rows)

  function search() {
    setQuery({ title, slot, online })
    table.setPage(1)
  }

  function reset() {
    setTitle('')
    setSlot('全部位置')
    setOnline('全部状态')
    setQuery({ title: '', slot: '全部位置', online: '全部状态' })
  }

  function batch(action: string, fn: () => BatchResult[]) {
    if (table.selected.length === 0) {
      toast.error('请先勾选需要处理的轮播位')
      return
    }
    setResultAction(action)
    setResults(fn())
    table.clear()
  }

  function openCreate() {
    if (publishedNews.length === 0) {
      toast.error('暂无已发布资讯，请先发布资讯后再配置轮播位')
      return
    }
    setEditing(null)
    setFormOpen(true)
  }

  const onlineCount = banners.filter((b) => b.online).length

  return (
    <>
      <PageHeader
        breadcrumb={breadcrumbFor(pathname)}
        title="资讯轮播位管理"
        description="配置资讯频道的轮播位：新增后默认下架，仅关联「已发布」资讯才能上架；上架中的轮播位需先下架再删除。"
        actions={
          <Button variant="outline" onClick={() => toast.success('列表已刷新')}>
            <RefreshCcw className="size-4" />
            刷新
          </Button>
        }
      />

      <FilterBar onSearch={search} onReset={reset}>
        <FilterField label="轮播标题">
          <Input
            value={title}
            placeholder="请输入轮播标题"
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) search()
            }}
          />
        </FilterField>
        <FilterField label="展示位置">
          <NativeSelect
            aria-label="展示位置"
            value={slot}
            onChange={setSlot}
            options={SLOT_OPTIONS}
          />
        </FilterField>
        <FilterField label="上架状态">
          <NativeSelect
            aria-label="上架状态"
            value={online}
            onChange={setOnline}
            options={ONLINE_OPTIONS}
          />
        </FilterField>
      </FilterBar>

      <Panel bodyClassName="p-0">
        <Toolbar>
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-3.5" />
            新增轮播位
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              batch('上架轮播位', () => setBannerOnline(table.selected, true))
            }
          >
            <ArrowUpToLine className="size-3.5" />
            批量上架
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              batch('下架轮播位', () => setBannerOnline(table.selected, false))
            }
          >
            <ArrowDownToLine className="size-3.5" />
            批量下架
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => batch('删除轮播位', () => removeBanners(table.selected))}
          >
            <Trash2 className="size-3.5" />
            批量删除
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">
            共 {banners.length} 个轮播位 · 已上架 {onlineCount} 个 · 已选{' '}
            {table.selected.length} 个
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
              <TableHead className="w-28">轮播图</TableHead>
              <TableHead className="min-w-48">轮播标题</TableHead>
              <TableHead className="w-32">展示位置</TableHead>
              <TableHead className="min-w-48">关联资讯</TableHead>
              <TableHead className="w-24">排序</TableHead>
              <TableHead className="w-24">状态</TableHead>
              <TableHead className="w-24">维护人</TableHead>
              <TableHead className="w-44">创建时间</TableHead>
              <TableHead className="w-32 pr-4 text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.pageRows.length === 0 && (
              <TableEmpty colSpan={11} text="没有符合条件的轮播位" />
            )}
            {table.pageRows.map((b, i) => {
              const target = news.find((n) => n.id === b.newsId)
              return (
                <TableRow key={b.id}>
                  <TableCell className="pl-4 text-muted-foreground">
                    {(table.page - 1) * table.pageSize + i + 1}
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      aria-label={`选择轮播位 ${b.title}`}
                      checked={table.selected.includes(b.id)}
                      onCheckedChange={(v) => table.toggleRow(b.id, Boolean(v))}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="relative h-12 w-20 overflow-hidden rounded border border-border">
                      <Image
                        src={b.image || '/placeholder.svg'}
                        alt={`${b.title} 轮播图`}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{b.title}</TableCell>
                  <TableCell className="text-muted-foreground">{b.slot}</TableCell>
                  <TableCell>
                    {target ? (
                      <button
                        type="button"
                        title={target.title}
                        onClick={() => router.push(`/content/news/${target.id}`)}
                        className="max-w-48 truncate text-left text-brand hover:underline"
                      >
                        {target.title}
                      </button>
                    ) : (
                      <span className="text-muted-foreground">资讯已删除</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      aria-label={`${b.title} 排序值`}
                      value={b.sort}
                      min={1}
                      className="h-7 w-16 text-[13px]"
                      onChange={(e) =>
                        setBannerSort(b.id, Number.parseInt(e.target.value, 10) || 1)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <StatusTag tone={b.online ? 'success' : 'neutral'}>
                      {b.online ? '已上架' : '已下架'}
                    </StatusTag>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{b.owner}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {b.createdAt}
                  </TableCell>
                  <TableCell className="pr-4">
                    <div className="flex items-center justify-center gap-0.5">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label="编辑轮播位"
                        onClick={() => {
                          setEditing(b)
                          setFormOpen(true)
                        }}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={b.online ? '下架轮播位' : '上架轮播位'}
                        onClick={() => {
                          const [r] = setBannerOnline([b.id], !b.online)
                          if (r.ok) toast.success(`${b.title}：${r.message}`)
                          else toast.error(`${b.title}：${r.message}`)
                        }}
                      >
                        {b.online ? <ArrowDownToLine /> : <ArrowUpToLine />}
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label="删除轮播位"
                        onClick={() => {
                          const [r] = removeBanners([b.id])
                          if (r.ok) toast.success(`${b.title}：${r.message}`)
                          else toast.error(`${b.title}：${r.message}`)
                        }}
                      >
                        <Trash2 className="text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
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

      <BannerFormDialog
        key={editing?.id ?? 'create'}
        open={formOpen}
        onOpenChange={setFormOpen}
        banner={editing}
        owner={role.person}
        newsOptions={publishedNews.map((n) => ({ id: n.id, title: n.title }))}
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

function BannerFormDialog({
  open,
  onOpenChange,
  banner,
  owner,
  newsOptions,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  banner: Banner | null
  owner: string
  newsOptions: { id: string; title: string }[]
}) {
  const [title, setTitle] = React.useState(banner?.title ?? '')
  const [image, setImage] = React.useState(banner?.image ?? IMAGE_LIBRARY[0].src)
  const [slot, setSlot] = React.useState<Banner['slot']>(
    banner?.slot ?? BANNER_SLOTS[0],
  )
  const [newsId, setNewsId] = React.useState(
    banner?.newsId ?? newsOptions[0]?.id ?? '',
  )
  const [sort, setSort] = React.useState(String(banner?.sort ?? 1))

  const newsTitleById = React.useMemo(
    () => new Map(newsOptions.map((n) => [n.id, n.title])),
    [newsOptions],
  )
  const titles = newsOptions.map((n) => n.title)

  function submit() {
    const r = saveBanner({
      id: banner?.id,
      title,
      image,
      slot,
      newsId,
      sort: Number.parseInt(sort, 10) || 1,
      owner,
    })
    if (!r.ok) {
      toast.error(r.message)
      return
    }
    toast.success(r.message)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{banner ? '编辑轮播位' : '新增轮播位'}</DialogTitle>
          <DialogDescription>
            轮播位仅可引用「已发布」资讯。新增后默认下架，确认无误后再上架。
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="banner-title">轮播标题</Label>
            <Input
              id="banner-title"
              value={title}
              placeholder="请输入轮播标题"
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="banner-slot">展示位置</Label>
              <NativeSelect
                id="banner-slot"
                value={slot}
                onChange={(v) => setSlot(v as Banner['slot'])}
                options={[...BANNER_SLOTS]}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="banner-sort">排序值</Label>
              <Input
                id="banner-sort"
                type="number"
                min={1}
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="banner-news">关联资讯（仅已发布）</Label>
            <NativeSelect
              id="banner-news"
              value={newsTitleById.get(newsId) ?? titles[0] ?? ''}
              onChange={(v) => {
                const hit = newsOptions.find((n) => n.title === v)
                if (hit) setNewsId(hit.id)
              }}
              options={titles.length > 0 ? titles : ['暂无已发布资讯']}
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">轮播图片</span>
            <div className="flex flex-wrap gap-2">
              {IMAGE_LIBRARY.map((img) => (
                <button
                  key={img.src}
                  type="button"
                  aria-pressed={image === img.src}
                  onClick={() => setImage(img.src)}
                  className={`relative h-16 w-28 overflow-hidden rounded border-2 transition-colors ${
                    image === img.src ? 'border-brand' : 'border-border'
                  }`}
                >
                  <Image
                    src={img.src || '/placeholder.svg'}
                    alt={img.name}
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-foreground/60 py-0.5 text-center text-[11px] text-background">
                    {img.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={submit} disabled={!newsId}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
