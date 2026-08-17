'use client'

/**
 * 员工管理原型数据与状态。
 *
 * 业务基线（务必保持）：
 * - 员工主数据来自用友 NC。来源为「NC同步」的员工在本系统只读，
 *   不允许修改任何信息，只允许启用/停用与重置登录密码。
 * - 来源为「系统新建」的是本平台自建的部门发布账号：用于部门在 APP 端
 *   登录并发布信息，可以编辑、启用/停用、重置密码与删除，不回写 NC。
 * - 工号唯一性由本表统一保证（系统新建的编号不能与 NC 同步工号冲突）。
 * - 系统新建员工在 APP 发布内容时，署名会附带部门信息（部门 + 公司）。
 * - 停用后立即失去 APP 登录与发布资格，但历史已发布内容的署名保持不变。
 */

import * as React from 'react'

/* ---------------- 类型 ---------------- */

/**
 * 员工状态：任职状态，随用友 NC 主数据变化。
 * 系统新建的部门发布账号统一视为「在职」。
 */
export type EmployeeStatus = '在职' | '退休' | '离职'

/** 账号状态：本平台的登录开关，停用后不能登录 APP，但不影响历史内容 */
export type AccountStatus = '启用' | '停用'

/** 数据来源：决定该行是否可编辑 */
export type StaffSource = 'NC同步' | '系统新建'

export type Staff = {
  id: string
  /** 员工工号，APP 登录账号，全表唯一 */
  code: string
  /** 员工姓名 */
  name: string
  /** 昵称，APP 内展示名 */
  nickname: string
  company: string
  dept: string
  /** 岗位 */
  position: string
  /** 员工状态：在职 / 退休 / 离职 */
  employeeStatus: EmployeeStatus
  /** 账号状态：启用 / 停用 */
  accountStatus: AccountStatus
  source: StaffSource
  /** 同步时间：仅 NC同步 有值，系统新建为空 */
  syncedAt: string
  /** 创建时间 */
  createdAt: string
  remark: string
  createdBy: string
  /** 最近一次重置登录密码的时间，未重置过为空 */
  passwordResetAt: string
}

export const EMPLOYEE_STATUSES: EmployeeStatus[] = ['在职', '退休', '离职']
export const ACCOUNT_STATUSES: AccountStatus[] = ['启用', '停用']
export const STAFF_SOURCES: StaffSource[] = ['NC同步', '系统新建']

/** 系统新建部门发布账号的默认岗位 */
export const DEPT_PUBLISHER_POSITION = '部门发布号'

/** 可选公司清单，与员工主数据口径一致 */
export const COMPANIES = ['陕鼓集团', '陕鼓动力', '陕鼓能源', '陕鼓智能']

/** 可选部门清单，按公司归集 */
export const DEPTS_BY_COMPANY: Record<string, string[]> = {
  陕鼓集团: [
    '党群工作部',
    '工会办公室',
    '人力资源部',
    '信息管理部',
    '平台管理部',
    '信息安全部',
    '离退休服务中心',
  ],
  陕鼓动力: [
    '技术中心',
    '能源互联事业部',
    '装备制造事业部',
    '离退休服务中心',
  ],
  陕鼓能源: ['运维服务中心', '项目管理部', '离退休服务中心'],
  陕鼓智能: ['研发一部', '研发二部'],
}

/** 全部部门（用于筛选下拉） */
export const ALL_DEPTS = Array.from(new Set(Object.values(DEPTS_BY_COMPANY).flat()))

export function employeeStatusTone(s: EmployeeStatus) {
  if (s === '在职') return 'success'
  return s === '退休' ? 'info' : 'warning'
}

export function accountStatusTone(s: AccountStatus) {
  return s === '启用' ? 'success' : 'neutral'
}

export function sourceTone(s: StaffSource) {
  return s === 'NC同步' ? 'neutral' : 'info'
}

/** NC 同步的员工在本系统只读，不允许修改信息 */
export function isEditable(s: Staff) {
  return s.source === '系统新建'
}

