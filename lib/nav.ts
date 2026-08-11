import type { LucideIcon } from 'lucide-react'
import {
  BadgeCheck,
  BarChart3,
  Bell,
  Building2,
  Coins,
  FileText,
  Gauge,
  KeyRound,
  LayoutList,
  ListTree,
  MessageSquare,
  MessagesSquare,
  Newspaper,
  PlayCircle,
  RefreshCcw,
  ScrollText,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Store,
  Users,
} from 'lucide-react'

/* ---------------- 角色（仅供原型演示） ---------------- */

export type RoleKey =
  | 'super'
  | 'normal'
  | 'news'
  | 'media'
  | 'publisher'
  | 'forum'
  | 'points'
  | 'ops'

export type Role = {
  key: RoleKey
  name: string
  account: string
  person: string
  scope: string
  perms: string[]
}

export const ROLES: Role[] = [
  {
    key: 'super',
    name: '超级管理员',
    account: 'admin',
    person: '张亦驰',
    scope: '集团全部数据',
    perms: ['*'],
  },
  {
    key: 'normal',
    name: '普通管理员',
    account: 'admin.normal',
    person: '王海涛',
    scope: '授权部门数据',
    perms: [
      'workbench',
      'messages',
      'feedback',
      'system.users',
      'system.depts',
      'logs.online',
      'logs.login',
    ],
  },
  {
    key: 'news',
    name: '资讯管理员',
    account: 'admin.news',
    person: '李雯',
    scope: '资讯栏目数据',
    perms: [
      'workbench',
      'content.categories',
      'content.news',
      'content.comments',
      'feedback',
    ],
  },
  {
    key: 'media',
    name: '视听管理员',
    account: 'admin.media',
    person: '赵启明',
    scope: '视听栏目数据',
    // 视听管理员只负责稿件准备与发布后管理，发布权限仅固定发布人员持有
    perms: ['workbench', 'media.list', 'media.comments', 'feedback'],
  },
  {
    key: 'publisher',
    name: '固定发布人员',
    account: 'admin.publish',
    person: '陈锐',
    scope: '资讯与视听发布',
    perms: [
      'workbench',
      'content.news',
      'content.publish',
      'media.list',
      'media.publish',
    ],
  },
  {
    key: 'forum',
    name: '论坛管理员',
    account: 'admin.forum',
    person: '刘思远',
    scope: '论坛全部内容',
    perms: [
      'workbench',
      'forum.posts',
      'forum.publish',
      'forum.comments',
      'forum.words',
    ],
  },
  {
    key: 'points',
    name: '积分/商城管理员',
    account: 'admin.points',
    person: '孙可',
    scope: '积分与商城数据',
    perms: [
      'workbench',
      'points.rules',
      'points.logs',
      'mall.products',
      'mall.orders',
    ],
  },
  {
    key: 'ops',
    name: '运维与安全人员',
    account: 'admin.ops',
    person: '周敬',
    scope: '系统与任务数据',
    perms: [
      'workbench',
      'system.menus',
      'system.users',
      'system.roles',
      'system.params',
      'system.codes',
      'system.agreements',
      'system.ads',
      'system.depts',
      'logs.online',
      'logs.login',
      'logs.export',
      'logs.delete',
      'logs.system',
      'logs.api',
    ],
  },
]

export const DEFAULT_ROLE: RoleKey = 'super'

export function getRole(key: RoleKey): Role {
  return ROLES.find((r) => r.key === key) ?? ROLES[0]
}

export function can(role: Role, perm: string): boolean {
  if (!perm) return true
  return role.perms.includes('*') || role.perms.includes(perm)
}

/* ---------------- 菜单与路由 ---------------- */

export type MenuItem = {
  title: string
  path: string
  perm: string
}

export type MenuGroup = {
  title: string
  icon: LucideIcon
  /** 一级菜单直达页面（无下级菜单时使用，如工作台） */
  path?: string
  perm?: string
  children: MenuItem[]
}

