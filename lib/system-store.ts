'use client'

/**
 * 系统管理（菜单 / 用户 / 角色 / 参数 / 通用代码 / 协议 / 广告组件）原型数据与状态。
 * 使用模块级 store + useSyncExternalStore，保证列表页与弹窗共享同一份数据。
 * 仅用于原型演示，不连接真实 API。
 */

import * as React from 'react'

import type { BatchResult } from '@/lib/content-store'
import { MENU, ROLES } from '@/lib/nav'

export type { BatchResult }

/* ---------------- 类型 ---------------- */

export type MenuNodeType = '目录' | '菜单' | '按钮'

export type MenuNode = {
  id: string
  /** 顶级节点为 null */
  parentId: string | null
  name: string
  url: string
  sort: number
  type: MenuNodeType
  enabled: boolean
  icon: string
}

export type UserStatus = '正常' | '锁定' | '停用'

export type SysUser = {
  id: string
  account: string
  name: string
  enabled: boolean
  status: UserStatus
  dept: string
  position: string
  email: string
  /** 关联的后台角色名称 */
  roleNames: string[]
  lastLoginAt: string
}

export type SysRole = {
  id: string
  code: string
  name: string
  /** 系统角色不可删除 */
  system: boolean
  remark: string
  /** 细粒度权限码，形如 content.news:view */
  perms: string[]
  createdBy: string
  createdAt: string
  updatedBy: string
  updatedAt: string
}

export type SysParam = {
  id: string
  key: string
  value: string
  image: string
  description: string
}

export type CodeItem = {
  id: string
  codeId: string
  name: string
  enabled: boolean
  value: string
  sort: number
  remark: string
}

export type CodeType = {
  id: string
  code: string
  name: string
  sort: number
  remark: string
  items: CodeItem[]
}

export type Agreement = {
  id: string
  title: string
  code: string
  /** HTML 片段，与资讯正文同口径 */
  content: string
  systemShown: boolean
  createdBy: string
  createdAt: string
  updatedBy: string
  updatedAt: string
}

export type AdSlot = {
  id: string
  instance: string
  component: string
  remark: string
}

/* ---------------- 常量 ---------------- */

export const MENU_NODE_TYPES: MenuNodeType[] = ['目录', '菜单', '按钮']
export const USER_STATUSES: UserStatus[] = ['正常', '锁定', '停用']

/** 角色权限矩阵的操作维度 */
export const ROLE_ACTIONS = [
  { key: 'view', label: '查看' },
  { key: 'create', label: '新增' },
  { key: 'update', label: '修改' },
  { key: 'delete', label: '删除' },
  { key: 'publish', label: '发布' },
  { key: 'export', label: '导出' },
] as const

export type RoleActionKey = (typeof ROLE_ACTIONS)[number]['key']

/** 广告实例名称：大写字母与下划线 */
export const AD_INSTANCE_PATTERN = /^[A-Z][A-Z_]*[A-Z]$/

/* ---- 有代码逻辑依赖的参数键，改动参数名时需同步这里 ---- */

/** 管理端后台账号初始密码的参数键 */
export const INIT_PWD_PARAM_KEY = 'sys_user_init_pwd'

/** 参数缺失或被清空时兜底的初始密码 */
export const DEFAULT_INIT_PWD = 'shaangu@2026'

/** 退休人员积分开关的参数键 */
export const RETIRED_POINTS_PARAM_KEY = 'points.retired.enabled'

/** 用户所属部门（与员工主数据口径一致） */
export const USER_DEPTS = [
  '信息管理部',
  '党群工作部',
  '工会办公室',
  '融媒运营组',
  '运营服务组',
  '透平机械',
  '能源工程',
  '智能装备',
]

/** 权限矩阵的模块分组，直接从导航推导，避免与菜单脱节 */
export const PERM_MODULES = MENU.filter((g) => g.children.length > 0).map((g) => ({
  title: g.title,
  items: g.children.map((c) => ({ title: c.title, perm: c.perm })),
}))

/* ---------------- 种子数据：菜单 ---------------- */

