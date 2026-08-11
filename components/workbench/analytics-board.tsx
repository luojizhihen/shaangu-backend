'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Download, RotateCcw, Search } from 'lucide-react'
import { toast } from 'sonner'

import { useApp } from '@/components/app-store'
import { Field, NativeSelect, Panel, StatusTag } from '@/components/layout/page-frame'
import {
  DeptPointsChart,
  FeedbackClosureChart,
  ForumGovernanceChart,
  PointsChart,
  ReadTrendChart,
  StaffTrendChart,
} from '@/components/workbench/charts'
import { MetricHint } from '@/components/workbench/metric-hint'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { can } from '@/lib/nav'
import {
  ASYNC_EXPORT_THRESHOLD,
  createExportTask,
  downloadCsv,
} from '@/lib/export'
import {
  COMPANIES,
  CONTENT_CATEGORIES,
  CONTENT_RANK,
  CONTENT_TYPES,
  DEPT_LIST,
  DEPT_POINTS,
  DEPT_POINT_MEMBERS,
  EXPORT_TASKS,
  FEEDBACK_CLOSURE,
  FORUM_GOVERNANCE,
  PEOPLE,
  POINTS_TREND,
  READ_TREND,
  READ_TREND_30,
  STAFF_TREND,
  TIME_PRESETS,
  type ExportTask,
} from '@/lib/mock'

const DEFAULT_FILTERS = {
  preset: '近 7 天',
  start: '2026-08-05',
  end: '2026-08-11',
  company: '全部公司',
  dept: '全部部门',
  person: '全部人员',
  category: '全部类目',
  type: '全部类型',
}

/** 按筛选维度收敛数据规模：维度越细，样本占比越小（原型内用确定性系数模拟） */
function scaleOf(f: typeof DEFAULT_FILTERS) {
  let s = 1
  if (f.company !== '全部公司') s *= 0.34
  if (f.dept !== '全部部门') s *= 0.22
  if (f.person !== '全部人员') s *= 0.05
  if (f.category !== '全部类目') s *= 0.3
  if (f.type !== '全部类型') s *= 0.42
  return s
}

const TASK_TONE = {
  排队中: 'neutral',
  生成中: 'info',
  可下载: 'success',
  已失败: 'danger',
} as const

