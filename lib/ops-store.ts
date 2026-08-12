'use client'

/**
 * 运营服务模块（消息管理 / 意见反馈管理）原型数据与状态。
 *
 * 业务基线（务必保持）：
 * - 站内消息与资讯栏目的「通知」完全分开：消息只在消息中心内流转，
 *   不占用资讯类目、不进入资讯列表，也不参与资讯的评论与积分计算。
 * - 消息必须区分接收端：发给「APP」或发给「管理端后台」，两者互不串发。
 * - 接收端为 APP 时还需指定员工范围：全部 / 在职员工 / 退休员工 / 选择员工。
 * - 年度清零消息只有「提前 30 天」「提前 7 天」两种模板，内容由模板生成后可微调。
 * - 意见反馈只有文字：不含图片、附件、语音。
 * - 反馈处理只有一步：管理员填写回复并保存后立即由「待回复」变为「已处理」，
 *   不提供采纳、评分、用户确认、二次审核等环节。
 */

import * as React from 'react'

/* ---------------- 消息类型 ---------------- */

export type MessageType = '系统消息' | '积分变动' | '年度清零' | '运营消息'

/** 接收端：APP 为员工侧消息中心，管理端后台为管理员提醒 */
export type MessageAudience = 'APP' | '管理端后台'

/** APP 侧的员工范围；管理端后台不适用，固定为空 */
export type MessageScope = '全部' | '在职员工' | '退休员工' | '选择员工'

/** 管理端后台的接收范围：全部管理员，或指定后台用户 */
export type AdminScope = '全部' | '选择用户'

/** 待发送可编辑可删除；已发送只读留痕 */
export type MessageStatus = '待发送' | '已发送'

/** 年度清零仅有两种提醒节点 */
export type ClearTemplate = '提前 30 天' | '提前 7 天'

/** 来源：系统按规则自动生成，或管理员手工新增 */
export type MessageOrigin = '系统自动' | '人工新增'

/** 员工在职状态，决定其是否落入「在职员工」或「退休员工」范围 */
export type EmployeeStatus = '在职' | '退休'

/** 员工名册，供 APP 接收范围与选择员工弹窗使用 */
export type Employee = {
  id: string
  /** 员工工号 */
  no: string
  name: string
  company: string
  dept: string
  status: EmployeeStatus
}

/** 后台用户名册，供管理端后台的「选择用户」弹窗使用 */
export type AdminUser = {
  id: string
  /** 用户账号 */
  account: string
  /** 用户姓名 */
  name: string
  /** 用户部门 */
  dept: string
  /** 所属角色 */
  role: string
}

/**
 * 发送明细：一条消息发给一名接收人的投递结果。
 * APP 侧 no/org 为员工工号与公司，管理端后台为用户账号与角色。
 */
export type DeliveryRecord = {
  key: string
  no: string
  name: string
  org: string
  dept: string
  /** 该条投递的发送时间 */
  sentAt: string
  /** 是否成功送达 */
  success: boolean
}

export type OpsMessage = {
  id: string
  /** 消息编号，全局唯一 */
  code: string
  type: MessageType
  audience: MessageAudience
  /** 接收端为 APP 时的员工范围；管理端后台为空 */
  scope: MessageScope | ''
  /** 范围为「选择员工」时的员工 id 列表，其他范围为空 */
  employeeIds: string[]
  /** 接收端为管理端后台时的用户范围；APP 为空 */
  adminScope: AdminScope | ''
  /** 范围为「选择用户」时的后台用户 id 列表，其他范围为空 */
  adminUserIds: string[]
  title: string
  content: string
  status: MessageStatus
  origin: MessageOrigin
  /** 仅年度清零消息使用 */
  clearTemplate: ClearTemplate | ''
  /** 接收人数，发送后由系统按接收范围统计 */
  recipients: number
  createdAt: string
  creator: string
  /** 发送时间与发送人，未发送时为空 */
  sentAt: string
  sender: string
}

/* ---------------- 反馈类型 ---------------- */

/** 反馈只有两种状态，回复保存后立即变为已处理 */
export type FeedbackStatus = '待回复' | '已处理'

export type Feedback = {
  id: string
  /** 反馈编号，全局唯一 */
  code: string
  nickname: string
  employee: string
  dept: string
  /** 反馈正文，纯文字 */
  content: string
  status: FeedbackStatus
  createdAt: string
  /** 管理员回复文字，未处理时为空 */
  reply: string
  replyBy: string
  replyAt: string
}

