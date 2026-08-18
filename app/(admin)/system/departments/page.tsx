'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import {
  BadgeCheck,
  ChevronDown,
  ChevronRight,
  CircleSlash,
  Download,
  Eye,
  ListTree,
} from 'lucide-react'
import { toast } from 'sonner'

import { NativeSelect, PageHeader, Panel, StatusTag } from '@/components/layout/page-frame'
import {
  FilterBar,
  FilterField,
  TableEmpty,
  Toolbar,
} from '@/components/content/table-shell'
import { breadcrumbFor } from '@/lib/nav'
import { downloadCsv } from '@/lib/export'
import {
  branchIds,
  buildRows,
  childCount,
  DEPT_KINDS,
  DEPT_SOURCE_LABEL,
  pathOf,
  setDeptOrder,
  setDeptUsed,
  usedTone,
  useDepts,
  type Dept,
  type DeptQuery,
} from '@/lib/dept-store'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const EMPTY_QUERY: DeptQuery = {
  keyword: '',
  used: '全部',
  kind: '全部类型',
}

/** 详情弹窗的一行 */
function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 border-b border-border py-2 last:border-b-0">
      <span className="w-24 shrink-0 text-[13px] text-muted-foreground">{label}</span>
      <div className="flex-1 text-[13px]">{children}</div>
    </div>
  )
}

