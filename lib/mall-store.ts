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
  /** 已兑换数量，由订单累计，不可手工修改 */
  redeemed: number
  /** 每人限兑数量，-1 表示不限 */
  perPersonLimit: number
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

/* ---------------- 种子数据 ---------------- */

const SEED_PRODUCTS: MallProduct[] = [
  {
    id: 'MP-06',
    image: '/images/mall/notebook.png',
    name: '定制硬壳笔记本',
    code: 'NO20260728000006',
    points: 120,
    stock: 148,
    redeemed: 52,
    perPersonLimit: 2,
    status: '已上架',
    intro: 'A5 硬壳笔记本，内页 120 页，封面烫印企业标识。',
    onlineAt: '2026-07-28 10:05:12',
    offlineAt: '',
    createdAt: '2026-07-28 09:41:36',
    creator: '孙可',
    updatedAt: '2026-08-04 15:20:08',
  },
  {
    id: 'MP-05',
    image: '/images/mall/bottle.png',
    name: '不锈钢保温杯',
    code: 'NO20260716000005',
    points: 300,
    stock: 36,
    redeemed: 84,
    perPersonLimit: 1,
    status: '已上架',
    intro: '316 不锈钢内胆，容量 500ml，保温 12 小时。',
    onlineAt: '2026-07-16 14:22:40',
    offlineAt: '',
    createdAt: '2026-07-16 13:58:02',
    creator: '孙可',
    updatedAt: '2026-08-05 16:48:12',
  },
  {
    id: 'MP-04',
    image: '/images/mall/tote.png',
    name: '棉麻帆布袋',
    code: 'NO20260703000004',
    points: 60,
    stock: 0,
    redeemed: 210,
    perPersonLimit: 3,
    status: '已上架',
    intro: '加厚帆布单肩袋，可承重 8kg，日常通勤适用。',
    onlineAt: '2026-07-03 09:30:18',
    offlineAt: '',
    createdAt: '2026-07-02 17:12:55',
    creator: '王海涛',
    updatedAt: '2026-08-02 11:04:31',
  },
  {
    id: 'MP-03',
    image: '/images/mall/tshirt.png',
    name: '纯棉圆领文化衫',
    code: 'NO20260620000003',
    points: 180,
    stock: 92,
    redeemed: 46,
    perPersonLimit: 2,
    status: '已下架',
    intro: '260g 纯棉面料，统一版型，暂缺部分尺码故先行下架。',
    onlineAt: '2026-06-20 10:12:07',
    offlineAt: '2026-07-30 18:02:44',
    createdAt: '2026-06-19 16:40:29',
    creator: '王海涛',
    updatedAt: '2026-07-30 18:02:44',
  },
  {
    id: 'MP-02',
    image: '/images/mall/speaker.png',
    name: '便携蓝牙音箱',
    code: 'NO20260805000002',
    points: 800,
    stock: 24,
    redeemed: 0,
    perPersonLimit: 1,
    status: '待上架',
    intro: '5W 输出，续航 10 小时，支持蓝牙 5.3。',
    onlineAt: '',
    offlineAt: '',
    createdAt: '2026-08-05 09:26:14',
    creator: '孙可',
    updatedAt: '2026-08-05 09:26:14',
  },
  {
    id: 'MP-01',
    image: '/images/mall/umbrella.png',
    name: '三折便携雨伞',
    code: 'NO20260806000001',
    points: 90,
    stock: 60,
    redeemed: 0,
    perPersonLimit: 2,
    status: '待上架',
    intro: '八骨三折伞，防紫外线涂层，收纳长度 24cm。',
    onlineAt: '',
    offlineAt: '',
    createdAt: '2026-08-06 08:52:30',
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
    productId: 'MP-06',
    productName: '定制硬壳笔记本',
    productCode: 'NO20260728000006',
    quantity: 1,
    unitPoints: 120,
    totalPoints: 120,
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
    productId: 'MP-04',
    productName: '棉麻帆布袋',
    productCode: 'NO20260703000004',
    quantity: 2,
    unitPoints: 60,
    totalPoints: 120,
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
    productId: 'MP-06',
    productName: '定制硬壳笔记本',
    productCode: 'NO20260728000006',
    quantity: 1,
    unitPoints: 120,
    totalPoints: 120,
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
    productId: 'MP-05',
    productName: '不锈钢保温杯',
    productCode: 'NO20260716000005',
    quantity: 1,
    unitPoints: 300,
    totalPoints: 300,
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
    productId: 'MP-04',
    productName: '棉麻帆布袋',
    productCode: 'NO20260703000004',
    quantity: 3,
    unitPoints: 60,
    totalPoints: 180,
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
    productId: 'MP-03',
    productName: '纯棉圆领文化衫',
    productCode: 'NO20260620000003',
    quantity: 1,
    unitPoints: 180,
    totalPoints: 180,
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
    productId: 'MP-05',
    productName: '不锈钢保温杯',
    productCode: 'NO20260716000005',
    quantity: 1,
    unitPoints: 300,
    totalPoints: 300,
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
    productId: 'MP-06',
    productName: '定制硬壳笔记本',
    productCode: 'NO20260728000006',
    quantity: 2,
    unitPoints: 120,
    totalPoints: 240,
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

let seq = 20
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

export function limitText(limit: number) {
  return limit < 0 ? '不限' : `${limit} 件`
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
  perPersonLimit: number
  intro: string
}

export const EMPTY_PRODUCT_DRAFT: ProductDraft = {
  image: '',
  name: '',
  code: '',
  points: 100,
  stock: 10,
  perPersonLimit: 1,
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

  if (
    !Number.isInteger(draft.perPersonLimit) ||
    draft.perPersonLimit === 0 ||
    draft.perPersonLimit < -1
  )
    issues.push('每人限兑需为正整数，或填 -1 表示不限')

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
    redeemed: 0,
    perPersonLimit: draft.perPersonLimit,
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
            perPersonLimit: draft.perPersonLimit,
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
 * 已领取订单重复确认直接返回失败，不会二次改动积分或库存。
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
