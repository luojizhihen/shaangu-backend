'use client'

/**
 * 论坛模块（帖子 / 投票 / 评论回复 / 敏感词 / 治理日志）原型数据与状态。
 *
 * 业务基线（务必保持）：
 * - 论坛不分板块、不计积分、不提供分享转发。
 * - 图文帖与投票帖通过必填、格式、敏感词校验后「直接发布」，没有人工审核环节。
 * - 已发布内容永久只读：不提供编辑、保存修改、撤回发布、退回草稿。
 *   投票发布后选项、单/多选、截止时间与结果全部锁定。
 * - 需要修正时只能隐藏或逻辑删除原帖，再从新建入口发布新帖（新 ID，互动数据不迁移）。
 * - 逻辑删除是软删除：原始内容、互动数据、投票结果与治理日志始终保留。
 */

import * as React from 'react'

/* ---------------- 类型 ---------------- */

export type ForumContentType = '普通图文' | '投票'
/** 发布来源：与内容类型是两个完全独立的维度 */
export type ForumSource = 'APP员工发布' | '管理端发布'
/** 发布状态仅两种，永不出现「待审核 / 已驳回 / 已撤回」 */
export type ForumStatus = '草稿' | '已发布'
/** 展示状态：逻辑删除为软删除，数据保留 */
export type ForumVisibility = '显示中' | '已隐藏' | '已删除'
export type PersonStatus = '在职' | '离职'
export type PollMode = '单选' | '多选'
export type PollOptionMode = '文字' | '图片'

export type PollOption = {
  id: string
  label: string
  image: string
  votes: number
}

export type Poll = {
  mode: PollMode
  optionMode: PollOptionMode
  /** 截止时间，发布后锁定 */
  deadline: string
  options: PollOption[]
  participants: number
}

export type OfficialReply = {
  content: string
  operator: string
  at: string
}

export type ForumPost = {
  id: string
  type: ForumContentType
  title: string
  /** 正文 HTML 片段 */
  body: string
  /** 普通图文帖的可选图片 */
  images: string[]
  /** 投票帖的可选封面 */
  cover: string
  source: ForumSource
  status: ForumStatus
  visibility: ForumVisibility
  /** 隐藏原因在恢复后仍然保留，便于追溯 */
  hiddenReason: string
  deletedReason: string
  top: boolean
  /** 官方账号发布 */
  official: boolean
  nickname: string
  author: string
  employeeNo: string
  dept: string
  personStatus: PersonStatus
  role: string
  createdAt: string
  publishedAt: string
  views: number
  likes: number
  commentCount: number
  poll?: Poll
  officialReply?: OfficialReply
}

export type ForumComment = {
  id: string
  postId: string
  postTitle: string
  postType: ForumContentType
  /** 一级评论为 null，二级为所回复评论的 ID */
  parentId: string | null
  content: string
  nickname: string
  author: string
  employeeNo: string
  dept: string
  personStatus: PersonStatus
  official: boolean
  createdAt: string
  visibility: ForumVisibility
  hiddenReason: string
  deletedReason: string
}

export type WordMatch = '精确匹配' | '模糊匹配' | '正则匹配'
export type WordScope = '帖子' | '评论' | '回复' | '投票' | '反馈' | '内容发布'

export type SensitiveWord = {
  id: string
  word: string
  category: string
  match: WordMatch
  scopes: WordScope[]
  enabled: boolean
  updatedAt: string
  operator: string
}

export type GovernanceObjectType = '帖子' | '投票' | '评论' | '回复' | '敏感词'

export type GovernanceLog = {
  id: string
  operator: string
  role: string
  objectType: GovernanceObjectType
  objectId: string
  objectSummary: string
  action: string
  reason: string
  before: string
  after: string
  at: string
}

/** 批量操作逐条结果，与内容/视听模块共用展示组件 */
export type BatchResult = {
  id: string
  label: string
  ok: boolean
  message: string
}

export type Actor = { person: string; role: string }

/* ---------------- 常量 ---------------- */

export const FORUM_SOURCES: ForumSource[] = ['APP员工发布', '管理端发布']
export const FORUM_TYPES: ForumContentType[] = ['普通图文', '投票']
export const FORUM_VISIBILITIES: ForumVisibility[] = ['显示中', '已隐藏', '已删除']
export const PERSON_STATUSES: PersonStatus[] = ['在职', '离职']
export const WORD_MATCHES: WordMatch[] = ['精确匹配', '模糊匹配', '正则匹配']
export const WORD_SCOPES: WordScope[] = [
  '帖子',
  '评论',
  '回复',
  '投票',
  '反馈',
  '内容发布',
]
export const WORD_CATEGORIES = ['违规表达', '攻击辱骂', '广告导流', '涉密信息']

/** 命中敏感词后的唯一处理方式 */
export const SENSITIVE_POLICY = '命中后阻止提交并提示修改，不做自动替换，也不进入人工审核'

/* ---------------- 种子数据 ---------------- */