export default function DepartmentsPage() {
  const pathname = usePathname()
  const { depts } = useDepts()

  const [keyword, setKeyword] = React.useState('')
  const [used, setUsed] = React.useState('全部')
  const [kind, setKind] = React.useState('全部类型')
  const [query, setQuery] = React.useState<DeptQuery>(EMPTY_QUERY)

  // 默认展开两个根组织，便于直接看到层级
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set(['00', '01']))
  const [selected, setSelected] = React.useState<string[]>([])

  const [detail, setDetail] = React.useState<Dept | null>(null)
  const [orderTarget, setOrderTarget] = React.useState<Dept | null>(null)
  const [orderInput, setOrderInput] = React.useState('')

  const { rows, matchedIds } = React.useMemo(
    () => buildRows(depts, query, expanded),
    [depts, query, expanded],
  )

  const visibleIds = rows.map((r) => r.dept.id)
  const validSelected = selected.filter((id) => visibleIds.includes(id))
  const allChecked = rows.length > 0 && rows.every((r) => validSelected.includes(r.dept.id))

  const filtering =
    query.keyword !== '' || query.used !== '全部' || query.kind !== '全部类型'

  function search() {
    setQuery({ keyword, used, kind })
  }

  function reset() {
    setKeyword('')
    setUsed('全部')
    setKind('全部类型')
    setQuery(EMPTY_QUERY)
    setExpanded(new Set(['00', '01']))
    setSelected([])
  }

  function toggleNode(id: string) {
    setExpanded((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function expandAll() {
    setExpanded(branchIds(depts))
  }

  function collapseAll() {
    setExpanded(new Set())
  }

  function batchUsed(next: boolean) {
    const res = setDeptUsed(validSelected, next)
    if (!res.ok) {
      toast.error(res.message)
      return
    }
    toast.success(res.message)
    setSelected([])
  }

  function openOrder(d: Dept) {
    setOrderTarget(d)
    setOrderInput(d.order === null ? '' : String(d.order))
  }

  function saveOrder() {
    if (!orderTarget) return
    const raw = orderInput.trim()
    const res = setDeptOrder(orderTarget.id, raw === '' ? null : Number(raw))
    if (!res.ok) {
      toast.error(res.message)
      return
    }
    toast.success(res.message)
    setOrderTarget(null)
  }

  return (
    <>
      <PageHeader
        breadcrumb={breadcrumbFor(pathname)}
        title="部门管理"
      />

      <FilterBar onSearch={search} onReset={reset}>
        <FilterField label="部门名称">
          <Input
            value={keyword}
            placeholder="名称或组织编码"
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) search()
            }}
          />
        </FilterField>
        <FilterField label="是否使用">
          <NativeSelect
            aria-label="是否使用"
            value={used}
            onChange={setUsed}
            options={['全部', '已使用', '未使用']}
          />
        </FilterField>
        <FilterField label="节点类型">
          <NativeSelect
            aria-label="节点类型"
            value={kind}
            onChange={setKind}
            options={['全部类型', ...DEPT_KINDS]}
          />
        </FilterField>
      </FilterBar>

      <Panel bodyClassName="p-0">
        <Toolbar>
          <Button size="sm" variant="outline" onClick={expandAll}>
            <ListTree className="size-3.5" />
            展开全部
          </Button>
          <Button size="sm" variant="outline" onClick={collapseAll}>
            收起全部
          </Button>
          <span className="mx-1 h-4 w-px bg-border" />
          <Button
            size="sm"
            variant="outline"
            disabled={validSelected.length === 0}
            onClick={() => batchUsed(true)}
          >
            <BadgeCheck className="size-3.5" />
            设为已使用
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={validSelected.length === 0}
            onClick={() => batchUsed(false)}
          >
            <CircleSlash className="size-3.5" />
            设为未使用
          </Button>
          <span className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              共 {depts.length} 个组织节点
              {validSelected.length > 0 ? ` · 已选 ${validSelected.length} 个` : ''}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                downloadCsv(
                  '部门管理.csv',
                  ['组织编码', '部门名称', '节点类型', '上级组织', '是否使用', '显示排序', '备注', '负责人'],
                  depts.map((d) => {
                    const trail = pathOf(depts, d)
                    return [
                      d.code,
                      d.name,
                      d.kind,
                      trail.length > 1 ? trail[trail.length - 2] : '—',
                      d.used ? '已使用' : '未使用',
                      d.order === null ? '' : d.order,
                      DEPT_SOURCE_LABEL,
                      d.owner || '—',
                    ]
                  }),
                )
                toast.success('部门数据已导出')
              }}
            >
              <Download className="size-3.5" />
              导出
            </Button>
          </span>
        </Toolbar>

        <div className="scroll-thin overflow-x-auto">
          <Table className="min-w-[900px] text-[13px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 pl-4">
                  <Checkbox
                    aria-label="全选当前视图"
                    checked={allChecked}
                    onCheckedChange={(v) =>
                      setSelected(v === true ? visibleIds : [])
                    }
                  />
                </TableHead>
                <TableHead className="min-w-72">部门名称</TableHead>
                <TableHead className="w-24">是否使用</TableHead>
                <TableHead className="w-24">显示排序</TableHead>
                <TableHead className="w-28">备注</TableHead>
                <TableHead className="w-32 pr-4 text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableEmpty colSpan={6} text="没有符合条件的部门" />
              ) : (
                rows.map(({ dept: d, depth, hasChildren }) => {
                  const open = expanded.has(d.id) || (filtering && hasChildren)
                  const dim = filtering && !matchedIds.has(d.id)
                  return (
                    <TableRow key={d.id}>
                      <TableCell className="pl-4">
                        <Checkbox
                          aria-label={`选择 ${d.name}`}
                          checked={validSelected.includes(d.id)}
                          onCheckedChange={(v) =>
                            setSelected((s) =>
                              v === true
                                ? [...new Set([...s, d.id])]
                                : s.filter((x) => x !== d.id),
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {/* 缩进体现层级，仅有子节点的行显示折叠箭头 */}
                        <div
                          className="flex items-center gap-1.5"
                          style={{ paddingLeft: depth * 18 }}
                        >
                          {hasChildren ? (
                            <button
                              type="button"
                              aria-label={open ? `收起 ${d.name}` : `展开 ${d.name}`}
                              aria-expanded={open}
                              onClick={() => toggleNode(d.id)}
                              className="flex size-4 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground"
                            >
                              {open ? (
                                <ChevronDown className="size-3.5" />
                              ) : (
                                <ChevronRight className="size-3.5" />
                              )}
                            </button>
                          ) : (
                            <span className="size-4 shrink-0" />
                          )}
                          <span className="font-mono text-xs text-muted-foreground">
                            {d.code}
                          </span>
                          <span className={dim ? 'text-muted-foreground' : ''}>
                            {d.name}
                          </span>
                          {d.kind === '公司' && (
                            <StatusTag tone="info">公司</StatusTag>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusTag tone={usedTone(d.used)}>
                          {d.used ? '已使用' : '未使用'}
                        </StatusTag>
                      </TableCell>
                      <TableCell className="text-brand">
                        {d.order === null ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          d.order
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusTag tone="neutral">{DEPT_SOURCE_LABEL}</StatusTag>
                      </TableCell>
                      <TableCell className="pr-4">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => setDetail(d)}
                          >
                            <Eye className="size-3.5" />
                            查看
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => openOrder(d)}
                          >
                            排序
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Panel>

      {/* 查看详情 */}
      <Dialog open={detail !== null} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>部门详情</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="flex flex-col">
              <DetailRow label="组织编码">
                <span className="font-mono text-xs">{detail.code}</span>
              </DetailRow>
              <DetailRow label="部门名称">{detail.name}</DetailRow>
              <DetailRow label="节点类型">{detail.kind}</DetailRow>
              <DetailRow label="所属层级">
                {pathOf(depts, detail).join(' / ')}
              </DetailRow>
              <DetailRow label="下级节点">
                {childCount(depts, detail.id)} 个
              </DetailRow>
              <DetailRow label="负责人">{detail.owner || '—'}</DetailRow>
              <DetailRow label="是否使用">
                <StatusTag tone={usedTone(detail.used)}>
                  {detail.used ? '已使用' : '未使用'}
                </StatusTag>
              </DetailRow>
              <DetailRow label="显示排序">
                {detail.order === null ? '未设置' : detail.order}
              </DetailRow>
              <DetailRow label="备注">
                <StatusTag tone="neutral">{DEPT_SOURCE_LABEL}</StatusTag>
              </DetailRow>
              <DetailRow label="同步时间">
                <span className="font-mono text-xs">{detail.syncedAt}</span>
              </DetailRow>
              <p className="pt-3 text-xs text-muted-foreground">
                组织主数据由用友 NC 同步，名称、编码与层级在本平台只读，仅「是否使用」「显示排序」可维护。
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetail(null)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 显示排序 */}
      <Dialog open={orderTarget !== null} onOpenChange={(o) => !o && setOrderTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>设置显示排序</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <p className="text-[13px] text-muted-foreground">
              {orderTarget?.name}
            </p>
            <Input
              value={orderInput}
              inputMode="numeric"
              placeholder="留空表示不参与排序"
              aria-label="显示排序"
              onChange={(e) => setOrderInput(e.target.value.replace(/[^\d]/g, ''))}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderTarget(null)}>
              取消
            </Button>
            <Button onClick={saveOrder}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
