'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Inbox } from 'lucide-react'
import { toast } from 'sonner'

import { useApp } from '@/components/app-store'
import { Panel, StatusTag } from '@/components/layout/page-frame'
import { Button } from '@/components/ui/button'
import { can } from '@/lib/nav'
import {
  CONTENT_OVERVIEW,
  SCHEDULED_TASKS,
  SHORTCUTS,
  TODOS,
  type Todo,
} from '@/lib/mock'

const TODO_TYPES: Todo['type'][] = [
  '待发布草稿',
  '同步异常',
  '待回复反馈',
  '待领取订单',
  '内容下架异常',
]

const LEVEL_TONE: Record<Todo['level'], 'danger' | 'warning' | 'neutral'> = {
  高: 'danger',
  中: 'warning',
  低: 'neutral',
}

const TASK_TONE = {
  异常待处理: 'danger',
  运行中: 'info',
  成功: 'success',
} as const

export function OpsBoard() {
  const router = useRouter()
  const { role } = useApp()
  const [activeType, setActiveType] = React.useState<Todo['type'] | '全部'>(
    '全部',
  )

  /** 待办只展示当前角色有权处理的条目，与菜单权限同源 */
  const visibleTodos = React.useMemo(
    () => TODOS.filter((t) => can(role, t.perm)),
    [role],
  )

  const rows =
    activeType === '全部'
      ? visibleTodos
      : visibleTodos.filter((t) => t.type === activeType)

  const shortcuts = SHORTCUTS.filter((s) => can(role, s.perm))
  const overview = CONTENT_OVERVIEW.filter((c) => can(role, c.perm))
  const tasks = SCHEDULED_TASKS.filter((t) => can(role, t.perm))

  function goto(path: string) {
    router.push(path)
  }

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {/* 待办事项：按类型分流，可直接下钻到业务页处理 */}
      <Panel
        title="我的运营待办"
        className="xl:col-span-2"
        bodyClassName="p-0"
        extra={
          <span className="text-xs text-muted-foreground">
            共 {visibleTodos.length} 条 · 权限范围 {role.scope}
          </span>
        }
      >
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-4 py-2.5">
          <TypeChip
            label="全部"
            count={visibleTodos.length}
            active={activeType === '全部'}
            onClick={() => setActiveType('全部')}
          />
          {TODO_TYPES.map((t) => {
            const count = visibleTodos.filter((x) => x.type === t).length
            if (count === 0) return null
            return (
              <TypeChip
                key={t}
                label={t}
                count={count}
                active={activeType === t}
                onClick={() => setActiveType(t)}
              />
            )
          })}
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <Inbox className="size-8" />
            <p className="text-[13px]">当前分类下没有待办事项</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((t) => (
              <li key={t.id} className="flex items-start gap-3 px-4 py-3">
                <StatusTag tone={LEVEL_TONE[t.level]}>{t.level}</StatusTag>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-foreground">
                    {t.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t.type}｜{t.dept} · {t.owner}｜{t.createdAt}
                  </p>
                </div>
                <Button size="xs" variant="outline" onClick={() => goto(t.target)}>
                  处理
                  <ArrowRight className="size-3" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* 快捷入口 */}
      <Panel title="快捷入口">
        <div className="grid grid-cols-2 gap-2">
          {shortcuts.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => goto(s.target)}
              className="rounded-md border border-border px-3 py-2.5 text-left transition-colors hover:border-brand/50 hover:bg-brand/5"
            >
              <span className="block text-[13px] font-medium text-foreground">
                {s.label}
              </span>
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                {s.desc}
              </span>
            </button>
          ))}
          {shortcuts.length === 0 && (
            <p className="col-span-2 py-6 text-center text-[13px] text-muted-foreground">
              当前角色暂无可用快捷入口
            </p>
          )}
        </div>
      </Panel>

      {/* 内容概览 */}
      <Panel title="内容概览" bodyClassName="p-0" className="xl:col-span-2">
        <table className="w-full text-[13px]">
          <thead className="bg-muted/60 text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left font-normal">体裁</th>
              <th className="px-3 py-2 text-right font-normal">总量</th>
              <th className="px-3 py-2 text-right font-normal">已发布</th>
              <th className="px-3 py-2 text-right font-normal">草稿</th>
              <th className="px-3 py-2 text-right font-normal">待审核</th>
              <th className="px-3 py-2 text-right font-normal">已下架</th>
              <th className="px-4 py-2 text-right font-normal">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {overview.map((c) => (
              <tr key={c.name} className="hover:bg-accent/40">
                <td className="px-4 py-2.5 font-medium">{c.name}</td>
                <td className="px-3 py-2.5 text-right">
                  {c.total.toLocaleString('zh-CN')}
                </td>
                <td className="px-3 py-2.5 text-right">
                  {c.published.toLocaleString('zh-CN')}
                </td>
                <td className="px-3 py-2.5 text-right">{c.draft}</td>
                <td className="px-3 py-2.5 text-right text-warning">
                  {c.review}
                </td>
                <td className="px-3 py-2.5 text-right text-destructive">
                  {c.offline}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Button
                    size="xs"
                    variant="ghost"
                    className="px-0"
                    onClick={() => goto(c.target)}
                  >
                    查看
                    <ArrowRight className="size-3" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      {/* 任务状态 */}
      <Panel
        title="任务状态"
        bodyClassName="p-0"
        extra={
          <Button
            size="xs"
            variant="ghost"
            className="px-0"
            onClick={() => {
              toast.success('已重新拉取任务状态')
              goto('/logs/system')
            }}
          >
            全部任务
            <ArrowRight className="size-3" />
          </Button>
        }
      >
        <ul className="divide-y divide-border">
          {tasks.map((t) => (
            <li key={t.name} className="px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[13px] font-medium">
                  {t.name}
                </span>
                <StatusTag tone={TASK_TONE[t.state]}>{t.state}</StatusTag>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {t.detail}
              </p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  {t.schedule}｜最近 {t.lastRun}
                </span>
                <Button
                  size="xs"
                  variant="ghost"
                  className="px-0"
                  onClick={() => goto(t.target)}
                >
                  日志
                  <ArrowRight className="size-3" />
                </Button>
              </div>
            </li>
          ))}
          {tasks.length === 0 && (
            <li className="px-4 py-8 text-center text-[13px] text-muted-foreground">
              当前角色无任务查看权限
            </li>
          )}
        </ul>
      </Panel>
    </div>
  )
}

function TypeChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-xs transition-colors ${
        active
          ? 'border-brand bg-brand text-brand-foreground'
          : 'border-border text-muted-foreground hover:border-brand/40 hover:text-foreground'
      }`}
    >
      {label}
      <span
        className={
          active ? 'text-brand-foreground/80' : 'text-muted-foreground/80'
        }
      >
        {count}
      </span>
    </button>
  )
}