const SEED_POSTS: ForumPost[] = [
  {
    id: 'FP-20260810-001',
    type: '普通图文',
    title: '检修班组完成三号机组年度大修，分享几张现场照片',
    body:
      '<p>历时 11 天，三号机组年度大修顺利完成。整个过程里最难的是叶轮动平衡复测，班组连续两个夜班守在现场。</p><p>把几张现场照片发上来，也感谢配合我们的兄弟班组。</p>',
    images: ['/forum/post-team.png'],
    cover: '',
    source: 'APP员工发布',
    status: '已发布',
    visibility: '显示中',
    hiddenReason: '',
    deletedReason: '',
    top: true,
    official: false,
    nickname: '老马修机',
    author: '马涛',
    employeeNo: 'SG02194',
    dept: '检修分厂',
    personStatus: '在职',
    role: '普通员工',
    createdAt: '2026-08-10 08:12:31',
    publishedAt: '2026-08-10 08:12:31',
    views: 3820,
    likes: 264,
    commentCount: 4,
    officialReply: {
      content:
        '感谢检修班组的付出，本次大修的经验总结已同步至设备管理部，后续会形成标准作业指导。',
      operator: '刘思远',
      at: '2026-08-10 15:02:44',
    },
  },
  {
    id: 'FP-20260809-002',
    type: '投票',
    title: '通勤班车早班发车时间调整意见征集',
    body:
      '<p>近期收到较多关于早班车时间的反馈。请选择你更倾向的发车时间，我们会结合投票结果与厂区班次统一评估。</p>',
    images: [],
    cover: '/forum/poll-cover.png',
    source: '管理端发布',
    status: '已发布',
    visibility: '显示中',
    hiddenReason: '',
    deletedReason: '',
    top: false,
    official: true,
    nickname: '陕鼓融媒官方',
    author: '刘思远',
    employeeNo: 'SG00087',
    dept: '党群工作部',
    personStatus: '在职',
    role: '论坛管理员',
    createdAt: '2026-08-09 09:30:00',
    publishedAt: '2026-08-09 09:40:12',
    views: 5642,
    likes: 188,
    commentCount: 3,
    poll: {
      mode: '单选',
      optionMode: '文字',
      deadline: '2026-08-20 18:00',
      participants: 1426,
      options: [
        { id: 'PO-1', label: '提前到 06:40 发车', image: '', votes: 612 },
        { id: 'PO-2', label: '保持 07:00 发车', image: '', votes: 508 },
        { id: 'PO-3', label: '推迟到 07:20 发车', image: '', votes: 306 },
      ],
    },
  },
  {
    id: 'FP-20260808-003',
    type: '投票',
    title: '二食堂新增窗口方案选择（可多选）',
    body: '<p>两套窗口方案已完成初步测算，请选择你希望保留的方案，可多选。</p>',
    images: [],
    cover: '',
    source: '管理端发布',
    status: '已发布',
    visibility: '显示中',
    hiddenReason: '',
    deletedReason: '',
    top: false,
    official: true,
    nickname: '陕鼓融媒官方',
    author: '刘思远',
    employeeNo: 'SG00087',
    dept: '党群工作部',
    personStatus: '在职',
    role: '论坛管理员',
    createdAt: '2026-08-08 10:02:18',
    publishedAt: '2026-08-08 10:15:03',
    views: 4180,
    likes: 143,
    commentCount: 2,
    poll: {
      mode: '多选',
      optionMode: '图片',
      deadline: '2026-08-18 12:00',
      participants: 982,
      options: [
        { id: 'PO-4', label: '方案 A：现炒面食窗口', image: '/forum/canteen-a.png', votes: 704 },
        { id: 'PO-5', label: '方案 B：轻食沙拉窗口', image: '/forum/canteen-b.png', votes: 531 },
      ],
    },
  },
  {
    id: 'FP-20260807-004',
    type: '普通图文',
    title: '关于夜班餐补发放时间的疑问',
    body: '<p>上月夜班餐补到账时间比往常晚了一周，想了解一下流程上是否有调整。</p>',
    images: [],
    cover: '',
    source: 'APP员工发布',
    status: '已发布',
    visibility: '显示中',
    hiddenReason: '',
    deletedReason: '',
    top: false,
    official: false,
    nickname: '夜猫子',
    author: '陈晓',
    employeeNo: 'SG03318',
    dept: '总装分厂',
    personStatus: '在职',
    role: '普通员工',
    createdAt: '2026-08-07 22:41:09',
    publishedAt: '2026-08-07 22:41:09',
    views: 2140,
    likes: 76,
    commentCount: 3,
    officialReply: {
      content:
        '经核对，上月因系统对接调整延迟发放，本月起恢复每月 15 日随工资发放，感谢反馈。',
      operator: '刘思远',
      at: '2026-08-08 09:12:20',
    },
  },
  {
    id: 'FP-20260806-005',
    type: '普通图文',
    title: '转让二手电动车一辆，有意者联系（含外部链接）',
    body: '<p>车况良好，价格可谈，详情见外部链接与联系方式。</p>',
    images: [],
    cover: '',
    source: 'APP员工发布',
    status: '已发布',
    visibility: '已隐藏',
    hiddenReason: '内容属于个人交易广告，含外部导流链接，不符合论坛内容定位。',
    deletedReason: '',
    top: false,
    official: false,
    nickname: '闲鱼小王',
    author: '王宁',
    employeeNo: 'SG04471',
    dept: '质量部',
    personStatus: '在职',
    role: '普通员工',
    createdAt: '2026-08-06 12:20:44',
    publishedAt: '2026-08-06 12:20:44',
    views: 1502,
    likes: 12,
    commentCount: 1,
  },
  {
    id: 'FP-20260805-006',
    type: '普通图文',
    title: '对某位同事的不当评价（已逻辑删除）',
    body: '<p>原始内容因含人身攻击已被逻辑删除，此处仅作为治理留痕展示。</p>',
    images: [],
    cover: '',
    source: 'APP员工发布',
    status: '已发布',
    visibility: '已删除',
    hiddenReason: '',
    deletedReason: '含针对同事的人身攻击内容，违反论坛发言规范，执行逻辑删除并保留审计数据。',
    top: false,
    official: false,
    nickname: '匿名用户',
    author: '李海',
    employeeNo: 'SG05920',
    dept: '后勤中心',
    personStatus: '离职',
    role: '普通员工',
    createdAt: '2026-08-05 16:48:02',
    publishedAt: '2026-08-05 16:48:02',
    views: 860,
    likes: 3,
    commentCount: 2,
  },
  {
    id: 'FP-20260804-007',
    type: '投票',
    title: '技能比武项目设置意向调查（违规选项已逻辑删除）',
    body: '<p>原投票选项设置存在歧义并被举报，已整体逻辑删除，结果保留不清空。</p>',
    images: [],
    cover: '',
    source: '管理端发布',
    status: '已发布',
    visibility: '已删除',
    hiddenReason: '',
    deletedReason: '选项表述存在明显歧义并引发误解，逻辑删除后已重新发布修正版投票。',
    top: false,
    official: false,
    nickname: '技能大赛组委',
    author: '周文倩',
    employeeNo: 'SG01126',
    dept: '人力资源部',
    personStatus: '在职',
    role: '论坛管理员',
    createdAt: '2026-08-04 09:11:37',
    publishedAt: '2026-08-04 09:20:15',
    views: 1980,
    likes: 41,
    commentCount: 0,
    poll: {
      mode: '单选',
      optionMode: '文字',
      deadline: '2026-08-14 18:00',
      participants: 402,
      options: [
        { id: 'PO-6', label: '增设装配工种', image: '', votes: 210 },
        { id: 'PO-7', label: '增设焊接工种', image: '', votes: 192 },
      ],
    },
  },
  {
    id: 'FP-20260811-008',
    type: '普通图文',
    title: '八月安全生产月活动预告（草稿）',
    body: '<p>活动方案尚在确认，待定稿后发布。</p>',
    images: [],
    cover: '',
    source: '管理端发布',
    status: '草稿',
    visibility: '显示中',
    hiddenReason: '',
    deletedReason: '',
    top: false,
    official: true,
    nickname: '陕鼓融媒官方',
    author: '刘思远',
    employeeNo: 'SG00087',
    dept: '党群工作部',
    personStatus: '在职',
    role: '论坛管理员',
    createdAt: '2026-08-11 09:05:12',
    publishedAt: '',
    views: 0,
    likes: 0,
    commentCount: 0,
  },
]