/**
 * APP 端署名：系统新建的部门账号发布内容时附带的部门信息。
 * 例如「党群工作部 · 陕鼓集团」。
 */
export function deptSignature(s: Pick<Staff, 'company' | 'dept'>) {
  return `${s.dept} · ${s.company}`
}

/* ---------------- 种子数据 ---------------- */

/** NC 同步样本：工号与姓名沿用员工名册口径，保持全系统一致 */
const SYNCED: Staff[] = [
  ['SG10023', '汪筱', '陕鼓动力', '技术中心', '主任工程师', '在职', '启用'],
  ['SG10057', '鹿鸣', '陕鼓动力', '能源互联事业部', '项目经理', '在职', '启用'],
  ['SG10112', '陆东南', '陕鼓动力', '装备制造事业部', '工艺工程师', '在职', '启用'],
  ['SG10189', '周敬', '陕鼓集团', '信息安全部', '安全管理员', '在职', '启用'],
  ['SG10204', '孙可', '陕鼓集团', '平台管理部', '平台运营专员', '在职', '启用'],
  ['SG10238', '王海涛', '陕鼓集团', '平台管理部', '部门副经理', '在职', '启用'],
  ['SG10341', '李鸣泉', '陕鼓能源', '运维服务中心', '运维工程师', '在职', '启用'],
  ['SG10455', '钱思远', '陕鼓智能', '研发一部', '算法工程师', '在职', '启用'],
  ['SG10402', '赵越', '陕鼓能源', '项目管理部', '项目专员', '离职', '停用'],
  ['SG10488', '许沐', '陕鼓智能', '研发二部', '软件工程师', '离职', '停用'],
  ['SG09012', '何长庚', '陕鼓动力', '离退休服务中心', '退休职工', '退休', '启用'],
  ['SG09044', '范秀英', '陕鼓动力', '离退休服务中心', '退休职工', '退休', '启用'],
  ['SG09077', '邓怀安', '陕鼓集团', '离退休服务中心', '退休职工', '退休', '启用'],
  ['SG09103', '柳文彬', '陕鼓集团', '离退休服务中心', '退休职工', '退休', '停用'],
  ['SG09156', '梁玉兰', '陕鼓能源', '离退休服务中心', '退休职工', '退休', '启用'],
].map((r, i) => {
  const [code, name, company, dept, position, employeeStatus, accountStatus] = r as [
    string,
    string,
    string,
    string,
    string,
    EmployeeStatus,
    AccountStatus,
  ]
  return {
    id: `NC-${String(i + 1).padStart(2, '0')}`,
    code,
    name,
    // NC 同步员工的昵称由本人在 APP 端设置，未设置时留空
    nickname: i % 3 === 0 ? name : '',
    company,
    dept,
    position,
    employeeStatus,
    accountStatus,
    source: 'NC同步' as StaffSource,
    syncedAt: '2025-12-01 02:00:00',
    createdAt: '2025-08-01 02:00:00',
    remark: '',
    createdBy: '用友 NC',
    passwordResetAt: '',
  }
})

