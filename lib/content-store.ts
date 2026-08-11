'use client'

/**
 * 内容管理（资讯类目 / 资讯 / 评论 / 轮播图）原型数据与状态。
 * 使用模块级 store + useSyncExternalStore，保证跨页面（列表、新增、详情）共享同一份数据。
 * 仅用于原型演示，不连接真实 API。
 */

import * as React from 'react'

/* ---------------- 类型 ---------------- */

/** 资讯状态仅三种：草稿、已发布、已下架。发布后默认上架，下架后可重新上架。 */
export type NewsStatus = '草稿' | '已发布' | '已下架'

export type Category = {
  id: string
  name: string
  /** 内置类目不可删除 */
  builtin: boolean
  /** 该类目正文之外还需维护附件（通知） */
  withAttachment: boolean
  owner: string
  createdAt: string
  remark: string
}

export type Attachment = {
  id: string
  name: string
  size: string
}

export type NewsItem = {
  id: string
  title: string
  category: string
  summary: string
  body: string
  cover: string
  author: string
  dept: string
  status: NewsStatus
  top: boolean
  sort: number
  allowComment: boolean
  createdAt: string
  updatedAt: string
  publishedAt: string
  publisher: string
  views: number
  likes: number
  commentCount: number
  attachments: Attachment[]
}

export type CommentItem = {
  id: string
  newsId: string
  newsTitle: string
  content: string
  phone: string
  author: string
  dept: string
  createdAt: string
  hidden: boolean
}

export type Banner = {
  id: string
  title: string
  image: string
  slot: '首页顶部轮播' | '资讯频道轮播' | '通知专区轮播'
  newsId: string
  sort: number
  online: boolean
  owner: string
  createdAt: string
}

/** 批量操作逐条结果 */
export type BatchResult = {
  id: string
  label: string
  ok: boolean
  message: string
}

/* ---------------- 常量 ---------------- */

export const NEWS_STATUSES: NewsStatus[] = ['草稿', '已发布', '已下架']

export const BANNER_SLOTS: Banner['slot'][] = [
  '首页顶部轮播',
  '资讯频道轮播',
  '通知专区轮播',
]

export const NOTICE_CATEGORY = '通知'

/* ---------------- 种子数据 ---------------- */

const SEED_CATEGORIES: Category[] = [
  {
    id: 'CAT-01',
    name: '推荐',
    builtin: true,
    withAttachment: false,
    owner: '系统内置',
    createdAt: '2026-01-06 09:00:00',
    remark: '首页推荐位内容池，按排序与置顶展示',
  },
  {
    id: 'CAT-02',
    name: '要闻',
    builtin: true,
    withAttachment: false,
    owner: '系统内置',
    createdAt: '2026-01-06 09:00:00',
    remark: '集团重要新闻与经营动态',
  },
  {
    id: 'CAT-03',
    name: '通知',
    builtin: true,
    withAttachment: true,
    owner: '系统内置',
    createdAt: '2026-01-06 09:00:00',
    remark: '资讯类目下的通知，可维护正文与附件，与站内消息完全分开',
  },
  {
    id: 'CAT-04',
    name: '奋斗者',
    builtin: true,
    withAttachment: false,
    owner: '系统内置',
    createdAt: '2026-01-06 09:00:00',
    remark: '一线员工与团队人物报道',
  },
  {
    id: 'CAT-05',
    name: '学习',
    builtin: true,
    withAttachment: false,
    owner: '系统内置',
    createdAt: '2026-01-06 09:00:00',
    remark: '业务学习、技术分享与理论学习',
  },
  {
    id: 'CAT-06',
    name: '内刊',
    builtin: true,
    withAttachment: true,
    owner: '系统内置',
    createdAt: '2026-01-06 09:00:00',
    remark: '企业内部刊物电子版，可附刊物 PDF',
  },
  {
    id: 'CAT-07',
    name: '专题活动',
    builtin: false,
    withAttachment: false,
    owner: '李雯',
    createdAt: '2026-05-18 10:24:31',
    remark: '阶段性专题（可删除的自定义类目）',
  },
]