const SEED_COMMENTS: ForumComment[] = [
  {
    id: 'FC-001',
    postId: 'FP-20260810-001',
    postTitle: '检修班组完成三号机组年度大修，分享几张现场照片',
    postType: '普通图文',
    parentId: null,
    content: '辛苦了，动平衡那段确实最费神，我们班组上次也卡在这儿。',
    nickname: '风叶如刀',
    author: '刘志强',
    employeeNo: 'SG02277',
    dept: '总装分厂',
    personStatus: '在职',
    official: false,
    createdAt: '2026-08-10 09:24:08',
    visibility: '显示中',
    hiddenReason: '',
    deletedReason: '',
  },
  {
    id: 'FC-002',
    postId: 'FP-20260810-001',
    postTitle: '检修班组完成三号机组年度大修，分享几张现场照片',
    postType: '普通图文',
    parentId: 'FC-001',
    content: '是的，这次我们提前做了配重预案，后面可以一起交流。',
    nickname: '老马修机',
    author: '马涛',
    employeeNo: 'SG02194',
    dept: '检修分厂',
    personStatus: '在职',
    official: false,
    createdAt: '2026-08-10 09:51:33',
    visibility: '显示中',
    hiddenReason: '',
    deletedReason: '',
  },
  {
    id: 'FC-003',
    postId: 'FP-20260810-001',
    postTitle: '检修班组完成三号机组年度大修，分享几张现场照片',
    postType: '普通图文',
    parentId: 'FC-001',
    content: '经验总结已同步设备管理部，后续会形成标准作业指导。',
    nickname: '陕鼓融媒官方',
    author: '刘思远',
    employeeNo: 'SG00087',
    dept: '党群工作部',
    personStatus: '在职',
    official: true,
    createdAt: '2026-08-10 15:03:10',
    visibility: '显示中',
    hiddenReason: '',
    deletedReason: '',
  },
  {
    id: 'FC-004',
    postId: 'FP-20260810-001',
    postTitle: '检修班组完成三号机组年度大修，分享几张现场照片',
    postType: '普通图文',
    parentId: null,
    content: '这种帖子有什么意义，天天发这些没用的。',
    nickname: '路人甲',
    author: '李海',
    employeeNo: 'SG05920',
    dept: '后勤中心',
    personStatus: '离职',
    official: false,
    createdAt: '2026-08-10 18:02:55',
    visibility: '已隐藏',
    hiddenReason: '内容带有明显贬损与挑动情绪表达，已隐藏处理。',
    deletedReason: '',
  },
  {
    id: 'FC-005',
    postId: 'FP-20260809-002',
    postTitle: '通勤班车早班发车时间调整意见征集',
    postType: '投票',
    parentId: null,
    content: '希望能同时考虑东厂区的接驳时间，06:40 对我们来说太早。',
    nickname: '东区通勤',
    author: '孙建国',
    employeeNo: 'SG02901',
    dept: '生产管理部',
    personStatus: '在职',
    official: false,
    createdAt: '2026-08-09 10:22:41',
    visibility: '显示中',
    hiddenReason: '',
    deletedReason: '',
  },
  {
    id: 'FC-006',
    postId: 'FP-20260809-002',
    postTitle: '通勤班车早班发车时间调整意见征集',
    postType: '投票',
    parentId: 'FC-005',
    content: '东厂区接驳会一并纳入评估，投票截止后统一答复。',
    nickname: '陕鼓融媒官方',
    author: '刘思远',
    employeeNo: 'SG00087',
    dept: '党群工作部',
    personStatus: '在职',
    official: true,
    createdAt: '2026-08-09 11:05:19',
    visibility: '显示中',
    hiddenReason: '',
    deletedReason: '',
  },
  {
    id: 'FC-007',
    postId: 'FP-20260809-002',
    postTitle: '通勤班车早班发车时间调整意见征集',
    postType: '投票',
    parentId: null,
    content: '投票是不是已经内定了，问了也没用。',
    nickname: '匿名同事',
    author: '高鹏',
    employeeNo: 'SG03042',
    dept: '技术中心',
    personStatus: '在职',
    official: false,
    createdAt: '2026-08-09 14:38:02',
    visibility: '已删除',
    hiddenReason: '',
    deletedReason: '内容为无依据的猜测且反复刷屏，逻辑删除后保留原文用于审计。',
  },
  {
    id: 'FC-008',
    postId: 'FP-20260808-003',
    postTitle: '二食堂新增窗口方案选择（可多选）',
    postType: '投票',
    parentId: null,
    content: '两个方案都想要，希望轻食窗口能延长供应时间。',
    nickname: '小陈',
    author: '陈晓',
    employeeNo: 'SG03318',
    dept: '总装分厂',
    personStatus: '在职',
    official: false,
    createdAt: '2026-08-08 12:31:47',
    visibility: '显示中',
    hiddenReason: '',
    deletedReason: '',
  },
  {
    id: 'FC-009',
    postId: 'FP-20260808-003',
    postTitle: '二食堂新增窗口方案选择（可多选）',
    postType: '投票',
    parentId: 'FC-008',
    content: '轻食窗口计划供应到 13:30，具体以最终方案为准。',
    nickname: '陕鼓融媒官方',
    author: '刘思远',
    employeeNo: 'SG00087',
    dept: '党群工作部',
    personStatus: '在职',
    official: true,
    createdAt: '2026-08-08 13:10:02',
    visibility: '显示中',
    hiddenReason: '',
    deletedReason: '',
  },
  {
    id: 'FC-010',
    postId: 'FP-20260807-004',
    postTitle: '关于夜班餐补发放时间的疑问',
    postType: '普通图文',
    parentId: null,
    content: '我们班组也遇到同样情况，希望能给个统一说明。',
    nickname: '三班倒',
    author: '郭亮',
    employeeNo: 'SG04120',
    dept: '服务事业部',
    personStatus: '在职',
    official: false,
    createdAt: '2026-08-07 23:10:26',
    visibility: '显示中',
    hiddenReason: '',
    deletedReason: '',
  },
  {
    id: 'FC-011',
    postId: 'FP-20260807-004',
    postTitle: '关于夜班餐补发放时间的疑问',
    postType: '普通图文',
    parentId: 'FC-010',
    content: '本月起恢复每月 15 日随工资发放，已在帖内官方回复说明。',
    nickname: '陕鼓融媒官方',
    author: '刘思远',
    employeeNo: 'SG00087',
    dept: '党群工作部',
    personStatus: '在职',
    official: true,
    createdAt: '2026-08-08 09:13:41',
    visibility: '显示中',
    hiddenReason: '',
    deletedReason: '',
  },
  {
    id: 'FC-012',
    postId: 'FP-20260806-005',
    postTitle: '转让二手电动车一辆，有意者联系（含外部链接）',
    postType: '普通图文',
    parentId: null,
    content: '价格能再谈吗，私聊我。',
    nickname: '同事乙',
    author: '张倩',
    employeeNo: 'SG03755',
    dept: '检修分厂',
    personStatus: '在职',
    official: false,
    createdAt: '2026-08-06 13:02:11',
    visibility: '已隐藏',
    hiddenReason: '所属帖子已隐藏，评论同步隐藏处理。',
    deletedReason: '',
  },
]

