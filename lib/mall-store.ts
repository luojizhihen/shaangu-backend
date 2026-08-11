'use client'

/**
 * 积分商城（商品管理 / 订单管理）原型数据与状态。
 *
 * 业务基线（务必保持）：
 * - 商品无 SKU，库存直接在商品上维护，不建设独立库存模块。
 * - 订单状态只有「待领取」「已领取」两种，兑换成功后不可取消，
 *   因此不提供取消订单、已取消状态、退单与回退积分的任何入口。
 * - 积分与库存在会员兑换下单那一刻即已结算完成；
 *   「确认领取」只登记领取事实（当前管理员 + 确认时间），
 *   永远不会再次改动积分或库存，重复确认直接失败返回。
 * - 领取由管理员在系统外通过企业微信联系员工完成，
 *   系统内不记录领取地点、地址、窗口、联系人、联系电话、领取说明，
 *   也不涉及物流、快递、运费与发货。
 */

import * as React from 'react'

import type { BatchResult } from '@/lib/content-store'

/* ---------------- 类型 ---------------- */

/** 商品状态：由上下架动作驱动，新建后先进入「待上架」 */
export type ProductStatus = '待上架' | '已上架' | '已下架'

/** 每人限兑的统计周期，与限兑数量组合成「1 个/季度」这类口径 */
export type LimitCycle = '月' | '季度' | '半年' | '年'

export type MallProduct = {
  id: string
  /** 商品图片，列表与详情共用 */
  image: string
  name: string
  /** 商品编号，全局唯一 */
  code: string
  /** 所需积分（单价） */
  points: number
  /** 库存，直接在商品上维护 */
  stock: number
  /** 计量单位，如 支 / 个 / 枚 / 本 / 把 */
  unit: string
  /** 已兑换数量，由订单累计，不可手工修改 */
  redeemed: number
  /** 每人限兑数量，-1 表示不限 */
  perPersonLimit: number
  /** 每人限兑的周期，限兑数量为 -1 时不生效 */
  limitCycle: LimitCycle
  status: ProductStatus
  /** 商品简介 */
  intro: string
  onlineAt: string
  offlineAt: string
  createdAt: string
  creator: string
  updatedAt: string
}

/** 订单状态：仅两态，无已取消 */
export type OrderStatus = '待领取' | '已领取'

export type MallOrder = {
  id: string
  /** 订单编号 */
  orderNo: string
  status: OrderStatus
  nickname: string
  employee: string
  dept: string
  productId: string
  productName: string
  productCode: string
  /** 下单时的计量单位快照，商品后续改名改单位也不影响历史订单 */
  unit: string
  /** 兑换数量 */
  quantity: number
  /** 消耗积分（单价） */
  unitPoints: number
  /** 订单消耗积分 = 单价 × 数量，下单即扣，确认领取不再变动 */
  totalPoints: number
  /** 兑换时间 */
  createdAt: string
  /** 确认领取时间，由系统在确认时自动写入 */
  receivedAt: string
  /** 确认领取的管理员，由系统自动记录 */
  receiver: string
}

/* ---------------- 常量 ---------------- */

export const PRODUCT_STATUSES: ProductStatus[] = ['待上架', '已上架', '已下架']
export const ORDER_STATUSES: OrderStatus[] = ['待领取', '已领取']
export const LIMIT_CYCLES: LimitCycle[] = ['月', '季度', '半年', '年']
/** 常用计量单位，可在表单中直接选择 */
export const PRODUCT_UNITS = ['支', '个', '枚', '本', '把', '件', '套']

/* ---------------- 种子数据 ---------------- */

