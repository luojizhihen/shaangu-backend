'use client'

/**
 * 积分模块（积分规则 / 积分日志 / 年度清零）原型数据与状态。
 *
 * 业务基线（务必保持）：
 * - 积分只能由会员行为按规则自动产生，或由兑换消耗、年度清零自动扣减。
 * - 管理端不提供人工增加、扣减、补发、回退积分的任何入口。
 * - 积分日志只读留痕：不可编辑、不可删除、不可回退历史积分。
 * - 年度清零只能配置「每年固定时点全员自动执行」，
 *   不提供立即清零、不提供选择部分用户清零、不提供修改已执行记录。
 * - 规则维护（新增 / 编辑 / 启用停用 / 删除）只影响此后产生的积分，不追溯历史流水。
 */

import * as React from 'react'

/* ---------------- 类型 ---------------- */

export type PointsRule = {
  id: string
  /** 排序值，越小越靠前 */
  sort: number
  name: string
  /** 积分编码，全局唯一 */
  code: string
  /** 单次积分 */
  points: number
  /** 单人每日上限，-1 表示不限 */
  dailyLimit: number
  /** 计分条件说明 */
  condition: string
  remark: string
  enabled: boolean
  updatedAt: string
  operator: string
}

/** 变更类型：全部由系统按规则自动产生，管理端不可手工制造 */
export type PointsLogType = '增加' | '扣减' | '年度清零'

export type PointsLog = {
  id: string
  /** 积分流水 ID */
  serial: string
  nickname: string
  phone: string
  employee: string
  dept: string
  /** 变更数量，恒为正数，方向由 type 决定 */
  amount: number
  type: PointsLogType
  /** 积分变更来源，对应规则名称或系统动作 */
  source: string
  /** 变更后余额 */
  balance: number
  at: string
}

export type AnnualClearConfig = {
  enabled: boolean
  /** 清零周期固定为每年一次 */
  cycle: string
  /** 执行月份（1-12） */
  month: number
  /** 执行日期（1-31） */
  day: number
  /** 执行时刻 */
  time: string
  /** 生效范围固定为全部会员，不支持按用户选择 */
  scope: string
  /** 提前提醒天数 */
  noticeDays: number
  updatedAt: string
  operator: string
}

export type AnnualClearRecord = {
  id: string
  /** 清零年度 */
  year: number
  executedAt: string
  /** 涉及会员数 */
  members: number
  /** 清零积分总额 */
  totalPoints: number
  /** 执行方式恒为系统自动 */
  mode: string
  status: '已完成' | '执行中'
}

/* ---------------- 常量 ---------------- */

/** 每日合计上限：所有行为当日累计不超过该值 */
export const DAILY_TOTAL_CAP = 50

/** 规则不可为负分，单次积分上限用于表单校验 */
export const MAX_POINTS_PER_TIME = 1000

export const CLEAR_SCOPE = '全部会员'
export const CLEAR_CYCLE = '每年一次'
export const CLEAR_MODE = '系统自动执行'

/* ---------------- 种子数据 ---------------- */

const SEED_RULES: PointsRule[] = [
  {
    id: 'PR-01',
    sort: 1,
    name: '阅读资讯/视频',
    code: 'HYJF_YDNR',
    points: 1,
    dailyLimit: 20,
    condition: '停留时长 ≥ 10 秒，且滑动至内容底部触发',
    remark: '滑动至底部触发，同一内容仅算 1 次',
    enabled: true,
    updatedAt: '2026-08-03 09:12:40',
    operator: '孙可',
  },
  {
    id: 'PR-02',
    sort: 2,
    name: '点赞',
    code: 'HYJF_DZ',
    points: 1,
    dailyLimit: 10,
    condition: '对资讯、视听或帖子点赞成功',
    remark: '同一内容仅算 1 次，取消点赞不退回积分',
    enabled: true,
    updatedAt: '2026-08-03 09:14:02',
    operator: '孙可',
  },
  {
    id: 'PR-03',
    sort: 3,
    name: '评论（审核通过）',
    code: 'HYJF_PL',
    points: 2,
    dailyLimit: 20,
    condition: '评论字数 ≥ 10 字，且审核通过',
    remark: '违规评论不计分，已计分评论被删除不扣回',
    enabled: true,
    updatedAt: '2026-08-03 09:15:31',
    operator: '孙可',
  },
]