const SEED_WORDS: SensitiveWord[] = [
  {
    id: 'SW-001',
    word: '示例词条 A',
    category: '违规表达',
    match: '精确匹配',
    scopes: ['帖子', '评论', '回复', '投票'],
    enabled: true,
    updatedAt: '2026-08-01 09:12:00',
    operator: '刘思远',
  },
  {
    id: 'SW-002',
    word: '示例词条 B',
    category: '攻击辱骂',
    match: '模糊匹配',
    scopes: ['帖子', '评论', '回复'],
    enabled: true,
    updatedAt: '2026-08-02 10:31:20',
    operator: '刘思远',
  },
  {
    id: 'SW-003',
    word: '示例词条 C',
    category: '广告导流',
    match: '模糊匹配',
    scopes: ['帖子', '评论', '回复', '投票', '反馈'],
    enabled: true,
    updatedAt: '2026-08-03 15:02:44',
    operator: '周敬',
  },
  {
    id: 'SW-004',
    word: '示例词条 D',
    category: '涉密信息',
    match: '精确匹配',
    scopes: ['帖子', '投票', '内容发布'],
    enabled: true,
    updatedAt: '2026-08-04 08:45:10',
    operator: '周敬',
  },
  {
    id: 'SW-005',
    word: '示例词条 E',
    category: '违规表达',
    match: '正则匹配',
    scopes: ['评论', '回复'],
    enabled: false,
    updatedAt: '2026-08-05 17:20:33',
    operator: '刘思远',
  },
  {
    id: 'SW-006',
    word: '示例词条 F',
    category: '广告导流',
    match: '模糊匹配',
    scopes: ['帖子', '反馈'],
    enabled: true,
    updatedAt: '2026-08-06 11:08:52',
    operator: '刘思远',
  },
]

const SEED_LOGS: GovernanceLog[] = [
  {
    id: 'GL-0006',
    operator: '刘思远',
    role: '论坛管理员',
    objectType: '帖子',
    objectId: 'FP-20260810-001',
    objectSummary: '检修班组完成三号机组年度大修，分享几张现场照片',
    action: '官方回复',
    reason: '统一答复大修经验沉淀问题',
    before: '无官方回复',
    after: '已附官方回复',
    at: '2026-08-10 15:02:44',
  },
  {
    id: 'GL-0005',
    operator: '刘思远',
    role: '论坛管理员',
    objectType: '帖子',
    objectId: 'FP-20260810-001',
    objectSummary: '检修班组完成三号机组年度大修，分享几张现场照片',
    action: '置顶',
    reason: '一线班组正向案例，置顶展示',
    before: '未置顶',
    after: '已置顶',
    at: '2026-08-10 10:22:05',
  },
  {
    id: 'GL-0004',
    operator: '刘思远',
    role: '论坛管理员',
    objectType: '评论',
    objectId: 'FC-004',
    objectSummary: '这种帖子有什么意义，天天发这些没用的。',
    action: '隐藏',
    reason: '内容带有明显贬损与挑动情绪表达，已隐藏处理。',
    before: '显示中',
    after: '已隐藏',
    at: '2026-08-10 18:40:12',
  },
  {
    id: 'GL-0003',
    operator: '刘思远',
    role: '论坛管理员',
    objectType: '回复',
    objectId: 'FC-007',
    objectSummary: '投票是不是已经内定了，问了也没用。',
    action: '逻辑删除',
    reason: '内容为无依据的猜测且反复刷屏，逻辑删除后保留原文用于审计。',
    before: '显示中',
    after: '已删除（软删除，数据保留）',
    at: '2026-08-09 15:12:38',
  },
  {
    id: 'GL-0002',
    operator: '刘思远',
    role: '论坛管理员',
    objectType: '帖子',
    objectId: 'FP-20260806-005',
    objectSummary: '转让二手电动车一辆，有意者联系（含外部链接）',
    action: '隐藏',
    reason: '内容属于个人交易广告，含外部导流链接，不符合论坛内容定位。',
    before: '显示中',
    after: '已隐藏',
    at: '2026-08-06 14:31:09',
  },
  {
    id: 'GL-0001',
    operator: '张亦驰',
    role: '超级管理员',
    objectType: '投票',
    objectId: 'FP-20260804-007',
    objectSummary: '技能比武项目设置意向调查（违规选项已逻辑删除）',
    action: '逻辑删除',
    reason: '选项表述存在明显歧义并引发误解，逻辑删除后已重新发布修正版投票。',
    before: '显示中',
    after: '已删除（软删除，投票结果保留）',
    at: '2026-08-05 09:02:47',
  },
]

/* ---------------- store ---------------- */

type State = {
  posts: ForumPost[]
  comments: ForumComment[]
  words: SensitiveWord[]
  logs: GovernanceLog[]
}