/* ---------------- 常量 ---------------- */

export const MESSAGE_TYPES: MessageType[] = [
  '系统消息',
  '积分变动',
  '年度清零',
  '运营消息',
]

export const MESSAGE_AUDIENCES: MessageAudience[] = ['APP', '管理端后台']
export const MESSAGE_SCOPES: MessageScope[] = [
  '全部',
  '在职员工',
  '退休员工',
  '选择员工',
]
export const ADMIN_SCOPES: AdminScope[] = ['全部', '选择用户']
export const EMPLOYEE_STATUSES: EmployeeStatus[] = ['在职', '退休']
export const MESSAGE_STATUSES: MessageStatus[] = ['待发送', '已发送']
export const CLEAR_TEMPLATES: ClearTemplate[] = ['提前 30 天', '提前 7 天']
export const FEEDBACK_STATUSES: FeedbackStatus[] = ['待回复', '已处理']

/** 标题与正文长度上限，与表单校验一致 */
export const MESSAGE_TITLE_MAX = 40
export const MESSAGE_CONTENT_MAX = 300
export const REPLY_MAX = 300

/**
 * 员工名册（原型样本）。真实环境由组织同步而来，
 * 此处样本用于「选择员工」弹窗与发送明细展示。
 */
export const EMPLOYEES: Employee[] = [
  { id: 'E-01', no: 'SG10023', name: '汪筱', company: '陕鼓动力', dept: '技术中心', status: '在职' },
  { id: 'E-02', no: 'SG10057', name: '鹿鸣', company: '陕鼓动力', dept: '能源互联事业部', status: '在职' },
  { id: 'E-03', no: 'SG10112', name: '陆东南', company: '陕鼓动力', dept: '装备制造事业部', status: '在职' },
  { id: 'E-04', no: 'SG10189', name: '周敬', company: '陕鼓集团', dept: '信息安全部', status: '在职' },
  { id: 'E-05', no: 'SG10204', name: '孙可', company: '陕鼓集团', dept: '平台管理部', status: '在职' },
  { id: 'E-06', no: 'SG10238', name: '王海涛', company: '陕鼓集团', dept: '平台管理部', status: '在职' },
  { id: 'E-07', no: 'SG10341', name: '李鸣泉', company: '陕鼓能源', dept: '运维服务中心', status: '在职' },
  { id: 'E-08', no: 'SG10402', name: '赵越', company: '陕鼓能源', dept: '项目管理部', status: '在职' },
  { id: 'E-09', no: 'SG10455', name: '钱思远', company: '陕鼓智能', dept: '研发一部', status: '在职' },
  { id: 'E-10', no: 'SG10488', name: '许沐', company: '陕鼓智能', dept: '研发二部', status: '在职' },
  { id: 'E-11', no: 'SG09012', name: '何长庚', company: '陕鼓动力', dept: '离退休服务中心', status: '退休' },
  { id: 'E-12', no: 'SG09044', name: '范秀英', company: '陕鼓动力', dept: '离退休服务中心', status: '退休' },
  { id: 'E-13', no: 'SG09077', name: '邓怀安', company: '陕鼓集团', dept: '离退休服务中心', status: '退休' },
  { id: 'E-14', no: 'SG09103', name: '柳文彬', company: '陕鼓集团', dept: '离退休服务中心', status: '退休' },
  { id: 'E-15', no: 'SG09156', name: '梁玉兰', company: '陕鼓能源', dept: '离退休服务中心', status: '退休' },
]

/**
 * 各发送范围的规模（原型值）。真实环境按组织人数实时统计，
 * 「选择员工」按实际勾选人数计算，不走此表。
 */
const SCOPE_SIZE: Record<MessageScope, number> = {
  全部: 1286,
  在职员工: 1108,
  退休员工: 178,
  选择员工: 0,
}

/**
 * 后台用户名册（原型样本）。真实环境取自系统管理的用户列表，
 * 此处样本用于「选择用户」弹窗与管理端后台的发送明细展示。
 */
