'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { Download, KeyRound, Pencil, Plus, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { useApp } from '@/components/app-store'
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
import { UserDialog } from '@/components/system/user-dialog'
import {
  USER_DEPTS,
  removeUsers,
  resetUserPassword,
  toggleUsers,
  useSystem,
  userStatusTone,
  type BatchResult,
  type SysUser,
} from '@/lib/system-store'
import { downloadCsv } from '@/lib/export'
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

const USE_OPTIONS = ['全部', '是', '否']
const DEPT_OPTIONS = ['全部部门', ...USER_DEPTS]

type Query = { account: string; name: string; use: string; dept: string }

const EMPTY_QUERY: Query = { account: '', name: '', use: '全部', dept: '全部部门' }

export default function UsersPage() {
  const pathname = usePathname()
  const { users } = useSystem()
  const { allow } = useApp()
  const canWrite = allow('system.users')

  const [draft, setDraft] = React.useState<Query>(EMPTY_QUERY)
  const [query, setQuery] = React.useState<Query>(EMPTY_QUERY)

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<SysUser | null>(null)
  const [results, setResults] = React.useState<BatchResult[] | null>(null)
  const [resultAction, setResultAction] = React.useState('操作')

  const rows = React.useMemo(
    () =>
      users.filter((u) => {
        if (!u.account.includes(query.account.trim())) return false
        if (!u.name.includes(query.name.trim())) return false
        if (query.use !== '全部' && (query.use === '是') !== u.enabled) return false
        if (query.dept !== '全部部门' && u.dept !== query.dept) return false
        return true
      }),
    [users, query],
  )

  const table = useTableState(rows)

  function search() {
    setQuery(draft)
    table.setPage(1)
  }

  function reset() {
    setDraft(EMPTY_QUERY)
    setQuery(EMPTY_QUERY)
    table.setPage(1)
  }

  function patch(p: Partial<Query>) {
    setDraft((d) => ({ ...d, ...p }))
  }

  /** 批量操作统一入口：先校验勾选，再把逐条结果交给结果弹窗 */
  function runBatch(action: string, fn: (ids: string[]) => BatchResult[]) {
    if (table.selected.length === 0) {
      toast.error('请先选择要操作的记录')
      return
    }
    setResultAction(action)
    setResults(fn(table.selected))
    table.clear()
  }

  function exportCsv() {
    downloadCsv(
      '后台用户.csv',
      ['用户账号', '用户名称', '是否使用', '状态', '部门', '职位', '邮箱', '关联角色', '最后登录时间'],
      rows.map((u) => [
        u.account,
        u.name,
        u.enabled ? '是' : '否',
        u.status,
        u.dept,
        u.position,
        u.email,
        u.roleNames.join('、'),
        u.lastLoginAt,
      ]),
    )
    toast.success(`已导出 ${rows.length} 条记录`)
  }

  return (
    <>
      <PageHeader breadcrumb={breadcrumbFor(pathname)} title="用户管理" />

      <FilterBar onSearch={search} onReset={reset}>
        <FilterField label="用户账号">
          <Input
            value={draft.account}
            placeholder="请输入用户账号"
            onChange={(e) => patch({ account: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) search()
            }}
          />
        </FilterField>
        <FilterField label="用户名称">
          <Input
            value={draft.name}
            placeholder="请输入用户名称"
            onChange={(e) => patch({ name: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) search()
            }}
          />
        </FilterField>
        <FilterField label="是否使用">
          <NativeSelect
            aria-label="是否使用"
            value={draft.use}
            options={USE_OPTIONS}
            onChange={(v) => patch({ use: v })}
          />
        </FilterField>
        <FilterField label="部门">
          <NativeSelect
            aria-label="部门"
            value={draft.dept}
            options={DEPT_OPTIONS}
            onChange={(v) => patch({ dept: v })}
          />
        </FilterField>
      </FilterBar>

      <Panel bodyClassName="p-0">
        <Toolbar>
          {canWrite && (
            <Button
              size="sm"
              onClick={() => {
                setEditing(null)
                setDialogOpen(true)
              }}
            >
              <Plus className="size-3.5" />
              新增
            </Button>
          )}
          {canWrite && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => runBatch('启用账号', (ids) => toggleUsers(ids, true))}
              >
                <ToggleRight className="size-3.5" />
                启用
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => runBatch('停用账号', (ids) => toggleUsers(ids, false))}
              >
                <ToggleLeft className="size-3.5" />
                停用
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => runBatch('重置密码', resetUserPassword)}
              >
                <KeyRound className="size-3.5" />
                重置密码
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => runBatch('删除用户', removeUsers)}
              >
                <Trash2 className="size-3.5" />
                删除
              </Button>
            </>
          )}
          <Button size="sm" variant="outline" onClick={exportCsv}>
            <Download className="size-3.5" />
            导出
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">
            共 {rows.length} 个用户
            {table.selected.length > 0 ? ` · 已选 ${table.selected.length} 个` : ''}
          </span>
        </Toolbar>

        <div className="scroll-thin overflow-x-auto">
          <Table className="min-w-[1160px] text-[13px]">
            <TableHeader>
              <TableRow className="bg-muted/60">
                <TableHead className="w-10 pl-4">
                  <Checkbox
                    aria-label="全选本页"
                    checked={table.allChecked}
                    onCheckedChange={(v) => table.togglePage(Boolean(v))}
                  />
                </TableHead>
                <TableHead className="w-36">用户账号</TableHead>
                <TableHead className="w-28">用户名称</TableHead>
                <TableHead className="w-24">是否使用</TableHead>
                <TableHead className="w-24">状态</TableHead>
                <TableHead className="w-32">部门</TableHead>
                <TableHead className="w-28">职位</TableHead>
                <TableHead className="w-48">邮箱</TableHead>
                <TableHead className="min-w-40">关联角色</TableHead>
                <TableHead className="w-44">最后登录时间</TableHead>
                <TableHead className="w-24 pr-4 text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.pageRows.length === 0 && (
                <TableEmpty colSpan={11} text="没有符合条件的用户" />
              )}
              {table.pageRows.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="pl-4">
                    <Checkbox
                      aria-label={`选择 ${u.account}`}
                      checked={table.selected.includes(u.id)}
                      onCheckedChange={(v) => table.toggleRow(u.id, Boolean(v))}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{u.account}</TableCell>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>
                    <StatusTag tone={u.enabled ? 'success' : 'neutral'}>
                      {u.enabled ? '是' : '否'}
                    </StatusTag>
                  </TableCell>
                  <TableCell>
                    <StatusTag tone={userStatusTone(u.status)}>{u.status}</StatusTag>
                  </TableCell>
                  <TableCell>{u.dept}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {u.position || '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {u.email || '—'}
                  </TableCell>

                  <TableCell>
                    {u.roleNames.length === 0 ? (
                      <span className="text-muted-foreground">未分配</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {u.roleNames.map((r) => (
                          <StatusTag key={r} tone="info">
                            {r}
                          </StatusTag>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {u.lastLoginAt || '从未登录'}
                  </TableCell>
                  <TableCell className="pr-4 text-center">
                    {canWrite && (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`编辑 ${u.account}`}
                        onClick={() => {
                          setEditing(u)
                          setDialogOpen(true)
                        }}
                      >
                        <Pencil />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Pagination
          total={rows.length}
          page={table.page}
          pageSize={table.pageSize}
          selectedCount={table.selected.length}
          onPageChange={table.setPage}
          onPageSizeChange={table.setPageSize}
        />
      </Panel>

      <UserDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />

      <BatchResultDialog
        open={results !== null}
        onOpenChange={(v) => !v && setResults(null)}
        action={resultAction}
        results={results ?? []}
      />
    </>
  )
}