let state: State = {
  posts: SEED_POSTS,
  comments: SEED_COMMENTS,
  words: SEED_WORDS,
  logs: SEED_LOGS,
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

export function useForum(): State {
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

let seq = 300
function nextSeq() {
  seq += 1
  return seq
}

export function plainText(html: string) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function visibilityTone(v: ForumVisibility) {
  if (v === '显示中') return 'success' as const
  if (v === '已隐藏') return 'warning' as const
  return 'danger' as const
}

export function statusTone(s: ForumStatus) {
  return s === '已发布' ? ('success' as const) : ('neutral' as const)
}

/** 投票是否已到截止时间（仅用于展示，结果始终锁定） */
export function pollClosed(poll: Poll) {
  const end = new Date(poll.deadline.replace(' ', 'T'))
  return Number.isFinite(end.getTime()) ? end.getTime() < Date.now() : false
}

export function getForumPost(id: string) {
  return state.posts.find((p) => p.id === id)
}

export function commentsOfPost(id: string) {
  return state.comments.filter((c) => c.postId === id)
}

export function logsOfObject(id: string) {
  return state.logs.filter((l) => l.objectId === id)
}

/* ---------------- 治理日志 ---------------- */

function log(entry: Omit<GovernanceLog, 'id' | 'at'>) {
  const item: GovernanceLog = {
    ...entry,
    id: `GL-${String(nextSeq()).padStart(4, '0')}`,
    at: stamp(),
  }
  state = { ...state, logs: [item, ...state.logs] }
}

/* ---------------- 敏感词校验 ---------------- */

export type SensitiveHit = { word: string; category: string; match: WordMatch }

/** 命中即阻止提交；不做替换发布，也不进入人工审核 */
export function checkSensitive(text: string, scope: WordScope): SensitiveHit[] {
  const target = text.toLowerCase()
  const compact = target.replace(/\s+/g, '')
  const hits: SensitiveHit[] = []
  for (const w of state.words) {
    if (!w.enabled || !w.scopes.includes(scope)) continue
    const key = w.word.toLowerCase()
    let hit = false
    if (w.match === '正则匹配') {
      try {
        hit = new RegExp(w.word, 'i').test(text)
      } catch {
        hit = false
      }
    } else {
      hit = target.includes(key) || compact.includes(key.replace(/\s+/g, ''))
    }
    if (hit) hits.push({ word: w.word, category: w.category, match: w.match })
  }
  return hits
}

export type ValidationIssue = { field: string; message: string }

export type PostDraftInput = {
  title: string
  body: string
  images: string[]
  official: boolean
}

export type PollDraftInput = {
  title: string
  body: string
  cover: string
  mode: PollMode
  optionMode: PollOptionMode
  deadline: string
  options: { id: string; label: string; image: string }[]
  official: boolean
}

/** 普通图文帖必填与格式校验 */
export function validatePost(input: PostDraftInput): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const title = input.title.trim()
  const text = plainText(input.body)

  if (!title) issues.push({ field: '标题', message: '标题为必填项' })
  else if (title.length < 4) issues.push({ field: '标题', message: '标题不少于 4 个字' })
  else if (title.length > 60) issues.push({ field: '标题', message: '标题不超过 60 个字' })

  if (!text) issues.push({ field: '正文', message: '正文为必填项' })
  else if (text.length < 10) issues.push({ field: '正文', message: '正文不少于 10 个字' })
  else if (text.length > 5000)
    issues.push({ field: '正文', message: '正文不超过 5000 个字' })

  if (input.images.length > 9)
    issues.push({ field: '图片', message: '图片最多上传 9 张' })

  for (const h of checkSensitive(`${title} ${text}`, '帖子')) {
    issues.push({
      field: '敏感词',
      message: `命中「${h.word}」（${h.category} · ${h.match}），请修改后再提交`,
    })
  }
  return issues
}

/** 投票帖必填与格式校验 */
export function validatePoll(input: PollDraftInput): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const title = input.title.trim()
  const text = plainText(input.body)

  if (!title) issues.push({ field: '标题', message: '标题为必填项' })
  else if (title.length < 4) issues.push({ field: '标题', message: '标题不少于 4 个字' })
  else if (title.length > 60) issues.push({ field: '标题', message: '标题不超过 60 个字' })

  if (!text) issues.push({ field: '正文', message: '正文为必填项' })
  else if (text.length < 10) issues.push({ field: '正文', message: '正文不少于 10 个字' })

  if (input.options.length < 2)
    issues.push({ field: '投票选项', message: '至少需要 2 个选项' })
  if (input.options.length > 8)
    issues.push({ field: '投票选项', message: '最多支持 8 个选项' })

  input.options.forEach((o, i) => {
    if (!o.label.trim())
      issues.push({ field: `选项 ${i + 1}`, message: '选项文字为必填项' })
    else if (o.label.trim().length > 30)
      issues.push({ field: `选项 ${i + 1}`, message: '选项文字不超过 30 个字' })
    if (input.optionMode === '图片' && !o.image)
      issues.push({ field: `选项 ${i + 1}`, message: '图片选项需上传对应图片' })
  })

  const labels = input.options.map((o) => o.label.trim()).filter(Boolean)
  if (new Set(labels).size !== labels.length)
    issues.push({ field: '投票选项', message: '选项文字不可重复' })

  if (!input.deadline) issues.push({ field: '截止时间', message: '截止时间为必填项' })
  else {
    const end = new Date(input.deadline.replace(' ', 'T'))
    if (!Number.isFinite(end.getTime()))
      issues.push({ field: '截止时间', message: '截止时间格式不正确' })
    else if (end.getTime() <= Date.now())
      issues.push({ field: '截止时间', message: '截止时间必须晚于当前时间' })
  }

  const optionText = input.options.map((o) => o.label).join(' ')
  for (const h of checkSensitive(`${title} ${text} ${optionText}`, '投票')) {
    issues.push({
      field: '敏感词',
      message: `命中「${h.word}」（${h.category} · ${h.match}），请修改后再提交`,
    })
  }
  return issues
}

/* ---------------- 帖子 / 投票创建 ---------------- */

function baseAuthorInfo(actor: Actor, official: boolean) {
  return {
    source: '管理端发布' as ForumSource,
    official,
    nickname: official ? '陕鼓融媒官方' : actor.person,
    author: actor.person,
    employeeNo: 'SG00087',
    dept: '党群工作部',
    personStatus: '在职' as PersonStatus,
    role: actor.role,
  }
}

/**
 * 新建图文帖。publish=true 时校验通过即「直接发布」，不存在审核态。
 * 每次新建都会生成新的内容 ID，不迁移任何历史互动数据。
 */