export const ADMIN_USERS: AdminUser[] = [
  { id: 'U-01', account: 'admin', name: '张亦驰', dept: '信息管理部', role: '超级管理员' },
  { id: 'U-02', account: 'admin.normal', name: '王海涛', dept: '信息管理部', role: '普通管理员' },
  { id: 'U-03', account: 'admin.news', name: '李雯', dept: '党群工作部', role: '资讯管理员' },
  { id: 'U-04', account: 'admin.media', name: '赵启明', dept: '党群工作部', role: '视听管理员' },
  { id: 'U-05', account: 'admin.publish', name: '陈锐', dept: '党群工作部', role: '固定发布人员' },
  { id: 'U-06', account: 'admin.forum', name: '刘思远', dept: '工会办公室', role: '论坛管理员' },
  { id: 'U-07', account: 'admin.points', name: '孙可', dept: '工会办公室', role: '积分/商城管理员' },
  { id: 'U-08', account: 'admin.ops', name: '周敬', dept: '信息管理部', role: '运维与安全人员' },
  { id: 'U-09', account: 'admin.hr', name: '汪筱', dept: '人力资源部', role: '普通管理员' },
  { id: 'U-10', account: 'admin.union', name: '鹿鸣', dept: '工会办公室', role: '普通管理员' },
  { id: 'U-11', account: 'admin.news2', name: '陆东南', dept: '党群工作部', role: '资讯管理员' },
  { id: 'U-12', account: 'admin.ops2', name: '李鸣泉', dept: '信息管理部', role: '运维与安全人员' },
]

/** 后台角色清单，供「选择用户」弹窗按角色筛选 */
export const ADMIN_ROLE_NAMES = Array.from(new Set(ADMIN_USERS.map((u) => u.role)))

/** 年度清零两种模板的默认文案，选中模板后自动填入且允许微调 */
export const CLEAR_TEMPLATE_TEXT: Record<
  ClearTemplate,
  { title: string; content: string }
> = {
  '提前 30 天': {
    title: '年度积分清零提醒（30 天）',
    content:
      '您的 2026 年度积分将于 2026-12-31 24:00 统一清零，距清零还有 30 天。请提前前往积分商城完成兑换，清零后积分不再保留、不可恢复。',
  },
  '提前 7 天': {
    title: '年度积分清零提醒（7 天）',
    content:
      '您的 2026 年度积分将于 2026-12-31 24:00 统一清零，距清零仅剩 7 天。请尽快前往积分商城完成兑换，清零后积分不再保留、不可恢复。',
  },
}

/* ---------------- 种子数据 ---------------- */

