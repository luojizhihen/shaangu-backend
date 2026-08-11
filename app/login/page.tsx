'use client'

import * as React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { AlertCircle, Loader2, Lock, RefreshCw, ShieldCheck, User } from 'lucide-react'

import { useApp } from '@/components/app-store'
import { ROLES, type RoleKey } from '@/lib/nav'
import { PLATFORM_NAME } from '@/lib/mock'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusTag } from '@/components/layout/page-frame'

/** 演示账号：密码统一为 shaangu@2026；其余账号用于演示异常状态 */
const DISABLED_ACCOUNT = 'admin.disabled'
const NO_ROLE_ACCOUNT = 'admin.norole'
const NETWORK_ACCOUNT = 'admin.offline'
const PASSWORD = 'shaangu@2026'

function newCaptcha() {
  return Math.random().toString(36).replace(/[^a-z0-9]/g, '').slice(0, 4).toUpperCase()
}

export default function LoginPage() {
  const router = useRouter()
  const { ready, signedIn, rememberedAccount, signIn, setRoleKey } = useApp()

  const [account, setAccount] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [captcha, setCaptcha] = React.useState('')
  const [captchaCode, setCaptchaCode] = React.useState('A7K2')
  const [remember, setRemember] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    setCaptchaCode(newCaptcha())
  }, [])

  React.useEffect(() => {
    if (ready && rememberedAccount) {
      setAccount(rememberedAccount)
      setRemember(true)
    }
  }, [ready, rememberedAccount])

  React.useEffect(() => {
    if (ready && signedIn) router.replace('/workbench')
  }, [ready, signedIn, router])

  function refreshCaptcha() {
    setCaptchaCode(newCaptcha())
    setCaptcha('')
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const acc = account.trim()
    if (!acc || !password.trim()) {
      setError('请输入管理员账号和密码。')
      return
    }
    if (captcha.trim().toUpperCase() !== captchaCode) {
      setError('安全校验码不正确，请重新输入。')
      refreshCaptcha()
      return
    }

    setLoading(true)
    window.setTimeout(() => {
      setLoading(false)

      if (acc === DISABLED_ACCOUNT) {
        setError('账号已停用：该管理员账号已被停用，请联系系统管理员。')
        return
      }
      if (acc === NO_ROLE_ACCOUNT) {
        setError('无后台权限：该账号未关联任何管理端角色，无法进入管理平台。')
        return
      }
      if (acc === NETWORK_ACCOUNT) {
        setError('网络异常：无法连接认证服务，请检查网络后重试。')
        return
      }

      const matched = ROLES.find((r) => r.account === acc)
      if (!matched || password !== PASSWORD) {
        setError('账号或密码错误，请重新输入。')
        refreshCaptcha()
        return
      }

      setRoleKey(matched.key as RoleKey)
      signIn(acc, remember)
      router.replace('/workbench')
    }, 600)
  }

  return (
    <div className="flex min-h-screen bg-page">
      {/* 品牌区：克制的深蓝色块与气流状态线，无营销文案与轮播 */}
      <section className="relative hidden w-[46%] max-w-[720px] flex-col justify-between bg-brand-deep px-12 py-10 text-white lg:flex">
        <div className="inline-flex h-11 w-fit items-center rounded-md bg-white px-4">
          <Image
            src="/shaangu-logo.png"
            alt="陕鼓集团 ShaanGu 官方标识"
            width={168}
            height={28}
            className="h-[22px] w-auto object-contain"
            priority
          />
        </div>

        <div>
          <span className="airflow-line mb-6 block h-[2px] w-24 rounded-full" />
          <h1 className="text-3xl leading-relaxed font-medium tracking-wide">
            {PLATFORM_NAME}
          </h1>
          <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-white/70">
            内部融媒内容、论坛治理、积分与商城、人员同步的统一运营管理端。仅限授权管理员访问。
          </p>
        </div>

        <p className="text-xs leading-relaxed text-white/55">
          陕西鼓风机（集团）有限公司 · 信息管理部
          <br />
          本平台数据属公司内部信息，请勿外传。
        </p>
      </section>

      {/* 登录表单区 */}
      <section className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-[380px]">
          <div className="mb-6 lg:hidden">
            <Image
              src="/shaangu-logo.png"
              alt="陕鼓集团 ShaanGu 官方标识"
              width={168}
              height={28}
              className="h-[22px] w-auto object-contain"
            />
          </div>

          <h2 className="text-xl font-medium">管理员登录</h2>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            请使用公司分配的管理员账号登录 {PLATFORM_NAME}。
          </p>

          <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="account">管理员账号</Label>
              <div className="relative">
                <User className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="account"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  placeholder="请输入管理员账号"
                  autoComplete="username"
                  className="h-9 pl-8"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">密码</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  autoComplete="current-password"
                  className="h-9 pl-8"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="captcha">安全校验码</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="captcha"
                  value={captcha}
                  onChange={(e) => setCaptcha(e.target.value)}
                  placeholder="请输入右侧 4 位校验码"
                  className="h-9 flex-1"
                />
                <div className="flex h-9 w-[92px] items-center justify-center rounded-md border border-input bg-secondary font-mono text-base tracking-[0.28em] text-brand-deep select-none">
                  {captchaCode}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-lg"
                  aria-label="更换校验码"
                  onClick={() => setCaptchaCode(newCaptcha())}
                >
                  <RefreshCw className="size-4" />
                </Button>
              </div>
            </div>

            <label className="flex w-fit items-center gap-2 text-[13px] text-muted-foreground">
              <Checkbox
                checked={remember}
                onCheckedChange={(v) => setRemember(Boolean(v))}
              />
              记住账号
            </label>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/8 px-3 py-2 text-[13px] text-destructive"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <Button type="submit" size="lg" disabled={loading} className="mt-1 w-full">
              {loading && <Loader2 className="size-4 animate-spin" />}
              {loading ? '正在校验…' : '登录'}
            </Button>
          </form>

          <div className="mt-5 flex items-start gap-2 rounded-md border border-border bg-surface px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-green" />
            <span>
              本平台仅限公司授权管理员访问，登录行为将记入系统日志。
            </span>
          </div>

          <div className="mt-4 rounded-md border border-dashed border-border bg-surface p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium">演示账号（仅供原型演示）</span>
              <StatusTag tone="neutral">密码 {PASSWORD}</StatusTag>
            </div>
            <ul className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
              {ROLES.map((r) => (
                <li key={r.key}>
                  <button
                    type="button"
                    className="w-full truncate text-left hover:text-brand"
                    onClick={() => {
                      setAccount(r.account)
                      setPassword(PASSWORD)
                      setError(null)
                    }}
                  >
                    <span className="font-mono">{r.account}</span>｜{r.name}
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              异常状态演示账号：
              <span className="font-mono"> admin.disabled</span>（停用）、
              <span className="font-mono">admin.norole</span>（无后台权限）、
              <span className="font-mono">admin.offline</span>（网络异常）。
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