const BODY_LONG = `　　近年来，公司围绕主业持续推进技术创新与数字化转型，在大型能量转换设备的智能运维、分布式能源系统集成等方向取得了一批可复用的成果。

　　会议指出，要坚持问题导向，把生产一线的真实需求作为课题来源，推动数据在设计、制造、服务各环节贯通；要强化跨部门协同，建立统一的数据口径与责任分工；要抓好人才培养，让骨干在项目中成长。

　　下一阶段，各单位要按照既定节点推进，做到任务清单化、进度可视化，确保各项举措落地见效。`

const BODY_NOTICE = `　　为进一步提升全员信息安全意识，规范信息系统使用行为，现就开展年度信息安全培训有关事项通知如下：

　　一、培训对象：集团本部及各子公司全体在职员工。
　　二、培训时间：2026 年 8 月 18 日至 8 月 29 日，分四批线上进行。
　　三、培训内容：数据分级分类、终端安全、账号与口令管理、钓鱼邮件识别、涉密信息处理。
　　四、考核要求：培训结束后统一在线考核，成绩计入年度培训档案。

　　请各单位按附件名单组织参加，具体安排见附件《年度信息安全培训实施方案》。`

const SEED_NEWS: NewsItem[] = [
  {
    id: 'NEWS-20260811-001',
    title: '集团召开数字化建设专题推进会',
    category: '要闻',
    summary:
      '会议听取了数字化建设年度进展汇报，明确了下一阶段重点任务与责任分工。',
    body: BODY_LONG,
    cover: '/content/banner-meeting.png',
    author: '李雯',
    dept: '党群工作部',
    status: '已发布',
    top: true,
    sort: 1,
    allowComment: true,
    createdAt: '2026-08-11 08:12:20',
    updatedAt: '2026-08-11 09:30:11',
    publishedAt: '2026-08-11 09:30:11',
    publisher: '陈锐',
    views: 4210,
    likes: 386,
    commentCount: 42,
    attachments: [],
  },
  {
    id: 'NEWS-20260810-002',
    title: '关于开展年度信息安全培训的通知',
    category: '通知',
    summary:
      '培训分四批线上开展，培训结束后统一在线考核，成绩计入年度培训档案。',
    body: BODY_NOTICE,
    cover: '/content/banner-training.png',
    author: '周敬',
    dept: '信息管理部',
    status: '已发布',
    top: true,
    sort: 2,
    allowComment: false,
    createdAt: '2026-08-10 10:02:41',
    updatedAt: '2026-08-10 14:20:03',
    publishedAt: '2026-08-10 14:20:03',
    publisher: '陈锐',
    views: 3860,
    likes: 254,
    commentCount: 18,
    attachments: [
      { id: 'ATT-01', name: '年度信息安全培训实施方案.pdf', size: '1.8 MB' },
      { id: 'ATT-02', name: '分批参训人员名单.xlsx', size: '326 KB' },
    ],
  },
  {
    id: 'NEWS-20260809-003',
    title: '奋斗者｜十年磨一“机”：透平装配班组的毫米之争',
    category: '奋斗者',
    summary: '从装配间隙到试车曲线，班组用十年时间把误差压到了毫米以内。',
    body: BODY_LONG,
    cover: '/content/banner-worker.png',
    author: '李雯',
    dept: '党群工作部',
    status: '已发布',
    top: false,
    sort: 3,
    allowComment: true,
    createdAt: '2026-08-09 09:14:12',
    updatedAt: '2026-08-09 15:41:52',
    publishedAt: '2026-08-09 15:41:52',
    publisher: '陈锐',
    views: 3120,
    likes: 297,
    commentCount: 26,
    attachments: [],
  },
  {
    id: 'NEWS-20260808-004',
    title: '内刊 2026 年第 7 期上线',
    category: '内刊',
    summary: '本期聚焦服务型制造转型，收录一线技改案例 8 篇。',
    body: BODY_LONG,
    cover: '/content/banner-digital.png',
    author: '李雯',
    dept: '党群工作部',
    status: '已发布',
    top: false,
    sort: 4,
    allowComment: true,
    createdAt: '2026-08-08 11:00:00',
    updatedAt: '2026-08-08 16:12:30',
    publishedAt: '2026-08-08 16:12:30',
    publisher: '陈锐',
    views: 2480,
    likes: 162,
    commentCount: 11,
    attachments: [
      { id: 'ATT-03', name: '陕鼓内刊2026年第7期.pdf', size: '12.4 MB' },
    ],
  },
  {
    id: 'NEWS-20260807-005',
    title: '学习｜能源系统节能技术要点解析',
    category: '学习',
    summary: '结合三个典型项目，梳理能源系统节能改造的关键技术点。',
    body: BODY_LONG,
    cover: '/content/banner-digital.png',
    author: '赵启明',
    dept: '融媒运营组',
    status: '已发布',
    top: false,
    sort: 5,
    allowComment: true,
    createdAt: '2026-08-07 09:32:18',
    updatedAt: '2026-08-07 10:44:02',
    publishedAt: '2026-08-07 10:44:02',
    publisher: '陈锐',
    views: 2210,
    likes: 143,
    commentCount: 9,
    attachments: [],
  },
  {
    id: 'NEWS-20260811-006',
    title: '陕鼓之声｜向上向善 优良风气创未来（图文稿）',
    category: '推荐',
    summary: '配合同名音频栏目的图文稿件，等待发布人员统一发布。',
    body: BODY_LONG,
    cover: '/content/banner-meeting.png',
    author: '赵启明',
    dept: '融媒运营组',
    status: '草稿',
    top: false,
    sort: 6,
    allowComment: true,
    createdAt: '2026-08-11 07:55:10',
    updatedAt: '2026-08-11 08:02:44',
    publishedAt: '',
    publisher: '',
    views: 0,
    likes: 0,
    commentCount: 0,
    attachments: [],
  },
  {
    id: 'NEWS-20260811-007',
    title: '关于 8 月份厂区停水检修安排的通知',
    category: '通知',
    summary: '检修期间涉及三个厂区的生活用水，请各单位提前做好准备。',
    body: BODY_NOTICE,
    cover: '/content/banner-training.png',
    author: '周敬',
    dept: '信息管理部',
    status: '草稿',
    top: false,
    sort: 7,
    allowComment: false,
    createdAt: '2026-08-11 08:40:05',
    updatedAt: '2026-08-11 08:52:19',
    publishedAt: '',
    publisher: '',
    views: 0,
    likes: 0,
    commentCount: 0,
    attachments: [
      { id: 'ATT-04', name: '停水检修区域示意图.pdf', size: '640 KB' },
    ],
  },
  {
    id: 'NEWS-20260806-008',
    title: '专题｜服务型制造转型系列报道（一）',
    category: '专题活动',
    summary: '系列报道第一篇，介绍分布式能源业务的服务化实践。',
    body: BODY_LONG,
    cover: '/content/banner-digital.png',
    author: '李雯',
    dept: '党群工作部',
    status: '草稿',
    top: false,
    sort: 8,
    allowComment: true,
    createdAt: '2026-08-06 14:22:31',
    updatedAt: '2026-08-06 14:50:08',
    publishedAt: '',
    publisher: '',
    views: 0,
    likes: 0,
    commentCount: 0,
    attachments: [],
  },
  {
    id: 'NEWS-20260805-009',
    title: '“关于开展年度信息安全培训的通知”（旧版，封面缺失）',
    category: '通知',
    summary: '因封面素材缺失已下架，补齐素材后可重新上架。',
    body: BODY_NOTICE,
    cover: '',
    author: '周敬',
    dept: '信息管理部',
    status: '已下架',
    top: false,
    sort: 9,
    allowComment: false,
    createdAt: '2026-08-05 09:12:00',
    updatedAt: '2026-08-10 11:22:44',
    publishedAt: '2026-08-05 10:30:12',
    publisher: '陈锐',
    views: 1240,
    likes: 36,
    commentCount: 4,
    attachments: [],
  },
  {
    id: 'NEWS-20260804-010',
    title: '要闻｜上半年经营指标完成情况通报',
    category: '要闻',
    summary: '数据口径调整中，暂时下架，调整完成后重新上架。',
    body: BODY_LONG,
    cover: '/content/banner-meeting.png',
    author: '李雯',
    dept: '党群工作部',
    status: '已下架',
    top: false,
    sort: 10,
    allowComment: true,
    createdAt: '2026-08-04 08:30:00',
    updatedAt: '2026-08-09 17:02:10',
    publishedAt: '2026-08-04 09:10:00',
    publisher: '陈锐',
    views: 2960,
    likes: 118,
    commentCount: 15,
    attachments: [],
  },
  {
    id: 'NEWS-20260803-011',
    title: '学习｜设备点检标准化作业指导',
    category: '学习',
    summary: '点检标准化作业的六个步骤与常见误区。',
    body: BODY_LONG,
    cover: '/content/banner-worker.png',
    author: '赵启明',
    dept: '融媒运营组',
    status: '已发布',
    top: false,
    sort: 11,
    allowComment: true,
    createdAt: '2026-08-03 10:10:10',
    updatedAt: '2026-08-03 11:20:30',
    publishedAt: '2026-08-03 11:20:30',
    publisher: '陈锐',
    views: 1860,
    likes: 96,
    commentCount: 7,
    attachments: [],
  },
  {
    id: 'NEWS-20260802-012',
    title: '奋斗者｜从图纸到现场：青年工程师的第一台机组',
    category: '奋斗者',
    summary: '记录青年工程师参与首台机组交付的全过程。',
    body: BODY_LONG,
    cover: '/content/banner-worker.png',
    author: '李雯',
    dept: '党群工作部',
    status: '已发布',
    top: false,
    sort: 12,
    allowComment: true,
    createdAt: '2026-08-02 09:05:00',
    updatedAt: '2026-08-02 10:15:00',
    publishedAt: '2026-08-02 10:15:00',
    publisher: '陈锐',
    views: 2040,
    likes: 132,
    commentCount: 12,
    attachments: [],
  },
]

