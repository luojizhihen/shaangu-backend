'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FilePlus2,
  Inbox,
  RotateCw,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'

import { useApp } from '@/components/app-store'
import {
  Field,
  NativeSelect,
  PageHeader,
  Panel,
  StatusTag,
} from '@/components/layout/page-frame'
import {
  DeptPointsChart,
  PointsChart,
  ReadTrendChart,
} from '@/components/workbench/charts'
import { usePersistentState } from '@/hooks/use-persistent-state'
import {
  DATA_UPDATED_AT,
  HOT_MEDIA,
  HOT_NEWS,
  KPIS,
  SYSTEM_STATUS,
  TODOS,
  type Todo,
} from '@/lib/mock'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const TYPES = [
  '全部类型',
  '待发布草稿',
  '同步异常',
  '待回复反馈',
  '待领取订单',
  '内容下架异常',
]
const LEVELS = ['全部优先级', '高', '中', '低']
const RANGES = ['近 7 天', '近 30 天', '本季度']
const PAGE_SIZE = 5

export default function WorkbenchPage() {
  const router = useRouter()
  const { role, allow } = useApp()

  const [filters, setFilters] = usePersistentState('shaangu-workbench-filters', {
    type: '全部类型',
    level: '全部优先级',
    owner: '',
    range: '近 7 天',
    more: false,
    dept: '全部部门',
    page: 1,
  })
  const [selected, setSelected] = React.useState<string[]>([])
  const [detail, setDetail] = React.useState<Todo | null>(null)

  const patch = (v: Partial<typeof filters>) =>
    setFilters((f) => ({ ...f, ...v }))

  const rows = React.useMemo(
    () =>
      TODOS.filter(
        (t) =>
          (filters.type === '全部类型' || t.type === filters.type) &&
          (filters.level === '全部优先级' || t.level === filters.level) &&
          (!filters.owner.trim() || t.owner.includes(filters.owner.trim())) &&
          (filters.dept === '全部部门' || t.dept === filters.dept),
      ),
    [filters.type, filters.level, filters.owner, filters.dept],
  )

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const page = Math.min(filters.page, totalPages)
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const summary = TYPES.slice(1).map((type) => ({
    type,
    count: TODOS.filter((t) => t.type === type).length,
  }))

  function goto(path: string) {
    router.push(path)
  }

  return (
    <>
      <PageHeader
        breadcrumb={['工作台', '工作台']}
        title="工作台"
        description={`运营待办优先展示，指标与图表可下钻到对应列表并保留筛选条件。数据更新时间 ${DATA_UPDATED_AT}｜当前数据权限范围：${role.scope}。`}
        actions={
          <>
            {allow('content.news') && (
              <Button onClick={() => goto('/content/news/new')}>
                <FilePlus2 className="size-4" />
                新增资讯
              </Button>
            )}
            <Button variant="outline" onClick={() => router.refresh()}>
              <RotateCw className="size-4" />
              刷新
            </Button>
          </>
        }
      />

      {/* 待办概览 */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {summary.map((s) => (
          <button
            key={s.type}
            type="button"
            onClick={() => patch({ type: s.type, page: 1 })}
            className={`flex items-center justify-between rounded-lg border bg-surface px-3.5 py-3 text-left transition-colors ${
              filters.type === s.type
                ? 'border-brand'
                : 'border-border hover:border-brand/40'
            }`}
          >
            <span className="text-[13px] text-muted-foreground">{s.type}</span>
            <span className="text-xl font-medium text-brand">{s.count}</span>
          </button>
        ))}
      </div>

      {/* 筛选区 */}
      <Panel className="mb-4" bodyClassName="p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Field label="待办类型">
            <NativeSelect
              aria-label="待办类型"
              value={filters.type}
              onChange={(v) => patch({ type: v, page: 1 })}
              options={TYPES}
            />
          </Field>
          <Field label="优先级">
            <NativeSelect
              aria-label="优先级"
              value={filters.level}
              onChange={(v) => patch({ level: v, page: 1 })}
              options={LEVELS}
            />
          </Field>
          <Field label="责任人">
            <Input
              value={filters.owner}
              onChange={(e) => patch({ owner: e.target.value, page: 1 })}
              placeholder="请输入责任人姓名"
              className="h-8"
            />
          </Field>
          <Field label="时间范围">
            <NativeSelect
              aria-label="时间范围"
              value={filters.range}
              onChange={(v) => patch({ range: v })}
              options={RANGES}
            />
          </Field>

          {filters.more && (
            <Field label="所属部门">
              <NativeSelect
                aria-label="所属部门"
                value={filters.dept}
                onChange={(v) => patch({ dept: v, page: 1 })}
                options={[
                  '全部部门',
                  ...Array.from(new Set(TODOS.map((t) => t.dept))),
                ]}
              />
            </Field>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
          <Button onClick={() => toast.success('已按当前条件检索待办')}>
            <Search className="size-4" />
            搜索
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              setFilters({
                type: '全部类型',
                level: '全部优先级',
                owner: '',
                range: '近 7 天',
                more: filters.more,
                dept: '全部部门',
                page: 1,
              })
            }
          >
            重置
          </Button>
          <Button variant="ghost" onClick={() => patch({ more: !filters.more })}>
            {filters.more ? '收起筛选' : '展开更多'}
            <ChevronDown
              className={`size-4 transition-transform ${filters.more ? 'rotate-180' : ''}`}
            />
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">
            共 {rows.length} 条待办
          </span>
        </div>
      </Panel>

      {/* 表格区 */}
      <Panel
        title="运营待办"
        className="mb-4"
        bodyClassName="p-0"
        extra={
          <span className="text-xs text-muted-foreground">
            仅显示当前角色权限范围内的待办
          </span>
        }
      >
        {selected.length > 0 && (
          <div className="flex items-center gap-2 border-b border-border bg-accent px-4 py-2">
            <span className="text-[13px]">已选 {selected.length} 项</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                toast.success(`已认领 ${selected.length} 项待办`, {
                  description: '操作已写入模拟审计记录，可在审计日志中查看。',
                })
              }
            >
              批量认领
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
              取消选择
            </Button>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead className="w-10">
                <Checkbox
                  checked={
                    pageRows.length > 0 &&
                    pageRows.every((r) => selected.includes(r.id))
                  }
                  onCheckedChange={(v) =>
                    setSelected(v ? pageRows.map((r) => r.id) : [])
                  }
                  aria-label="全选本页"
                />
              </TableHead>
              <TableHead className="w-[132px]">待办类型</TableHead>
              <TableHead>待办事项</TableHead>
              <TableHead className="w-[96px]">责任人</TableHead>
              <TableHead className="w-[132px]">所属部门</TableHead>
              <TableHead className="w-[76px]">优先级</TableHead>
              <TableHead className="w-[148px]">产生时间</TableHead>
              <TableHead className="w-[168px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-40">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Inbox className="size-6" />
                    <p className="text-[13px]">当前筛选条件下没有待办事项</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        patch({
                          type: '全部类型',
                          level: '全部优先级',
                          owner: '',
                          dept: '全部部门',
                          page: 1,
                        })
                      }
                    >
                      清空筛选条件
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {pageRows.map((t) => (
              <TableRow key={t.id} className="h-12">
                <TableCell>
                  <Checkbox
                    checked={selected.includes(t.id)}
                    onCheckedChange={(v) =>
                      setSelected((prev) =>
                        v ? [...prev, t.id] : prev.filter((i) => i !== t.id),
                      )
                    }
                    aria-label={`选择 ${t.id}`}
                  />
                </TableCell>
                <TableCell>
                  <StatusTag
                    tone={
                      t.type === '同步异常' || t.type === '内容下架异常'
                        ? 'warning'
                        : 'info'
                    }
                  >
                    {t.type}
                  </StatusTag>
                </TableCell>
                <TableCell className="max-w-[420px]">
                  <button
                    type="button"
                    onClick={() => setDetail(t)}
                    className="truncate text-left text-brand hover:underline"
                  >
                    {t.title}
                  </button>
                  <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                    {t.id}
                  </div>
                </TableCell>
                <TableCell>{t.owner}</TableCell>
                <TableCell className="text-muted-foreground">{t.dept}</TableCell>
                <TableCell>
                  <StatusTag
                    tone={
                      t.level === '高'
                        ? 'danger'
                        : t.level === '中'
                          ? 'warning'
                          : 'neutral'
                    }
                  >
                    {t.level}
                  </StatusTag>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {t.createdAt}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setDetail(t)}>
                      详情
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => goto(t.target)}>
                      去处理
                      <ArrowRight className="size-3.5" />
                    </Button>
                    {!allow(t.perm) && (
                      <StatusTag tone="neutral">无权限</StatusTag>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
          <span className="text-xs text-muted-foreground">
            第 {page} / {totalPages} 页 · 每页 {PAGE_SIZE} 条
          </span>
          <div className="flex items-center gap-1">
            <Button
              size="icon-sm"
              variant="outline"
              disabled={page <= 1}
              aria-label="上一页"
              onClick={() => patch({ page: page - 1 })}
            >
              <ChevronLeft className="size-4" />
            </Button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <Button
                key={i}
                size="sm"
                variant={page === i + 1 ? 'default' : 'outline'}
                onClick={() => patch({ page: i + 1 })}
              >
                {i + 1}
              </Button>
            ))}
            <Button
              size="icon-sm"
              variant="outline"
              disabled={page >= totalPages}
              aria-label="下一页"
              onClick={() => patch({ page: page + 1 })}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </Panel>

      {/* 核心指标 */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        {KPIS.map((k) => (
          <button
            key={k.label}
            type="button"
            onClick={() => goto(k.target)}
            className="rounded-lg border border-border bg-surface px-3.5 py-3 text-left transition-colors hover:border-brand/40"
          >
            <div className="text-xs text-muted-foreground">{k.label}</div>
            <div className="mt-1 text-xl font-medium text-foreground">
              {k.value}
            </div>
            <div className="mt-0.5 truncate text-xs text-muted-foreground">
              {k.note}
            </div>
          </button>
        ))}
      </div>

      {/* 趋势与排行 */}
      <div className="mb-4 grid gap-4 xl:grid-cols-3">
        <Panel title="资讯阅读与视听播放趋势" className="xl:col-span-2">
          <ReadTrendChart />
        </Panel>
        <Panel title="部门积分排行">
          <DeptPointsChart />
        </Panel>
      </div>

      <div className="mb-4 grid gap-4 xl:grid-cols-3">
        <Panel title="积分获取与消耗（月）" className="xl:col-span-2">
          <PointsChart />
        </Panel>
        <Panel
          title="系统状态"
          bodyClassName="p-0"
          extra={
            <span className="text-xs text-muted-foreground">
              NC 为每日定时同步
            </span>
          }
        >
          <ul className="divide-y divide-border">
            {SYSTEM_STATUS.map((s) => (
              <li key={s.name} className="px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-medium">{s.name}</span>
                  <StatusTag tone={s.state === '正常' ? 'success' : 'warning'}>
                    {s.state}
                  </StatusTag>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {s.detail}
                </p>
                <Button
                  size="xs"
                  variant="ghost"
                  className="mt-1 px-0"
                  onClick={() => goto(s.target)}
                >
                  查看详情
                  <ArrowRight className="size-3" />
                </Button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="热门资讯" bodyClassName="p-0">
          <ol className="divide-y divide-border">
            {HOT_NEWS.map((n, i) => (
              <li
                key={n.title}
                className="flex items-center gap-3 px-4 py-2.5 text-[13px]"
              >
                <span className="w-4 text-center text-muted-foreground">
                  {i + 1}
                </span>
                <span className="flex-1 truncate">{n.title}</span>
                <StatusTag tone="neutral">{n.category}</StatusTag>
                <span className="w-16 text-right text-muted-foreground">
                  {n.reads.toLocaleString('zh-CN')}
                </span>
              </li>
            ))}
          </ol>
        </Panel>
        <Panel title="热门视频与音频" bodyClassName="p-0">
          <ol className="divide-y divide-border">
            {HOT_MEDIA.map((m, i) => (
              <li
                key={m.title}
                className="flex items-center gap-3 px-4 py-2.5 text-[13px]"
              >
                <span className="w-4 text-center text-muted-foreground">
                  {i + 1}
                </span>
                <span className="flex-1 truncate">{m.title}</span>
                <StatusTag tone="neutral">{m.type}</StatusTag>
                <span className="w-16 text-right text-muted-foreground">
                  {m.plays.toLocaleString('zh-CN')}
                </span>
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      {/* 待办详情抽屉 */}
      <Sheet open={detail !== null} onOpenChange={(open) => !open && setDetail(null)}>
        <SheetContent className="w-[560px] sm:max-w-[560px]">
          <SheetHeader>
            <SheetTitle>待办详情</SheetTitle>
            <SheetDescription>
              低频字段收纳在抽屉中，处理入口跳转到对应业务列表并保留筛选条件。
            </SheetDescription>
          </SheetHeader>
          {detail && (
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
              <dl className="grid gap-y-2.5 text-[13px] sm:grid-cols-[92px_1fr]">
                <dt className="text-muted-foreground">待办编号</dt>
                <dd className="font-mono text-xs">{detail.id}</dd>
                <dt className="text-muted-foreground">待办类型</dt>
                <dd>{detail.type}</dd>
                <dt className="text-muted-foreground">待办事项</dt>
                <dd className="leading-relaxed">{detail.title}</dd>
                <dt className="text-muted-foreground">责任人</dt>
                <dd>
                  {detail.owner}｜{detail.dept}
                </dd>
                <dt className="text-muted-foreground">优先级</dt>
                <dd>{detail.level}</dd>
                <dt className="text-muted-foreground">产生时间</dt>
                <dd>{detail.createdAt}</dd>
                <dt className="text-muted-foreground">处理路由</dt>
                <dd className="font-mono text-xs">{detail.target}</dd>
              </dl>

              <div className="rounded-md border border-border bg-muted px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
                {allow(detail.perm)
                  ? '当前演示角色具备处理该待办的权限，处理结果将写入模拟审计记录。'
                  : '当前演示角色没有该功能权限，点击“去处理”将进入 403 无访问权限页面。'}
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={() => goto(detail.target)}>
                  去处理
                  <ArrowRight className="size-4" />
                </Button>
                <Button variant="outline" onClick={() => setDetail(null)}>
                  关闭
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
