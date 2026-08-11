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
    target: '/media/audios',
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
  { label: '视听总量', value: '412', note: '视频 268 / 音频 144', target: '/media/videos', perm: 'media.list' },
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

export const NOTICES = [
  { title: 'NC 同步异常 3 条待处理', time: '02:14' },
  { title: '待领取订单已达 28 笔', time: '昨天 16:05' },
  { title: '反馈 2 条待回复', time: '昨天 17:40' },
]
