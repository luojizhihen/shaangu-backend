/**
 * 登录安全策略（原型本地实现，无真实 API）：
 * 1) 首次登录、或密码被重置后，必须先修改初始密码才能进入平台；
 * 2) 连续 5 次密码错误锁定账号 30 分钟，锁定状态刷新后仍然保留。
 * 所有状态写入 localStorage，便于原型演示与刷新后状态保留。
 */

export const INITIAL_PASSWORD = 'shaangu@2026'
export const MAX_FAILED = 5
export const LOCK_MINUTES = 30

const KEY = 'shaangu-login-security-v1'

type AccountSecurity = {
  /** 连续密码错误次数 */
  failed: number
  /** 锁定到期时间戳，null 表示未锁定 */
  lockedUntil: number | null
  /** 是否需要修改初始密码（首次登录 / 密码重置后为 true） */
  mustChangePassword: boolean
  /** 当前密码（修改初始密码后写入） */
  password: string
  /** 最近一次修改密码时间 */
  passwordChangedAt: number | null
  /** 是否由管理员重置密码触发（用于区分首次登录与密码重置提示） */
  resetByAdmin: boolean
}

type SecurityStore = Record<string, AccountSecurity>

function blank(): AccountSecurity {
  return {
    failed: 0,
    lockedUntil: null,
    mustChangePassword: true,
    password: INITIAL_PASSWORD,
    passwordChangedAt: null,
    resetByAdmin: false,
  }
}

function readStore(): SecurityStore {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as SecurityStore) : {}
  } catch {
    return {}
  }
}

function writeStore(store: SecurityStore) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, JSON.stringify(store))
}

export function getAccount(account: string): AccountSecurity {
  const store = readStore()
  return store[account] ?? blank()
}

function patch(account: string, next: Partial<AccountSecurity>): AccountSecurity {
  const store = readStore()
  const merged = { ...(store[account] ?? blank()), ...next }
  store[account] = merged
  writeStore(store)
  return merged
}

/** 返回剩余锁定毫秒数，0 表示未锁定；已到期自动解锁并清零错误次数 */
export function lockRemaining(account: string): number {
  const rec = getAccount(account)
  if (!rec.lockedUntil) return 0
  const left = rec.lockedUntil - Date.now()
  if (left <= 0) {
    patch(account, { lockedUntil: null, failed: 0 })
    return 0
  }
  return left
}

export function formatRemaining(ms: number): string {
  const total = Math.ceil(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export type VerifyResult =
  | { kind: 'locked'; remaining: number }
  | { kind: 'wrong'; attemptsLeft: number }
  | { kind: 'just-locked'; remaining: number }
  | { kind: 'must-change' }
  | { kind: 'ok' }

/** 校验密码并按策略更新失败计数 / 锁定状态 */
export function verifyPassword(account: string, password: string): VerifyResult {
  const remaining = lockRemaining(account)
  if (remaining > 0) return { kind: 'locked', remaining }

  const rec = getAccount(account)
  if (password !== rec.password) {
    const failed = rec.failed + 1
    if (failed >= MAX_FAILED) {
      const lockedUntil = Date.now() + LOCK_MINUTES * 60 * 1000
      patch(account, { failed, lockedUntil })
      return { kind: 'just-locked', remaining: lockedUntil - Date.now() }
    }
    patch(account, { failed })
    return { kind: 'wrong', attemptsLeft: MAX_FAILED - failed }
  }

  patch(account, { failed: 0, lockedUntil: null })
  return rec.mustChangePassword ? { kind: 'must-change' } : { kind: 'ok' }
}

/** 演示用：把账号置为已锁定状态 */
export function forceLock(account: string): number {
  const rec = getAccount(account)
  if (rec.lockedUntil && rec.lockedUntil > Date.now()) return rec.lockedUntil - Date.now()
  const lockedUntil = Date.now() + LOCK_MINUTES * 60 * 1000
  patch(account, { failed: MAX_FAILED, lockedUntil })
  return lockedUntil - Date.now()
}

/** 完成初始密码修改 */
export function changePassword(account: string, next: string) {
  patch(account, {
    password: next,
    mustChangePassword: false,
    passwordChangedAt: Date.now(),
    failed: 0,
    lockedUntil: null,
    resetByAdmin: false,
  })
}

/** 演示用：模拟管理员重置密码，回到初始密码并要求再次修改 */
export function resetToInitial(account: string) {
  patch(account, {
    password: INITIAL_PASSWORD,
    mustChangePassword: true,
    passwordChangedAt: null,
    failed: 0,
    lockedUntil: null,
  })
}

/** 演示用：清空全部登录安全状态 */
export function clearSecurityState() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(KEY)
}

export type PasswordRule = { label: string; pass: boolean }

/** 密码复杂度校验：8-20 位，含大小写字母、数字、符号中的至少三类，且不能与初始密码相同 */
export function checkPasswordRules(pwd: string): PasswordRule[] {
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pwd)).length
  return [
    { label: '长度 8-20 位', pass: pwd.length >= 8 && pwd.length <= 20 },
    { label: '包含大小写字母、数字、符号中至少三类', pass: classes >= 3 },
    { label: '不能与初始密码相同', pass: pwd.length > 0 && pwd !== INITIAL_PASSWORD },
    { label: '不含连续 3 位以上相同字符', pass: pwd.length > 0 && !/(.)\1{2,}/.test(pwd) },
  ]
}
