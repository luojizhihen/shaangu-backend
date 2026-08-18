'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import {
  CircleSlash,
  Plus,
  ShieldCheck,
  SquarePen,
  Upload,
} from 'lucide-react'
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
import {
  WORD_CATEGORIES,
  createWord,
  importWords,
  toggleWords,
  updateWord,
  useForum,
  type BatchResult,
  type SensitiveWord,
  type WordMatch,
  type WordScope,
} from '@/lib/forum-store'
import { breadcrumbFor } from '@/lib/nav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

const EMPTY_QUERY = {
  word: '',
  category: '全部分类',
  enabled: '全部状态',
}

/** 词条统一按模糊匹配、全场景生效，页面不再暴露匹配方式与作用范围配置 */
const DEFAULT_MATCH: WordMatch = '模糊匹配'
const DEFAULT_SCOPES: WordScope[] = ['帖子', '投票', '评论', '回复']

type FormState = {
  word: string
  category: string
  match: WordMatch
  scopes: WordScope[]
  enabled: boolean
}

const EMPTY_FORM: FormState = {
  word: '',
  category: WORD_CATEGORIES[0],
  match: DEFAULT_MATCH,
  scopes: DEFAULT_SCOPES,
  enabled: true,
}

export default function ForumSensitiveWordsPage() {
  const pathname = usePathname()
  const { words } = useForum()
  const { role } = useApp()
  const actor = { person: role.person, role: role.name }

  const [word, setWord] = React.useState('')
  const [category, setCategory] = React.useState('全部分类')
  const [enabled, setEnabled] = React.useState('全部状态')
  const [query, setQuery] = React.useState(EMPTY_QUERY)

  const [results, setResults] = React.useState<BatchResult[] | null>(null)
  const [resultAction, setResultAction] = React.useState('批量操作')

  const [editing, setEditing] = React.useState<SensitiveWord | null>(null)
  const [formOpen, setFormOpen] = React.useState(false)
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM)

  const [importOpen, setImportOpen] = React.useState(false)
  const [importText, setImportText] = React.useState('')
  const [importCategory, setImportCategory] = React.useState(WORD_CATEGORIES[0])

  const rows = React.useMemo(
    () =>
      words.filter((w) => {
        const hitWord = w.word.includes(query.word.trim())
        const hitCategory = query.category === '全部分类' || w.category === query.category
        const hitEnabled =
          query.enabled === '全部状态' ||
          (query.enabled === '已启用' ? w.enabled : !w.enabled)
        return hitWord && hitCategory && hitEnabled
      }),
    [words, query],
  )

  const table = useTableState(rows)

  function search() {
    setQuery({ word, category, enabled })
    table.setPage(1)
  }

  function reset() {
    setWord('')
    setCategory('全部分类')
    setEnabled('全部状态')
    setQuery(EMPTY_QUERY)
  }

  function show(action: string, list: BatchResult[]) {
    setResultAction(action)
    setResults(list)
    table.clear()
  }

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  function openEdit(w: SensitiveWord) {
    setEditing(w)
    setForm({
      word: w.word,
      category: w.category,
      match: w.match,
      scopes: w.scopes,
      enabled: w.enabled,
    })
    setFormOpen(true)
  }

  function submitForm() {
    const res = editing
      ? updateWord(editing.id, form, actor)
      : createWord(form, actor)
    toast[res.ok ? 'success' : 'error'](res.message)
    if (res.ok) setFormOpen(false)
  }

  function batchToggle(on: boolean) {
    if (table.selected.length === 0) {
      toast.error('请先勾选需要处理的词条')
      return
    }
    show(on ? '启用词条' : '停用词条', toggleWords(table.selected, on, actor))
  }

  return (
    <>
      <PageHeader
        breadcrumb={breadcrumbFor(pathname)}
        title="敏感词管理"
      />

      <FilterBar onSearch={search} onReset={reset}>
        <FilterField label="词条">
          <Input
            value={word}
            placeholder="请输入词条"
            onChange={(e) => setWord(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) search()
            }}
          />
        </FilterField>
        <FilterField label="分类">
          <NativeSelect
            aria-label="分类"
            value={category}
            onChange={setCategory}
            options={['全部分类', ...WORD_CATEGORIES]}
          />
        </FilterField>
        <FilterField label="启用状态">
          <NativeSelect
            aria-label="启用状态"
            value={enabled}
            onChange={setEnabled}
            options={['全部状态', '已启用', '已停用']}
          />
        </FilterField>
      </FilterBar>

      <div className="pb-4">
        <Panel bodyClassName="p-0">
          <Toolbar>
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-3.5" />
              新增
            </Button>
            <Button size="sm" variant="outline" onClick={() => batchToggle(true)}>
              <ShieldCheck className="size-3.5" />
              批量启用
            </Button>
            <Button size="sm" variant="outline" onClick={() => batchToggle(false)}>
              <CircleSlash className="size-3.5" />
              批量停用
            </Button>
            <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="size-3.5" />
              批量导入
            </Button>
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
                <TableHead className="min-w-40">词条</TableHead>
                <TableHead className="w-24">分类</TableHead>
                <TableHead className="w-24">启用状态</TableHead>
                <TableHead className="w-44">更新时间</TableHead>
                <TableHead className="w-24">操作人</TableHead>
                <TableHead className="w-20 pr-4 text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.pageRows.length === 0 && (
                <TableEmpty colSpan={8} text="没有符合条件的敏感词" />
              )}
              {table.pageRows.map((w, i) => (
                <TableRow key={w.id}>
                  <TableCell className="pl-4 text-muted-foreground">
                    {(table.page - 1) * table.pageSize + i + 1}
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      aria-label={`选择词条 ${w.word}`}
                      checked={table.selected.includes(w.id)}
                      onCheckedChange={(v) => table.toggleRow(w.id, Boolean(v))}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{w.word}</TableCell>
                  <TableCell>
                    <StatusTag tone="neutral">{w.category}</StatusTag>
                  </TableCell>
                  <TableCell>
                    <StatusTag tone={w.enabled ? 'success' : 'neutral'}>
                      {w.enabled ? '已启用' : '已停用'}
                    </StatusTag>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {w.updatedAt}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{w.operator}</TableCell>
                  <TableCell className="pr-4">
                    <div className="flex items-center justify-center">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`编辑词条 ${w.word}`}
                        onClick={() => openEdit(w)}
                      >
                        <SquarePen />
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

      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? '编辑词条' : '新增词条'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <label htmlFor="form-word" className="text-[13px]">
                <span className="text-destructive">*</span>词条
              </label>
              <Input
                id="form-word"
                value={form.word}
                maxLength={40}
                placeholder="请输入词条内容"
                onChange={(e) => setForm((f) => ({ ...f, word: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="form-category" className="text-[13px]">
                分类
              </label>
              <NativeSelect
                id="form-category"
                aria-label="分类"
                value={form.category}
                onChange={(v) => setForm((f) => ({ ...f, category: v }))}
                options={WORD_CATEGORIES}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] text-muted-foreground">启用该词条</span>
              <Switch
                checked={form.enabled}
                onCheckedChange={(v) => setForm((f) => ({ ...f, enabled: v }))}
                aria-label="启用该词条"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              取消
            </Button>
            <Button onClick={submitForm}>{editing ? '保存' : '新增'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>批量导入词条</DialogTitle>
            <DialogDescription>
              每行一个词条，重复词条自动跳过；导入后默认启用。
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <label htmlFor="import-category" className="text-[13px]">
                分类
              </label>
              <NativeSelect
                id="import-category"
                aria-label="导入分类"
                value={importCategory}
                onChange={setImportCategory}
                options={WORD_CATEGORIES}
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="import-text" className="text-[13px]">
                词条列表
              </label>
              <textarea
                id="import-text"
                rows={6}
                value={importText}
                placeholder={'每行一个词条，例如：\n内部资料\n私下转让'}
                onChange={(e) => setImportText(e.target.value)}
                className="scroll-thin w-full rounded-md border border-input bg-surface px-3 py-2 text-[13px] leading-relaxed text-foreground focus:border-ring focus:outline-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              取消
            </Button>
            <Button
              disabled={!importText.trim()}
              onClick={() => {
                const list = importWords(
                  importText.split('\n'),
                  importCategory,
                  DEFAULT_MATCH,
                  DEFAULT_SCOPES,
                  actor,
                )
                show('批量导入', list)
                setImportText('')
                setImportOpen(false)
              }}
            >
              开始导入
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BatchResultDialog
        open={results !== null}
        onOpenChange={(v) => !v && setResults(null)}
        action={resultAction}
        results={results ?? []}
      />
    </>
  )
}