export function createForumPost(
  input: PostDraftInput,
  publish: boolean,
  actor: Actor,
): ForumPost {
  const ts = stamp()
  const post: ForumPost = {
    id: `FP-${ts.slice(0, 10).replace(/-/g, '')}-${String(nextSeq()).padStart(3, '0')}`,
    type: '普通图文',
    title: input.title.trim() || '未命名草稿',
    body: input.body,
    images: input.images,
    cover: '',
    status: publish ? '已发布' : '草稿',
    visibility: '显示中',
    hiddenReason: '',
    deletedReason: '',
    top: false,
    createdAt: ts,
    publishedAt: publish ? ts : '',
    views: 0,
    likes: 0,
    commentCount: 0,
    ...baseAuthorInfo(actor, input.official),
  }
  commit({ posts: [post, ...state.posts] })
  if (publish) {
    log({
      operator: actor.person,
      role: actor.role,
      objectType: '帖子',
      objectId: post.id,
      objectSummary: post.title,
      action: '直接发布',
      reason: '必填、格式与敏感词校验通过',
      before: '新建',
      after: '已发布（发布后只读）',
    })
    commit({})
  }
  return post
}

/** 新建投票帖。发布后选项、单/多选、截止时间与结果全部锁定。 */
export function createForumPoll(
  input: PollDraftInput,
  publish: boolean,
  actor: Actor,
): ForumPost {
  const ts = stamp()
  const post: ForumPost = {
    id: `FP-${ts.slice(0, 10).replace(/-/g, '')}-${String(nextSeq()).padStart(3, '0')}`,
    type: '投票',
    title: input.title.trim() || '未命名投票草稿',
    body: input.body,
    images: [],
    cover: input.cover,
    status: publish ? '已发布' : '草稿',
    visibility: '显示中',
    hiddenReason: '',
    deletedReason: '',
    top: false,
    createdAt: ts,
    publishedAt: publish ? ts : '',
    views: 0,
    likes: 0,
    commentCount: 0,
    poll: {
      mode: input.mode,
      optionMode: input.optionMode,
      deadline: input.deadline,
      participants: 0,
      options: input.options.map((o, i) => ({
        id: `PO-${nextSeq()}-${i}`,
        label: o.label.trim(),
        image: o.image,
        votes: 0,
      })),
    },
    ...baseAuthorInfo(actor, input.official),
  }
  commit({ posts: [post, ...state.posts] })
  if (publish) {
    log({
      operator: actor.person,
      role: actor.role,
      objectType: '投票',
      objectId: post.id,
      objectSummary: post.title,
      action: '直接发布',
      reason: '必填、格式与敏感词校验通过',
      before: '新建',
      after: '已发布（选项、单/多选、截止时间与结果锁定）',
    })
    commit({})
  }
  return post
}

/* ---------------- 草稿发布 ---------------- */

/**
 * 发布已保存的草稿。仅草稿可发布，发布后即进入永久只读状态。
 * 校验不通过时返回具体问题，不存在人工审核环节。
 */
export function publishForumDraft(
  id: string,
  actor: Actor,
): { ok: boolean; message: string; issues: ValidationIssue[] } {
  const post = state.posts.find((p) => p.id === id)
  if (!post) return { ok: false, message: '未找到该内容', issues: [] }
  if (post.status === '已发布') {
    return { ok: false, message: '该内容已发布，发布后永久只读', issues: [] }
  }

  const issues =
    post.type === '投票' && post.poll
      ? validatePoll({
          title: post.title,
          body: post.body,
          cover: post.cover,
          mode: post.poll.mode,
          optionMode: post.poll.optionMode,
          deadline: post.poll.deadline,
          options: post.poll.options.map((o) => ({
            id: o.id,
            label: o.label,
            image: o.image,
          })),
          official: post.official,
        })
      : validatePost({
          title: post.title,
          body: post.body,
          images: post.images,
          official: post.official,
        })

  if (issues.length > 0) {
    return { ok: false, message: `校验未通过，共 ${issues.length} 项需修改`, issues }
  }

  const ts = stamp()
  log({
    operator: actor.person,
    role: actor.role,
    objectType: post.type === '投票' ? '投票' : '帖子',
    objectId: post.id,
    objectSummary: post.title,
    action: '直接发布',
    reason: '草稿校验通过后直接发布',
    before: '草稿',
    after:
      post.type === '投票'
        ? '已发布（选项、单/多选、截止时间与结果锁定）'
        : '已发布（发布后只读）',
  })
  commit({
    posts: state.posts.map((p) =>
      p.id === id ? { ...p, status: '已发布' as ForumStatus, publishedAt: ts } : p,
    ),
  })
  return { ok: true, message: '已发布，内容进入永久只读状态', issues: [] }
}

/* ---------------- 帖子事后治理 ---------------- */

function objectTypeOf(p: ForumPost): GovernanceObjectType {
  return p.type === '投票' ? '投票' : '帖子'
}

/** 隐藏：需填写原因；恢复后隐藏原因仍保留 */
export function hideForumPosts(
  ids: string[],
  reason: string,
  actor: Actor,
): BatchResult[] {
  const results: BatchResult[] = []
  const posts = state.posts.map((p) => {
    if (!ids.includes(p.id)) return p
    if (p.status !== '已发布') {
      results.push({ id: p.id, label: p.title, ok: false, message: '草稿无需隐藏' })
      return p
    }
    if (p.visibility === '已删除') {
      results.push({ id: p.id, label: p.title, ok: false, message: '已逻辑删除，无需隐藏' })
      return p
    }
    if (p.visibility === '已隐藏') {
      results.push({ id: p.id, label: p.title, ok: false, message: '已处于隐藏状态' })
      return p
    }
    log({
      operator: actor.person,
      role: actor.role,
      objectType: objectTypeOf(p),
      objectId: p.id,
      objectSummary: p.title,
      action: '隐藏',
      reason,
      before: '显示中',
      after: '已隐藏',
    })
    results.push({ id: p.id, label: p.title, ok: true, message: '已隐藏，用户端不再展示' })
    return { ...p, visibility: '已隐藏' as ForumVisibility, hiddenReason: reason, top: false }
  })
  commit({ posts })
  return results
}