const SEED_MESSAGES: OpsMessage[] = [
  {
    id: 'OM-12',
    code: 'MSG20260810000012',
    type: '年度清零',
    audience: 'APP',
    scope: '全部',
    employeeIds: [],
    adminScope: '',
    adminUserIds: [],
    title: '年度积分清零提醒（30 天）',
    content: CLEAR_TEMPLATE_TEXT['提前 30 天'].content,
    status: '待发送',
    origin: '人工新增',
    clearTemplate: '提前 30 天',
    recipients: 0,
    createdAt: '2026-08-10 16:22:41',
    creator: '王海涛',
    sentAt: '',
    sender: '',
  },
  {
    id: 'OM-11',
    code: 'MSG20260810000011',
    type: '运营消息',
    audience: 'APP',
    scope: '在职员工',
    employeeIds: [],
    adminScope: '',
    adminUserIds: [],
    title: '陕鼓 55 周年主题征文开启',
    content:
      '陕鼓 55 周年主题征文即日起开放投稿，可在论坛「官方话题」下参与，入选稿件将在资讯栏目展示。',
    status: '待发送',
    origin: '人工新增',
    clearTemplate: '',
    recipients: 0,
    createdAt: '2026-08-10 10:05:18',
    creator: '王海涛',
    sentAt: '',
    sender: '',
  },
  {
    id: 'OM-10',
    code: 'MSG20260809000010',
    type: '系统消息',
    audience: '管理端后台',
    scope: '',
    employeeIds: [],
    adminScope: '全部',
    adminUserIds: [],
    title: '待办提醒：3 条兑换订单待确认领取',
    content:
      '积分商城当前有 3 条订单处于「待领取」，请联系员工核对后在订单管理中确认领取。',
    status: '已发送',
    origin: '系统自动',
    clearTemplate: '',
    recipients: 12,
    createdAt: '2026-08-09 09:00:00',
    creator: '系统',
    sentAt: '2026-08-09 09:00:00',
    sender: '系统',
  },
  {
    id: 'OM-08',
    code: 'MSG20260807000008',
    type: '积分变动',
    audience: 'APP',
    scope: '选择员工',
    employeeIds: ['E-01'],
    adminScope: '',
    adminUserIds: [],
    title: '积分到账提醒',
    content:
      '您因「评论（审核通过）」获得 2 积分，当前可用积分 386。积分明细可在个人中心查看。',
    status: '已发送',
    origin: '系统自动',
    clearTemplate: '',
    recipients: 1,
    createdAt: '2026-08-07 09:41:25',
    creator: '系统',
    sentAt: '2026-08-07 09:41:25',
    sender: '系统',
  },
  {
    id: 'OM-07',
    code: 'MSG20260806000007',
    type: '系统消息',
    audience: 'APP',
    scope: '全部',
    employeeIds: [],
    adminScope: '',
    adminUserIds: [],
    title: '平台维护通知',
    content:
      '平台将于 2026-08-12 22:00 至 23:00 进行例行维护，期间资讯浏览与积分兑换可能短暂不可用。',
    status: '已发送',
    origin: '人工新增',
    clearTemplate: '',
    recipients: 1286,
    createdAt: '2026-08-06 14:12:39',
    creator: '张亦驰',
    sentAt: '2026-08-06 15:00:00',
    sender: '张亦驰',
  },
  {
    id: 'OM-06',
    code: 'MSG20260805000006',
    type: '运营消息',
    audience: 'APP',
    scope: '在职员工',
    employeeIds: [],
    adminScope: '',
    adminUserIds: [],
    title: '积分商城上新：富光×陕鼓 55 周年保温杯',
    content:
      '积分商城已上新「富光×陕鼓55周年保温杯」，所需积分 2000，每人每半年可兑换 1 个，先兑先得。',
    status: '已发送',
    origin: '人工新增',
    clearTemplate: '',
    recipients: 1286,
    createdAt: '2026-08-05 09:26:14',
    creator: '孙可',
    sentAt: '2026-08-05 10:00:00',
    sender: '孙可',
  },
  {
    id: 'OM-05',
    code: 'MSG20260804000005',
    type: '系统消息',
    audience: '管理端后台',
    scope: '',
    employeeIds: [],
    adminScope: '选择用户',
    adminUserIds: ['U-01', 'U-02', 'U-03'],
    title: '待办提醒：5 条意见反馈待回复',
    content: '意见反馈中有 5 条处于「待回复」，请及时进入意见反馈管理处理。',
    status: '已发送',
    origin: '系统自动',
    clearTemplate: '',
    recipients: 3,
    createdAt: '2026-08-04 09:00:00',
    creator: '系统',
    sentAt: '2026-08-04 09:00:00',
    sender: '系统',
  },
  {
    id: 'OM-04',
    code: 'MSG20260731000004',
    type: '积分变动',
    audience: 'APP',
    scope: '选择员工',
    employeeIds: ['E-03'],
    adminScope: '',
    adminUserIds: [],
    title: '积分扣减提醒',
    content:
      '您兑换「天堂307E升级黑胶伞」扣减 2000 积分，当前可用积分 430。请留意领取通知。',
    status: '已发送',
    origin: '系统自动',
    clearTemplate: '',
    recipients: 1,
    createdAt: '2026-07-31 14:31:50',
    creator: '系统',
    sentAt: '2026-07-31 14:31:50',
    sender: '系统',
  },
  {
    id: 'OM-03',
    code: 'MSG20251224000003',
    type: '年度清零',
    audience: 'APP',
    scope: '全部',
    employeeIds: [],
    adminScope: '',
    adminUserIds: [],
    title: '年度积分清零提醒（7 天）',
    content:
      '您的 2025 年度积分将于 2025-12-31 24:00 统一清零，距清零仅剩 7 天。请尽快前往积分商城完成兑换，清零后积分不再保留、不可恢复。',
    status: '已发送',
    origin: '人工新增',
    clearTemplate: '提前 7 天',
    recipients: 1243,
    createdAt: '2025-12-24 09:00:00',
    creator: '孙可',
    sentAt: '2025-12-24 09:30:00',
    sender: '孙可',
  },
  {
    id: 'OM-02',
    code: 'MSG20251201000002',
    type: '年度清零',
    audience: 'APP',
    scope: '全部',
    employeeIds: [],
    adminScope: '',
    adminUserIds: [],
    title: '年度积分清零提醒（30 天）',
    content:
      '您的 2025 年度积分将于 2025-12-31 24:00 统一清零，距清零还有 30 天。请提前前往积分商城完成兑换，清零后积分不再保留、不可恢复。',
    status: '已发送',
    origin: '人工新增',
    clearTemplate: '提前 30 天',
    recipients: 1243,
    createdAt: '2025-12-01 09:00:00',
    creator: '孙可',
    sentAt: '2025-12-01 09:30:00',
    sender: '孙可',
  },
  {
    id: 'OM-01',
    code: 'MSG20251130000001',
    type: '系统消息',
    audience: '管理端后台',
    scope: '',
    employeeIds: [],
    adminScope: '全部',
    adminUserIds: [],
    title: '年度清零任务已就绪',
    content:
      '2025 年度积分清零任务将于 2025-12-31 24:00 自动执行，执行前请确认积分商城库存与订单已处理完毕。',
    status: '已发送',
    origin: '系统自动',
    clearTemplate: '',
    recipients: 12,
    createdAt: '2025-11-30 09:00:00',
    creator: '系统',
    sentAt: '2025-11-30 09:00:00',
    sender: '系统',
  },
]

