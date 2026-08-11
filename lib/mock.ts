/* 本地 mock data，仅用于原型演示，不连接真实 API */

export const PLATFORM_NAME = '陕鼓融媒管理平台'
export const DATA_UPDATED_AT = '2026-08-11 08:30'

export type Todo = {
  id: string
  type: '待发布草稿' | '同步异常' | '待回复反馈' | '待领取订单' | '内容下架异常'
  title: string
  owner: string
  dept: string
  level: '高' | '中' | '低'
  createdAt: string
  target: string
  perm: string
}

export const TODOS: Todo[] = [
  {
    id: 'TD-20260811-001',
    type: '待发布草稿',
    title: '集团召开数字化建设专题推进会',
    owner: '李雯',
    dept: '党群工作部',
    level: '高',
    createdAt: '2026-08-11 08:12',
    target: '/content/news',
    perm: 'content.news',
  },
  {
    id: 'TD-20260811-002',
    type: '待发布草稿',
    title: '陕鼓之声｜向上向善 优良风气创未来',
    owner: '赵启明',
    dept: '融媒运营组',
    level: '中',
    createdAt: '2026-08-11 07:55',
    target: '/media/list',
    perm: 'media.list',
  },
  {
    id: 'TD-20260811-003',
    type: '同步异常',
    title: 'NC-20260811-0200 批次存在 3 条重复工号',
    owner: '周敬',
    dept: '信息管理部',
    level: '高',
    createdAt: '2026-08-11 02:14',
    target: '/logs/api',
    perm: 'logs.api',
  },
  {
    id: 'TD-20260811-004',
    type: '待回复反馈',
    title: '员工反馈：视听页面音频进度条偶发跳动',
    owner: '王海涛',
    dept: '运营服务组',
    level: '中',
    createdAt: '2026-08-10 17:40',
    target: '/feedback',
    perm: 'feedback',
  },
  {
    id: 'TD-20260811-005',
    type: '待领取订单',
    title: '待领取订单 28 笔，其中 6 笔超过 7 天未领取',
    owner: '孙可',
    dept: '工会办公室',
    level: '中',
    createdAt: '2026-08-10 16:05',
    target: '/mall/orders',
    perm: 'mall.orders',
  },
  {
    id: 'TD-20260811-006',
    type: '内容下架异常',
    title: '“关于开展年度信息安全培训的通知”封面缺失导致下架',
    owner: '李雯',
    dept: '党群工作部',
    level: '低',
    createdAt: '2026-08-10 11:22',
    target: '/content/news',
    perm: 'content.news',
  },
  {
    id: 'TD-20260811-007',
    type: '待回复反馈',
    title: '员工反馈：论坛投票截止时间显示需更明确',
    owner: '刘思远',
    dept: '运营服务组',
    level: '低',
    createdAt: '2026-08-09 15:31',
    target: '/feedback',
    perm: 'feedback',
  },
]

export const KPIS = [
  { label: '总用户', value: '8,642', note: '在职 7,318 / 退休 1,324', target: '/system/users', perm: 'system.users' },
  { label: '今日活跃', value: '3,105', note: '较昨日 +4.2%', target: '/logs/online', perm: 'logs.online' },
  { label: '资讯总量', value: '1,286', note: '已发布 1,164', target: '/content/news', perm: 'content.news' },
  { label: '视听总量', value: '412', note: '视频 268 / 音频 144', target: '/media/list', perm: 'media.list' },
  { label: '今日阅读', value: '12,478', note: '资讯 9,204 / 视听 3,274', target: '/content/news', perm: 'content.news' },
  { label: '今日互动量', value: '2,864', note: '点赞 1,932 / 评论 932', target: '/content/comments', perm: 'content.comments' },
  { label: '今日积分发放', value: '18,420', note: '浏览 9,860 / 点赞 4,120', target: '/points/logs', perm: 'points.logs' },
  { label: '待领取订单', value: '28', note: '超 7 天未领取 6', target: '/mall/orders', perm: 'mall.orders' },
]

export const READ_TREND = [
  { date: '08-05', 资讯阅读: 8120, 视听播放: 2410, 互动: 2180 },
  { date: '08-06', 资讯阅读: 8760, 视听播放: 2680, 互动: 2320 },
  { date: '08-07', 资讯阅读: 9340, 视听播放: 2980, 互动: 2610 },
  { date: '08-08', 资讯阅读: 8890, 视听播放: 3120, 互动: 2480 },
  { date: '08-09', 资讯阅读: 7620, 视听播放: 2740, 互动: 2050 },
  { date: '08-10', 资讯阅读: 9860, 视听播放: 3260, 互动: 2790 },
  { date: '08-11', 资讯阅读: 9204, 视听播放: 3274, 互动: 2864 },
]