/** 恢复显示：仅隐藏态可恢复，逻辑删除不可恢复 */
export function restoreForumPosts(ids: string[], actor: Actor): BatchResult[] {
  const results: BatchResult[] = []
  const posts = state.posts.map((p) => {
    if (!ids.includes(p.id)) return p
    if (p.visibility === '已删除') {
      results.push({
        id: p.id,
        label: p.title,
        ok: false,
        message: '已逻辑删除的内容不可恢复，请新建并发布修正版',
      })
      return p
    }
    if (p.visibility !== '已隐藏') {
      results.push({ id: p.id, label: p.title, ok: false, message: '当前已是显示状态' })
      return p
    }
    log({
      operator: actor.person,
      role: actor.role,
      objectType: objectTypeOf(p),
      objectId: p.id,
      objectSummary: p.title,
      action: '恢复显示',
      reason: `原隐藏原因：${p.hiddenReason || '未填写'}`,
      before: '已隐藏',
      after: '显示中（保留隐藏原因）',
    })
    results.push({ id: p.id, label: p.title, ok: true, message: '已恢复显示' })
    return { ...p, visibility: '显示中' as ForumVisibility }
  })
  commit({ posts })
  return results
}

/** 逻辑删除（软删除）：原始内容、互动数据与投票结果全部保留 */
export function softDeleteForumPosts(
  ids: string[],
  reason: string,
  actor: Actor,
): BatchResult[] {
  const results: BatchResult[] = []
  const posts = state.posts.map((p) => {
    if (!ids.includes(p.id)) return p
    if (p.visibility === '已删除') {
      results.push({ id: p.id, label: p.title, ok: false, message: '已处于逻辑删除状态' })
      return p
    }
    log({
      operator: actor.person,
      role: actor.role,
      objectType: objectTypeOf(p),
      objectId: p.id,
      objectSummary: p.title,
      action: '逻辑删除',
      reason,
      before: p.visibility,
      after:
        p.type === '投票'
          ? '已删除（软删除，投票结果保留）'
          : '已删除（软删除，互动数据保留）',
    })
    results.push({
      id: p.id,
      label: p.title,
      ok: true,
      message: '已逻辑删除，原始内容与互动数据保留',
    })
    return {
      ...p,
      visibility: '已删除' as ForumVisibility,
      deletedReason: reason,
      top: false,
    }
  })
  commit({ posts })
  return results
}

export function setForumPostTop(ids: string[], top: boolean, actor: Actor): BatchResult[] {
  const results: BatchResult[] = []
  const posts = state.posts.map((p) => {
    if (!ids.includes(p.id)) return p
    if (top && (p.status !== '已发布' || p.visibility !== '显示中')) {
      results.push({
        id: p.id,
        label: p.title,
        ok: false,
        message: '仅显示中的已发布内容可置顶',
      })
      return p
    }
    if (p.top === top) {
      results.push({
        id: p.id,
        label: p.title,
        ok: false,
        message: top ? '已在置顶状态' : '当前未置顶',
      })
      return p
    }
    log({
      operator: actor.person,
      role: actor.role,
      objectType: objectTypeOf(p),
      objectId: p.id,
      objectSummary: p.title,
      action: top ? '置顶' : '取消置顶',
      reason: top ? '列表置顶展示' : '取消列表置顶',
      before: p.top ? '已置顶' : '未置顶',
      after: top ? '已置顶' : '未置顶',
    })
    results.push({
      id: p.id,
      label: p.title,
      ok: true,
      message: top ? '已置顶' : '已取消置顶',
    })
    return { ...p, top }
  })
  commit({ posts })
  return results
}

/** 官方回复：追加在帖子下方，不修改原帖正文 */
export function replyOfficial(id: string, content: string, actor: Actor): BatchResult {
  const post = state.posts.find((p) => p.id === id)
  if (!post) return { id, label: id, ok: false, message: '未找到该内容' }
  if (post.status !== '已发布') {
    return { id, label: post.title, ok: false, message: '草稿不支持官方回复' }
  }
  const hits = checkSensitive(content, '回复')
  if (hits.length > 0) {
    return {
      id,
      label: post.title,
      ok: false,
      message: `官方回复命中敏感词「${hits[0].word}」，请修改后再提交`,
    }
  }
  const reply: OfficialReply = { content: content.trim(), operator: actor.person, at: stamp() }
  log({
    operator: actor.person,
    role: actor.role,
    objectType: objectTypeOf(post),
    objectId: post.id,
    objectSummary: post.title,
    action: '官方回复',
    reason: content.trim().slice(0, 40),
    before: post.officialReply ? '已有官方回复' : '无官方回复',
    after: '已附官方回复',
  })
  commit({
    posts: state.posts.map((p) => (p.id === id ? { ...p, officialReply: reply } : p)),
  })
  return { id, label: post.title, ok: true, message: '官方回复已发布' }
}

/* ---------------- 评论 / 回复治理 ---------------- */

function commentObjectType(c: ForumComment): GovernanceObjectType {
  return c.parentId ? '回复' : '评论'
}

export function hideForumComments(
  ids: string[],
  reason: string,
  actor: Actor,
): BatchResult[] {
  const results: BatchResult[] = []
  const comments = state.comments.map((c) => {
    if (!ids.includes(c.id)) return c
    if (c.visibility === '已删除') {
      results.push({
        id: c.id,
        label: c.content.slice(0, 14),
        ok: false,
        message: '已逻辑删除，无需隐藏',
      })
      return c
    }
    if (c.visibility === '已隐藏') {
      results.push({
        id: c.id,
        label: c.content.slice(0, 14),
        ok: false,
        message: '已处于隐藏状态',
      })
      return c
    }
    log({
      operator: actor.person,
      role: actor.role,
      objectType: commentObjectType(c),
      objectId: c.id,
      objectSummary: c.content.slice(0, 40),
      action: '隐藏',
      reason,
      before: '显示中',
      after: '已隐藏',
    })
    results.push({ id: c.id, label: c.content.slice(0, 14), ok: true, message: '已隐藏' })
    return { ...c, visibility: '已隐藏' as ForumVisibility, hiddenReason: reason }
  })
  commit({ comments })
  return results
}

export function restoreForumComments(ids: string[], actor: Actor): BatchResult[] {
  const results: BatchResult[] = []
  const comments = state.comments.map((c) => {
    if (!ids.includes(c.id)) return c
    if (c.visibility === '已删除') {
      results.push({
        id: c.id,
        label: c.content.slice(0, 14),
        ok: false,
        message: '已逻辑删除的内容不可恢复',
      })
      return c
    }
    if (c.visibility !== '已隐藏') {
      results.push({
        id: c.id,
        label: c.content.slice(0, 14),
        ok: false,
        message: '当前已是显示状态',
      })
      return c
    }
    log({
      operator: actor.person,
      role: actor.role,
      objectType: commentObjectType(c),
      objectId: c.id,
      objectSummary: c.content.slice(0, 40),
      action: '恢复显示',
      reason: `原隐藏原因：${c.hiddenReason || '未填写'}`,
      before: '已隐藏',
      after: '显示中（保留隐藏原因）',
    })
    results.push({
      id: c.id,
      label: c.content.slice(0, 14),
      ok: true,
      message: '已恢复显示',
    })
    return { ...c, visibility: '显示中' as ForumVisibility }
  })
  commit({ comments })
  return results
}