const SEED_FEEDBACK: Feedback[] = [
  {
    id: 'FB-16',
    code: 'FB20260810000016',
    nickname: '筱筱',
    employee: '汪筱',
    dept: '技术中心',
    content:
      '积分商城的商品列表希望能按所需积分排序，现在只能一页页翻着找能兑换的东西。',
    status: '待回复',
    createdAt: '2026-08-10 17:12:44',
    reply: '',
    replyBy: '',
    replyAt: '',
  },
  {
    id: 'FB-15',
    code: 'FB20260810000015',
    nickname: '风起东南',
    employee: '陆东南',
    dept: '装备制造事业部',
    content: '陕鼓之声的音频没有倍速播放，通勤路上听长篇访谈比较费时间。',
    status: '待回复',
    createdAt: '2026-08-10 11:36:02',
    reply: '',
    replyBy: '',
    replyAt: '',
  },
  {
    id: 'FB-14',
    code: 'FB20260809000014',
    nickname: '一只鹿',
    employee: '鹿鸣',
    dept: '能源互联事业部',
    content: '论坛发帖时如果被敏感词拦下来，希望能提示是哪个词，否则不知道怎么改。',
    status: '待回复',
    createdAt: '2026-08-09 15:48:19',
    reply: '',
    replyBy: '',
    replyAt: '',
  },
  {
    id: 'FB-13',
    code: 'FB20260809000013',
    nickname: '老周同学',
    employee: '周敬',
    dept: '信息安全部',
    content: '每日积分上限的规则说明希望在个人中心也能看到，现在只能靠猜。',
    status: '待回复',
    createdAt: '2026-08-09 09:21:07',
    reply: '',
    replyBy: '',
    replyAt: '',
  },
  {
    id: 'FB-12',
    code: 'FB20260808000012',
    nickname: '海涛',
    employee: '王海涛',
    dept: '平台管理部',
    content: '资讯正文的字号偏小，年纪大一些的同事反馈看着比较吃力。',
    status: '待回复',
    createdAt: '2026-08-08 16:04:53',
    reply: '',
    replyBy: '',
    replyAt: '',
  },
  {
    id: 'FB-11',
    code: 'FB20260807000011',
    nickname: '筱筱',
    employee: '汪筱',
    dept: '技术中心',
    content: '兑换成功后没有告诉我去哪里领，只能等电话，希望消息里说明清楚。',
    status: '已处理',
    createdAt: '2026-08-07 10:52:31',
    reply:
      '已收到反馈。兑换成功后我们会通过企业微信联系您核对，确认领取后订单状态会同步更新为「已领取」，可在个人中心查看进度。',
    replyBy: '孙可',
    replyAt: '2026-08-07 15:20:08',
  },
  {
    id: 'FB-10',
    code: 'FB20260806000010',
    nickname: '风起东南',
    employee: '陆东南',
    dept: '装备制造事业部',
    content: '视频看到一半退出后，再进去要重新从头看，进度没有记住。',
    status: '已处理',
    createdAt: '2026-08-06 14:19:26',
    reply:
      '感谢反馈，播放进度记忆已纳入下一版视听模块的优化计划，上线后会通过站内消息通知您。',
    replyBy: '赵启明',
    replyAt: '2026-08-06 17:41:52',
  },
  {
    id: 'FB-09',
    code: 'FB20260805000009',
    nickname: '一只鹿',
    employee: '鹿鸣',
    dept: '能源互联事业部',
    content: '评论审核大概要多久？发出去之后一直显示待审核，不知道是不是没通过。',
    status: '已处理',
    createdAt: '2026-08-05 11:26:19',
    reply:
      '评论审核在工作日一般 2 小时内完成。若长时间未通过，多为触发敏感词校验，可修改后重新提交。',
    replyBy: '李雯',
    replyAt: '2026-08-05 14:08:37',
  },
  {
    id: 'FB-08',
    code: 'FB20260804000008',
    nickname: '老周同学',
    employee: '周敬',
    dept: '信息安全部',
    content: '希望增加深色模式，晚上值班的时候看屏幕太亮。',
    status: '已处理',
    createdAt: '2026-08-04 21:33:48',
    reply: '深色模式已在规划中，会随下一次版本升级一并发布，感谢您的建议。',
    replyBy: '张亦驰',
    replyAt: '2026-08-05 09:15:22',
  },
  {
    id: 'FB-07',
    code: 'FB20260802000007',
    nickname: '海涛',
    employee: '王海涛',
    dept: '平台管理部',
    content: '积分明细里的「年度清零」希望能标注是哪一年的，历史记录看起来容易混。',
    status: '已处理',
    createdAt: '2026-08-02 09:47:15',
    reply:
      '已确认：积分日志中的清零记录会显示「XXXX 年度积分清零」，我们也会在提前 30 天与 7 天各推送一次清零提醒。',
    replyBy: '孙可',
    replyAt: '2026-08-02 16:30:41',
  },
]

