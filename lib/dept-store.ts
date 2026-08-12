'use client'

import * as React from 'react'

/**
 * 部门管理数据源。
 *
 * 组织主数据来自用友 NC，本系统只读：
 * - 名称、编码、上级组织不允许在本平台修改；
 * - 「是否使用」「显示排序」属于本平台的展示配置，两种来源都可维护。
 */

/** 数据来源：NC 同步 或 本平台新建 */
export type DeptSource = 'NC同步' | '系统新建'

/** 节点类型：组织（公司）或部门 */
export type DeptKind = '公司' | '部门'

export type Dept = {
  id: string
  /** NC 组织编码 */
  code: string
  name: string
  kind: DeptKind
  /** 上级节点 id，根节点为 null */
  parentId: string | null
  /** 是否在 APP 端投入使用 */
  used: boolean
  /** 显示排序，未设置为空 */
  order: number | null
  source: DeptSource
  /** 负责人，NC 未同步时为空 */
  owner: string
  syncedAt: string
  createdAt: string
}

export const DEPT_KINDS: DeptKind[] = ['公司', '部门']
export const DEPT_SOURCES: DeptSource[] = ['NC同步', '系统新建']
export const USED_LABELS = ['已使用', '未使用'] as const

export function sourceTone(s: DeptSource) {
  return s === 'NC同步' ? 'neutral' : 'info'
}

export function usedTone(used: boolean) {
  return used ? 'success' : 'neutral'
}

/** NC 同步的组织主数据在本系统只读 */
export function isNameEditable(d: Dept) {
  return d.source === '系统新建'
}

/* ---------------- 种子数据：按 NC 组织树录入 ---------------- */

const SYNC_STAMP = '2026-08-11 03:10:22'

/** [编码, 名称, 上级编码, 节点类型, 是否使用, 负责人] */
type Row = [string, string, string | null, DeptKind, boolean, string]