const SEED_MENUS: MenuNode[] = [
  { id: 'MN-01', parentId: null, name: '工作台', url: '/workbench', sort: 1, type: '菜单', enabled: true, icon: 'Gauge' },

  { id: 'MN-10', parentId: null, name: '内容管理', url: '', sort: 10, type: '目录', enabled: true, icon: 'Newspaper' },
  { id: 'MN-11', parentId: 'MN-10', name: '资讯类目管理', url: '/content/categories', sort: 1, type: '菜单', enabled: true, icon: '' },
  { id: 'MN-12', parentId: 'MN-10', name: '资讯管理', url: '/content/news', sort: 2, type: '菜单', enabled: true, icon: '' },
  { id: 'MN-13', parentId: 'MN-12', name: '新增资讯', url: '/content/news/new', sort: 1, type: '按钮', enabled: true, icon: '' },
  { id: 'MN-14', parentId: 'MN-12', name: '发布资讯', url: '', sort: 2, type: '按钮', enabled: true, icon: '' },
  { id: 'MN-15', parentId: 'MN-12', name: '下架资讯', url: '', sort: 3, type: '按钮', enabled: true, icon: '' },
  { id: 'MN-16', parentId: 'MN-10', name: '资讯评论管理', url: '/content/comments', sort: 3, type: '菜单', enabled: true, icon: '' },

  { id: 'MN-20', parentId: null, name: '视听管理', url: '', sort: 20, type: '目录', enabled: true, icon: 'PlayCircle' },
  { id: 'MN-21', parentId: 'MN-20', name: '视频管理', url: '/media/videos', sort: 1, type: '菜单', enabled: true, icon: '' },
  { id: 'MN-22', parentId: 'MN-20', name: '陕鼓之声', url: '/media/audios', sort: 2, type: '菜单', enabled: true, icon: '' },
  { id: 'MN-23', parentId: 'MN-20', name: '视听评论管理', url: '/media/comments', sort: 3, type: '菜单', enabled: true, icon: '' },

  { id: 'MN-30', parentId: null, name: '论坛管理', url: '', sort: 30, type: '目录', enabled: true, icon: 'MessagesSquare' },
  { id: 'MN-31', parentId: 'MN-30', name: '帖子管理', url: '/forum/posts', sort: 1, type: '菜单', enabled: true, icon: '' },
  { id: 'MN-32', parentId: 'MN-31', name: '新建帖子', url: '/forum/posts/new', sort: 1, type: '按钮', enabled: true, icon: '' },
  { id: 'MN-33', parentId: 'MN-30', name: '评论与回复管理', url: '/forum/comments', sort: 2, type: '菜单', enabled: true, icon: '' },
  { id: 'MN-34', parentId: 'MN-30', name: '敏感词管理', url: '/forum/sensitive-words', sort: 3, type: '菜单', enabled: true, icon: '' },

  { id: 'MN-40', parentId: null, name: '积分管理', url: '', sort: 40, type: '目录', enabled: true, icon: 'Coins' },
  { id: 'MN-41', parentId: 'MN-40', name: '积分规则', url: '/points/rules', sort: 1, type: '菜单', enabled: true, icon: '' },
  { id: 'MN-42', parentId: 'MN-40', name: '积分日志', url: '/points/logs', sort: 2, type: '菜单', enabled: true, icon: '' },

  { id: 'MN-50', parentId: null, name: '积分商城', url: '', sort: 50, type: '目录', enabled: true, icon: 'Store' },
  { id: 'MN-51', parentId: 'MN-50', name: '商品管理', url: '/mall/products', sort: 1, type: '菜单', enabled: true, icon: '' },
  { id: 'MN-52', parentId: 'MN-50', name: '订单管理', url: '/mall/orders', sort: 2, type: '菜单', enabled: true, icon: '' },

  { id: 'MN-60', parentId: null, name: '运营服务', url: '', sort: 60, type: '目录', enabled: true, icon: 'Bell' },
  { id: 'MN-61', parentId: 'MN-60', name: '消息管理', url: '/messages', sort: 1, type: '菜单', enabled: true, icon: '' },
  { id: 'MN-62', parentId: 'MN-60', name: '意见反馈管理', url: '/feedback', sort: 2, type: '菜单', enabled: true, icon: '' },

  { id: 'MN-70', parentId: null, name: '系统管理', url: '', sort: 94, type: '目录', enabled: true, icon: 'Settings' },
  { id: 'MN-71', parentId: 'MN-70', name: '菜单管理', url: '/system/menus', sort: 1, type: '菜单', enabled: true, icon: '' },
  { id: 'MN-72', parentId: 'MN-70', name: '用户管理', url: '/system/users', sort: 2, type: '菜单', enabled: true, icon: '' },
  { id: 'MN-73', parentId: 'MN-70', name: '员工管理', url: '/system/staff', sort: 3, type: '菜单', enabled: true, icon: '' },
  { id: 'MN-74', parentId: 'MN-70', name: '角色管理', url: '/system/roles', sort: 4, type: '菜单', enabled: true, icon: '' },
  { id: 'MN-75', parentId: 'MN-70', name: '参数管理', url: '/system/params', sort: 5, type: '菜单', enabled: true, icon: '' },
  { id: 'MN-76', parentId: 'MN-70', name: '通用代码', url: '/system/codes', sort: 6, type: '菜单', enabled: true, icon: '' },
  { id: 'MN-77', parentId: 'MN-70', name: '协议管理', url: '/system/agreements', sort: 7, type: '菜单', enabled: true, icon: '' },
  { id: 'MN-78', parentId: 'MN-70', name: '广告组件', url: '/system/ads', sort: 8, type: '菜单', enabled: true, icon: '' },
  { id: 'MN-79', parentId: 'MN-70', name: '部门管理', url: '/system/departments', sort: 9, type: '菜单', enabled: true, icon: '' },

  { id: 'MN-80', parentId: null, name: '系统日志', url: '', sort: 95, type: '目录', enabled: true, icon: 'ScrollText' },
  { id: 'MN-81', parentId: 'MN-80', name: '在线用户', url: '/logs/online', sort: 1, type: '菜单', enabled: true, icon: '' },
  { id: 'MN-82', parentId: 'MN-80', name: '登录日志', url: '/logs/login', sort: 2, type: '菜单', enabled: true, icon: '' },
  { id: 'MN-83', parentId: 'MN-80', name: '导出日志', url: '/logs/export', sort: 3, type: '菜单', enabled: true, icon: '' },
  { id: 'MN-84', parentId: 'MN-80', name: '删除日志', url: '/logs/delete', sort: 4, type: '菜单', enabled: true, icon: '' },
  { id: 'MN-85', parentId: 'MN-80', name: '系统日志', url: '/logs/system', sort: 5, type: '菜单', enabled: true, icon: '' },
  { id: 'MN-86', parentId: 'MN-80', name: '接口日志', url: '/logs/api', sort: 6, type: '菜单', enabled: true, icon: '' },

  { id: 'MN-90', parentId: null, name: '会员管理', url: '', sort: 96, type: '目录', enabled: false, icon: 'Users' },
]

/* ---------------- 种子数据：用户 ---------------- */

const SEED_USERS: SysUser[] = [
  { id: 'SU-01', account: 'admin', name: '张亦驰', enabled: true, status: '正常', dept: '信息管理部', position: '平台负责人', email: 'zhangyc@shaangu.com', roleNames: ['超级管理员'], lastLoginAt: '2026-08-12 09:37:23' },
  { id: 'SU-02', account: 'admin.normal', name: '王海涛', enabled: true, status: '正常', dept: '信息管理部', position: '系统管理员', email: 'wanght@shaangu.com', roleNames: ['普通管理员'], lastLoginAt: '2026-08-12 08:52:10' },
  { id: 'SU-03', account: 'admin.news', name: '李雯', enabled: true, status: '正常', dept: '党群工作部', position: '宣传干事', email: 'liwen@shaangu.com', roleNames: ['资讯管理员'], lastLoginAt: '2026-08-12 08:14:47' },
  { id: 'SU-04', account: 'admin.media', name: '赵启明', enabled: true, status: '正常', dept: '融媒运营组', position: '视听编辑', email: 'zhaoqm@shaangu.com', roleNames: ['视听管理员'], lastLoginAt: '2026-08-11 17:23:05' },
  { id: 'SU-05', account: 'admin.publish', name: '陈锐', enabled: true, status: '正常', dept: '党群工作部', position: '内容审核', email: 'chenrui@shaangu.com', roleNames: ['固定发布人员'], lastLoginAt: '2026-08-11 16:40:31' },
  { id: 'SU-06', account: 'admin.forum', name: '刘思远', enabled: true, status: '正常', dept: '运营服务组', position: '社区运营', email: 'liusy@shaangu.com', roleNames: ['论坛管理员'], lastLoginAt: '2026-08-11 15:08:52' },
  { id: 'SU-07', account: 'admin.points', name: '孙可', enabled: true, status: '正常', dept: '工会办公室', position: '积分运营', email: 'sunke@shaangu.com', roleNames: ['积分/商城管理员'], lastLoginAt: '2026-08-11 14:22:18' },
  { id: 'SU-08', account: 'admin.ops', name: '周敬', enabled: true, status: '正常', dept: '信息管理部', position: '运维工程师', email: 'zhoujing@shaangu.com', roleNames: ['运维与安全人员'], lastLoginAt: '2026-08-12 02:14:09' },
  { id: 'SU-09', account: 'yangfan', name: '杨帆', enabled: true, status: '锁定', dept: '信息管理部', position: '开发工程师', email: 'yangfan@shaangu.com', roleNames: ['普通管理员'], lastLoginAt: '2026-07-28 10:05:44' },
  { id: 'SU-10', account: 'majln', name: '马丽娜', enabled: false, status: '停用', dept: '党群工作部', position: '宣传干事', email: 'maln@shaangu.com', roleNames: [], lastLoginAt: '2026-05-19 09:31:26' },
  { id: 'SU-11', account: 'hejing', name: '何静', enabled: true, status: '正常', dept: '运营服务组', position: '客服专员', email: 'hejing@shaangu.com', roleNames: ['普通管理员'], lastLoginAt: '2026-08-10 11:47:33' },
  { id: 'SU-12', account: 'zhengwb', name: '郑文博', enabled: true, status: '正常', dept: '透平机械', position: '车间主任', email: 'zhengwb@shaangu.com', roleNames: [], lastLoginAt: '2026-08-09 16:19:02' },
]