export function AnalyticsBoard() {
  const router = useRouter()
  const { role } = useApp()
  const [draft, setDraft] = React.useState(DEFAULT_FILTERS)
  const [applied, setApplied] = React.useState(DEFAULT_FILTERS)
  const [tasks, setTasks] = React.useState<ExportTask[]>(EXPORT_TASKS)

  const patch = (v: Partial<typeof DEFAULT_FILTERS>) =>
    setDraft((d) => ({ ...d, ...v }))

  const scale = scaleOf(applied)
  const custom = applied.preset === '自定义'
  const rangeLabel = custom
    ? `${applied.start} 至 ${applied.end}`
    : applied.preset

  /* ---------- 各图表按筛选条件派生数据 ---------- */

  const trendData = React.useMemo(() => {
    const base = applied.preset === '近 30 天' ? READ_TREND_30 : READ_TREND
    if (scale === 1) return base
    return base.map((d) => ({
      date: d.date,
      资讯阅读: Math.round(d.资讯阅读 * scale),
      视听播放: Math.round(d.视听播放 * scale),
      互动: Math.round(d.互动 * scale),
    }))
  }, [applied.preset, scale])

  const pointsData = React.useMemo(
    () =>
      scale === 1
        ? POINTS_TREND
        : POINTS_TREND.map((d) => ({
            month: d.month,
            获取: Math.round(d.获取 * scale),
            消耗: Math.round(d.消耗 * scale),
          })),
    [scale],
  )

  const staffData = React.useMemo(
    () =>
      scale === 1
        ? STAFF_TREND
        : STAFF_TREND.map((d) => ({
            month: d.month,
            在册: Math.max(1, Math.round(d.在册 * scale)),
            入职: Math.max(0, Math.round(d.入职 * scale)),
            离职: Math.max(0, Math.round(d.离职 * scale)),
          })),
    [scale],
  )

  const deptData = React.useMemo(
    () =>
      applied.dept === '全部部门'
        ? DEPT_POINTS
        : DEPT_POINTS.filter((d) => d.dept === applied.dept),
    [applied.dept],
  )

  const forumData = React.useMemo(
    () =>
      scale === 1
        ? FORUM_GOVERNANCE
        : FORUM_GOVERNANCE.map((d) => ({
            month: d.month,
            敏感词命中: Math.round(d.敏感词命中 * scale),
            删除: Math.round(d.删除 * scale),
            申诉: Math.round(d.申诉 * scale),
          })),
    [scale],
  )

  const rankRows = React.useMemo(
    () =>
      CONTENT_RANK.filter(
        (r) =>
          can(role, r.perm) &&
          (applied.category === '全部类目' || r.category === applied.category) &&
          (applied.type === '全部类型' || r.type === applied.type) &&
          (applied.dept === '全部部门' || r.dept === applied.dept),
      ),
    [applied.category, applied.type, applied.dept, role],
  )

  const memberRows = React.useMemo(
    () =>
      applied.dept === '全部部门'
        ? DEPT_POINT_MEMBERS
        : DEPT_POINT_MEMBERS.filter((m) => m.dept === applied.dept),
    [applied.dept],
  )

  const closureNow = FEEDBACK_CLOSURE[FEEDBACK_CLOSURE.length - 1]

  /* ---------- 导出：小数据量直接下载，大数据量转异步任务 ---------- */

  const suffix = `${applied.company}_${applied.dept}_${rangeLabel}`

  function runExport(
    name: string,
    rows: number,
    write: () => void,
  ) {
    if (rows > ASYNC_EXPORT_THRESHOLD) {
      const task = createExportTask(`${name}_${suffix}`, rows, role.person)
      setTasks((t) => [task, ...t])
      toast.info(
        `数据量 ${rows.toLocaleString('zh-CN')} 行，已转为后台异步任务 ${task.id}`,
      )
      return
    }
    write()
    toast.success(`已按当前筛选条件导出 ${rows.toLocaleString('zh-CN')} 行`)
  }

  function exportRank() {
    runExport('内容排行明细', rankRows.length, () =>
      downloadCsv(
        `内容排行明细_${suffix}.csv`,
        ['标题', '体裁', '类目', '归属部门', '阅读/播放', '互动量', '产生积分', '统计区间'],
        rankRows.map((r) => [
          r.title,
          r.type,
          r.category,
          r.dept,
          r.reads,
          r.interactions,
          r.points,
          rangeLabel,
        ]),
      ),
    )
  }

  function exportDept() {
    runExport('部门积分汇总', deptData.length, () =>
      downloadCsv(
        `部门积分汇总_${suffix}.csv`,
        ['部门', '积分合计', '统计区间'],
        deptData.map((d) => [d.dept, d.积分, rangeLabel]),
      ),
    )
  }

  function exportMembers() {
    runExport('部门员工积分明细', memberRows.length, () =>
      downloadCsv(
        `部门员工积分明细_${suffix}.csv`,
        ['部门', '姓名', '工号', '获取积分', '消耗积分', '积分余额', '统计区间'],
        memberRows.map((m) => [
          m.dept,
          m.name,
          m.employeeNo,
          m.获取,
          m.消耗,
          m.余额,
          rangeLabel,
        ]),
      ),
    )
  }

  /** 积分流水为逐笔明细，数据量必然超阈值，用于演示异步导出 */
  function exportPointsFlow() {
    const rows = Math.max(
      ASYNC_EXPORT_THRESHOLD + 1,
      Math.round(42180 * Math.max(scale, 0.15)),
    )
    runExport('积分流水明细', rows, () => {})
  }

  /* 异步任务进度推进：仅为原型演示，真实实现由后端轮询或推送 */
  React.useEffect(() => {
    const timer = setInterval(() => {
      setTasks((list) =>
        list.map((t) => {
          if (t.state === '可下载' || t.state === '已失败') return t
          const next = Math.min(100, t.progress + 12)
          return {
            ...t,
            progress: next,
            state: next >= 100 ? '可下载' : '生成中',
          }
        }),
      )
    }, 1500)
    return () => clearInterval(timer)
  }, [])

  const activeTasks = tasks.filter((t) => t.state !== '可下载').length

  return (
    <div className="mt-6">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2 border-t border-border pt-5">
        <div>
          <h2 className="text-base font-medium text-foreground">运营数据</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            所有指标均按下方筛选条件与当前账号数据权限计算，鼠标悬停指标右侧
            <span className="mx-1 text-brand">口径图标</span>
            可查看统计口径、数据来源与更新时间。
          </p>
        </div>
        <StatusTag tone="info">权限范围：{role.scope}</StatusTag>
      </div>

      {/* 六维筛选 */}
      <Panel className="mb-4" bodyClassName="p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Field label="时间范围">
            <NativeSelect
              aria-label="时间范围"
              value={draft.preset}
              onChange={(v) => patch({ preset: v })}
              options={TIME_PRESETS}
            />
          </Field>
          <Field label="公司">
            <NativeSelect
              aria-label="公司"
              value={draft.company}
              onChange={(v) => patch({ company: v })}
              options={COMPANIES}
            />
          </Field>
          <Field label="部门">
            <NativeSelect
              aria-label="部门"
              value={draft.dept}
              onChange={(v) => patch({ dept: v })}
              options={DEPT_LIST}
            />
          </Field>
          <Field label="人员">
            <NativeSelect
              aria-label="人员"
              value={draft.person}
              onChange={(v) => patch({ person: v })}
              options={PEOPLE}
            />
          </Field>
          <Field label="内容类目">
            <NativeSelect
              aria-label="内容类目"
              value={draft.category}
              onChange={(v) => patch({ category: v })}
              options={CONTENT_CATEGORIES}
            />
          </Field>
          <Field label="内容类型">
            <NativeSelect
              aria-label="内容类型"
              value={draft.type}
              onChange={(v) => patch({ type: v })}
              options={CONTENT_TYPES}
            />
          </Field>

          {draft.preset === '自定义' && (
            <Field label="自定义区间">
              <div className="flex flex-1 items-center gap-2">
                <Input
                  type="date"
                  aria-label="开始日期"
                  value={draft.start}
                  onChange={(e) => patch({ start: e.target.value })}
                  className="h-8 text-[13px]"
                />
                <span className="text-xs text-muted-foreground">至</span>
                <Input
                  type="date"
                  aria-label="结束日期"
                  value={draft.end}
                  onChange={(e) => patch({ end: e.target.value })}
                  className="h-8 text-[13px]"
                />
              </div>
            </Field>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <Button
            onClick={() => {
              setApplied(draft)
              toast.success('已按当前筛选条件重新统计')
            }}
          >
            <Search className="size-4" />
            查询
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setDraft(DEFAULT_FILTERS)
              setApplied(DEFAULT_FILTERS)
            }}
          >
            <RotateCcw className="size-4" />
            重置
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" />}>
              <Download className="size-4" />
              导出
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={exportRank}>
                导出内容排行明细
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportDept}>
                导出部门积分汇总
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportMembers}>
                导出部门员工积分明细
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportPointsFlow}>
                导出积分流水明细（大数据量）
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <span className="ml-auto text-xs text-muted-foreground">
            当前条件：{rangeLabel}｜{applied.company}｜{applied.dept}｜
            {applied.person}｜{applied.category}｜{applied.type}
          </span>
        </div>
      </Panel>

      {/* 图表区 */}
      <div className="mb-4 grid gap-4 xl:grid-cols-3">
        <Panel
          title="阅读与互动趋势"
          className="xl:col-span-2"
          extra={<MetricHint metric="阅读互动趋势" />}
        >
          <ReadTrendChart data={trendData} />
        </Panel>
        <Panel
          title="部门积分"
          extra={
            <div className="flex items-center gap-1">
              <Button
                size="xs"
                variant="ghost"
                className="px-0"
                onClick={() => router.push('/points/logs')}
              >
                积分日志
                <ArrowRight className="size-3" />
              </Button>
              <MetricHint metric="部门积分" />
            </div>
          }
        >
          <DeptPointsChart data={deptData} />
        </Panel>
      </div>

      <div className="mb-4 grid gap-4 xl:grid-cols-3">
        <Panel
          title="积分获取与消耗（月）"
          className="xl:col-span-2"
          extra={<MetricHint metric="积分获取与消耗" />}
        >
          <PointsChart data={pointsData} />
        </Panel>
        <Panel title="员工变化（月）" extra={<MetricHint metric="员工变化" />}>
          <StaffTrendChart data={staffData} />
        </Panel>
      </div>

      <div className="mb-4 grid gap-4 xl:grid-cols-3">
        <Panel
          title="论坛治理"
          extra={
            <div className="flex items-center gap-1">
              <Button
                size="xs"
                variant="ghost"
                className="px-0"
                onClick={() => router.push('/forum/sensitive-words')}
              >
                敏感词
                <ArrowRight className="size-3" />
              </Button>
              <MetricHint metric="论坛治理" />
            </div>
          }
        >
          <ForumGovernanceChart data={forumData} />
        </Panel>
        <Panel
          title="反馈闭环率"
          extra={
            <div className="flex items-center gap-1">
              <Button
                size="xs"
                variant="ghost"
                className="px-0"
                onClick={() => router.push('/feedback')}
              >
                反馈列表
                <ArrowRight className="size-3" />
              </Button>
              <MetricHint metric="反馈闭环率" />
            </div>
          }
        >
          <FeedbackClosureChart data={FEEDBACK_CLOSURE} />
          <p className="mt-2 text-xs text-muted-foreground">
            本月新增 {closureNow.新增} 条、办结 {closureNow.办结} 条，闭环率
            {' '}
            {closureNow.闭环率}%，低于 90% 目标值需重点跟进。
          </p>
        </Panel>

        {/* 异步导出任务状态 */}
        <Panel
          title="导出任务"
          bodyClassName="p-0"
          extra={
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                进行中 {activeTasks}
              </span>
              <Button
                size="xs"
                variant="ghost"
                className="px-0"
                onClick={() => router.push('/logs/export')}
              >
                导出日志
                <ArrowRight className="size-3" />
              </Button>
            </div>
          }
        >
          <ul className="divide-y divide-border">
            {tasks.slice(0, 4).map((t) => (
              <li key={t.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs text-muted-foreground">
                    {t.id}
                  </span>
                  <StatusTag tone={TASK_TONE[t.state]}>{t.state}</StatusTag>
                </div>
                <p className="mt-1 truncate text-[13px]">{t.name}</p>
                <div
                  className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuenow={t.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${t.id} 导出进度`}
                >
                  <div
                    className="h-full rounded-full bg-brand transition-all"
                    style={{ width: `${t.progress}%` }}
                  />
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {t.rows.toLocaleString('zh-CN')} 行｜{t.operator}｜
                    {t.createdAt}
                  </span>
                  {t.state === '可下载' ? (
                    <button
                      type="button"
                      className="text-brand hover:underline"
                      onClick={() => toast.success(`已开始下载 ${t.id}`)}
                    >
                      下载
                    </button>
                  ) : (
                    <span>{t.progress}%</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* 内容排行：可下钻到资讯、视听、帖子对应业务页 */}
      <Panel
        title="内容排行"
        bodyClassName="p-0"
        extra={
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              共 {rankRows.length} 条
            </span>
            <MetricHint metric="内容排行" />
          </div>
        }
      >
        <table className="w-full text-[13px]">
          <thead className="bg-muted/60 text-xs text-muted-foreground">
            <tr>
              <th className="w-12 px-4 py-2 text-left font-normal">排名</th>
              <th className="px-3 py-2 text-left font-normal">标题</th>
              <th className="w-16 px-3 py-2 text-left font-normal">体裁</th>
              <th className="w-20 px-3 py-2 text-left font-normal">类目</th>
              <th className="w-28 px-3 py-2 text-left font-normal">归属部门</th>
              <th className="w-24 px-3 py-2 text-right font-normal">阅读/播放</th>
              <th className="w-20 px-3 py-2 text-right font-normal">互动</th>
              <th className="w-20 px-4 py-2 text-right font-normal">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rankRows.map((r, i) => (
              <tr key={r.title} className="hover:bg-accent/40">
                <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                <td className="px-3 py-2.5">
                  <span className="line-clamp-1">{r.title}</span>
                </td>
                <td className="px-3 py-2.5">
                  <StatusTag tone="neutral">{r.type}</StatusTag>
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {r.category}
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">{r.dept}</td>
                <td className="px-3 py-2.5 text-right">
                  {Math.round(r.reads * scale).toLocaleString('zh-CN')}
                </td>
                <td className="px-3 py-2.5 text-right">
                  {Math.round(r.interactions * scale).toLocaleString('zh-CN')}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Button
                    size="xs"
                    variant="ghost"
                    className="px-0"
                    onClick={() => router.push(r.target)}
                  >
                    下钻
                    <ArrowRight className="size-3" />
                  </Button>
                </td>
              </tr>
            ))}
            {rankRows.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-[13px] text-muted-foreground"
                >
                  当前筛选条件与数据权限下没有可展示的内容
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  )
}