/* ---------------- store ---------------- */

type State = {
  messages: OpsMessage[]
  feedback: Feedback[]
}

let state: State = {
  messages: SEED_MESSAGES,
  feedback: SEED_FEEDBACK,
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

export function useOps(): State {
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

let seq = 16
function nextSeq() {
  seq += 1
  return seq
}

/** 消息编号：MSG + 日期 + 12 位流水 */
function nextMessageCode(d = new Date()) {
  const day = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
  const tail = String(state.messages.length + 1).padStart(6, '0')
  return `MSG${day}${tail}`
}

export function messageTypeTone(t: MessageType) {
  if (t === '年度清零') return 'warning' as const
  if (t === '积分变动') return 'success' as const
  if (t === '运营消息') return 'info' as const
  return 'neutral' as const
}

export function messageStatusTone(s: MessageStatus) {
  return s === '已发送' ? ('success' as const) : ('warning' as const)
}

export function audienceTone(a: MessageAudience) {
  return a === 'APP' ? ('info' as const) : ('neutral' as const)
}

/**
 * 接收范围的展示文案，如「在职员工」「选择员工（2 人）」；
 * 管理端后台则为「全部管理员」或「选择用户（3 人）」。
 */
export function scopeText(m: OpsMessage) {
  if (m.audience === '管理端后台') {
    if (m.adminScope === '选择用户')
      return `选择用户（${m.adminUserIds.length} 人）`
    return '全部管理员'
  }
  if (m.scope === '选择员工') return `选择员工（${m.employeeIds.length} 人）`
  return m.scope || '全部'
}

/** 按接收范围解析命中的员工名册 */
export function resolveEmployees(
  audience: MessageAudience,
  scope: MessageScope | '',
  employeeIds: string[],
): Employee[] {
  if (audience === '管理端后台') return []
  if (scope === '选择员工') return EMPLOYEES.filter((e) => employeeIds.includes(e.id))
  if (scope === '在职员工') return EMPLOYEES.filter((e) => e.status === '在职')
  if (scope === '退休员工') return EMPLOYEES.filter((e) => e.status === '退休')
  return EMPLOYEES
}

/** 按管理端范围解析命中的后台用户名册 */
export function resolveAdminUsers(
  adminScope: AdminScope | '',
  adminUserIds: string[],
): AdminUser[] {
  if (adminScope === '选择用户')
    return ADMIN_USERS.filter((u) => adminUserIds.includes(u.id))
  return ADMIN_USERS
}

/** 待发送消息的预计接收人数；选择员工/选择用户按实际勾选数计算 */
export function plannedRecipients(
  audience: MessageAudience,
  scope: MessageScope | '',
  employeeIds: string[],
  adminScope: AdminScope | '' = '',
  adminUserIds: string[] = [],
) {
  if (audience === '管理端后台')
    return adminScope === '选择用户' ? adminUserIds.length : ADMIN_USERS.length
  if (scope === '选择员工') return employeeIds.length
  return SCOPE_SIZE[(scope || '全部') as MessageScope]
}

/**
 * 发送明细：按接收范围列出每名接收人的投递结果。
 * 原型下以名册样本演示，真实环境由推送网关回执生成。
 */
export function deliveryRecords(m: OpsMessage): DeliveryRecord[] {
  if (m.status !== '已发送') return []
  // 原型下固定第 7 条演示失败回执，便于查看失败态
  if (m.audience === '管理端后台')
    return resolveAdminUsers(m.adminScope, m.adminUserIds).map((u, i) => ({
      key: u.id,
      no: u.account,
      name: u.name,
      org: u.role,
      dept: u.dept,
      sentAt: m.sentAt,
      success: i !== 6,
    }))
  return resolveEmployees(m.audience, m.scope, m.employeeIds).map((e, i) => ({
    key: e.id,
    no: e.no,
    name: e.name,
    org: e.company,
    dept: e.dept,
    sentAt: m.sentAt,
    success: i !== 6,
  }))
}

export function feedbackStatusTone(s: FeedbackStatus) {
  return s === '已处理' ? ('success' as const) : ('warning' as const)
}

/* ---------------- 消息维护 ---------------- */

export type MessageDraft = {
  type: MessageType
  audience: MessageAudience
  scope: MessageScope | ''
  employeeIds: string[]
  adminScope: AdminScope | ''
  adminUserIds: string[]
  title: string
  content: string
  clearTemplate: ClearTemplate | ''
}

export const EMPTY_MESSAGE_DRAFT: MessageDraft = {
  type: '系统消息',
  audience: 'APP',
  scope: '全部',
  employeeIds: [],
  adminScope: '',
  adminUserIds: [],
  title: '',
  content: '',
  clearTemplate: '',
}

/** 消息表单校验：年度清零必须落在两种模板之一 */
export function validateMessage(draft: MessageDraft): string[] {
  const issues: string[] = []

  if (!draft.title.trim()) issues.push('消息标题为必填项')
  else if (draft.title.trim().length > MESSAGE_TITLE_MAX)
    issues.push(`消息标题不超过 ${MESSAGE_TITLE_MAX} 字`)

  if (!draft.content.trim()) issues.push('消息内容为必填项')
  else if (draft.content.trim().length > MESSAGE_CONTENT_MAX)
    issues.push(`消息内容不超过 ${MESSAGE_CONTENT_MAX} 字`)

  if (draft.type === '年度清零' && !draft.clearTemplate)
    issues.push('年度清零消息需选择「提前 30 天」或「提前 7 天」模板')

  if (draft.type !== '年度清零' && draft.clearTemplate)
    issues.push('清零提醒模板仅适用于年度清零消息')

  if (draft.audience === 'APP') {
    if (!draft.scope) issues.push('接收端为 APP 时需选择员工范围')
    else if (draft.scope === '选择员工' && draft.employeeIds.length === 0)
      issues.push('请至少选择一名员工')
  } else {
    if (!draft.adminScope) issues.push('接收端为管理端后台时需选择用户范围')
    else if (draft.adminScope === '选择用户' && draft.adminUserIds.length === 0)
      issues.push('请至少选择一名后台用户')
  }

  return issues
}

export function createMessage(draft: MessageDraft, operator: string) {
  const message: OpsMessage = {
    id: `OM-${nextSeq()}`,
    code: nextMessageCode(),
    type: draft.type,
    audience: draft.audience,
    scope: draft.audience === 'APP' ? draft.scope : '',
    employeeIds:
      draft.audience === 'APP' && draft.scope === '选择员工' ? draft.employeeIds : [],
    adminScope: draft.audience === '管理端后台' ? draft.adminScope : '',
    adminUserIds:
      draft.audience === '管理端后台' && draft.adminScope === '选择用户'
        ? draft.adminUserIds
        : [],
    title: draft.title.trim(),
    content: draft.content.trim(),
    status: '待发送',
    origin: '人工新增',
    clearTemplate: draft.type === '年度清零' ? draft.clearTemplate : '',
    recipients: 0,
    createdAt: stamp(),
    creator: operator,
    sentAt: '',
    sender: '',
  }
  commit({ messages: [message, ...state.messages] })
  return message
}

/** 仅待发送消息可编辑，已发送消息只读留痕 */
export function updateMessage(id: string, draft: MessageDraft) {
  const target = state.messages.find((m) => m.id === id)
  if (!target) return { ok: false, message: '消息不存在' }
  if (target.status === '已发送')
    return { ok: false, message: '消息已发送，不可再编辑' }

  commit({
    messages: state.messages.map((m) =>
      m.id === id
        ? {
            ...m,
            type: draft.type,
            audience: draft.audience,
            scope: draft.audience === 'APP' ? draft.scope : '',
            employeeIds:
              draft.audience === 'APP' && draft.scope === '选择员工'
                ? draft.employeeIds
                : [],
            adminScope: draft.audience === '管理端后台' ? draft.adminScope : '',
            adminUserIds:
              draft.audience === '管理端后台' && draft.adminScope === '选择用户'
                ? draft.adminUserIds
                : [],
            title: draft.title.trim(),
            content: draft.content.trim(),
            clearTemplate: draft.type === '年度清零' ? draft.clearTemplate : '',
          }
        : m,
    ),
  })
  return { ok: true, message: '消息已保存' }
}

/** 发送后按接收范围统计接收人数，并记录发送人与发送时间 */
export function sendMessages(ids: string[], operator: string) {
  const at = stamp()
  const results = state.messages
    .filter((m) => ids.includes(m.id))
    .map((m) => ({
      id: m.id,
      label: m.title,
      ok: m.status === '待发送',
      message:
        m.status === '待发送'
          ? `已发送至${scopeText(m)}，接收 ${plannedRecipients(
              m.audience,
              m.scope,
              m.employeeIds,
              m.adminScope,
              m.adminUserIds,
            )} 人`
          : '已发送过，本次跳过',
    }))

  commit({
    messages: state.messages.map((m) =>
      ids.includes(m.id) && m.status === '待发送'
        ? {
            ...m,
            status: '已发送',
            recipients: plannedRecipients(
              m.audience,
              m.scope,
              m.employeeIds,
              m.adminScope,
              m.adminUserIds,
            ),
            sentAt: at,
            sender: operator,
          }
        : m,
    ),
  })
  return results
}

/** 只允许删除尚未发送的消息 */
export function removeMessages(ids: string[]) {
  const results = state.messages
    .filter((m) => ids.includes(m.id))
    .map((m) => ({
      id: m.id,
      label: m.title,
      ok: m.status === '待发送',
      message: m.status === '待发送' ? '已删除' : '已发送消息需留痕，不可删除',
    }))

  const removable = results.filter((r) => r.ok).map((r) => r.id)
  commit({ messages: state.messages.filter((m) => !removable.includes(m.id)) })
  return results
}

/* ---------------- 反馈处理 ---------------- */

export function validateReply(reply: string): string[] {
  const issues: string[] = []
  const text = reply.trim()
  if (!text) issues.push('回复内容为必填项')
  else if (text.length < 5) issues.push('回复内容至少 5 个字')
  else if (text.length > REPLY_MAX) issues.push(`回复内容不超过 ${REPLY_MAX} 字`)
  return issues
}

/**
 * 保存回复：状态立即由「待回复」变为「已处理」，一步到位。
 * 不存在采纳、评分、用户确认或二次审核环节。
 */
export function replyFeedback(id: string, reply: string, operator: string) {
  const target = state.feedback.find((f) => f.id === id)
  if (!target) return { ok: false, message: '反馈不存在' }

  const issues = validateReply(reply)
  if (issues.length > 0) return { ok: false, message: issues[0] }

  const at = stamp()
  commit({
    feedback: state.feedback.map((f) =>
      f.id === id
        ? {
            ...f,
            status: '已处理',
            reply: reply.trim(),
            replyBy: operator,
            replyAt: at,
          }
        : f,
    ),
  })
  return {
    ok: true,
    message: `已回复并置为「已处理」，处理人 ${operator}，处理时间 ${at}`,
  }
}