/* ---------------- 种子数据：角色 ---------------- */

/** 按模块给角色铺一套细粒度权限，便于演示权限矩阵的回显 */
function permsOf(pairs: [string, RoleActionKey[]][]): string[] {
  return pairs.flatMap(([perm, actions]) => actions.map((a) => `${perm}:${a}`))
}

const SEED_ROLES: SysRole[] = [
  {
    id: 'SR-01', code: 'admin', name: '超级管理员', system: true,
    remark: '集团全部数据，拥有所有功能权限',
    perms: PERM_MODULES.flatMap((m) =>
      m.items.flatMap((i) => ROLE_ACTIONS.map((a) => `${i.perm}:${a.key}`)),
    ),
    createdBy: '系统内置', createdAt: '2026-01-06 09:00:00', updatedBy: '系统内置', updatedAt: '2026-01-06 09:00:00',
  },
  {
    id: 'SR-02', code: 'general', name: '普通管理员', system: false,
    remark: '授权部门数据，可维护用户与部门',
    perms: permsOf([
      ['system.users', ['view', 'update', 'export']],
      ['system.staff', ['view', 'update']],
      ['system.depts', ['view']],
      ['feedback', ['view', 'update']],
      ['messages', ['view', 'create']],
    ]),
    createdBy: '张亦驰', createdAt: '2026-01-08 10:12:30', updatedBy: '王海涛', updatedAt: '2026-06-11 14:22:08',
  },
  {
    id: 'SR-03', code: 'news', name: '资讯管理员', system: false,
    remark: '资讯栏目数据，不含发布权限',
    perms: permsOf([
      ['content.categories', ['view', 'create', 'update']],
      ['content.news', ['view', 'create', 'update', 'delete', 'export']],
      ['content.comments', ['view', 'update', 'delete']],
    ]),
    createdBy: '张亦驰', createdAt: '2026-01-08 10:18:04', updatedBy: '李雯', updatedAt: '2026-07-02 09:41:55',
  },
  {
    id: 'SR-04', code: 'media', name: '视听管理员', system: false,
    remark: '视听栏目数据，发布权限由固定发布人员持有',
    perms: permsOf([
      ['media.list', ['view', 'create', 'update', 'delete']],
      ['media.comments', ['view', 'update', 'delete']],
    ]),
    createdBy: '张亦驰', createdAt: '2026-01-08 10:24:19', updatedBy: '赵启明', updatedAt: '2026-07-18 16:03:27',
  },
  {
    id: 'SR-05', code: 'publisher', name: '固定发布人员', system: false,
    remark: '仅负责资讯与视听的发布动作',
    perms: permsOf([
      ['content.news', ['view', 'publish']],
      ['media.list', ['view', 'publish']],
    ]),
    createdBy: '张亦驰', createdAt: '2026-02-11 11:05:42', updatedBy: '陈锐', updatedAt: '2026-07-25 10:37:11',
  },
  {
    id: 'SR-06', code: 'forum', name: '论坛管理员', system: false,
    remark: '论坛全部内容治理',
    perms: permsOf([
      ['forum.posts', ['view', 'create', 'update', 'delete', 'publish']],
      ['forum.comments', ['view', 'update', 'delete']],
      ['forum.words', ['view', 'create', 'update', 'delete']],
    ]),
    createdBy: '张亦驰', createdAt: '2026-02-11 11:12:36', updatedBy: '刘思远', updatedAt: '2026-08-04 15:29:48',
  },
  {
    id: 'SR-07', code: 'points', name: '积分/商城管理员', system: false,
    remark: '积分规则与商城商品、订单',
    perms: permsOf([
      ['points.rules', ['view', 'create', 'update']],
      ['points.logs', ['view', 'export']],
      ['mall.products', ['view', 'create', 'update', 'delete']],
      ['mall.orders', ['view', 'update', 'export']],
    ]),
    createdBy: '张亦驰', createdAt: '2026-03-04 09:48:15', updatedBy: '孙可', updatedAt: '2026-08-06 11:52:34',
  },
  {
    id: 'SR-08', code: 'ops', name: '运维与安全人员', system: false,
    remark: '系统配置与全部日志',
    perms: permsOf([
      ['system.menus', ['view', 'create', 'update', 'delete']],
      ['system.users', ['view', 'create', 'update', 'delete', 'export']],
      ['system.roles', ['view', 'create', 'update', 'delete']],
      ['system.params', ['view', 'create', 'update', 'delete', 'export']],
      ['system.codes', ['view', 'create', 'update', 'delete']],
      ['system.agreements', ['view', 'create', 'update', 'delete']],
      ['system.ads', ['view', 'create', 'update', 'delete']],
      ['logs.online', ['view', 'export']],
      ['logs.login', ['view', 'export']],
      ['logs.system', ['view', 'export']],
      ['logs.api', ['view', 'export']],
    ]),
    createdBy: '张亦驰', createdAt: '2026-03-04 09:55:03', updatedBy: '周敬', updatedAt: '2026-08-11 08:16:22',
  },
]

/* ---------------- 种子数据：参数 ---------------- */

