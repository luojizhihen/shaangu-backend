'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import {
  CheckCircle2,
  CircleSlash,
  Plus,
  RefreshCcw,
  ShieldAlert,
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
  SENSITIVE_POLICY,
  WORD_CATEGORIES,
  WORD_MATCHES,
  WORD_SCOPES,
  checkSensitive,
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
  match: '全部方式',
  scope: '全部范围',
  enabled: '全部状态',
}

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
  match: '模糊匹配',
  scopes: ['帖子', '评论', '回复', '投票'],
  enabled: true,
}

export default function ForumSensitiveWordsPage() {
  const pathname = usePathname()
  const { words } = useForum()
  const { role } = useApp()
  const actor = { person: role.person, role: role.name }

  const [word, setWord] = React.useState('')
  const [category, setCategory] = React.useState('全部分类')
  const [match, setMatch] = React.useState('全部方式')
  const [scope, setScope] = React.useState('全部范围')
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
  const [importMatch, setImportMatch] = React.useState<WordMatch>('模糊匹配')

  const [testText, setTestText] = React.useState('')
  const [testScope, setTestScope] = React.useState<WordScope>('帖子')
  const [tested, setTested] = React.useState(false)

  const rows = React.useMemo(
    () =>
      words.filter((w) => {
        const hitWord = w.word.includes(query.word.trim())
        const hitCategory = query.category === '全部分类' || w.category === query.category
        const hitMatch = query.match === '全部方式' || w.match === query.match
        const hitScope =
          query.scope === '全部范围' || w.scopes.includes(query.scope as WordScope)
        const hitEnabled =
          query.enabled === '全部状态' ||
          (query.enabled === '已启用' ? w.enabled : !w.enabled)
        return hitWord && hitCategory && hitMatch && hitScope && hitEnabled
      }),
    [words, query],
  )

  const table = useTableState(rows)
  const hits = tested ? checkSensitive(testText, testScope) : []

  function search() {
    setQuery({ word, category, match, scope, enabled })
    table.setPage(1)
  }

  function reset() {
    setWord('')
    setCategory('全部分类')
    setMatch('全部方式')
    setScope('全部范围')
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

  function toggleScope(s: WordScope, on: boolean) {
    setForm((f) => ({
      ...f,
      scopes: on ? [...f.scopes, s] : f.scopes.filter((x) => x !== s),
    }))
  }

  function batchToggle(on: boolean) {
    if (table.selected.length === 0) {
      toast.error('请先勾选需要处理的词条')
      return
    }
    show(on ? '启用词条' : '停用词条', toggleWords(table.selected, on, actor))
  }

  const enabledCount = words.filter((w) => w.enabled).length

  return (
    <>
      <PageHeader
        breadcrumb={breadcrumbFor(pathname)}
        title="敏感词管理"
        actions={
          <>
            <Button variant="outline" onClick={() => toast.success('列表已刷新')}>
              <RefreshCcw className="size-4" />
              刷新
            </Button>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="size-4" />
              批量导入
            </Button>
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              新增词条
            </Button>
          </>
        }
      />

      <p className="mb-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/8 px-4 py-2.5 text-xs leading-relaxed text-warning">
        <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
        拦截策略：{SENSITIVE_POLICY}。启用的词条会在帖子、投票、评论与回复提交前统一校验，命中即阻止提交。
      </p>

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
        <FilterField label="匹配方式">
          <NativeSelect
            aria-label="匹配方式"
            value={match}
            onChange={setMatch}
            options={['全部方式', ...WORD_MATCHES]}
          />
        </FilterField>
        <FilterField label="作用范围">
          <NativeSelect
            aria-label="作用范围"
            value={scope}
            onChange={setScope}
            options={['全部范围', ...WORD_SCOPES]}
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

      <div className="grid gap-4 pb-4 xl:grid-cols-[minmax(0,1fr)_320px]">
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
            <span className="ml-auto text-xs text-muted-foreground">
              共 {words.length} 个词条 · 已启用 {enabledCount} 个 · 已选{' '}
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
                <TableHead className="min-w-40">词条</TableHead>
                <TableHead className="w-24">分类</TableHead>
                <TableHead className="w-24">匹配方式</TableHead>
                <TableHead className="min-w-52">作用范围</TableHead>
                <TableHead className="w-24">启用状态</TableHead>
                <TableHead className="w-44">更新时间</TableHead>
                <TableHead className="w-24">操作人</TableHead>
                <TableHead className="w-20 pr-4 text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.pageRows.length === 0 && (
                <TableEmpty colSpan={10} text="没有符合条件的敏感词" />
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
                  <TableCell>{w.match}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {w.scopes.map((s) => (
                        <StatusTag key={s} tone="info">
                          {s}
                        </StatusTag>
                      ))}
                    </div>
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

        <Panel title="拦截试算" className="self-start">
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <label htmlFor="test-scope" className="text-[13px]">
                作用范围
              </label>
              <NativeSelect
                id="test-scope"
                aria-label="试算作用范围"
                value={testScope}
                onChange={(v) => setTestScope(v as WordScope)}
                options={WORD_SCOPES}
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="test-text" className="text-[13px]">
                待校验文本
              </label>
              <textarea
                id="test-text"
                rows={5}
                value={testText}
                placeholder="粘贴一段文本，试算是否会被敏感词拦截"
                onChange={(e) => {
                  setTestText(e.target.value)
                  setTested(false)
                }}
                className="scroll-thin w-full rounded-md border border-input bg-surface px-3 py-2 text-[13px] leading-relaxed text-foreground focus:border-ring focus:outline-none"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={!testText.trim()}
              onClick={() => setTested(true)}
            >
              执行试算
            </Button>

            {tested &&
              (hits.length === 0 ? (
                <div className="flex items-start gap-2 rounded-md border border-brand-green/30 bg-brand-green/8 px-3 py-2.5">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-green" />
                  <p className="text-xs leading-relaxed text-brand-green">
                    未命中启用中的敏感词，可正常提交。
                  </p>
                </div>
              ) : (
                <div className="rounded-md border border-destructive/30 bg-destructive/8 px-3 py-2.5">
                  <p className="flex items-center gap-2 text-xs text-destructive">
                    <ShieldAlert className="size-4 shrink-0" />
                    命中 {hits.length} 个词条，提交将被阻止
                  </p>
                  <ul className="mt-2 grid gap-1">
                    {hits.map((h, i) => (
                      <li key={`${h.word}-${i}`} className="text-xs text-destructive">
                        「{h.word}」· {h.category} · {h.match}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs leading-relaxed text-destructive">
                    处理方式：阻止提交并提示修改，不做自动替换，也不进入人工审核。
                  </p>
                </div>
              ))}
          </div>
        </Panel>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? '编辑词条' : '新增词条'}</DialogTitle>
            <DialogDescription>
              词条命中后统一阻止提交并提示修改，不提供自动替换或送审配置。
            </DialogDescription>
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
                placeholder="请输入词条内容，正则匹配请填写正则表达式"
                onChange={(e) => setForm((f) => ({ ...f, word: e.target.value }))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
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
              <div className="grid gap-1.5">
                <label htmlFor="form-match" className="text-[13px]">
                  匹配方式
                </label>
                <NativeSelect
                  id="form-match"
                  aria-label="匹配方式"
                  value={form.match}
                  onChange={(v) => setForm((f) => ({ ...f, match: v as WordMatch }))}
                  options={WORD_MATCHES}
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <span className="text-[13px]">
                <span className="text-destructive">*</span>作用范围
              </span>
              <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-md border border-border px-3 py-2.5">
                {WORD_SCOPES.map((s) => (
                  <label key={s} className="flex items-center gap-1.5 text-[13px]">
                    <Checkbox
                      checked={form.scopes.includes(s)}
                      aria-label={`作用范围 ${s}`}
                      onCheckedChange={(v) => toggleScope(s, Boolean(v))}
                    />
                    {s}
                  </label>
                ))}
              </div>
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
            <div className="grid gap-3 sm:grid-cols-2">
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
                <label htmlFor="import-match" className="text-[13px]">
                  匹配方式
                </label>
                <NativeSelect
                  id="import-match"
                  aria-label="导入匹配方式"
                  value={importMatch}
                  onChange={(v) => setImportMatch(v as WordMatch)}
                  options={WORD_MATCHES}
                />
              </div>
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
            <p className="text-xs leading-relaxed text-muted-foreground">
              导入词条默认作用于帖子、投票、评论与回复，可在列表中逐条调整。
            </p>
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
                  importMatch,
                  ['帖子', '投票', '评论', '回复'],
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
