'use client'

import { CheckCircle2, XCircle } from 'lucide-react'

import type { BatchResult } from '@/lib/content-store'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

/** 批量操作结果：逐条展示成功或失败原因 */
export function BatchResultDialog({
  open,
  onOpenChange,
  action,
  results,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  action: string
  results: BatchResult[]
}) {
  const ok = results.filter((r) => r.ok).length
  const failed = results.length - ok

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{action}执行结果</DialogTitle>
          <DialogDescription>
            共 {results.length} 条，成功 {ok} 条，失败 {failed} 条。失败条目保持原状态，可修正后重试。
          </DialogDescription>
        </DialogHeader>
        <ul className="scroll-thin max-h-72 divide-y divide-border overflow-y-auto rounded-md border border-border">
          {results.map((r) => (
            <li key={r.id} className="flex items-start gap-2 px-3 py-2">
              {r.ok ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-green" />
              ) : (
                <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] text-foreground">{r.label}</p>
                <p className="text-xs text-muted-foreground">
                  {r.ok ? '成功' : '失败'}：{r.message}
                </p>
              </div>
              <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                {r.id}
              </span>
            </li>
          ))}
        </ul>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>关闭</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