const SEED_PARAMS: SysParam[] = [
  { id: 'SP-01', key: 'image.type', value: '.jpg,.png,.jpeg,.webp', image: '', description: '图片上传允许的格式' },
  { id: 'SP-02', key: 'image.size', value: '10', image: '', description: '图片大小上限 单位 M' },
  { id: 'SP-03', key: 'video.type', value: '.mp4', image: '', description: '视频上传允许的格式' },
  { id: 'SP-04', key: 'video.size', value: '500', image: '', description: '视频文件大小上限 单位 M' },
  { id: 'SP-05', key: 'audio.type', value: '.mp3,.m4a', image: '', description: '陕鼓之声音频允许的格式' },
  { id: 'SP-06', key: 'upload.water.content', value: '陕鼓融媒', image: '', description: '图片水印文字，若图片自带水印则不叠加' },
  { id: 'SP-07', key: 'upload.water.content.color', value: '255,255,255', image: '', description: '水印文字颜色 RGB' },
  { id: 'SP-08', key: 'sys_user_init_pwd', value: DEFAULT_INIT_PWD, image: '', description: '管理端后台账号初始密码，新建用户与重置密码后均使用该密码，首次登录须修改' },
  { id: 'SP-09', key: 'nc.sync.cron', value: '0 0 2 * * ?', image: '', description: '用友 NC 员工主数据同步时间，每日 02:00' },
  { id: 'SP-10', key: 'CLOUD_STORAGE_CONFIG_KEY', value: '{"type":6,"endpoint":"obs.shaangu.com","bucket":"shaangu-media","prefix":"app/"}', image: '', description: '对象存储配置信息' },
  { id: 'SP-11', key: RETIRED_POINTS_PARAM_KEY, value: '0', image: '', description: '退休人员积分开关：1 开启，0 关闭。关闭后退休员工的浏览、点赞等行为不再产生积分' },
]

/* ---------------- 种子数据：通用代码 ---------------- */

const SEED_CODE_TYPES: CodeType[] = [
  {
    id: 'CT-01', code: 'IDENTITY_TYPE', name: '员工身份', sort: 1, remark: 'APP 端员工身份标识',
    items: [
      { id: 'CD-0101', codeId: 'CD-0101', name: '在职员工', enabled: true, value: 'ON_JOB', sort: 1, remark: '正常在职' },
      { id: 'CD-0102', codeId: 'CD-0102', name: '退休员工', enabled: true, value: 'RETIRED', sort: 2, remark: '保留 APP 浏览权限' },
      { id: 'CD-0103', codeId: 'CD-0103', name: '离职员工', enabled: false, value: 'LEFT', sort: 3, remark: '停用 APP 登录' },
    ],
  },
  {
    id: 'CT-02', code: 'NEWS_CATEGORY', name: '资讯类目', sort: 2, remark: '与资讯类目管理保持同一口径',
    items: [
      { id: 'CD-0201', codeId: 'CD-0201', name: '推荐', enabled: true, value: 'RECOMMEND', sort: 1, remark: '首页推荐位' },
      { id: 'CD-0202', codeId: 'CD-0202', name: '要闻', enabled: true, value: 'HEADLINE', sort: 2, remark: '集团重要新闻' },
      { id: 'CD-0203', codeId: 'CD-0203', name: '通知', enabled: true, value: 'NOTICE', sort: 3, remark: '可维护附件' },
      { id: 'CD-0204', codeId: 'CD-0204', name: '奋斗者', enabled: true, value: 'FIGHTER', sort: 4, remark: '人物报道' },
      { id: 'CD-0205', codeId: 'CD-0205', name: '学习', enabled: true, value: 'STUDY', sort: 5, remark: '学习专区' },
      { id: 'CD-0206', codeId: 'CD-0206', name: '内刊', enabled: true, value: 'JOURNAL', sort: 6, remark: '企业内刊电子版' },
    ],
  },
  {
    id: 'CT-03', code: 'POINTS_ACTION', name: '积分行为', sort: 3, remark: '积分规则可配置的行为类型',
    items: [
      { id: 'CD-0301', codeId: 'CD-0301', name: '浏览资讯', enabled: true, value: 'READ_NEWS', sort: 1, remark: '每日上限受总上限约束' },
      { id: 'CD-0302', codeId: 'CD-0302', name: '点赞', enabled: true, value: 'LIKE', sort: 2, remark: '' },
      { id: 'CD-0303', codeId: 'CD-0303', name: '评论', enabled: true, value: 'COMMENT', sort: 3, remark: '需通过敏感词校验' },
      { id: 'CD-0304', codeId: 'CD-0304', name: '分享', enabled: true, value: 'SHARE', sort: 4, remark: '' },
      { id: 'CD-0305', codeId: 'CD-0305', name: '参与投票', enabled: true, value: 'VOTE', sort: 5, remark: '' },
    ],
  },
  {
    id: 'CT-04', code: 'ORDER_STATUS', name: '订单状态', sort: 4, remark: '积分商城订单流转状态',
    items: [
      { id: 'CD-0401', codeId: 'CD-0401', name: '待领取', enabled: true, value: 'PENDING', sort: 1, remark: '超 7 天未领取需提醒' },
      { id: 'CD-0402', codeId: 'CD-0402', name: '已领取', enabled: true, value: 'RECEIVED', sort: 2, remark: '' },
      { id: 'CD-0403', codeId: 'CD-0403', name: '已取消', enabled: true, value: 'CANCELLED', sort: 3, remark: '积分原路退回' },
    ],
  },
  {
    id: 'CT-05', code: 'FEEDBACK_TYPE', name: '反馈类型', sort: 5, remark: '意见反馈的分类',
    items: [
      { id: 'CD-0501', codeId: 'CD-0501', name: '功能异常', enabled: true, value: 'BUG', sort: 1, remark: '' },
      { id: 'CD-0502', codeId: 'CD-0502', name: '体验建议', enabled: true, value: 'ADVICE', sort: 2, remark: '' },
      { id: 'CD-0503', codeId: 'CD-0503', name: '内容纠错', enabled: true, value: 'CONTENT', sort: 3, remark: '' },
      { id: 'CD-0504', codeId: 'CD-0504', name: '其他', enabled: true, value: 'OTHER', sort: 4, remark: '' },
    ],
  },
  {
    id: 'CT-06', code: 'MEDIA_TYPE', name: '视听类型', sort: 6, remark: '视听内容的媒体类型',
    items: [
      { id: 'CD-0601', codeId: 'CD-0601', name: '视频', enabled: true, value: 'VIDEO', sort: 1, remark: '视频管理' },
      { id: 'CD-0602', codeId: 'CD-0602', name: '音频', enabled: true, value: 'AUDIO', sort: 2, remark: '陕鼓之声' },
    ],
  },
]

