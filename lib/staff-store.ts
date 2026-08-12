'use client'

/**
 * 员工管理（部门发布账号）原型数据与状态。
 *
 * 业务基线（务必保持）：
 * - 员工主数据来自用友 NC，本系统只读、不可手工新增或修改员工本身。
 *   这里维护的是「部门发布账号」——用于部门在 APP 端登录并发布信息的员工编号，
 *   属于本平台自建的发布授权，不回写 NC。
 * - 编号允许手工录入（含 NC 中不存在的部门公用编号），因此编号唯一性由本表自己保证。
 * - 持有该授权的编号在 APP 发布内容时，会在署名上附带部门信息（部门 + 公司）。
 * - 只维护授权名单本身，不细分可发布的内容类型。
 * - 停用后立即失去 APP 发布资格，但历史已发布内容的署名保持不变。
 */

import * as React from 'react'

/* ---------------- 类型 ---------------- */

/** 授权状态：停用后不能登录 APP 发布，但不影响历史内容 */
export type PublisherStatus = '启用' | '停用'

export type DeptPublisher = {
  id: string
  /** 员工编号：APP 登录account，手工录入，全表唯一 */
  code: string
  /** 发布人显示名称，APP 署名中的名字部分 */
  name: string
  company: string
  dept: string
  status: PublisherStatus
  /** 联系电话，便于停用前核实 */
  phone: string
  remark: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export const PUBLISHER_STATUSES: PublisherStatus[] = ['启用', '停用']

/** 可授权的公司清单，与员工主数据口径一致 */
export const COMPANIES = ['陕鼓集团', '陕鼓动力', '陕鼓能源', '陕鼓智能']

/** 可授权的部门清单，按公司归集 */
export const DEPTS_BY_COMPANY: Record<string, string[]> = {
  陕鼓集团: [
    '党群工作部',
    '工会办公室',
    '人力资源部',
    '信息管理部',
    '平台管理部',
    '信息安全部',
  ],
  陕鼓动力: ['技术中心', '能源互联事业部', '装备制造事业部', '离退休服务中心'],
  陕鼓能源: ['运维服务中心', '项目管理部'],
  陕鼓智能: ['研发一部', '研发二部'],
}

/** 全部部门（用于筛选下拉） */
export const ALL_DEPTS = Array.from(
  new Set(Object.values(DEPTS_BY_COMPANY).flat()),
)

export function statusTone(s: PublisherStatus) {
  return s === '启用' ? 'success' : 'neutral'
}

/**
 * APP 端署名：部门发布账号发布内容时附带的部门信息。
 * 例如「党群工作部 · 陕鼓集团」，APP 会展示为发布者所属部门。
 */
export function deptSignature(p: Pick<DeptPublisher, 'company' | 'dept'>) {
  return `${p.dept} · ${p.company}`
}

/* ---------------- 种子数据 ---------------- */

const SEED_PUBLISHERS: DeptPublisher[] = [
  {
    id: 'DP-01',
    code: 'BM-DQ001',
    name: '党群工作部',
    company: '陕鼓集团',
    dept: '党群工作部',
    status: '启用',
    phone: '029-8813 2001',
    remark: '党建与企业文化类信息发布',
    createdBy: '张亦驰',
    createdAt: '2025-09-12 09:20:00',
    updatedAt: '2025-09-12 09:20:00',
  },
  {
    id: 'DP-02',
    code: 'BM-GH001',
    name: '工会办公室',
    company: '陕鼓集团',
    dept: '工会办公室',
    status: '启用',
    phone: '029-8813 2015',
    remark: '职工活动、福利与慰问信息发布',
    createdBy: '张亦驰',
    createdAt: '2025-09-12 09:26:00',
    updatedAt: '2025-10-08 14:12:00',
  },
  {
    id: 'DP-03',
    code: 'BM-HR001',
    name: '人力资源部',
    company: '陕鼓集团',
    dept: '人力资源部',
    status: '启用',
    phone: '029-8813 2088',
    remark: '招聘、培训与制度类通知发布',
    createdBy: '王海涛',
    createdAt: '2025-09-20 10:05:00',
    updatedAt: '2025-09-20 10:05:00',
  },
  {
    id: 'DP-04',
    code: 'BM-XX001',
    name: '信息管理部',
    company: '陕鼓集团',
    dept: '信息管理部',
    status: '启用',
    phone: '029-8813 2130',
    remark: '系统停机、运维公告类信息发布',
    createdBy: '周敬',
    createdAt: '2025-09-25 16:40:00',
    updatedAt: '2025-09-25 16:40:00',
  },
  {
    id: 'DP-05',
    code: 'SG10189',
    name: '周敬',
    company: '陕鼓集团',
    dept: '信息安全部',
    status: '启用',
    phone: '138 0913 2288',
    remark: '以本人工号授权，发布安全通报',
    createdBy: '张亦驰',
    createdAt: '2025-10-11 08:50:00',
    updatedAt: '2025-10-11 08:50:00',
  },
  {
    id: 'DP-06',
    code: 'BM-JS001',
    name: '技术中心',
    company: '陕鼓动力',
    dept: '技术中心',
    status: '启用',
    phone: '029-8813 3306',
    remark: '技术攻关与成果类信息发布',
    createdBy: '王海涛',
    createdAt: '2025-10-15 11:15:00',
    updatedAt: '2025-10-15 11:15:00',
  },
  {
    id: 'DP-07',
    code: 'BM-NY001',
    name: '能源互联事业部',
    company: '陕鼓动力',
    dept: '能源互联事业部',
    status: '启用',
    phone: '029-8813 3412',
    remark: '项目进展与现场动态发布',
    createdBy: '王海涛',
    createdAt: '2025-10-20 15:30:00',
    updatedAt: '2025-11-03 09:44:00',
  },
  {
    id: 'DP-08',
    code: 'BM-TX001',
    name: '离退休服务中心',
    company: '陕鼓动力',
    dept: '离退休服务中心',
    status: '启用',
    phone: '029-8813 3520',
    remark: '面向退休员工的关怀与活动通知',
    createdBy: '张亦驰',
    createdAt: '2025-10-28 09:10:00',
    updatedAt: '2025-10-28 09:10:00',
  },
  {
    id: 'DP-09',
    code: 'BM-YW001',
    name: '运维服务中心',
    company: '陕鼓能源',
    dept: '运维服务中心',
    status: '停用',
    phone: '029-8813 4180',
    remark: '部门职能调整，暂停发布权限',
    createdBy: '周敬',
    createdAt: '2025-09-30 13:20:00',
    updatedAt: '2025-11-18 10:05:00',
  },
  {
    id: 'DP-10',
    code: 'BM-YF002',
    name: '研发二部',
    company: '陕鼓智能',
    dept: '研发二部',
    status: '停用',
    phone: '029-8813 4602',
    remark: '编号录入有误，已停用待重建',
    createdBy: '王海涛',
    createdAt: '2025-11-05 17:02:00',
    updatedAt: '2025-11-22 16:30:00',
  },
]

/* ---------------- store ---------------- */

type State = {
  publishers: DeptPublisher[]
}

let state: State = { publishers: SEED_PUBLISHERS }

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

export function useStaff(): State {
  return React.useSyncExternalStore(subscribe, snapshot, snapshot)
}

/* ---------------- 工具 ---------------- */

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function stamp(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

let seq = SEED_PUBLISHERS.length

function nextId() {
  seq += 1
  return `DP-${pad(seq)}`
}

/**
 * 按员工编号查询启用中的部门发布授权。
 * APP 发布内容时用它决定是否附带部门署名。
 */
export function findPublisherByCode(code: string) {
  const hit = state.publishers.find((p) => p.code === code.trim())
  return hit && hit.status === '启用' ? hit : null
}

/* ---------------- 表单 ---------------- */

export type PublisherDraft = {
  code: string
  name: string
  company: string
  dept: string
  status: PublisherStatus
  phone: string
  remark: string
}

export const EMPTY_PUBLISHER_DRAFT: PublisherDraft = {
  code: '',
  name: '',
  company: '陕鼓集团',
  dept: '党群工作部',
  status: '启用',
  phone: '',
  remark: '',
}

/** 编号格式：大写字母、数字与短横线，2-20 位 */
const CODE_PATTERN = /^[A-Z0-9-]{2,20}$/

/**
 * 校验部门发布账号。editingId 用于编辑时排除自身，避免误判编号重复。
 */
export function validatePublisher(draft: PublisherDraft, editingId?: string) {
  const issues: string[] = []
  const code = draft.code.trim().toUpperCase()

  if (!code) issues.push('请填写员工编号')
  else if (!CODE_PATTERN.test(code))
    issues.push('员工编号仅支持大写字母、数字与短横线，长度 2-20 位')
  else if (
    state.publishers.some((p) => p.code === code && p.id !== editingId)
  )
    issues.push(`员工编号 ${code} 已存在，不能重复授权`)

  if (!draft.name.trim()) issues.push('请填写发布人名称')
  if (!draft.company) issues.push('请选择所属公司')
  if (!draft.dept) issues.push('请选择所属部门')
  else if (!(DEPTS_BY_COMPANY[draft.company] ?? []).includes(draft.dept))
    issues.push(`${draft.dept} 不属于 ${draft.company}，请重新选择部门`)

  return issues
}

export function createPublisher(draft: PublisherDraft, operator: string) {
  const issues = validatePublisher(draft)
  if (issues.length > 0) return { ok: false as const, message: issues[0] }

  const now = stamp()
  const row: DeptPublisher = {
    id: nextId(),
    code: draft.code.trim().toUpperCase(),
    name: draft.name.trim(),
    company: draft.company,
    dept: draft.dept,
    status: draft.status,
    phone: draft.phone.trim(),
    remark: draft.remark.trim(),
    createdBy: operator,
    createdAt: now,
    updatedAt: now,
  }
  commit({ publishers: [row, ...state.publishers] })
  return {
    ok: true as const,
    message: `已授权 ${row.code}，APP 发布将署名「${deptSignature(row)}」`,
  }
}

export function updatePublisher(id: string, draft: PublisherDraft) {
  const issues = validatePublisher(draft, id)
  if (issues.length > 0) return { ok: false as const, message: issues[0] }

  commit({
    publishers: state.publishers.map((p) =>
      p.id === id
        ? {
            ...p,
            code: draft.code.trim().toUpperCase(),
            name: draft.name.trim(),
            company: draft.company,
            dept: draft.dept,
            status: draft.status,
            phone: draft.phone.trim(),
            remark: draft.remark.trim(),
            updatedAt: stamp(),
          }
        : p,
    ),
  })
  return { ok: true as const, message: '部门发布账号已保存' }
}

/** 启用/停用：停用后立即失去 APP 发布资格，历史内容署名不变 */
export function togglePublishers(ids: string[], status: PublisherStatus) {
  if (ids.length === 0)
    return { ok: false as const, message: '请先选择要操作的记录' }

  const now = stamp()
  commit({
    publishers: state.publishers.map((p) =>
      ids.includes(p.id) ? { ...p, status, updatedAt: now } : p,
    ),
  })
  return {
    ok: true as const,
    message:
      status === '停用'
        ? `已停用 ${ids.length} 个账号，其 APP 发布权限立即失效`
        : `已启用 ${ids.length} 个账号`,
  }
}

/** 删除授权：仅移除发布资格，不影响 NC 员工主数据与历史内容 */
export function removePublishers(ids: string[]) {
  if (ids.length === 0)
    return { ok: false as const, message: '请先选择要删除的记录' }

  commit({
    publishers: state.publishers.filter((p) => !ids.includes(p.id)),
  })
  return {
    ok: true as const,
    message: `已删除 ${ids.length} 个部门发布账号，历史已发布内容不受影响`,
  }
}