const SEED_PRODUCTS: MallProduct[] = [
  {
    id: 'MP-09',
    image: '/images/mall/plush.png',
    name: '鼓小风毛绒公仔',
    code: 'NO20260805000009',
    points: 10000,
    stock: 15,
    unit: '个',
    redeemed: 0,
    perPersonLimit: 1,
    limitCycle: '年',
    status: '待上架',
    intro: '鼓小风 IP 形象毛绒公仔，高约 28cm，限量发放。',
    onlineAt: '',
    offlineAt: '',
    createdAt: '2026-08-05 09:26:14',
    creator: '孙可',
    updatedAt: '2026-08-05 09:26:14',
  },
  {
    id: 'MP-08',
    image: '/images/mall/bottle.png',
    name: '富光×陕鼓55周年保温杯',
    code: 'NO20260728000008',
    points: 2000,
    stock: 100,
    unit: '个',
    redeemed: 26,
    perPersonLimit: 1,
    limitCycle: '半年',
    status: '已上架',
    intro: '富光联名款，316 不锈钢内胆，容量 500ml，杯身激光雕刻 55 周年标识。',
    onlineAt: '2026-07-28 10:05:12',
    offlineAt: '',
    createdAt: '2026-07-28 09:41:36',
    creator: '孙可',
    updatedAt: '2026-08-04 15:20:08',
  },
  {
    id: 'MP-07',
    image: '/images/mall/tote.png',
    name: '陕鼓环保帆布袋',
    code: 'NO20260722000007',
    points: 2000,
    stock: 50,
    unit: '个',
    redeemed: 18,
    perPersonLimit: 1,
    limitCycle: '季度',
    status: '已上架',
    intro: '加厚纯棉帆布单肩袋，可承重 8kg，正面丝印陕鼓标识。',
    onlineAt: '2026-07-22 09:30:18',
    offlineAt: '',
    createdAt: '2026-07-21 17:12:55',
    creator: '王海涛',
    updatedAt: '2026-08-02 11:04:31',
  },
  {
    id: 'MP-06',
    image: '/images/mall/umbrella.png',
    name: '天堂307E升级黑胶伞',
    code: 'NO20260716000006',
    points: 2000,
    stock: 100,
    unit: '把',
    redeemed: 31,
    perPersonLimit: 1,
    limitCycle: '年',
    status: '已上架',
    intro: '天堂 307E 升级款，三折黑胶防晒内层，收纳长度 24cm。',
    onlineAt: '2026-07-16 14:22:40',
    offlineAt: '',
    createdAt: '2026-07-16 13:58:02',
    creator: '孙可',
    updatedAt: '2026-08-05 16:48:12',
  },
  {
    id: 'MP-05',
    image: '/images/mall/notebook.png',
    name: '“陕鼓”压印笔记本',
    code: 'NO20260703000005',
    points: 1500,
    stock: 50,
    unit: '本',
    redeemed: 42,
    perPersonLimit: 1,
    limitCycle: '季度',
    status: '已上架',
    intro: 'A5 硬壳笔记本，内页 120 页，封面压印“陕鼓”字样。',
    onlineAt: '2026-07-03 10:12:07',
    offlineAt: '',
    createdAt: '2026-07-02 16:40:29',
    creator: '王海涛',
    updatedAt: '2026-08-02 15:20:08',
  },
  {
    id: 'MP-04',
    image: '/images/mall/keychain.png',
    name: '鼓小风55周年限定钥匙扣',
    code: 'NO20260620000004',
    points: 1000,
    stock: 100,
    unit: '个',
    redeemed: 57,
    perPersonLimit: 1,
    limitCycle: '季度',
    status: '已上架',
    intro: '55 周年限定款金属珐琅钥匙扣，鼓小风形象立体成型。',
    onlineAt: '2026-06-20 09:18:44',
    offlineAt: '',
    createdAt: '2026-06-19 15:02:31',
    creator: '孙可',
    updatedAt: '2026-08-01 14:05:39',
  },
  {
    id: 'MP-03',
    image: '/images/mall/fridge-magnet.png',
    name: '鼓小风冰箱贴盲盒',
    code: 'NO20260612000003',
    points: 1000,
    stock: 50,
    unit: '枚',
    redeemed: 64,
    perPersonLimit: 1,
    limitCycle: '月',
    status: '已下架',
    intro: '鼓小风系列软胶冰箱贴，共 6 款随机发放，暂因补货先行下架。',
    onlineAt: '2026-06-12 10:40:22',
    offlineAt: '2026-07-30 18:02:44',
    createdAt: '2026-06-11 16:35:09',
    creator: '王海涛',
    updatedAt: '2026-07-30 18:02:44',
  },
  {
    id: 'MP-02',
    image: '/images/mall/phone-grip.png',
    name: '鼓小风气囊手机支架',
    code: 'NO20260605000002',
    points: 800,
    stock: 50,
    unit: '个',
    redeemed: 73,
    perPersonLimit: 1,
    limitCycle: '月',
    status: '已上架',
    intro: '可折叠气囊支架，背胶反复水洗可用，印鼓小风形象。',
    onlineAt: '2026-06-05 09:12:36',
    offlineAt: '',
    createdAt: '2026-06-04 17:26:48',
    creator: '孙可',
    updatedAt: '2026-08-03 09:22:15',
  },
  {
    id: 'MP-01',
    image: '/images/mall/pen.png',
    name: '陕鼓定制签字笔',
    code: 'NO20260528000001',
    points: 500,
    stock: 100,
    unit: '支',
    redeemed: 128,
    perPersonLimit: 2,
    limitCycle: '月',
    status: '已上架',
    intro: '金属杆中性签字笔，0.5mm 笔芯，笔夹镌刻陕鼓标识。',
    onlineAt: '2026-05-28 10:05:41',
    offlineAt: '',
    createdAt: '2026-05-27 14:52:30',
    creator: '孙可',
    updatedAt: '2026-08-06 08:52:30',
  },
]