const NC_ROWS: Row[] = [
  // 集团本部
  ['00', '陕西鼓风机（集团）有限公司集团本部', null, '公司', true, '李宏安'],
  ['00B001', '公司办公室', '00', '部门', true, '范磊'],
  ['00B002', '战略规划部', '00', '部门', true, '陈晓辉'],
  ['00B047', '集团纪委', '00', '部门', true, '刘振国'],
  ['00B038', '党群工作部', '00', '部门', true, '王海涛'],
  ['00B004', '人力资源部', '00', '部门', true, '张亚楠'],
  ['00B006', '品牌文化部', '00', '部门', true, '孙可'],
  ['00B037', '培训中心', '00', '部门', true, '杨帆'],
  ['00B005', '财务部', '00', '部门', true, '赵敏'],
  ['00B009', '合规风控部', '00', '部门', true, '周敬'],
  ['00B032', '金融方案中心', '00', '部门', true, '吴钧'],
  ['00B035', '集团资金中心', '00', '部门', true, '钱立'],
  ['00B003', '集团工会', '00', '部门', true, '郑丽'],
  ['00B011', '市场协同部', '00', '部门', true, '马骁'],
  ['00B013', '安全管理部', '00', '部门', true, '高峰'],
  ['00B014', '投资管理部', '00', '部门', true, '徐磊'],
  ['00B040', '董事监事办公室', '00', '部门', true, '何嘉'],
  ['00B048', '产业研究中心', '00', '部门', true, '罗宇'],
  ['00B049', '系统方案中心', '00', '部门', true, '袁翔'],
  ['00B050', '科研管理中心', '00', '部门', true, '侯瑞'],
  ['00B023', '改制办公室', '00', '部门', false, ''],
  ['00B041', '固定资产管理部', '00', '部门', true, '崔浩'],
  ['00B043', '成本工程部', '00', '部门', true, '邵鹏'],
  ['00B034', '数字科技部', '00', '部门', true, '汪筱'],
  ['00B025', '工研院办公室', '00', '部门', true, '沈括'],
  ['00B026', '工研院研发中心', '00', '部门', true, '钱思远'],
  ['00B031', '工研院系统方案中心', '00', '部门', true, '柏原'],
  ['00B033', '工研院社团管理部', '00', '部门', false, ''],
  ['00B027', '综合能源事业部', '00', '部门', true, '鹿鸣'],
  ['00B028', '采购事业部', '00', '部门', true, '章明'],
  ['00B008', '质量管理部', '00', '部门', true, '陆东南'],

  // 陕鼓动力及其下属组织
  ['01', '西安陕鼓动力股份有限公司', null, '公司', true, '陈党民'],
  ['0101', '西安陕鼓通风设备有限公司', '01', '公司', true, '牛春林'],
  ['0103', '西安陕鼓数智化技术有限公司（原工程公司）', '01', '公司', true, '寇伟'],
  ['010302', '西安陕鼓数智化技术有限公司', '0103', '公司', true, '田磊'],
  ['0104', '西安陕鼓汽轮机有限公司', '01', '公司', true, '姚宏伟'],
  ['0104B01', '试制一车间', '0104', '部门', true, '雷军平'],
  ['0104B02', '物流管理科', '0104', '部门', true, '苏文'],
  ['0104B03', '工艺技术一室', '0104', '部门', true, '任杰'],
  ['0104B04', '技术中心', '0104', '部门', true, '汪筱'],
  ['0104B0401', '技术室', '0104B04', '部门', true, '简一鸣'],
  ['0104B0402', '轮边设计二室', '0104B04', '部门', true, '于振'],
  ['0104B0403', '仿真应用室', '0104B04', '部门', false, ''],
  ['0104B05', '智能制造室', '0104', '部门', true, '费翔'],
  ['0104B06', '智能制造与设备管理部', '0104', '部门', false, ''],
  ['0106', '西安陕鼓动力股份有限公司工程技术分公司', '01', '公司', true, '孟辉'],
  ['0107', '西安陕鼓动力股份有限公司节能环保技术分公司', '01', '公司', true, '常磊'],
  ['0108', '陕鼓动力（香港）有限公司', '01', '公司', true, '林嘉'],
  ['0110', '陕鼓动力（印尼）有限责任公司', '01', '公司', false, ''],

  // 秦风气体及其下属公司
  ['0111', '陕西秦风气体股份有限公司', '01', '公司', true, '刘杰'],
  ['011101', '扬州秦风气体有限公司', '0111', '公司', true, '顾成'],
  ['011102', '唐山陕鼓气体有限公司', '0111', '公司', true, '邢磊'],
  ['011103', '徐州陕鼓工业气体有限公司', '0111', '公司', true, '朱刚'],
  ['011104', '准格尔旗鼎承气体有限责任公司', '0111', '公司', true, '白宇'],
  ['011105', '石家庄陕鼓气体有限公司', '0111', '公司', true, '安平'],
  ['011106', '渭南陕鼓气体有限公司', '0111', '公司', true, '雷鸣'],
  ['011107', '开封陕鼓气体有限公司', '0111', '公司', true, '穆青'],
  ['011108', '章丘秦风气体有限公司', '0111', '公司', true, '曹俊'],
  ['011109', '铜陵秦风气体有限公司', '0111', '公司', true, '倪坤'],
  ['011110', '六安秦风气体有限公司', '0111', '公司', true, '严成'],
  ['011111', '唐山秦风气体有限公司', '0111', '公司', true, '孔亮'],
  ['011112', '赤峰秦风气体有限公司', '0111', '公司', true, '巴特'],
  ['011113', '呼和浩特秦风气体有限公司', '0111', '公司', true, '乌恩'],
  ['011114', '晋城秦风气体有限公司', '0111', '公司', true, '路遥'],
  ['011115', '临汾陕鼓气体有限公司', '0111', '公司', true, '尉迟明'],
  ['011116', '龙岩秦风气体有限公司', '0111', '公司', true, '陈榕'],
  ['011117', '哈密秦风气体有限公司', '0111', '公司', false, ''],
  ['011118', '扬州秦风特气新材料有限公司', '0111', '公司', true, '梅松'],
  ['011119', '凌源秦风气体有限公司', '0111', '公司', false, ''],
  ['011120', '漳平秦风气体有限公司', '0111', '公司', true, '廖凡'],
]

