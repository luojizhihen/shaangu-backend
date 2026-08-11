'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'

import { useApp } from '@/components/app-store'
import { Panel, StatusTag } from '@/components/layout/page-frame'
import { Button, buttonVariants } from '@/components/ui/button'
import { ROLES, can } from '@/lib/nav'

export function Forbidden({
  perm,
  title,
}: {
  perm?: string
  title?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { role } = useApp()
  const owners = perm ? ROLES.filter((r) => can(r, perm)) : []

  return (
    <div className="mx-auto max-w-3xl py-6">
      <Panel bodyClassName="p-8">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <ShieldAlert className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-medium">403 无访问权限</h2>
              <StatusTag tone="danger">服务端已拒绝该操作</StatusTag>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              当前演示角色「{role.name}」未被授予该功能的访问权限。菜单入口已隐藏，直接访问路由同样被拒绝，
              并写入模拟审计记录（登录、权限、路由拦截）。
            </p>

            <dl className="mt-4 grid gap-y-2 text-[13px] sm:grid-cols-[92px_1fr]">
              <dt className="text-muted-foreground">请求功能</dt>
              <dd>{title ?? '未知功能'}</dd>
              <dt className="text-muted-foreground">请求路由</dt>
              <dd className="font-mono text-xs">{pathname}</dd>
              <dt className="text-muted-foreground">权限编码</dt>
              <dd className="font-mono text-xs">{perm ?? '—'}</dd>
              <dt className="text-muted-foreground">数据范围</dt>
              <dd>{role.scope}</dd>
            </dl>

            {owners.length > 0 && (
              <div className="mt-4 rounded-md border border-border bg-muted px-3 py-2.5">
                <p className="text-xs text-muted-foreground">
                  拥有该权限的角色（可在右上角“角色切换（仅供原型演示）”中切换验证）
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {owners.map((r) => (
                    <StatusTag key={r.key} tone="info">
                      {r.name}
                    </StatusTag>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 flex items-center gap-2">
              <Link href="/workbench" className={buttonVariants()}>
                返回工作台
              </Link>
              <Button variant="outline" onClick={() => router.back()}>
                返回上一页
              </Button>
              <Link
                href="/feedback"
                className={buttonVariants({ variant: 'ghost' })}
              >
                申请权限（联系系统管理员）
              </Link>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  )
}