/** 系统新建样本：部门发布账号，姓名与昵称默认取部门名称 */
const CUSTOM: Staff[] = [
  ['BM-DQ001', '党群工作部', '陕鼓集团', '党建与企业文化类信息发布', '张亦驰', '2025-09-12 09:20:00', '启用'],
  ['BM-GH001', '工会办公室', '陕鼓集团', '职工活动、福利与慰问信息发布', '张亦驰', '2025-09-12 09:26:00', '启用'],
  ['BM-HR001', '人力资源部', '陕鼓集团', '招聘、培训与制度类通知发布', '王海涛', '2025-09-20 10:05:00', '启用'],
  ['BM-XX001', '信息管理部', '陕鼓集团', '系统停机、运维公告类信息发布', '周敬', '2025-09-25 16:40:00', '启用'],
  ['BM-JS001', '技术中心', '陕鼓动力', '技术攻关与成果类信息发布', '王海涛', '2025-10-15 11:15:00', '启用'],
  ['BM-NY001', '能源互联事业部', '陕鼓动力', '项目进展与现场动态发布', '王海涛', '2025-10-20 15:30:00', '启用'],
  ['BM-TX001', '离退休服务中心', '陕鼓动力', '面向退休员工的关怀与活动通知', '张亦驰', '2025-10-28 09:10:00', '启用'],
  ['BM-YW001', '运维服务中心', '陕鼓能源', '部门职能调整，暂停发布权限', '周敬', '2025-09-30 13:20:00', '停用'],
  ['BM-YF002', '研发二部', '陕鼓智能', '编号录入有误，已停用待重建', '王海涛', '2025-11-05 17:02:00', '停用'],
].map((r, i) => {
  const [code, dept, company, remark, createdBy, createdAt, accountStatus] = r as [
    string,
    string,
    string,
    string,
    string,
    string,
    AccountStatus,
  ]
  return {
    id: `SYS-${String(i + 1).padStart(2, '0')}`,
    code,
    // 部门发布账号的姓名与昵称默认等于部门名称
    name: dept,
    nickname: dept,
    company,
    dept,
    position: DEPT_PUBLISHER_POSITION,
    // 部门发布账号不是自然人，任职状态统一视为在职
    employeeStatus: '在职' as EmployeeStatus,
    accountStatus,
    source: '系统新建' as StaffSource,
    syncedAt: '',
    createdAt,
    remark,
    createdBy,
    passwordResetAt: '',
  }
})

const SEED_STAFF: Staff[] = [...CUSTOM, ...SYNCED]

/* ---------------- store ---------------- */

type State = { staff: Staff[] }

let state: State = { staff: SEED_STAFF }

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

let seq = CUSTOM.length

function nextId() {
  seq += 1
  return `SYS-${pad(seq)}`
}

/**
 * 按工号查询启用中的系统新建部门账号。
 * APP 发布内容时用它决定是否附带部门署名。
 */
export function findDeptPublisherByCode(code: string) {
  const hit = state.staff.find((s) => s.code === code.trim())
  return hit && hit.source === '系统新建' && hit.accountStatus === '启用' ? hit : null
}

/* ---------------- 表单 ---------------- */

export type StaffDraft = {
  code: string
  name: string
  nickname: string
  company: string
  dept: string
  position: string
  employeeStatus: EmployeeStatus
  accountStatus: AccountStatus
  remark: string
}

export const EMPTY_STAFF_DRAFT: StaffDraft = {
  code: '',
  // 姓名与昵称默认取部门名称，与默认部门保持一致
  name: '党群工作部',
  nickname: '党群工作部',
  company: '陕鼓集团',
  dept: '党群工作部',
  position: DEPT_PUBLISHER_POSITION,
  employeeStatus: '在职',
  accountStatus: '启用',
  remark: '',
}

/** 工号格式：大写字母、数字与短横线，2-20 位 */
const CODE_PATTERN = /^[A-Z0-9-]{2,20}$/

/**
 * 校验系统新建员工。editingId 用于编辑时排除自身，避免误判工号重复。
 */
export function validateStaff(draft: StaffDraft, editingId?: string) {
  const issues: string[] = []
  const code = draft.code.trim().toUpperCase()

  if (!code) issues.push('请填写员工工号')
  else if (!CODE_PATTERN.test(code))
    issues.push('员工工号仅支持大写字母、数字与短横线，长度 2-20 位')
  else if (state.staff.some((s) => s.code === code && s.id !== editingId))
    issues.push(`员工工号 ${code} 已存在，不能重复`)

  if (!draft.name.trim()) issues.push('请填写员工姓名')
  if (!draft.nickname.trim()) issues.push('请填写昵称')
  if (!draft.position.trim()) issues.push('请填写岗位')
  if (!draft.company) issues.push('请选择公司')
  if (!draft.dept) issues.push('请选择部门')
  else if (!(DEPTS_BY_COMPANY[draft.company] ?? []).includes(draft.dept))
    issues.push(`${draft.dept} 不属于 ${draft.company}，请重新选择部门`)

  return issues
}