const SEED_COMMENTS: CommentItem[] = [
  {
    id: 'CMT-0001',
    newsId: 'NEWS-20260811-001',
    newsTitle: '集团召开数字化建设专题推进会',
    content: '数据口径统一以后，报表确实省了不少事。',
    phone: '13891234567',
    author: '王建国',
    dept: '透平机械',
    createdAt: '2026-08-11 10:22:08',
    hidden: false,
  },
  {
    id: 'CMT-0002',
    newsId: 'NEWS-20260811-001',
    newsTitle: '集团召开数字化建设专题推进会',
    content: '希望把一线的需求也纳入课题来源。',
    phone: '13809876543',
    author: '李慧敏',
    dept: '透平机械',
    createdAt: '2026-08-11 10:19:43',
    hidden: false,
  },
  {
    id: 'CMT-0003',
    newsId: 'NEWS-20260811-001',
    newsTitle: '集团召开数字化建设专题推进会',
    content: '下班',
    phone: '13512345678',
    author: '赵鹏',
    dept: '透平机械',
    createdAt: '2026-08-11 09:41:32',
    hidden: true,
  },
  {
    id: 'CMT-0004',
    newsId: 'NEWS-20260810-002',
    newsTitle: '关于开展年度信息安全培训的通知',
    content: '附件里的名单打开是空的，麻烦核实一下。',
    phone: '13698765432',
    author: '陈晓东',
    dept: '能源工程',
    createdAt: '2026-08-10 16:20:12',
    hidden: false,
  },
  {
    id: 'CMT-0005',
    newsId: 'NEWS-20260810-002',
    newsTitle: '关于开展年度信息安全培训的通知',
    content: '第四批能不能改到下午？',
    phone: '13787654321',
    author: '周芸',
    dept: '能源工程',
    createdAt: '2026-08-10 14:59:41',
    hidden: false,
  },
  {
    id: 'CMT-0006',
    newsId: 'NEWS-20260809-003',
    newsTitle: '奋斗者｜十年磨一“机”：透平装配班组的毫米之争',
    content: '班组的老师傅带徒弟是真用心。',
    phone: '13901234567',
    author: '刘志强',
    dept: '智能装备',
    createdAt: '2026-08-09 18:15:40',
    hidden: false,
  },
  {
    id: 'CMT-0007',
    newsId: 'NEWS-20260809-003',
    newsTitle: '奋斗者｜十年磨一“机”：透平装配班组的毫米之争',
    content: '广告推广联系我 xxxxx',
    phone: '13312349876',
    author: '匿名用户',
    dept: '—',
    createdAt: '2026-08-09 17:52:30',
    hidden: true,
  },
  {
    id: 'CMT-0008',
    newsId: 'NEWS-20260808-004',
    newsTitle: '内刊 2026 年第 7 期上线',
    content: '内刊 PDF 在手机上打开有点慢。',
    phone: '13455556666',
    author: '孙悦',
    dept: '智能装备',
    createdAt: '2026-08-08 20:10:22',
    hidden: false,
  },
  {
    id: 'CMT-0009',
    newsId: 'NEWS-20260807-005',
    newsTitle: '学习｜能源系统节能技术要点解析',
    content: '案例三的改造前后数据能否补充一下？',
    phone: '13566667777',
    author: '郑文博',
    dept: '党群工作部',
    createdAt: '2026-08-07 15:31:05',
    hidden: false,
  },
  {
    id: 'CMT-0010',
    newsId: 'NEWS-20260807-005',
    newsTitle: '学习｜能源系统节能技术要点解析',
    content: '111',
    phone: '13677778888',
    author: '马丽娜',
    dept: '党群工作部',
    createdAt: '2026-08-07 12:04:18',
    hidden: true,
  },
  {
    id: 'CMT-0011',
    newsId: 'NEWS-20260803-011',
    newsTitle: '学习｜设备点检标准化作业指导',
    content: '点检表模板可以做成附件下载吗？',
    phone: '13788889999',
    author: '杨帆',
    dept: '信息管理部',
    createdAt: '2026-08-03 14:22:51',
    hidden: false,
  },
  {
    id: 'CMT-0012',
    newsId: 'NEWS-20260802-012',
    newsTitle: '奋斗者｜从图纸到现场：青年工程师的第一台机组',
    content: '年轻人成长很快，点赞。',
    phone: '13899990000',
    author: '何静',
    dept: '信息管理部',
    createdAt: '2026-08-02 19:08:33',
    hidden: false,
  },
]