const SEED_ORDERS: MallOrder[] = [
  {
    id: 'MO-2108',
    orderNo: 'NO20260806000008',
    status: '待领取',
    nickname: '筱筱',
    employee: '汪筱',
    dept: '技术中心',
    productId: 'MP-08',
    productName: '富光×陕鼓55周年保温杯',
    productCode: 'NO20260728000008',
    unit: '个',
    quantity: 1,
    unitPoints: 2000,
    totalPoints: 2000,
    createdAt: '2026-08-06 09:12:48',
    receivedAt: '',
    receiver: '',
  },
  {
    id: 'MO-2107',
    orderNo: 'NO20260806000007',
    status: '待领取',
    nickname: '一只鹿',
    employee: '鹿鸣',
    dept: '能源互联事业部',
    productId: 'MP-01',
    productName: '陕鼓定制签字笔',
    productCode: 'NO20260528000001',
    unit: '支',
    quantity: 2,
    unitPoints: 500,
    totalPoints: 1000,
    createdAt: '2026-08-05 17:40:22',
    receivedAt: '',
    receiver: '',
  },
  {
    id: 'MO-2106',
    orderNo: 'NO20260805000006',
    status: '待领取',
    nickname: '风起东南',
    employee: '陆东南',
    dept: '装备制造事业部',
    productId: 'MP-05',
    productName: '“陕鼓”压印笔记本',
    productCode: 'NO20260703000005',
    unit: '本',
    quantity: 1,
    unitPoints: 1500,
    totalPoints: 1500,
    createdAt: '2026-08-05 16:48:12',
    receivedAt: '',
    receiver: '',
  },
  {
    id: 'MO-2105',
    orderNo: 'NO20260804000005',
    status: '已领取',
    nickname: '海涛',
    employee: '王海涛',
    dept: '平台管理部',
    productId: 'MP-06',
    productName: '天堂307E升级黑胶伞',
    productCode: 'NO20260716000006',
    unit: '把',
    quantity: 1,
    unitPoints: 2000,
    totalPoints: 2000,
    createdAt: '2026-08-04 14:31:50',
    receivedAt: '2026-08-05 10:18:26',
    receiver: '孙可',
  },
  {
    id: 'MO-2104',
    orderNo: 'NO20260802000004',
    status: '已领取',
    nickname: '老周同学',
    employee: '周敬',
    dept: '信息安全部',
    productId: 'MP-07',
    productName: '陕鼓环保帆布袋',
    productCode: 'NO20260722000007',
    unit: '个',
    quantity: 1,
    unitPoints: 2000,
    totalPoints: 2000,
    createdAt: '2026-08-02 11:04:31',
    receivedAt: '2026-08-03 09:22:15',
    receiver: '王海涛',
  },
  {
    id: 'MO-2103',
    orderNo: 'NO20260731000003',
    status: '已领取',
    nickname: '筱筱',
    employee: '汪筱',
    dept: '技术中心',
    productId: 'MP-04',
    productName: '鼓小风55周年限定钥匙扣',
    productCode: 'NO20260620000004',
    unit: '个',
    quantity: 1,
    unitPoints: 1000,
    totalPoints: 1000,
    createdAt: '2026-07-31 15:26:04',
    receivedAt: '2026-08-01 14:05:39',
    receiver: '孙可',
  },
  {
    id: 'MO-2102',
    orderNo: 'NO20260729000002',
    status: '已领取',
    nickname: '一只鹿',
    employee: '鹿鸣',
    dept: '能源互联事业部',
    productId: 'MP-03',
    productName: '鼓小风冰箱贴盲盒',
    productCode: 'NO20260612000003',
    unit: '枚',
    quantity: 1,
    unitPoints: 1000,
    totalPoints: 1000,
    createdAt: '2026-07-29 10:47:53',
    receivedAt: '2026-07-30 16:31:07',
    receiver: '孙可',
  },
  {
    id: 'MO-2101',
    orderNo: 'NO20260728000001',
    status: '已领取',
    nickname: '风起东南',
    employee: '陆东南',
    dept: '装备制造事业部',
    productId: 'MP-02',
    productName: '鼓小风气囊手机支架',
    productCode: 'NO20260605000002',
    unit: '个',
    quantity: 1,
    unitPoints: 800,
    totalPoints: 800,
    createdAt: '2026-07-28 11:19:36',
    receivedAt: '2026-07-29 09:03:44',
    receiver: '王海涛',
  },
]

