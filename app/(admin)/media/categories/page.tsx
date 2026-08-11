'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AudioLines, FileVideo, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader, Panel, StatusTag } from '@/components/layout/page-frame'
import { TableEmpty } from '@/components/content/table-shell'
import { kindCount, updateCategory, useMedia } from '@/lib/media-store'
import { breadcrumbFor } from '@/lib/nav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function MediaCategoriesPage() {
  const pathname = usePathname()
  const router = useRouter()
  const { categories, media } = useMedia()

  const rows = React.useMemo(
    () => [...categories].sort((a, b) => a.sort - b.sort),
    [categories],
  )

  return (
    <>
      <PageHeader
        breadcrumb={[...breadcrumbFor('/media/list'), '视听类目管理']}
        title="视听类目管理"
        actions={
          <>
            <Button variant="outline" onClick={() => toast.success('列表已刷新')}>
              <RefreshCcw className="size-4" />
              刷新
            </Button>
            <Button onClick={() => router.push('/media/list')}>
              查看视听内容
            </Button>
          </>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        {rows.map((c) => {
          const stat = kindCount(c.name)
          const Icon = c.name === '视频' ? FileVideo : AudioLines
          return (
            <Panel key={c.id} bodyClassName="p-4">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-brand">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium">{c.name}</h3>
                    <StatusTag tone="neutral">固定类目</StatusTag>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {c.coverRule} · 支持 {c.accept}
                  </p>
                  <dl className="mt-3 grid grid-cols-4 gap-2 text-center">
                    {[
                      { k: '内容总数', v: stat.total },
                      { k: '已发布', v: stat.online },
                      { k: '草稿', v: stat.draft },
                      { k: '已下架', v: stat.offline },
                    ].map((s) => (
                      <div key={s.k} className="rounded-md border border-border py-1.5">
                        <dt className="text-[11px] text-muted-foreground">{s.k}</dt>
                        <dd className="font-mono text-sm">{s.v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </Panel>
          )
        })}
      </div>

      <Panel bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
          <span className="text-xs text-muted-foreground">
            视听类型固定为「视频」与音频「陕鼓之声」两类，不支持新增或删除；可维护展示顺序与备注。
          </span>
          <span className="ml-auto text-xs text-muted-foreground">
            共 {media.length} 条视听内容
          </span>
        </div>
        <Table className="text-[13px]">
          <TableHeader>
            <TableRow className="bg-muted/60">
              <TableHead className="w-14 pl-4">序号</TableHead>
              <TableHead className="w-32">类目名称</TableHead>
              <TableHead className="w-44">封面获取方式</TableHead>
              <TableHead className="w-40">支持格式</TableHead>
              <TableHead className="w-24">内容数量</TableHead>
              <TableHead className="w-24 text-right">播放量</TableHead>
              <TableHead className="w-24">展示顺序</TableHead>
              <TableHead className="min-w-64 pr-4">备注</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && <TableEmpty colSpan={8} text="暂无视听类目" />}
            {rows.map((c, i) => {
              const stat = kindCount(c.name)
              return (
                <TableRow key={c.id}>
                  <TableCell className="pl-4 text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>
                    <StatusTag tone={c.name === '视频' ? 'info' : 'success'}>
                      {c.coverRule}
                    </StatusTag>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.accept}</TableCell>
                  <TableCell>{stat.total}</TableCell>
                  <TableCell className="text-right">
                    {stat.plays.toLocaleString('zh-CN')}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={1}
                      aria-label={`${c.name} 展示顺序`}
                      value={c.sort}
                      className="h-7 w-16 px-2 text-xs"
                      onChange={(e) =>
                        updateCategory(c.id, {
                          sort: Number.parseInt(e.target.value, 10) || 1,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell className="pr-4">
                    <Input
                      aria-label={`${c.name} 备注`}
                      value={c.remark}
                      className="h-8 text-xs"
                      onChange={(e) => updateCategory(c.id, { remark: e.target.value })}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Panel>
    </>
  )
}