const SEED_BANNERS: Banner[] = [
  {
    id: 'BAN-001',
    title: '数字化建设专题推进会',
    image: '/content/banner-meeting.png',
    slot: '首页顶部轮播',
    newsId: 'NEWS-20260811-001',
    sort: 1,
    online: true,
    owner: '李雯',
    createdAt: '2026-08-11 09:35:12',
  },
  {
    id: 'BAN-002',
    title: '年度信息安全培训',
    image: '/content/banner-training.png',
    slot: '通知专区轮播',
    newsId: 'NEWS-20260810-002',
    sort: 2,
    online: true,
    owner: '周敬',
    createdAt: '2026-08-10 14:30:00',
  },
  {
    id: 'BAN-003',
    title: '奋斗者·十年磨一“机”',
    image: '/content/banner-worker.png',
    slot: '资讯频道轮播',
    newsId: 'NEWS-20260809-003',
    sort: 3,
    online: true,
    owner: '李雯',
    createdAt: '2026-08-09 16:02:40',
  },
  {
    id: 'BAN-004',
    title: '智能运维实践（待上架）',
    image: '/content/banner-digital.png',
    slot: '资讯频道轮播',
    newsId: 'NEWS-20260807-005',
    sort: 4,
    online: false,
    owner: '赵启明',
    createdAt: '2026-08-07 11:00:00',
  },
]