/* ---------------- store ---------------- */

type State = {
  products: MallProduct[]
  orders: MallOrder[]
}

let state: State = {
  products: SEED_PRODUCTS,
  orders: SEED_ORDERS,
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

export function useMall(): State {
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

let seq = 9
function nextSeq() {
  seq += 1
  return seq
}

export function getProduct(id: string) {
  return state.products.find((p) => p.id === id)
}

export function productStatusTone(s: ProductStatus) {
  if (s === '已上架') return 'success' as const
  if (s === '已下架') return 'neutral' as const
  return 'warning' as const
}

export function orderStatusTone(s: OrderStatus) {
  return s === '已领取' ? ('success' as const) : ('warning' as const)
}

/** 每人限兑口径，如「2 支/月」；-1 表示不限 */
export function limitText(limit: number, unit: string, cycle: LimitCycle) {
  return limit < 0 ? '不限' : `${limit} ${unit}/${cycle}`
}

/** 带单位的数量口径，如「100 支」 */
export function qtyText(qty: number, unit: string) {
  return `${qty} ${unit}`
}

/** 生成下一个商品编号，规则与既有编号保持一致 */
export function nextProductCode(d = new Date()) {
  const day = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
  const count = state.products.length + 1
  return `NO${day}${String(count).padStart(6, '0')}`
}

/* ---------------- 商品维护 ---------------- */

export type ProductDraft = {
  image: string
  name: string
  code: string
  points: number
  stock: number
  unit: string
  perPersonLimit: number
  limitCycle: LimitCycle
  intro: string
}

export const EMPTY_PRODUCT_DRAFT: ProductDraft = {
  image: '',
  name: '',
  code: '',
  points: 500,
  stock: 50,
  unit: '个',
  perPersonLimit: 1,
  limitCycle: '月',
  intro: '',
}

export function validateProduct(
  draft: ProductDraft,
  editingId?: string,
): string[] {
  const issues: string[] = []
  if (!draft.name.trim()) issues.push('商品名称为必填项')
  if (!draft.code.trim()) issues.push('商品编号为必填项')
  else if (
    state.products.some((p) => p.code === draft.code.trim() && p.id !== editingId)
  )
    issues.push('商品编号已存在，请更换')

  if (!Number.isInteger(draft.points) || draft.points <= 0)
    issues.push('所需积分需为大于 0 的整数')

  if (!Number.isInteger(draft.stock) || draft.stock < 0)
    issues.push('库存需为不小于 0 的整数')

  if (!draft.unit.trim()) issues.push('计量单位为必填项')

  if (
    !Number.isInteger(draft.perPersonLimit) ||
    draft.perPersonLimit === 0 ||
    draft.perPersonLimit < -1
  )
    issues.push('每人限兑需为正整数，或填 -1 表示不限')
  else if (draft.perPersonLimit > 0 && draft.perPersonLimit > draft.stock)
    issues.push('每人限兑不得大于当前库存')

  // 编辑时库存不得低于已兑换数量，避免与既有订单矛盾
  const current = editingId ? getProduct(editingId) : undefined
  if (!draft.image.trim()) issues.push('请上传商品图片')
  if (current && draft.stock + current.redeemed < current.redeemed)
    issues.push('库存不能小于已兑换数量')

  return issues
}

export function createProduct(draft: ProductDraft, creator: string) {
  const now = stamp()
  const product: MallProduct = {
    id: `MP-${nextSeq()}`,
    image: draft.image,
    name: draft.name.trim(),
    code: draft.code.trim(),
    points: draft.points,
    stock: draft.stock,
    unit: draft.unit.trim(),
    redeemed: 0,
    perPersonLimit: draft.perPersonLimit,
    limitCycle: draft.limitCycle,
    // 新建商品统一先入「待上架」，需显式上架后才对会员可见
    status: '待上架',
    intro: draft.intro.trim(),
    onlineAt: '',
    offlineAt: '',
    createdAt: now,
    creator,
    updatedAt: now,
  }
  commit({ products: [product, ...state.products] })
  return product
}

export function updateProduct(id: string, draft: ProductDraft) {
  commit({
    products: state.products.map((p) =>
      p.id === id
        ? {
            ...p,
            image: draft.image,
            name: draft.name.trim(),
            code: draft.code.trim(),
            points: draft.points,
            stock: draft.stock,
            unit: draft.unit.trim(),
            perPersonLimit: draft.perPersonLimit,
            limitCycle: draft.limitCycle,
            intro: draft.intro.trim(),
            updatedAt: stamp(),
          }
        : p,
    ),
  })
}

/** 上架：需有图片与库存，已上架商品重复上架直接失败 */
export function putProductsOnline(ids: string[]): BatchResult[] {
  const results: BatchResult[] = []
  const now = stamp()
  const products = state.products.map((p) => {
    if (!ids.includes(p.id)) return p
    if (p.status === '已上架') {
      results.push({ id: p.id, label: p.name, ok: false, message: '商品已在上架状态' })
      return p
    }
    if (!p.image) {
      results.push({ id: p.id, label: p.name, ok: false, message: '缺少商品图片' })
      return p
    }
    if (p.stock <= 0) {
      results.push({ id: p.id, label: p.name, ok: false, message: '库存为 0，请先补充库存' })
      return p
    }
    results.push({ id: p.id, label: p.name, ok: true, message: '已上架' })
    return { ...p, status: '已上架' as ProductStatus, onlineAt: now, offlineAt: '', updatedAt: now }
  })
  commit({ products })
  return results
}

/** 下架：只影响此后兑换，不影响已产生的订单与已扣积分 */
export function takeProductsOffline(ids: string[]): BatchResult[] {
  const results: BatchResult[] = []
  const now = stamp()
  const products = state.products.map((p) => {
    if (!ids.includes(p.id)) return p
    if (p.status !== '已上架') {
      results.push({ id: p.id, label: p.name, ok: false, message: '仅已上架商品可下架' })
      return p
    }
    results.push({ id: p.id, label: p.name, ok: true, message: '已下架' })
    return { ...p, status: '已下架' as ProductStatus, offlineAt: now, updatedAt: now }
  })
  commit({ products })
  return results
}

/* ---------------- 订单确认领取 ---------------- */

export function getOrder(id: string) {
  return state.orders.find((o) => o.id === id)
}

export function ordersOfProduct(productId: string) {
  return state.orders.filter((o) => o.productId === productId)
}

/**
 * 确认领取：员工线下实际领取后由管理员点击，
 * 系统自动记录当前管理员与确认时间。
 *
 * 幂等约束：积分与库存在兑换下单时已结算，
 * 本操作只做「待领取 → 已领取」的状态流转，
 * 已领取订单重复确认直接返回失败，不会二次���动积分或库存。
 */
export function confirmReceive(id: string, operator: string): BatchResult {
  const order = getOrder(id)
  if (!order) {
    return { id, label: id, ok: false, message: '订单不存在' }
  }
  if (order.status === '已领取') {
    return {
      id,
      label: order.orderNo,
      ok: false,
      message: `该订单已于 ${order.receivedAt} 由 ${order.receiver} 确认领取，不再重复处理`,
    }
  }
  const now = stamp()
  commit({
    orders: state.orders.map((o) =>
      o.id === id
        ? { ...o, status: '已领取' as OrderStatus, receivedAt: now, receiver: operator }
        : o,
    ),
  })
  return { id, label: order.orderNo, ok: true, message: `已确认领取（${now}）` }
}