const SEED_LOGS: PointsLog[] = [
  {
    id: 'PL-2208',
    serial: '2208',
    nickname: '筱筱',
    phone: '13905921188',
    employee: '汪筱',
    dept: '技术中心',
    amount: 2,
    type: '增加',
    source: '评论（审核通过）',
    balance: 386,
    at: '2026-08-06 09:41:25',
  },
  {
    id: 'PL-2207',
    serial: '2207',
    nickname: '筱筱',
    phone: '13905921188',
    employee: '汪筱',
    dept: '技术中心',
    amount: 1,
    type: '增加',
    source: '阅读资讯/视频',
    balance: 384,
    at: '2026-08-06 09:33:07',
  },
  {
    id: 'PL-2206',
    serial: '2206',
    nickname: '风起东南',
    phone: '13609127436',
    employee: '陆东南',
    dept: '装备制造事业部',
    amount: 1,
    type: '增加',
    source: '点赞',
    balance: 209,
    at: '2026-08-06 09:20:55',
  },
  {
    id: 'PL-2205',
    serial: '2205',
    nickname: '风起东南',
    phone: '13609127436',
    employee: '陆东南',
    dept: '装备制造事业部',
    amount: 120,
    type: '扣减',
    source: '积分兑换（定制笔记本）',
    balance: 208,
    at: '2026-08-05 16:48:12',
  },
  {
    id: 'PL-2204',
    serial: '2204',
    nickname: '老周同学',
    phone: '15829330471',
    employee: '周敬',
    dept: '信息安全部',
    amount: 20,
    type: '增加',
    source: '阅读资讯/视频',
    balance: 512,
    at: '2026-08-05 15:02:38',
  },
  {
    id: 'PL-2203',
    serial: '2203',
    nickname: '一只鹿',
    phone: '18627340092',
    employee: '鹿鸣',
    dept: '能源互联事业部',
    amount: 2,
    type: '增加',
    source: '评论（审核通过）',
    balance: 77,
    at: '2026-08-05 11:26:19',
  },
  {
    id: 'PL-2202',
    serial: '2202',
    nickname: '一只鹿',
    phone: '18627340092',
    employee: '鹿鸣',
    dept: '能源互联事业部',
    amount: 10,
    type: '增加',
    source: '点赞',
    balance: 75,
    at: '2026-08-05 11:18:44',
  },
  {
    id: 'PL-2201',
    serial: '2201',
    nickname: '海涛',
    phone: '13512480365',
    employee: '王海涛',
    dept: '平台管理部',
    amount: 1,
    type: '增加',
    source: '阅读资讯/视频',
    balance: 431,
    at: '2026-08-04 17:55:03',
  },
  {
    id: 'PL-2200',
    serial: '2200',
    nickname: '海涛',
    phone: '13512480365',
    employee: '王海涛',
    dept: '平台管理部',
    amount: 300,
    type: '扣减',
    source: '积分兑换（保温杯）',
    balance: 430,
    at: '2026-08-04 14:31:50',
  },
  {
    id: 'PL-2199',
    serial: '2199',
    nickname: '筱筱',
    phone: '13905921188',
    employee: '汪筱',
    dept: '技术中心',
    amount: 268,
    type: '年度清零',
    source: '2025 年度积分清零',
    balance: 0,
    at: '2025-12-31 23:59:59',
  },
  {
    id: 'PL-2198',
    serial: '2198',
    nickname: '风起东南',
    phone: '13609127436',
    employee: '陆东南',
    dept: '装备制造事业部',
    amount: 143,
    type: '年度清零',
    source: '2025 年度积分清零',
    balance: 0,
    at: '2025-12-31 23:59:59',
  },
  {
    id: 'PL-2197',
    serial: '2197',
    nickname: '老周同学',
    phone: '15829330471',
    employee: '周敬',
    dept: '信息安全部',
    amount: 96,
    type: '增加',
    source: '评论（审核通过）',
    balance: 268,
    at: '2025-12-28 10:09:26',
  },
]