export const MENU: MenuGroup[] = [
  {
    title: '工作台',
    icon: Gauge,
    path: '/workbench',
    perm: 'workbench',
    children: [],
  },
  {
    title: '内容管理',
    icon: Newspaper,
    children: [
      {
        title: '资讯类目管理',
        path: '/content/categories',
        perm: 'content.categories',
      },
      { title: '资讯管理', path: '/content/news', perm: 'content.news' },
      {
        title: '资讯评论管理',
        path: '/content/comments',
        perm: 'content.comments',
      },
    ],
  },
  {
    title: '视听管理',
    icon: PlayCircle,
    children: [
      { title: '视频与音频管理', path: '/media/list', perm: 'media.list' },
      { title: '视听评论管理', path: '/media/comments', perm: 'media.comments' },
    ],
  },
  {
    title: '论坛管理',
    icon: MessagesSquare,
    children: [
      { title: '帖子管理', path: '/forum/posts', perm: 'forum.posts' },
      {
        title: '评论与回复管理',
        path: '/forum/comments',
        perm: 'forum.comments',
      },
      {
        title: '敏感词管理',
        path: '/forum/sensitive-words',
        perm: 'forum.words',
      },
    ],
  },
  {
    title: '积分管理',
    icon: Coins,
    children: [
      { title: '积分规则', path: '/points/rules', perm: 'points.rules' },
      { title: '积分日志', path: '/points/logs', perm: 'points.logs' },
    ],
  },
  {
    title: '积分商城',
    icon: Store,
    children: [
      { title: '商品管理', path: '/mall/products', perm: 'mall.products' },
      { title: '订单管理', path: '/mall/orders', perm: 'mall.orders' },
    ],
  },
  {
    title: '运营服务',
    icon: Bell,
    children: [
      { title: '站内消息管理', path: '/messages', perm: 'messages' },
      { title: '意见反馈管理', path: '/feedback', perm: 'feedback' },
    ],
  },
  {
    title: '系统管理',
    icon: Settings,
    children: [
      { title: '菜单管理', path: '/system/menus', perm: 'system.menus' },
      { title: '用户管理', path: '/system/users', perm: 'system.users' },
      { title: '角色管理', path: '/system/roles', perm: 'system.roles' },
      { title: '参数管理', path: '/system/params', perm: 'system.params' },
      { title: '通用代码', path: '/system/codes', perm: 'system.codes' },
      {
        title: '协议管理',
        path: '/system/agreements',
        perm: 'system.agreements',
      },
      { title: '广告组件', path: '/system/ads', perm: 'system.ads' },
      { title: '部门管理', path: '/system/departments', perm: 'system.depts' },
    ],
  },
  {
    title: '系统日志',
    icon: ScrollText,
    children: [
      { title: '在线用户', path: '/logs/online', perm: 'logs.online' },
      { title: '登录日志', path: '/logs/login', perm: 'logs.login' },
      { title: '导出日志', path: '/logs/export', perm: 'logs.export' },
      { title: '删除日志', path: '/logs/delete', perm: 'logs.delete' },
      { title: '系统日志', path: '/logs/system', perm: 'logs.system' },
      { title: '接口日志', path: '/logs/api', perm: 'logs.api' },
    ],
  },
]

/** 菜单之外仍需权限校验的子路由（发布动作、编辑页等） */
export const EXTRA_ROUTES: MenuItem[] = [
  { title: '新增资讯', path: '/content/news/new', perm: 'content.news' },
  { title: '新增视听内容', path: '/media/new', perm: 'media.list' },
  { title: '视听类目管理', path: '/media/categories', perm: 'media.list' },
  // 兜底前缀匹配 /media/[id] 详情页，需排在具体路径之后
  { title: '视听内容详情', path: '/media', perm: 'media.list' },
  { title: '发布视听内容', path: '/media/publish', perm: 'media.publish' },
  {
    title: '新建普通图文帖子',
    path: '/forum/posts/new',
    perm: 'forum.publish',
  },
  { title: '新增商品', path: '/mall/products/new', perm: 'mall.products' },
]

/** 一级直达菜单（无下级菜单）也纳入路由表 */
const LEAF_GROUPS: MenuItem[] = MENU.filter(
  (g) => g.children.length === 0 && g.path,
).map((g) => ({ title: g.title, path: g.path as string, perm: g.perm ?? '' }))

export const ALL_ROUTES: MenuItem[] = [
  ...LEAF_GROUPS,
  ...MENU.flatMap((g) => g.children),
  ...EXTRA_ROUTES,
]

export function routeMeta(path: string): MenuItem | undefined {
  const clean = path.split('?')[0]
  const exact = ALL_ROUTES.find((r) => r.path === clean)
  if (exact) return exact
  // 最长前缀匹配，覆盖 /content/news/[id] 之类的动态路由
  const matches = ALL_ROUTES.filter((r) => clean.startsWith(r.path + '/'))
  return matches.sort((a, b) => b.path.length - a.path.length)[0]
}

export function routeTitle(path: string): string {
  return routeMeta(path)?.title ?? '页面'
}

export function breadcrumbFor(path: string): string[] {
  const meta = routeMeta(path)
  if (!meta) return ['陕鼓融媒管理平台']
  // 一级直达菜单只显示自身，不重复层级
  if (MENU.some((g) => g.children.length === 0 && g.path === meta.path)) {
    return [meta.title]
  }
  const group = MENU.find((g) => g.children.some((c) => c.path === meta.path))
  const trail = group ? [group.title] : ['工作区']
  return [...trail, meta.title]
}

/** 角色可见菜单（按钮、路由与 403 均由同一份权限驱动） */
export function menuForRole(role: Role): MenuGroup[] {
  return MENU.map((g) => ({
    ...g,
    children: g.children.filter((c) => can(role, c.perm)),
  })).filter((g) =>
    g.children.length === 0 && g.path
      ? can(role, g.perm ?? '')
      : g.children.length > 0,
  )
}

export const ICONS = {
  BadgeCheck,
  BarChart3,
  Building2,
  FileText,
  KeyRound,
  LayoutList,
  ListTree,
  MessageSquare,
  RefreshCcw,
  ScrollText,
  ShieldCheck,
  ShoppingBag,
  Users,
}