/* ---------------- store ---------------- */

type State = {
  categories: Category[]
  news: NewsItem[]
  comments: CommentItem[]
  banners: Banner[]
}

let state: State = {
  categories: SEED_CATEGORIES,
  news: SEED_NEWS,
  comments: SEED_COMMENTS,
  banners: SEED_BANNERS,
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

export function useContent(): State {
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

let seq = 100
function nextId(prefix: string) {
  seq += 1
  return `${prefix}-${seq}`
}

/* ---------------- 类目动作 ---------------- */

export function addCategory(input: {
  name: string
  withAttachment: boolean
  remark: string
  owner: string
}): { ok: boolean; message: string } {
  const name = input.name.trim()
  if (!name) return { ok: false, message: '类目名称不能为空' }
  if (state.categories.some((c) => c.name === name)) {
    return { ok: false, message: '类目名称已存在' }
  }
  const item: Category = {
    id: nextId('CAT'),
    name,
    builtin: false,
    withAttachment: input.withAttachment,
    owner: input.owner,
    createdAt: stamp(),
    remark: input.remark.trim() || '—',
  }
  commit({ categories: [...state.categories, item] })
  return { ok: true, message: '类目已新增' }
}

export function removeCategories(ids: string[]): BatchResult[] {
  const results: BatchResult[] = []
  const keep: Category[] = []
  for (const c of state.categories) {
    if (!ids.includes(c.id)) {
      keep.push(c)
      continue
    }
    if (c.builtin) {
      keep.push(c)
      results.push({
        id: c.id,
        label: c.name,
        ok: false,
        message: '内置类目不允许删除',
      })
      continue
    }
    const used = state.news.filter((n) => n.category === c.name).length
    if (used > 0) {
      keep.push(c)
      results.push({
        id: c.id,
        label: c.name,
        ok: false,
        message: `该类目下仍有 ${used} 条资讯，需先转移或删除`,
      })
      continue
    }
    results.push({ id: c.id, label: c.name, ok: true, message: '已删除' })
  }
  commit({ categories: keep })
  return results
}

export function categoryNames(): string[] {
  return state.categories.map((c) => c.name)
}

export function newsCountOf(name: string): number {
  return state.news.filter((n) => n.category === name).length
}

/* ---------------- 资讯动作 ---------------- */

export function getNews(id: string): NewsItem | undefined {
  return state.news.find((n) => n.id === id)
}

export function createNews(input: {
  title: string
  category: string
  summary: string
  body: string
  cover: string
  sort: number
  top: boolean
  allowComment: boolean
  attachments: Attachment[]
  author: string
  dept: string
}): NewsItem {
  const ts = stamp()
  const item: NewsItem = {
    id: `NEWS-${ts.slice(0, 10).replace(/-/g, '')}-${nextId('N').slice(2)}`,
    title: input.title.trim() || '未命名草稿',
    category: input.category,
    summary: input.summary,
    body: input.body,
    cover: input.cover,
    author: input.author,
    dept: input.dept,
    status: '草稿',
    top: input.top,
    sort: input.sort,
    allowComment: input.allowComment,
    createdAt: ts,
    updatedAt: ts,
    publishedAt: '',
    publisher: '',
    views: 0,
    likes: 0,
    commentCount: 0,
    attachments: input.attachments,
  }
  commit({ news: [item, ...state.news] })
  return item
}

export function updateNews(id: string, patch: Partial<NewsItem>) {
  commit({
    news: state.news.map((n) =>
      n.id === id ? { ...n, ...patch, updatedAt: stamp() } : n,
    ),
  })
}

/** 发布：仅草稿可发布，发布后默认上架（已发布） */
export function publishNews(ids: string[], publisher: string): BatchResult[] {
  const ts = stamp()
  const results: BatchResult[] = []
  const news = state.news.map((n) => {
    if (!ids.includes(n.id)) return n
    if (n.status === '已发布') {
      results.push({ id: n.id, label: n.title, ok: false, message: '已是已发布状态' })
      return n
    }
    if (n.status === '已下架') {
      results.push({
        id: n.id,
        label: n.title,
        ok: false,
        message: '已下架内容请使用「上架」重新上架',
      })
      return n
    }
    if (!n.title.trim() || !n.body.trim()) {
      results.push({ id: n.id, label: n.title, ok: false, message: '标题或正文为空' })
      return n
    }
    if (!n.cover) {
      results.push({ id: n.id, label: n.title, ok: false, message: '缺少封面图' })
      return n
    }
    results.push({ id: n.id, label: n.title, ok: true, message: '已发布并上架' })
    return { ...n, status: '已发布' as NewsStatus, publishedAt: ts, publisher, updatedAt: ts }
  })
  commit({ news })
  return results
}

/** 上架：仅已下架可重新上架 */
export function putOnline(ids: string[]): BatchResult[] {
  const ts = stamp()
  const results: BatchResult[] = []
  const news = state.news.map((n) => {
    if (!ids.includes(n.id)) return n
    if (n.status === '草稿') {
      results.push({ id: n.id, label: n.title, ok: false, message: '草稿需先由发布人员发布' })
      return n
    }
    if (n.status === '已发布') {
      results.push({ id: n.id, label: n.title, ok: false, message: '已处于上架状态' })
      return n
    }
    if (!n.cover) {
      results.push({ id: n.id, label: n.title, ok: false, message: '缺少封面图，补齐后可上架' })
      return n
    }
    results.push({ id: n.id, label: n.title, ok: true, message: '已重新上架' })
    return { ...n, status: '已发布' as NewsStatus, updatedAt: ts }
  })
  commit({ news })
  return results
}

/** 下架：仅已发布可下架 */
export function takeOffline(ids: string[]): BatchResult[] {
  const ts = stamp()
  const results: BatchResult[] = []
  const news = state.news.map((n) => {
    if (!ids.includes(n.id)) return n
    if (n.status !== '已发布') {
      results.push({
        id: n.id,
        label: n.title,
        ok: false,
        message: n.status === '草稿' ? '草稿无需下架' : '已处于下架状态',
      })
      return n
    }
    results.push({ id: n.id, label: n.title, ok: true, message: '已下架，可随时重新上架' })
    return { ...n, status: '已下架' as NewsStatus, top: false, updatedAt: ts }
  })
  commit({ news })
  return results
}

export function setTop(ids: string[], top: boolean): BatchResult[] {
  const results: BatchResult[] = []
  const news = state.news.map((n) => {
    if (!ids.includes(n.id)) return n
    if (top && n.status !== '已发布') {
      results.push({ id: n.id, label: n.title, ok: false, message: '仅已发布内容可置顶' })
      return n
    }
    if (n.top === top) {
      results.push({
        id: n.id,
        label: n.title,
        ok: false,
        message: top ? '已在置顶状态' : '当前未置顶',
      })
      return n
    }
    results.push({ id: n.id, label: n.title, ok: true, message: top ? '已置顶' : '已取消置顶' })
    return { ...n, top, updatedAt: stamp() }
  })
  commit({ news })
  return results
}

export function setSort(id: string, sort: number) {
  updateNews(id, { sort })
}

export function removeNews(ids: string[]): BatchResult[] {
  const results: BatchResult[] = []
  const keep: NewsItem[] = []
  for (const n of state.news) {
    if (!ids.includes(n.id)) {
      keep.push(n)
      continue
    }
    if (n.status === '已发布') {
      keep.push(n)
      results.push({ id: n.id, label: n.title, ok: false, message: '请先下架后再删除' })
      continue
    }
    results.push({ id: n.id, label: n.title, ok: true, message: '已删除' })
  }
  const removed = state.news.filter((n) => ids.includes(n.id) && !keep.includes(n))
  commit({
    news: keep,
    comments: state.comments.filter((c) => !removed.some((n) => n.id === c.newsId)),
    banners: state.banners.filter((b) => !removed.some((n) => n.id === b.newsId)),
  })
  return results
}

/* ---------------- 评论治理动作 ---------------- */

export function setCommentHidden(ids: string[], hidden: boolean): BatchResult[] {
  const results: BatchResult[] = []
  const comments = state.comments.map((c) => {
    if (!ids.includes(c.id)) return c
    if (c.hidden === hidden) {
      results.push({
        id: c.id,
        label: c.content.slice(0, 12),
        ok: false,
        message: hidden ? '该评论已隐藏' : '该评论已是显示状态',
      })
      return c
    }
    results.push({
      id: c.id,
      label: c.content.slice(0, 12),
      ok: true,
      message: hidden ? '已隐藏' : '已恢复显示',
    })
    return { ...c, hidden }
  })
  commit({ comments })
  return results
}

export function removeComments(ids: string[]): BatchResult[] {
  const results: BatchResult[] = []
  const keep = state.comments.filter((c) => {
    if (!ids.includes(c.id)) return true
    results.push({ id: c.id, label: c.content.slice(0, 12), ok: true, message: '已删除' })
    return false
  })
  const news = state.news.map((n) => {
    const removed = ids.filter((id) =>
      state.comments.some((c) => c.id === id && c.newsId === n.id),
    ).length
    return removed ? { ...n, commentCount: Math.max(0, n.commentCount - removed) } : n
  })
  commit({ comments: keep, news })
  return results
}

/* ---------------- 轮播图动作 ---------------- */

export function saveBanner(input: {
  id?: string
  title: string
  image: string
  slot: Banner['slot']
  newsId: string
  sort: number
  owner: string
}): { ok: boolean; message: string } {
  if (!input.title.trim()) return { ok: false, message: '轮播标题不能为空' }
  if (!input.image) return { ok: false, message: '请选择轮播图片' }
  if (input.id) {
    commit({
      banners: state.banners.map((b) =>
        b.id === input.id
          ? {
              ...b,
              title: input.title.trim(),
              image: input.image,
              slot: input.slot,
              newsId: input.newsId,
              sort: input.sort,
            }
          : b,
      ),
    })
    return { ok: true, message: '轮播图已保存' }
  }
  const item: Banner = {
    id: nextId('BAN'),
    title: input.title.trim(),
    image: input.image,
    slot: input.slot,
    newsId: input.newsId,
    sort: input.sort,
    online: false,
    owner: input.owner,
    createdAt: stamp(),
  }
  commit({ banners: [...state.banners, item] })
  return { ok: true, message: '轮播图已新增（默认下架）' }
}

export function setBannerOnline(ids: string[], online: boolean): BatchResult[] {
  const results: BatchResult[] = []
  const banners = state.banners.map((b) => {
    if (!ids.includes(b.id)) return b
    if (b.online === online) {
      results.push({
        id: b.id,
        label: b.title,
        ok: false,
        message: online ? '已处于上架状态' : '已处于下架状态',
      })
      return b
    }
    if (online) {
      const target = state.news.find((n) => n.id === b.newsId)
      if (!target || target.status !== '已发布') {
        results.push({
          id: b.id,
          label: b.title,
          ok: false,
          message: '关联资讯未处于已发布状态',
        })
        return b
      }
    }
    results.push({ id: b.id, label: b.title, ok: true, message: online ? '已上架' : '已下架' })
    return { ...b, online }
  })
  commit({ banners })
  return results
}

export function setBannerSort(id: string, sort: number) {
  commit({
    banners: state.banners.map((b) => (b.id === id ? { ...b, sort } : b)),
  })
}

export function removeBanners(ids: string[]): BatchResult[] {
  const results: BatchResult[] = []
  const keep = state.banners.filter((b) => {
    if (!ids.includes(b.id)) return true
    if (b.online) {
      results.push({ id: b.id, label: b.title, ok: false, message: '请先下架后再删除' })
      return true
    }
    results.push({ id: b.id, label: b.title, ok: true, message: '已删除' })
    return false
  })
  commit({ banners: keep })
  return results
}

/** 可选封面 / 轮播图片素材（原型内置） */
export const IMAGE_LIBRARY = [
  { src: '/content/banner-meeting.png', name: '会议现场' },
  { src: '/content/banner-training.png', name: '培训课堂' },
  { src: '/content/banner-worker.png', name: '一线工匠' },
  { src: '/content/banner-digital.png', name: '智能运维' },
]