const SEED_CLEAR_CONFIG: AnnualClearConfig = {
  enabled: true,
  cycle: CLEAR_CYCLE,
  month: 12,
  day: 31,
  time: '23:59:59',
  scope: CLEAR_SCOPE,
  noticeDays: 15,
  updatedAt: '2026-01-06 10:22:18',
  operator: '孙可',
}

const SEED_CLEAR_RECORDS: AnnualClearRecord[] = [
  {
    id: 'AC-2025',
    year: 2025,
    executedAt: '2025-12-31 23:59:59',
    members: 4186,
    totalPoints: 512430,
    mode: CLEAR_MODE,
    status: '已完成',
  },
  {
    id: 'AC-2024',
    year: 2024,
    executedAt: '2024-12-31 23:59:59',
    members: 3902,
    totalPoints: 446175,
    mode: CLEAR_MODE,
    status: '已完成',
  },
  {
    id: 'AC-2023',
    year: 2023,
    executedAt: '2023-12-31 23:59:59',
    members: 3574,
    totalPoints: 391208,
    mode: CLEAR_MODE,
    status: '已完成',
  },
]

/* ---------------- store ---------------- */

type State = {
  rules: PointsRule[]
  logs: PointsLog[]
  clearConfig: AnnualClearConfig
  clearRecords: AnnualClearRecord[]
}

let state: State = {
  rules: SEED_RULES,
  logs: SEED_LOGS,
  clearConfig: SEED_CLEAR_CONFIG,
  clearRecords: SEED_CLEAR_RECORDS,
}

const listeners = new Set<() => void>()