export function createStaff(draft: StaffDraft, operator: string) {
  const issues = validateStaff(draft)
  if (issues.length > 0) return { ok: false as const, message: issues[0] }

  const row: Staff = {
    id: nextId(),
    code: draft.code.trim().toUpperCase(),
    name: draft.name.trim(),
    nickname: draft.nickname.trim(),
    company: draft.company,
    dept: draft.dept,
    position: draft.position.trim(),
    employeeStatus: draft.employeeStatus,
    accountStatus: draft.accountStatus,
    source: '系统新建',
    syncedAt: '',
    createdAt: stamp(),
    remark: draft.remark.trim(),
    createdBy: operator,
    passwordResetAt: '',
  }
  commit({ staff: [row, ...state.staff] })
  return {
    ok: true as const,
    message: `已新增 ${row.code}，APP 发布将署名「${deptSignature(row)}」`,
  }
}

export function updateStaff(id: string, draft: StaffDraft) {
  const target = state.staff.find((s) => s.id === id)
  if (!target) return { ok: false as const, message: '记录不存在' }
  // NC 同步员工只读，任何修改请求都直接拒绝
  if (!isEditable(target))
    return { ok: false as const, message: 'NC 同步的员工不允许修改信息' }

  const issues = validateStaff(draft, id)
  if (issues.length > 0) return { ok: false as const, message: issues[0] }

  commit({
    staff: state.staff.map((s) =>
      s.id === id
        ? {
            ...s,
            code: draft.code.trim().toUpperCase(),
            name: draft.name.trim(),
            nickname: draft.nickname.trim(),
            company: draft.company,
            dept: draft.dept,
            position: draft.position.trim(),
            employeeStatus: draft.employeeStatus,
            accountStatus: draft.accountStatus,
            remark: draft.remark.trim(),
          }
        : s,
    ),
  })
  return { ok: true as const, message: '员工信息已保存' }
}

/** 启用/停用账号：两种来源都允许，停用后立即失去 APP 登录资格 */
export function toggleStaff(ids: string[], accountStatus: AccountStatus) {
  if (ids.length === 0) return { ok: false as const, message: '请先选择要操作的记录' }

  commit({
    staff: state.staff.map((s) => (ids.includes(s.id) ? { ...s, accountStatus } : s)),
  })
  return {
    ok: true as const,
    message:
      accountStatus === '停用'
        ? `已停用 ${ids.length} 名员工，其 APP 登录权限立即失效`
        : `已启用 ${ids.length} 名员工`,
  }
}

/** 原型下的初始密码规则：工号后 6 位，首次登录需修改 */
export function initialPassword(code: string) {
  return `Sg@${code.replace(/-/g, '').slice(-6)}`
}

/** 重置登录密码：两种来源都允许，仅重置本平台密码，不回写 NC */
export function resetStaffPassword(id: string) {
  const target = state.staff.find((s) => s.id === id)
  if (!target) return { ok: false as const, message: '记录不存在' }

  commit({
    staff: state.staff.map((s) =>
      s.id === id ? { ...s, passwordResetAt: stamp() } : s,
    ),
  })
  return {
    ok: true as const,
    message: `已重置 ${target.code} 的登录密码`,
    password: initialPassword(target.code),
  }
}

/** 删除：仅允许删除系统新建的员工，NC 同步数据不可删除 */
export function removeStaff(ids: string[]) {
  if (ids.length === 0) return { ok: false as const, message: '请先选择要删除的记录' }

  const blocked = state.staff.filter((s) => ids.includes(s.id) && !isEditable(s))
  if (blocked.length > 0)
    return {
      ok: false as const,
      message: `所选记录中有 ${blocked.length} 条来自 NC 同步，不允许删除`,
    }

  commit({ staff: state.staff.filter((s) => !ids.includes(s.id)) })
  return {
    ok: true as const,
    message: `已删除 ${ids.length} 名系统新建员工，历史已发布内容不受影响`,
  }
}