/* ---------------- 种子数据：协议 ---------------- */

const SEED_AGREEMENTS: Agreement[] = [
  {
    id: 'AG-01', title: '隐私政策', code: 'PRIVACY-POLICY', systemShown: true,
    content:
      '<p>陕西鼓风机（集团）有限公司（以下简称「本公司」）深知个人信息对您的重要性，并会尽全力保护您的个人信息安全可靠。</p><h3>一、我们如何收集信息</h3><p>为向您提供内部融媒服务，我们会收集您的工号、姓名、所属部门等由用友 NC 系统同步的员工主数据，以及您在使用过程中产生的浏览、点赞、评论记录。</p><h3>二、我们如何使用信息</h3><p>收集的信息仅用于身份识别、内容推荐、积分计算与内部统计，不会用于任何商业推广，也不会向公司外部第三方提供。</p><h3>三、信息的存储与保护</h3><p>您的信息存储于公司内部服务器，采取加密传输与访问审计等措施保护。</p>',
    createdBy: '周敬', createdAt: '2026-01-06 09:00:00', updatedBy: '周敬', updatedAt: '2026-06-22 16:13:06',
  },
  {
    id: 'AG-02', title: '服务协议', code: 'SERVICE-AGREEMENT', systemShown: true,
    content:
      '<p>欢迎使用陕鼓融媒平台。请您在使用前仔细阅读本协议。</p><h3>一、服务内容</h3><p>本平台向公司在职及退休员工提供企业资讯、视听内容、内部论坛、积分商城等内部服务。</p><h3>二、账号规则</h3><p>账号与您的工号一一对应，请勿转借他人使用。若发现账号异常，请及时联系信息管理部。</p><h3>三、内容规范</h3><p>您在论坛发布的内容应遵守国家法律法规与公司管理制度，不得发布涉密、不实或不当信息。</p><blockquote>本平台数据属公司内部信息，请勿外传。</blockquote>',
    createdBy: '周敬', createdAt: '2026-01-06 09:00:00', updatedBy: '王海涛', updatedAt: '2026-05-14 10:28:41',
  },
  {
    id: 'AG-03', title: '关于我们', code: 'ABOUT-US', systemShown: true,
    content:
      '<p>陕西鼓风机（集团）有限公司创建于 1968 年，是我国大型能量转换设备的研究、设计与制造企业，为流程工业提供分布式能源系统解决方案。</p><p>陕鼓融媒平台是公司内部信息发布与员工互动的统一入口，由信息管理部建设与运维，党群工作部负责内容管理。</p>',
    createdBy: '李雯', createdAt: '2026-01-09 14:42:11', updatedBy: '李雯', updatedAt: '2026-07-30 09:05:33',
  },
  {
    id: 'AG-04', title: '积分规则说明', code: 'POINTS-RULE', systemShown: false,
    content:
      '<p>积分通过浏览资讯、点赞、评论、分享、参与投票等行为获取，可在积分商城兑换实物。</p><ol><li>每日各行为累计积分不超过 50 分；</li><li>积分按自然年清零，清零前 30 天与 7 天各推送一次提醒；</li><li>订单取消后积分原路退回。</li></ol>',
    createdBy: '孙可', createdAt: '2026-03-18 11:20:47', updatedBy: '孙可', updatedAt: '2026-08-06 15:41:19',
  },
]

/* ---------------- 种子数据：广告组件 ---------------- */

const SEED_ADS: AdSlot[] = [
  { id: 'AD-01', instance: 'INDEX_BANNER', component: 'APP 首页顶部轮播', remark: '首页 banner，最多 5 张' },
  { id: 'AD-02', instance: 'NEWS_CHANNEL_BANNER', component: '资讯频道轮播', remark: '资讯频道顶部运营位' },
  { id: 'AD-03', instance: 'MALL_INDEX_BANNER', component: '积分商城首页轮播', remark: '商城活动位' },
]

/* ---------------- store ---------------- */

type State = {
  menus: MenuNode[]
  users: SysUser[]
  roles: SysRole[]
  params: SysParam[]
  codeTypes: CodeType[]
  agreements: Agreement[]
  ads: AdSlot[]
}