/** NC 同步节点的显示排序：由平台配置，默认留空 */
const NC_ORDER: Record<string, number> = {
  '00B001': 2,
  '00B002': 3,
  '00B038': 4,
  '00B004': 5,
  '00B006': 6,
}

const SYNCED: Dept[] = NC_ROWS.map(([code, name, parentId, kind, used, owner]) => ({
  id: code,
  code,
  name,
  kind,
  parentId,
  used,
  order: NC_ORDER[code] ?? null,
  source: 'NC同步' as DeptSource,
  owner,
  syncedAt: SYNC_STAMP,
  createdAt: SYNC_STAMP,
}))

/** 本平台新建的部门：用于 APP 端的发布口径，不回写 NC */
const CUSTOM: Dept[] = [
  {
    id: 'LOCAL-01',
    code: 'LOCAL-01',
    name: '平台管理部-1',
    kind: '部门',
    parentId: '00',
    used: true,
    order: 1,
    source: '系统新建',
    owner: '孙可',
    syncedAt: '',
    createdAt: '2026-06-18 09:24:10',
  },
  {
    id: 'LOCAL-02',
    code: 'LOCAL-02',
    name: '测试部门',
    kind: '部门',
    parentId: '00',
    used: true,
    order: null,
    source: '系统新建',
    owner: '周敬',
    syncedAt: '',
    createdAt: '2026-07-02 14:36:51',
  },
  {
    id: 'LOCAL-0201',
    code: 'LOCAL-0201',
    name: '测试一组',
    kind: '部门',
    parentId: 'LOCAL-02',
    used: true,
    order: null,
    source: '系统新建',
    owner: '周敬',
    syncedAt: '',
    createdAt: '2026-07-02 14:38:20',
  },
  {
    id: 'LOCAL-0202',
    code: 'LOCAL-0202',
    name: '测试二组',
    kind: '部门',
    parentId: 'LOCAL-02',
    used: false,
    order: null,
    source: '系统新建',
    owner: '',
    syncedAt: '',
    createdAt: '2026-07-02 14:39:02',
  },
]

const SEED: Dept[] = [...SYNCED, ...CUSTOM]

/* ---------------- store ---------------- */

type State = { depts: Dept[] }

let state: State = { depts: SEED }

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

export function useDepts(): State {
  return React.useSyncExternalStore(subscribe, snapshot, snapshot)
}

/* ---------------- 树结构工具 ---------------- */

export type DeptRow = {
  dept: Dept
  depth: number
  hasChildren: boolean
}

/** 每个节点的直接子节点，保持录入顺序，显示排序优先 */
function childrenMap(depts: Dept[]) {
  const map = new Map<string | null, Dept[]>()
  depts.forEach((d) => {
    const list = map.get(d.parentId) ?? []
    list.push(d)
    map.set(d.parentId, list)
  })
  map.forEach((list) => {
    list.sort((a, b) => {
      // 有显示排序的排前面，其余保持 NC 录入顺序
      if (a.order !== null && b.order !== null) return a.order - b.order
      if (a.order !== null) return -1
      if (b.order !== null) return 1
      return 0
    })
  })
  return map
}

/** 节点全部祖先 id */
function ancestorsOf(d: Dept, byId: Map<string, Dept>) {
  const out: string[] = []
  let cur = d.parentId
  while (cur) {
    out.push(cur)
    cur = byId.get(cur)?.parentId ?? null
  }
  return out
}

export type DeptQuery = {
  keyword: string
  used: string
  source: string
  kind: string
}