/** 近 30 天趋势：按日生成的稳定模拟数据（无随机，避免服务端与客户端不一致） */
export const READ_TREND_30 = Array.from({ length: 30 }, (_, i) => {
  const day = new Date(2026, 6, 13)
  day.setDate(day.getDate() + i)
  const date = `${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
  const wave = Math.sin(i / 3.2)
  const weekend = day.getDay() === 0 || day.getDay() === 6
  const factor = weekend ? 0.72 : 1
  return {
    date,
    资讯阅读: Math.round((8200 + wave * 900 + i * 42) * factor),
    视听播放: Math.round((2500 + wave * 320 + i * 26) * factor),
    互动: Math.round((2100 + wave * 260 + i * 24) * factor),
  }
})

export const POINTS_TREND = [
  { month: '3月', 获取: 268000, 消耗: 121000 },
  { month: '4月', 获取: 291000, 消耗: 143000 },
  { month: '5月', 获取: 305000, 消耗: 168000 },
  { month: '6月', 获取: 288000, 消耗: 152000 },
  { month: '7月', 获取: 316000, 消耗: 187000 },
  { month: '8月', 获取: 142000, 消耗: 78000 },
]

export const DEPT_POINTS = [
  { dept: '透平机械', 积分: 86200 },
  { dept: '能源工程', 积分: 74100 },
  { dept: '智能装备', 积分: 68400 },
  { dept: '党群工作部', 积分: 51200 },
  { dept: '信息管理部', 积分: 43900 },
]

/** 部门员工积分明细：用于部门积分排行的下钻与导出 */
export type DeptPointMember = {
  dept: string
  name: string
  employeeNo: string
  获取: number
  消耗: number
  余额: number
}

export const DEPT_POINT_MEMBERS: DeptPointMember[] = [
  { dept: '透平机械', name: '王建国', employeeNo: 'SG10231', 获取: 4820, 消耗: 1600, 余额: 3220 },
  { dept: '透平机械', name: '李慧敏', employeeNo: 'SG10287', 获取: 4310, 消耗: 900, 余额: 3410 },
  { dept: '透平机械', name: '赵鹏', employeeNo: 'SG10344', 获取: 3760, 消耗: 2100, 余额: 1660 },
  { dept: '能源工程', name: '陈晓东', employeeNo: 'SG20115', 获取: 4180, 消耗: 1200, 余额: 2980 },
  { dept: '能源工程', name: '周芸', employeeNo: 'SG20178', 获取: 3520, 消耗: 800, 余额: 2720 },
  { dept: '智能装备', name: '刘志强', employeeNo: 'SG30142', 获取: 3980, 消耗: 1750, 余额: 2230 },
  { dept: '智能装备', name: '孙悦', employeeNo: 'SG30196', 获取: 3240, 消耗: 600, 余额: 2640 },
  { dept: '党群工作部', name: '郑文博', employeeNo: 'SG40108', 获取: 3610, 消耗: 1400, 余额: 2210 },
  { dept: '党群工作部', name: '马丽娜', employeeNo: 'SG40163', 获取: 2870, 消耗: 500, 余额: 2370 },
  { dept: '信息管理部', name: '杨帆', employeeNo: 'SG50127', 获取: 3150, 消耗: 1950, 余额: 1200 },
  { dept: '信息管理部', name: '何静', employeeNo: 'SG50184', 获取: 2640, 消耗: 700, 余额: 1940 },
]

export const HOT_NEWS = [
  { title: '集团召开数字化建设专题推进会', category: '要闻', reads: 4210 },
  { title: '关于开展年度信息安全培训的通知', category: '通知', reads: 3860 },
  { title: '奋斗者｜十年磨一“机”', category: '奋斗者', reads: 3120 },
  { title: '内刊 2026 年第 7 期上线', category: '内刊', reads: 2480 },
  { title: '学习｜能源系统节能技术要点', category: '学习', reads: 2210 },
]

export const HOT_MEDIA = [
  { title: '大型能量转换设备智能运维实践', type: '视频', plays: 3240 },
  { title: '陕鼓之声｜向上向善 优良风气创未来', type: '音频', plays: 2870 },
  { title: '分布式能源示范项目纪实', type: '视频', plays: 2160 },
  { title: '陕鼓之声｜工匠说安全', type: '音频', plays: 1840 },
  { title: '透平装配一线纪录', type: '视频', plays: 1520 },
]

export const SYSTEM_STATUS = [
  {
    name: '用友 NC 每日定时同步',
    detail: '批次 NC-20260811-0200 · 成功 8,614 · 异常 3',
    state: '异常待处理' as const,
    target: '/logs/api',
    perm: 'logs.api',
  },
  {
    name: '积分规则与发放任务',
    detail: '每日积分上限校验正常 · 规则版本 V2.3',
    state: '正常' as const,
    target: '/points/rules',
    perm: 'points.rules',
  },
  {
    name: '对象存储与媒体处理',
    detail: '媒体转码队列 2 个任务排队 · 存储可用',
    state: '正常' as const,
    target: '/logs/system',
    perm: 'logs.system',
  },
]

/** 快捷入口：高频操作直达业务页，按权限过滤后展示 */
export const SHORTCUTS = [
  { label: '新增资讯', desc: '创建图文资讯并送审', target: '/content/news/new', perm: 'content.news' },
  { label: '发布资讯', desc: '待发布草稿一键发布', target: '/content/news/publish', perm: 'content.publish' },
  { label: '上传视听', desc: '上传视频或音频内容', target: '/media/new', perm: 'media.list' },
  { label: '发帖', desc: '新建普通图文帖子', target: '/forum/posts/new', perm: 'forum.publish' },
  { label: '敏感词', desc: '维护论坛敏感词库', target: '/forum/sensitive-words', perm: 'forum.words' },
  { label: '积分规则', desc: '调整获取与消耗规则', target: '/points/rules', perm: 'points.rules' },
  { label: '订单发放', desc: '处理待领取订单', target: '/mall/orders', perm: 'mall.orders' },
  { label: '反馈处理', desc: '回复员工意见反馈', target: '/feedback', perm: 'feedback' },
  { label: '用户管理', desc: '查看员工与账号', target: '/system/users', perm: 'system.users' },
  { label: '导出日志', desc: '查看导出任务记录', target: '/logs/export', perm: 'logs.export' },
]

/** 内容概览：各内容体裁的状态分布，点击下钻到对应列表 */
export const CONTENT_OVERVIEW = [
  { name: '资讯', total: 1286, published: 1164, draft: 86, review: 24, offline: 12, target: '/content/news', perm: 'content.news' },
  { name: '视频', total: 268, published: 244, draft: 14, review: 8, offline: 2, target: '/media/list', perm: 'media.list' },
  { name: '音频', total: 144, published: 132, draft: 6, review: 4, offline: 2, target: '/media/list', perm: 'media.list' },
  { name: '帖子', total: 2483, published: 2402, draft: 0, review: 47, offline: 34, target: '/forum/posts', perm: 'forum.posts' },
]

/** 后台任务状态：定时同步、转码、积分结算等 */
export const SCHEDULED_TASKS = [
  {
    name: '用友 NC 员工同步',
    schedule: '每日 02:00',
    lastRun: '2026-08-11 02:14',
    state: '异常待处理' as const,
    detail: '成功 8,614 条，异常 3 条重复工号待人工确认',
    target: '/logs/api',
    perm: 'logs.api',
  },
  {
    name: '媒体转码队列',
    schedule: '实时触发',
    lastRun: '2026-08-11 08:22',
    state: '运行中' as const,
    detail: '2 个任务排队，平均耗时 3 分 12 秒',
    target: '/logs/system',
    perm: 'logs.system',
  },
  {
    name: '每日积分结算',
    schedule: '每日 06:00',
    lastRun: '2026-08-11 06:00',
    state: '成功' as const,
    detail: '结算 7,318 人，发放 18,420 分，规则版本 V2.3',
    target: '/points/logs',
    perm: 'points.logs',
  },
  {
    name: '内容热度重算',
    schedule: '每 30 分钟',
    lastRun: '2026-08-11 08:30',
    state: '成功' as const,
    detail: '重算 1,698 条内容热度分值',
    target: '/logs/system',
    perm: 'logs.system',
  },
]

/* ---------------- 运营数据（/analytics）筛选维度与指标 ---------------- */

export const COMPANIES = [
  '全部公司',
  '陕鼓集团本部',
  '陕鼓动力',
  '陕鼓能源',
  '陕鼓智能装备',
  '陕鼓服务',
]

export const DEPT_LIST = [
  '全部部门',
  '透平机械',
  '能源工程',
  '智能装备',
  '党群工作部',
  '信息管理部',
  '工会办公室',
  '融媒运营组',
  '运营服务组',
]

export const PEOPLE = [
  '全部人员',
  '李雯',
  '赵启明',
  '陈锐',
  '刘思远',
  '孙可',
  '周敬',
  '王海涛',
]

export const CONTENT_CATEGORIES = [
  '全部类目',
  '要闻',
  '通知',
  '奋斗者',
  '内刊',
  '学习',
  '党建',
]

export const CONTENT_TYPES = ['全部类型', '资讯', '视频', '音频', '帖子']

export const TIME_PRESETS = ['今日', '近 7 天', '近 30 天', '本季度', '自定义']

/** 指标口径说明：每个指标都要能说明清楚怎么算、数据来自哪里、什么时候更新 */
export type MetricDef = {
  caliber: string
  source: string
  updatedAt: string
}

export const METRIC_DEFS: Record<string, MetricDef> = {
  阅读互动趋势: {
    caliber:
      '阅读量按“同一用户同一内容同一天只计 1 次”去重统计；互动量为点赞数与评论数之和，评论以审核通过为准。',
    source: '移动端埋点日志 + 内容中心业务库',
    updatedAt: '2026-08-11 08:30',
  },
  积分获取与消耗: {
    caliber:
      '获取为规则生效期内实际入账积分，含浏览、点赞、评论、签到；消耗为商城下单占用积分，订单取消后回退不计入消耗。',
    source: '积分中心流水表（按自然月归集）',
    updatedAt: '2026-08-11 06:00',
  },
  员工变化: {
    caliber:
      '在册人数为月末在职员工数（不含退休）；入职与离职按用友 NC 生效日期归属月份，同月入职又离职的计双向各 1 次。',
    source: '用友 NC 每日定时同步批次',
    updatedAt: '2026-08-11 02:14',
  },
  部门积分: {
    caliber:
      '部门积分为该部门在册员工获取积分合计，按员工当前所属部门归集，历史调岗不追溯。',
    source: '积分中心 + 部门主数据',
    updatedAt: '2026-08-11 06:00',
  },
  内容排行: {
    caliber:
      '按筛选区间内的阅读（播放）量倒序排列，资讯与视听分别去重后合并展示；下架内容不参与排行。',
    source: '内容中心 + 埋点日志',
    updatedAt: '2026-08-11 08:30',
  },
  论坛治理: {
    caliber:
      '敏感词命中按“提交时命中即计 1 次”统计；删除含管理员删除与作者自删；申诉为用户对处理结果发起的复核请求。',
    source: '论坛业务库 + 敏感词引擎日志',
    updatedAt: '2026-08-11 08:00',
  },
  反馈闭环率: {
    caliber:
      '闭环率 = 当月已回复且状态为已办结的反馈数 ÷ 当月新增反馈数；跨月办结计入反馈提交当月。',
    source: '运营服务反馈工单表',
    updatedAt: '2026-08-11 08:30',
  },
}

/** 员工变化（月） */
export const STAFF_TREND = [
  { month: '3月', 在册: 7248, 入职: 62, 离职: 41 },
  { month: '4月', 在册: 7286, 入职: 71, 离职: 33 },
  { month: '5月', 在册: 7301, 入职: 48, 离职: 33 },
  { month: '6月', 在册: 7330, 入职: 66, 离职: 37 },
  { month: '7月', 在册: 7352, 入职: 59, 离职: 37 },
  { month: '8月', 在册: 7318, 入职: 21, 离职: 55 },
]

/** 内容排行（支持类目与内容类型筛选、可下钻到对应业务页） */
export type ContentRankRow = {
  title: string
  type: '资讯' | '视频' | '音频' | '帖子'
  category: string
  dept: string
  reads: number
  interactions: number
  points: number
  target: string
  perm: string
}

export const CONTENT_RANK: ContentRankRow[] = [
  { title: '集团召开数字化建设专题推进会', type: '资讯', category: '要闻', dept: '党群工作部', reads: 4210, interactions: 682, points: 8420, target: '/content/news', perm: 'content.news' },
  { title: '关于开展年度信息安全培训的通知', type: '资讯', category: '通知', dept: '信息管理部', reads: 3860, interactions: 415, points: 7720, target: '/content/news', perm: 'content.news' },
  { title: '大型能量转换设备智能运维实践', type: '视频', category: '学习', dept: '透平机械', reads: 3240, interactions: 596, points: 6480, target: '/media/list', perm: 'media.list' },
  { title: '奋斗者｜十年磨一“机”', type: '资讯', category: '奋斗者', dept: '透平机械', reads: 3120, interactions: 728, points: 6240, target: '/content/news', perm: 'content.news' },
  { title: '陕鼓之声｜向上向善 优良风气创未来', type: '音频', category: '党建', dept: '党群工作部', reads: 2870, interactions: 342, points: 5740, target: '/media/list', perm: 'media.list' },
  { title: '内刊 2026 年第 7 期上线', type: '资讯', category: '内刊', dept: '融媒运营组', reads: 2480, interactions: 268, points: 4960, target: '/content/news', perm: 'content.news' },
  { title: '一线技改金点子征集讨论', type: '帖子', category: '学习', dept: '智能装备', reads: 2360, interactions: 914, points: 4720, target: '/forum/posts', perm: 'forum.posts' },
  { title: '分布式能源示范项目纪实', type: '视频', category: '要闻', dept: '能源工程', reads: 2160, interactions: 331, points: 4320, target: '/media/list', perm: 'media.list' },
  { title: '学习｜能源系统节能技术要点', type: '资讯', category: '学习', dept: '能源工程', reads: 2210, interactions: 297, points: 4420, target: '/content/news', perm: 'content.news' },
  { title: '食堂菜品建议征集', type: '帖子', category: '通知', dept: '工会办公室', reads: 1980, interactions: 1024, points: 3960, target: '/forum/posts', perm: 'forum.posts' },
]

/** 论坛治理数据（月） */
export const FORUM_GOVERNANCE = [
  { month: '3月', 新增帖子: 412, 新增评论: 2860, 敏感词命中: 96, 删除: 34, 申诉: 8 },
  { month: '4月', 新增帖子: 448, 新增评论: 3120, 敏感词命中: 88, 删除: 29, 申诉: 6 },
  { month: '5月', 新增帖子: 476, 新增评论: 3348, 敏感词命中: 104, 删除: 41, 申诉: 11 },
  { month: '6月', 新增帖子: 459, 新增评论: 3204, 敏感词命中: 79, 删除: 26, 申诉: 5 },
  { month: '7月', 新增帖子: 502, 新增评论: 3592, 敏感词命中: 112, 删除: 38, 申诉: 9 },
  { month: '8月', 新增帖子: 186, 新增评论: 1284, 敏感词命中: 37, 删除: 12, 申诉: 3 },
]

/** 反馈闭环率（月） */
export const FEEDBACK_CLOSURE = [
  { month: '3月', 新增: 86, 办结: 79, 闭环率: 91.9 },
  { month: '4月', 新增: 94, 办结: 88, 闭环率: 93.6 },
  { month: '5月', 新增: 102, 办结: 91, 闭环率: 89.2 },
  { month: '6月', 新增: 88, 办结: 84, 闭环率: 95.5 },
  { month: '7月', 新增: 110, 办结: 99, 闭环率: 90.0 },
  { month: '8月', 新增: 42, 办结: 33, 闭环率: 78.6 },
]

/** 异步导出任务（大数据量导出时进入队列） */
export type ExportTask = {
  id: string
  name: string
  rows: number
  state: '排队中' | '生成中' | '可下载' | '已失败'
  progress: number
  operator: string
  createdAt: string
}

export const EXPORT_TASKS: ExportTask[] = [
  {
    id: 'EXP-20260811-0032',
    name: '内容排行明细_全部公司_2026-07-01至2026-07-31',
    rows: 18640,
    state: '可下载',
    progress: 100,
    operator: '张亦驰',
    createdAt: '2026-08-11 08:12',
  },
  {
    id: 'EXP-20260811-0031',
    name: '积分流水明细_陕鼓动力_2026-08-01至2026-08-11',
    rows: 42180,
    state: '生成中',
    progress: 64,
    operator: '孙可',
    createdAt: '2026-08-11 08:04',
  },
]

export const NOTICES = [
  { title: 'NC 同步异常 3 条待处理', time: '02:14' },
  { title: '待领取订单已达 28 笔', time: '昨天 16:05' },
  { title: '反馈 2 条待回复', time: '昨天 17:40' },
]