let state: State = {
  menus: SEED_MENUS,
  users: SEED_USERS,
  roles: SEED_ROLES,
  params: SEED_PARAMS,
  codeTypes: SEED_CODE_TYPES,
  agreements: SEED_AGREEMENTS,
  ads: SEED_ADS,
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

export function useSystem(): State {
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

let seq = 90
function nextSeq() {
  seq += 1
  return seq
}

export function menuTypeTone(t: MenuNodeType) {
  if (t === '目录') return 'neutral' as const
  return t === '菜单' ? ('info' as const) : ('success' as const)
}

export function userStatusTone(s: UserStatus) {
  if (s === '正常') return 'success' as const
  return s === '锁定' ? ('warning' as const) : ('neutral' as const)
}

/* ---------------- 菜单 ---------------- */

export function hasChildren(id: string) {
  return state.menus.some((m) => m.parentId === id)
}

export function menuById(id: string) {
  return state.menus.find((m) => m.id === id)
}

/** 可作为父节点的候选（仅目录类型） */
export function menuParentOptions() {
  return state.menus.filter((m) => m.type === '目录')
}

export type MenuDraft = {
  parentId: string | null
  name: string
  url: string
  sort: number
  type: MenuNodeType
  enabled: boolean
  icon: string
}

export const EMPTY_MENU_DRAFT: MenuDraft = {
  parentId: null,
  name: '',
  url: '',
  sort: 1,
  type: '目录',
  enabled: true,
  icon: '',
}

export function validateMenuNode(draft: MenuDraft): string[] {
  const issues: string[] = []
  if (!draft.name.trim()) issues.push('菜单名称不能为空')
  if (draft.type === '菜单' && !draft.url.trim()) issues.push('菜单类型为「菜单」时必须填写 url')
  if (!Number.isFinite(draft.sort) || draft.sort < 0) issues.push('排序号必须为非负整数')
  return issues
}

export function createMenuNode(draft: MenuDraft) {
  const issues = validateMenuNode(draft)
  if (issues.length > 0) return { ok: false as const, message: issues[0] }

  const node: MenuNode = {
    id: `MN-${nextSeq()}`,
    parentId: draft.parentId,
    name: draft.name.trim(),
    url: draft.url.trim(),
    sort: draft.sort,
    type: draft.type,
    enabled: draft.enabled,
    icon: draft.icon.trim(),
  }
  commit({ menus: [...state.menus, node] })
  return { ok: true as const, message: `菜单节点「${node.name}」已新增` }
}

export function updateMenuNode(id: string, draft: MenuDraft) {
  const issues = validateMenuNode(draft)
  if (issues.length > 0) return { ok: false as const, message: issues[0] }
  if (draft.parentId === id) return { ok: false as const, message: '不能将自身设为父节点' }

  commit({
    menus: state.menus.map((m) =>
      m.id === id
        ? {
            ...m,
            parentId: draft.parentId,
            name: draft.name.trim(),
            url: draft.url.trim(),
            sort: draft.sort,
            type: draft.type,
            enabled: draft.enabled,
            icon: draft.icon.trim(),
          }
        : m,
    ),
  })
  return { ok: true as const, message: '菜单节点已保存' }
}

/** 删除菜单：含子节点的节点必须先删除子节点 */
export function removeMenuNodes(ids: string[]): BatchResult[] {
  const hit = state.menus.filter((m) => ids.includes(m.id))
  const results: BatchResult[] = hit.map((m) => {
    if (state.menus.some((c) => c.parentId === m.id)) {
      return { id: m.id, label: m.name, ok: false, message: '存在下级节点，请先删除下级' }
    }
    return { id: m.id, label: m.name, ok: true, message: '已删除' }
  })

  const removable = results.filter((r) => r.ok).map((r) => r.id)
  if (removable.length > 0) {
    commit({ menus: state.menus.filter((m) => !removable.includes(m.id)) })
  }
  return results
}

/* ---------------- 用户 ---------------- */

export type UserDraft = {
  account: string
  name: string
  dept: string
  position: string
  email: string
  enabled: boolean
  roleNames: string[]
}

export const EMPTY_USER_DRAFT: UserDraft = {
  account: '',
  name: '',
  dept: USER_DEPTS[0],
  position: '',
  email: '',
  enabled: true,
  roleNames: [],
}

export function validateUser(draft: UserDraft, editingId?: string): string[] {
  const issues: string[] = []
  const account = draft.account.trim()
  if (!account) issues.push('用户账号不能为空')
  if (!draft.name.trim()) issues.push('用户名称不能为空')
  if (
    account &&
    state.users.some((u) => u.account === account && u.id !== editingId)
  ) {
    issues.push(`用户账号「${account}」已存在`)
  }
  if (draft.email.trim() && !/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(draft.email.trim())) {
    issues.push('邮箱格式不正确')
  }
  return issues
}

export function createUser(draft: UserDraft) {
  const issues = validateUser(draft)
  if (issues.length > 0) return { ok: false as const, message: issues[0] }

  const user: SysUser = {
    id: `SU-${nextSeq()}`,
    account: draft.account.trim(),
    name: draft.name.trim(),
    enabled: draft.enabled,
    status: draft.enabled ? '正常' : '停用',
    dept: draft.dept,
    position: draft.position.trim(),
    email: draft.email.trim(),
    roleNames: draft.roleNames,
    lastLoginAt: '',
  }
  commit({ users: [user, ...state.users] })
  return { ok: true as const, message: `用户「${user.name}」已新增` }
}

export function updateUser(id: string, draft: UserDraft) {
  const issues = validateUser(draft, id)
  if (issues.length > 0) return { ok: false as const, message: issues[0] }

  commit({
    users: state.users.map((u) =>
      u.id === id
        ? {
            ...u,
            account: draft.account.trim(),
            name: draft.name.trim(),
            dept: draft.dept,
            position: draft.position.trim(),
            email: draft.email.trim(),
            enabled: draft.enabled,
            status: draft.enabled ? (u.status === '停用' ? '正常' : u.status) : '停用',
            roleNames: draft.roleNames,
          }
        : u,
    ),
  })
  return { ok: true as const, message: '用户信息已保存' }
}

/** 启用/停用账号 */
export function toggleUsers(ids: string[], enabled: boolean): BatchResult[] {
  const hit = state.users.filter((u) => ids.includes(u.id))
  const results: BatchResult[] = hit.map((u) => {
    if (u.account === 'admin' && !enabled) {
      return { id: u.id, label: u.name, ok: false, message: '超级管理员账号不可停用' }
    }
    return {
      id: u.id,
      label: u.name,
      ok: true,
      message: enabled ? '已启用' : '已停用',
    }
  })

  const changed = results.filter((r) => r.ok).map((r) => r.id)
  if (changed.length > 0) {
    commit({
      users: state.users.map((u) =>
        changed.includes(u.id)
          ? { ...u, enabled, status: enabled ? '正常' : '停用' }
          : u,
      ),
    })
  }
  return results
}

/**
 * 读取参数管理中的参数值，未配置时返回 fallback。
 * 供其他模块复用平台参数（如上传校验读取 image.type / image.size）。
 */
export function paramValue(key: string, fallback = '') {
  return state.params.find((p) => p.key === key)?.value.trim() || fallback
}

/**
 * 管理端后台账号初始密码：取自参数管理中的 sys_user_init_pwd。
 * 参数被清空时回退到默认值，保证新建用户与重置密码始终有可用密码。
 */
export function initialPassword() {
  const configured = state.params.find((p) => p.key === INIT_PWD_PARAM_KEY)?.value.trim()
  return configured || DEFAULT_INIT_PWD
}

/**
 * 退休人员积分开关：参数值为 1 表示开启，其余情况（含默认 0）为关闭。
 * 关闭时退休员工的浏览、点赞等行为不产生积分。
 */
export function isRetiredPointsEnabled() {
  return (
    state.params.find((p) => p.key === RETIRED_POINTS_PARAM_KEY)?.value.trim() === '1'
  )
}

export function resetUserPassword(ids: string[]): BatchResult[] {
  const hit = state.users.filter((u) => ids.includes(u.id))
  return hit.map((u) => ({
    id: u.id,
    label: u.name,
    ok: true,
    message: `密码已重置为 ${initialPassword()}，首次登录须修改`,
  }))
}

export function removeUsers(ids: string[]): BatchResult[] {
  const hit = state.users.filter((u) => ids.includes(u.id))
  const results: BatchResult[] = hit.map((u) =>
    u.account === 'admin'
      ? { id: u.id, label: u.name, ok: false, message: '超级管理员账号不可删除' }
      : { id: u.id, label: u.name, ok: true, message: '已删除' },
  )

  const removable = results.filter((r) => r.ok).map((r) => r.id)
  if (removable.length > 0) {
    commit({ users: state.users.filter((u) => !removable.includes(u.id)) })
  }
  return results
}

/* ---------------- 角色 ---------------- */

export type RoleDraft = {
  code: string
  name: string
  system: boolean
  remark: string
  perms: string[]
}

export const EMPTY_ROLE_DRAFT: RoleDraft = {
  code: '',
  name: '',
  system: false,
  remark: '',
  perms: [],
}

export function validateRole(draft: RoleDraft, editingId?: string): string[] {
  const issues: string[] = []
  const code = draft.code.trim()
  if (!code) issues.push('角色编号不能为空')
  if (!draft.name.trim()) issues.push('角色名称不能为空')
  if (code && state.roles.some((r) => r.code === code && r.id !== editingId)) {
    issues.push(`角色编号「${code}」已存在`)
  }
  return issues
}

export function createRole(draft: RoleDraft, operator: string) {
  const issues = validateRole(draft)
  if (issues.length > 0) return { ok: false as const, message: issues[0] }

  const at = stamp()
  const role: SysRole = {
    id: `SR-${nextSeq()}`,
    code: draft.code.trim(),
    name: draft.name.trim(),
    system: draft.system,
    remark: draft.remark.trim(),
    perms: draft.perms,
    createdBy: operator,
    createdAt: at,
    updatedBy: operator,
    updatedAt: at,
  }
  commit({ roles: [role, ...state.roles] })
  return { ok: true as const, message: `角色「${role.name}」已新增` }
}

export function updateRole(id: string, draft: RoleDraft, operator: string) {
  const issues = validateRole(draft, id)
  if (issues.length > 0) return { ok: false as const, message: issues[0] }

  commit({
    roles: state.roles.map((r) =>
      r.id === id
        ? {
            ...r,
            code: draft.code.trim(),
            name: draft.name.trim(),
            system: draft.system,
            remark: draft.remark.trim(),
            perms: draft.perms,
            updatedBy: operator,
            updatedAt: stamp(),
          }
        : r,
    ),
  })
  return { ok: true as const, message: '角色已保存' }
}

export function removeRoles(ids: string[]): BatchResult[] {
  const hit = state.roles.filter((r) => ids.includes(r.id))
  const results: BatchResult[] = hit.map((r) => {
    if (r.system) return { id: r.id, label: r.name, ok: false, message: '系统角色不可删除' }
    const used = state.users.filter((u) => u.roleNames.includes(r.name)).length
    if (used > 0) {
      return { id: r.id, label: r.name, ok: false, message: `已被 ${used} 个用户关联，请先解除关联` }
    }
    return { id: r.id, label: r.name, ok: true, message: '已删除' }
  })

  const removable = results.filter((r) => r.ok).map((r) => r.id)
  if (removable.length > 0) {
    commit({ roles: state.roles.filter((r) => !removable.includes(r.id)) })
  }
  return results
}

/** 演示角色清单，供用户管理的「关联角色」使用 */
export function roleNameOptions() {
  return ROLES.map((r) => r.name)
}

/* ---------------- 参数 ---------------- */

export type ParamDraft = {
  key: string
  value: string
  image: string
  description: string
}

export const EMPTY_PARAM_DRAFT: ParamDraft = {
  key: '',
  value: '',
  image: '',
  description: '',
}

export function validateParam(draft: ParamDraft, editingId?: string): string[] {
  const issues: string[] = []
  const key = draft.key.trim()
  if (!key) issues.push('参数名不能为空')
  if (!draft.value.trim()) issues.push('参数值不能为空')
  if (key && state.params.some((p) => p.key === key && p.id !== editingId)) {
    issues.push(`参数名「${key}」已存在`)
  }
  return issues
}

export function createParam(draft: ParamDraft) {
  const issues = validateParam(draft)
  if (issues.length > 0) return { ok: false as const, message: issues[0] }

  const param: SysParam = {
    id: `SP-${nextSeq()}`,
    key: draft.key.trim(),
    value: draft.value.trim(),
    image: draft.image,
    description: draft.description.trim(),
  }
  commit({ params: [param, ...state.params] })
  return { ok: true as const, message: `参数「${param.key}」已新增` }
}

export function updateParam(id: string, draft: ParamDraft) {
  const issues = validateParam(draft, id)
  if (issues.length > 0) return { ok: false as const, message: issues[0] }

  commit({
    params: state.params.map((p) =>
      p.id === id
        ? {
            ...p,
            key: draft.key.trim(),
            value: draft.value.trim(),
            image: draft.image,
            description: draft.description.trim(),
          }
        : p,
    ),
  })
  return { ok: true as const, message: '参数已保存' }
}

export function removeParams(ids: string[]): BatchResult[] {
  const hit = state.params.filter((p) => ids.includes(p.id))
  const results: BatchResult[] = hit.map((p) => ({
    id: p.id,
    label: p.key,
    ok: true,
    message: '已删除',
  }))
  if (ids.length > 0) {
    commit({ params: state.params.filter((p) => !ids.includes(p.id)) })
  }
  return results
}

/* ---------------- 通用代码 ---------------- */

export type CodeTypeDraft = {
  code: string
  name: string
  sort: number
  remark: string
  items: CodeItem[]
}

export const EMPTY_CODE_TYPE_DRAFT: CodeTypeDraft = {
  code: '',
  name: '',
  sort: 1,
  remark: '',
  items: [],
}

/** 明细行的空白模板，codeId 按序生成 */
export function newCodeItem(index: number): CodeItem {
  const id = `CD-${nextSeq()}${pad(index + 1)}`
  return { id, codeId: id, name: '', enabled: true, value: '', sort: index + 1, remark: '' }
}

export function validateCodeType(draft: CodeTypeDraft, editingId?: string): string[] {
  const issues: string[] = []
  const code = draft.code.trim()
  if (!code) issues.push('类型编号不能为空')
  if (!draft.name.trim()) issues.push('类型名称不能为空')
  if (code && state.codeTypes.some((t) => t.code === code && t.id !== editingId)) {
    issues.push(`类型编号「${code}」已存在`)
  }
  if (draft.items.some((i) => !i.name.trim())) issues.push('明细中存在未填写的代码名称')

  const values = draft.items.map((i) => i.value.trim()).filter(Boolean)
  if (new Set(values).size !== values.length) issues.push('明细中存在重复的代码值')
  return issues
}

export function createCodeType(draft: CodeTypeDraft) {
  const issues = validateCodeType(draft)
  if (issues.length > 0) return { ok: false as const, message: issues[0] }

  const type: CodeType = {
    id: `CT-${nextSeq()}`,
    code: draft.code.trim(),
    name: draft.name.trim(),
    sort: draft.sort,
    remark: draft.remark.trim(),
    items: draft.items,
  }
  commit({ codeTypes: [type, ...state.codeTypes] })
  return { ok: true as const, message: `通用代码「${type.name}」已新增` }
}

export function updateCodeType(id: string, draft: CodeTypeDraft) {
  const issues = validateCodeType(draft, id)
  if (issues.length > 0) return { ok: false as const, message: issues[0] }

  commit({
    codeTypes: state.codeTypes.map((t) =>
      t.id === id
        ? {
            ...t,
            code: draft.code.trim(),
            name: draft.name.trim(),
            sort: draft.sort,
            remark: draft.remark.trim(),
            items: draft.items,
          }
        : t,
    ),
  })
  return { ok: true as const, message: '通用代码已保存' }
}

export function removeCodeTypes(ids: string[]): BatchResult[] {
  const hit = state.codeTypes.filter((t) => ids.includes(t.id))
  const results: BatchResult[] = hit.map((t) => ({
    id: t.id,
    label: t.name,
    ok: true,
    message: `已删除，同时移除 ${t.items.length} 条明细`,
  }))
  if (ids.length > 0) {
    commit({ codeTypes: state.codeTypes.filter((t) => !ids.includes(t.id)) })
  }
  return results
}

/* ---------------- 协议 ---------------- */

export type AgreementDraft = {
  title: string
  code: string
  content: string
  systemShown: boolean
}

export const EMPTY_AGREEMENT_DRAFT: AgreementDraft = {
  title: '',
  code: '',
  content: '',
  systemShown: false,
}

/** 去掉 HTML 标签后判断富文本是否为空 */
export function plainText(html: string) {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, '')
    .trim()
}

export function validateAgreement(draft: AgreementDraft, editingId?: string): string[] {
  const issues: string[] = []
  const code = draft.code.trim()
  if (!draft.title.trim()) issues.push('协议标题不能为空')
  if (!code) issues.push('协议编号不能为空')
  if (!plainText(draft.content)) issues.push('协议内容不能为空')
  if (code && state.agreements.some((a) => a.code === code && a.id !== editingId)) {
    issues.push(`协议编号「${code}」已存在`)
  }
  return issues
}

export function createAgreement(draft: AgreementDraft, operator: string) {
  const issues = validateAgreement(draft)
  if (issues.length > 0) return { ok: false as const, message: issues[0] }

  const at = stamp()
  const agreement: Agreement = {
    id: `AG-${nextSeq()}`,
    title: draft.title.trim(),
    code: draft.code.trim(),
    content: draft.content,
    systemShown: draft.systemShown,
    createdBy: operator,
    createdAt: at,
    updatedBy: operator,
    updatedAt: at,
  }
  commit({ agreements: [agreement, ...state.agreements] })
  return { ok: true as const, message: `协议「${agreement.title}」已新增` }
}

export function updateAgreement(id: string, draft: AgreementDraft, operator: string) {
  const issues = validateAgreement(draft, id)
  if (issues.length > 0) return { ok: false as const, message: issues[0] }

  commit({
    agreements: state.agreements.map((a) =>
      a.id === id
        ? {
            ...a,
            title: draft.title.trim(),
            code: draft.code.trim(),
            content: draft.content,
            systemShown: draft.systemShown,
            updatedBy: operator,
            updatedAt: stamp(),
          }
        : a,
    ),
  })
  return { ok: true as const, message: '协议已保存' }
}

export function removeAgreements(ids: string[]): BatchResult[] {
  const hit = state.agreements.filter((a) => ids.includes(a.id))
  const results: BatchResult[] = hit.map((a) =>
    a.systemShown
      ? { id: a.id, label: a.title, ok: false, message: 'APP 端正在引用，不可删除' }
      : { id: a.id, label: a.title, ok: true, message: '已删除' },
  )

  const removable = results.filter((r) => r.ok).map((r) => r.id)
  if (removable.length > 0) {
    commit({ agreements: state.agreements.filter((a) => !removable.includes(a.id)) })
  }
  return results
}

/* ---------------- 广告组件 ---------------- */

export type AdSlotDraft = {
  instance: string
  component: string
  remark: string
}

export const EMPTY_AD_DRAFT: AdSlotDraft = {
  instance: '',
  component: '',
  remark: '',
}

export function validateAdSlot(draft: AdSlotDraft, editingId?: string): string[] {
  const issues: string[] = []
  const instance = draft.instance.trim()
  if (!instance) issues.push('实例名称不能为空')
  else if (!AD_INSTANCE_PATTERN.test(instance)) {
    issues.push('实例名称只能使用大写字母与下划线，如 INDEX_BANNER')
  }
  if (!draft.component.trim()) issues.push('系统组件名称不能为空')
  if (instance && state.ads.some((a) => a.instance === instance && a.id !== editingId)) {
    issues.push(`实例名称「${instance}」已存在`)
  }
  return issues
}

export function createAdSlot(draft: AdSlotDraft) {
  const issues = validateAdSlot(draft)
  if (issues.length > 0) return { ok: false as const, message: issues[0] }

  const ad: AdSlot = {
    id: `AD-${nextSeq()}`,
    instance: draft.instance.trim(),
    component: draft.component.trim(),
    remark: draft.remark.trim(),
  }
  commit({ ads: [...state.ads, ad] })
  return { ok: true as const, message: `广告组件「${ad.instance}」已新增` }
}

export function updateAdSlot(id: string, draft: AdSlotDraft) {
  const issues = validateAdSlot(draft, id)
  if (issues.length > 0) return { ok: false as const, message: issues[0] }

  commit({
    ads: state.ads.map((a) =>
      a.id === id
        ? {
            ...a,
            instance: draft.instance.trim(),
            component: draft.component.trim(),
            remark: draft.remark.trim(),
          }
        : a,
    ),
  })
  return { ok: true as const, message: '广告组件已保存' }
}

export function removeAdSlots(ids: string[]): BatchResult[] {
  const hit = state.ads.filter((a) => ids.includes(a.id))
  const results: BatchResult[] = hit.map((a) => ({
    id: a.id,
    label: a.instance,
    ok: true,
    message: '已删除',
  }))
  if (ids.length > 0) {
    commit({ ads: state.ads.filter((a) => !ids.includes(a.id)) })
  }
  return results
}