/**
 * 按查询条件生成可见的树行。
 * 命中筛选的节点连同其祖先一起保留，祖先自动展开，保证层级不断裂。
 */
export function buildRows(
  depts: Dept[],
  query: DeptQuery,
  expanded: Set<string>,
): { rows: DeptRow[]; matchedIds: Set<string>; forced: Set<string> } {
  const byId = new Map(depts.map((d) => [d.id, d]))
  const kw = query.keyword.trim().toLowerCase()
  const filtering =
    kw !== '' ||
    query.used !== '全部' ||
    query.source !== '全部来源' ||
    query.kind !== '全部类型'

  const matchedIds = new Set<string>()
  depts.forEach((d) => {
    const hitKw =
      kw === '' ||
      d.name.toLowerCase().includes(kw) ||
      d.code.toLowerCase().includes(kw)
    const hitUsed =
      query.used === '全部' || (query.used === '已使用') === d.used
    const hitSource = query.source === '全部来源' || d.source === query.source
    const hitKind = query.kind === '全部类型' || d.kind === query.kind
    if (hitKw && hitUsed && hitSource && hitKind) matchedIds.add(d.id)
  })

  // 命中节点的祖先需要保留并强制展开
  const forced = new Set<string>()
  const keep = new Set<string>()
  if (filtering) {
    matchedIds.forEach((id) => {
      keep.add(id)
      const d = byId.get(id)
      if (d) {
        ancestorsOf(d, byId).forEach((a) => {
          keep.add(a)
          forced.add(a)
        })
      }
    })
  }

  const visible = filtering ? depts.filter((d) => keep.has(d.id)) : depts
  const kids = childrenMap(visible)

  const rows: DeptRow[] = []
  function walk(parentId: string | null, depth: number) {
    const list = kids.get(parentId) ?? []
    list.forEach((d) => {
      const hasChildren = (kids.get(d.id) ?? []).length > 0
      rows.push({ dept: d, depth, hasChildren })
      if (hasChildren && (expanded.has(d.id) || forced.has(d.id))) {
        walk(d.id, depth + 1)
      }
    })
  }
  walk(null, 0)

  return { rows, matchedIds, forced }
}

/** 全部含子节点的 id，用于「展开全部」 */
export function branchIds(depts: Dept[]) {
  const parents = new Set<string>()
  depts.forEach((d) => {
    if (d.parentId) parents.add(d.parentId)
  })
  return parents
}

/** 完整层级路径，用于详情展示 */
export function pathOf(depts: Dept[], d: Dept) {
  const byId = new Map(depts.map((x) => [x.id, x]))
  const names = [d.name]
  let cur = d.parentId
  while (cur) {
    const p = byId.get(cur)
    if (!p) break
    names.unshift(p.name)
    cur = p.parentId
  }
  return names
}

/** 直接子节点数量 */
export function childCount(depts: Dept[], id: string) {
  return depts.filter((d) => d.parentId === id).length
}

/* ---------------- 变更操作 ---------------- */

/** 批量设置是否使用：属于平台展示配置，NC 同步节点同样可维护 */
export function setDeptUsed(ids: string[], used: boolean) {
  if (ids.length === 0) return { ok: false as const, message: '请先选择要操作的部门' }

  commit({
    depts: state.depts.map((d) => (ids.includes(d.id) ? { ...d, used } : d)),
  })
  return {
    ok: true as const,
    message: `已将 ${ids.length} 个部门设为${used ? '已使用' : '未使用'}`,
  }
}

/** 保存显示排序：留空表示不参与排序 */
export function setDeptOrder(id: string, order: number | null) {
  if (order !== null && (!Number.isInteger(order) || order < 0)) {
    return { ok: false as const, message: '显示排序需为 0 或正整数' }
  }

  commit({
    depts: state.depts.map((d) => (d.id === id ? { ...d, order } : d)),
  })
  return { ok: true as const, message: '显示排序已保存' }
}