function commit(next: Partial<State>) {
  state = { ...state, ...next }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function snapshot() {
  return state
}

export function usePoints(): State {
  return React.useSyncExternalStore(subscribe, snapshot, snapshot)
}

/* ---------------- 工具 ---------------- */

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function stamp(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

let seq = 40
function nextSeq() {
  seq += 1
  return seq
}

/** 手机号中间四位打码 */
export function maskPhone(phone: string) {
  return phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2')
}

export function logTypeTone(t: PointsLogType) {
  if (t === '增加') return 'success' as const
  if (t === '扣减') return 'warning' as const
  return 'neutral' as const
}

/** 带方向的积分数量展示 */
export function signedAmount(log: PointsLog) {
  return `${log.type === '增加' ? '+' : '-'}${log.amount}`
}

/** 下一次自动清零时间，仅按配置推算展示 */
export function nextClearAt(c: AnnualClearConfig, now = new Date()) {
  const thisYear = new Date(
    `${now.getFullYear()}-${pad(c.month)}-${pad(c.day)}T${c.time}`,
  )
  const year = thisYear.getTime() > now.getTime() ? now.getFullYear() : now.getFullYear() + 1
  return `${year}-${pad(c.month)}-${pad(c.day)} ${c.time}`
}

/* ---------------- 规则维护 ---------------- */

export type RuleDraft = {
  sort: number
  name: string
  code: string
  points: number
  dailyLimit: number
  condition: string
  remark: string
  enabled: boolean
}

/** 规则表单校验：仅约束配置本身，不涉及任何积分数值改写 */
export function validateRule(
  draft: RuleDraft,
  rules: PointsRule[],
  editingId?: string,
): string[] {
  const issues: string[] = []
  if (!draft.name.trim()) issues.push('积分名称为必填项')
  if (!draft.code.trim()) issues.push('积分编码为必填项')
  else if (!/^[A-Z][A-Z0-9_]*$/.test(draft.code.trim()))
    issues.push('积分编码仅支持大写字母、数字与下划线，且以字母开头')
  else if (
    rules.some((r) => r.code === draft.code.trim() && r.id !== editingId)
  )
    issues.push('积分编码已存在，请更换')

  if (!Number.isInteger(draft.points) || draft.points <= 0)
    issues.push('单次积分需为大于 0 的整数')
  else if (draft.points > MAX_POINTS_PER_TIME)
    issues.push(`单次积分不得超过 ${MAX_POINTS_PER_TIME} 分`)

  if (!Number.isInteger(draft.dailyLimit) || draft.dailyLimit === 0 || draft.dailyLimit < -1)
    issues.push('单人每日上限需为正整数，或填 -1 表示不限')
  else if (draft.dailyLimit > 0 && draft.dailyLimit < draft.points)
    issues.push('单人每日上限不得小于单次积分')
  else if (draft.dailyLimit > DAILY_TOTAL_CAP)
    issues.push(`单人每日上限不得超过每日合计上限 ${DAILY_TOTAL_CAP} 分`)

  if (!draft.condition.trim()) issues.push('计分条件为必填项')
  return issues
}

export function createRule(draft: RuleDraft, operator: string) {
  const rule: PointsRule = {
    id: `PR-${nextSeq()}`,
    sort: draft.sort,
    name: draft.name.trim(),
    code: draft.code.trim(),
    points: draft.points,
    dailyLimit: draft.dailyLimit,
    condition: draft.condition.trim(),
    remark: draft.remark.trim(),
    enabled: draft.enabled,
    updatedAt: stamp(),
    operator,
  }
  commit({ rules: [...state.rules, rule].sort((a, b) => a.sort - b.sort) })
  return rule
}

export function updateRule(id: string, draft: RuleDraft, operator: string) {
  commit({
    rules: state.rules
      .map((r) =>
        r.id === id
          ? {
              ...r,
              sort: draft.sort,
              name: draft.name.trim(),
              code: draft.code.trim(),
              points: draft.points,
              dailyLimit: draft.dailyLimit,
              condition: draft.condition.trim(),
              remark: draft.remark.trim(),
              enabled: draft.enabled,
              updatedAt: stamp(),
              operator,
            }
          : r,
      )
      .sort((a, b) => a.sort - b.sort),
  })
}

export function toggleRules(ids: string[], enabled: boolean, operator: string) {
  const hit = state.rules.filter((r) => ids.includes(r.id))
  commit({
    rules: state.rules.map((r) =>
      ids.includes(r.id) ? { ...r, enabled, updatedAt: stamp(), operator } : r,
    ),
  })
  return hit
}

/** 删除规则只停止此后计分，历史流水不受影响 */
export function removeRules(ids: string[]) {
  const hit = state.rules.filter((r) => ids.includes(r.id))
  commit({ rules: state.rules.filter((r) => !ids.includes(r.id)) })
  return hit
}

/* ---------------- 年度清零配置 ---------------- */

export type ClearDraft = {
  enabled: boolean
  month: number
  day: number
  time: string
  noticeDays: number
}

export function validateClearConfig(draft: ClearDraft): string[] {
  const issues: string[] = []
  if (!Number.isInteger(draft.month) || draft.month < 1 || draft.month > 12)
    issues.push('清零月份需为 1-12 之间的整数')
  if (!Number.isInteger(draft.day) || draft.day < 1 || draft.day > 31)
    issues.push('清零日期需为 1-31 之间的整数')
  if (!/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(draft.time))
    issues.push('执行时刻格式需为 HH:mm:ss')
  if (!Number.isInteger(draft.noticeDays) || draft.noticeDays < 0 || draft.noticeDays > 90)
    issues.push('提前提醒天数需为 0-90 之间的整数')
  return issues
}

/** 仅保存下一次自动执行的配置，不触发任何即时清零 */
export function saveClearConfig(draft: ClearDraft, operator: string) {
  commit({
    clearConfig: {
      ...state.clearConfig,
      enabled: draft.enabled,
      month: draft.month,
      day: draft.day,
      time: draft.time,
      noticeDays: draft.noticeDays,
      updatedAt: stamp(),
      operator,
    },
  })
}