export function softDeleteForumComments(
  ids: string[],
  reason: string,
  actor: Actor,
): BatchResult[] {
  const results: BatchResult[] = []
  const comments = state.comments.map((c) => {
    if (!ids.includes(c.id)) return c
    if (c.visibility === '已删除') {
      results.push({
        id: c.id,
        label: c.content.slice(0, 14),
        ok: false,
        message: '已处于逻辑删除状态',
      })
      return c
    }
    log({
      operator: actor.person,
      role: actor.role,
      objectType: commentObjectType(c),
      objectId: c.id,
      objectSummary: c.content.slice(0, 40),
      action: '逻辑删除',
      reason,
      before: c.visibility,
      after: '已删除（软删除，原文保留）',
    })
    results.push({
      id: c.id,
      label: c.content.slice(0, 14),
      ok: true,
      message: '已逻辑删除，原文保留',
    })
    return { ...c, visibility: '已删除' as ForumVisibility, deletedReason: reason }
  })
  commit({ comments })
  return results
}

/* ---------------- 敏感词维护 ---------------- */

export type WordInput = {
  word: string
  category: string
  match: WordMatch
  scopes: WordScope[]
  enabled: boolean
}

export function createWord(input: WordInput, actor: Actor): BatchResult {
  const word = input.word.trim()
  if (!word) return { id: '-', label: word, ok: false, message: '词条不能为空' }
  if (state.words.some((w) => w.word === word)) {
    return { id: '-', label: word, ok: false, message: '该词条已存在' }
  }
  if (input.scopes.length === 0) {
    return { id: '-', label: word, ok: false, message: '至少选择一个作用范围' }
  }
  const item: SensitiveWord = {
    id: `SW-${String(nextSeq()).padStart(3, '0')}`,
    word,
    category: input.category,
    match: input.match,
    scopes: input.scopes,
    enabled: input.enabled,
    updatedAt: stamp(),
    operator: actor.person,
  }
  log({
    operator: actor.person,
    role: actor.role,
    objectType: '敏感词',
    objectId: item.id,
    objectSummary: item.word,
    action: '新增词条',
    reason: `分类 ${item.category} · ${item.match}`,
    before: '不存在',
    after: item.enabled ? '已启用' : '已停用',
  })
  commit({ words: [item, ...state.words] })
  return { id: item.id, label: item.word, ok: true, message: '已新增' }
}

export function updateWord(id: string, input: WordInput, actor: Actor): BatchResult {
  const before = state.words.find((w) => w.id === id)
  if (!before) return { id, label: id, ok: false, message: '未找到该词条' }
  if (!input.word.trim()) return { id, label: id, ok: false, message: '词条不能为空' }
  if (input.scopes.length === 0) {
    return { id, label: input.word, ok: false, message: '至少选择一个作用范围' }
  }
  log({
    operator: actor.person,
    role: actor.role,
    objectType: '敏感词',
    objectId: id,
    objectSummary: input.word.trim(),
    action: '编辑词条',
    reason: `分类 ${input.category} · ${input.match}`,
    before: `${before.word}（${before.match}）`,
    after: `${input.word.trim()}（${input.match}）`,
  })
  commit({
    words: state.words.map((w) =>
      w.id === id
        ? {
            ...w,
            ...input,
            word: input.word.trim(),
            updatedAt: stamp(),
            operator: actor.person,
          }
        : w,
    ),
  })
  return { id, label: input.word, ok: true, message: '已保存' }
}

export function toggleWords(ids: string[], enabled: boolean, actor: Actor): BatchResult[] {
  const results: BatchResult[] = []
  const words = state.words.map((w) => {
    if (!ids.includes(w.id)) return w
    if (w.enabled === enabled) {
      results.push({
        id: w.id,
        label: w.word,
        ok: false,
        message: enabled ? '已处于启用状态' : '已处于停用状态',
      })
      return w
    }
    log({
      operator: actor.person,
      role: actor.role,
      objectType: '敏感词',
      objectId: w.id,
      objectSummary: w.word,
      action: enabled ? '启用词条' : '停用词条',
      reason: enabled ? '纳入拦截范围' : '暂不参与拦截',
      before: w.enabled ? '已启用' : '已停用',
      after: enabled ? '已启用' : '已停用',
    })
    results.push({
      id: w.id,
      label: w.word,
      ok: true,
      message: enabled ? '已启用' : '已停用',
    })
    return { ...w, enabled, updatedAt: stamp(), operator: actor.person }
  })
  commit({ words })
  return results
}

/** 批量导入：每行一个词条，重复词条按失败返回 */
export function importWords(
  lines: string[],
  category: string,
  match: WordMatch,
  scopes: WordScope[],
  actor: Actor,
): BatchResult[] {
  const results: BatchResult[] = []
  const added: SensitiveWord[] = []
  for (const raw of lines) {
    const word = raw.trim()
    if (!word) continue
    if (state.words.some((w) => w.word === word) || added.some((w) => w.word === word)) {
      results.push({ id: '-', label: word, ok: false, message: '词条重复，已跳过' })
      continue
    }
    const item: SensitiveWord = {
      id: `SW-${String(nextSeq()).padStart(3, '0')}`,
      word,
      category,
      match,
      scopes,
      enabled: true,
      updatedAt: stamp(),
      operator: actor.person,
    }
    added.push(item)
    results.push({ id: item.id, label: word, ok: true, message: '已导入并启用' })
  }
  if (added.length > 0) {
    log({
      operator: actor.person,
      role: actor.role,
      objectType: '敏感词',
      objectId: `BATCH-${nextSeq()}`,
      objectSummary: `批量导入 ${added.length} 个词条`,
      action: '批量导入',
      reason: `分类 ${category} · ${match}`,
      before: `${state.words.length} 个词条`,
      after: `${state.words.length + added.length} 个词条`,
    })
    commit({ words: [...added, ...state.words] })
  }
  return results
}
