'use client'

/**
 * 系统日志（在线用户 / 登录 / 导出 / 删除 / 系统 / 接口）原型数据与状态。
 * 日志本身只读，唯一的写操作是把在线会话强制下线。
 * 仅用于原型演示，不连接真实 API。
 */

import * as React from 'react'

import type { BatchResult } from '@/lib/content-store'

export type { BatchResult }

/* ---------------- 类型 ---------------- */

export type LoginType = '平台管理端登录' | 'APP 登录' | '企业微信 H5 登录'
export type LoginState = '登录成功' | '登录失败'

/** 在线用户与登录日志共用；在线列表只取 online 为 true 的记录 */
export type LoginLog = {
  id: string
  account: string
  name: string
  type: LoginType
  ip: string
  state: LoginState
  loginAt: string
  online: boolean
}

/** 导出日志与删除日志共用 */
export type OpLog = {
  id: string
  operator: string
  action: string
  content: string
  ip: string
  operatedAt: string
}

export type SysLog = {
  id: string
  operator: string
  description: string
  method: string
  params: string
  costMs: number
  operatedAt: string
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export type ApiLog = {
  id: string
  url: string
  description: string
  httpMethod: HttpMethod
  ip: string
  abnormal: boolean
  params: string
  response: string
  costMs: number
  createdAt: string
}

/* ---------------- 常量 ---------------- */

export const LOGIN_TYPES: LoginType[] = [
  '平台管理端登录',
  'APP 登录',
  '企业微信 H5 登录',
]
export const LOGIN_STATES: LoginState[] = ['登录成功', '登录失败']
export const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE']

/** 慢请求阈值，超过则在列表中高亮 */
export const SLOW_MS = 1000

/* ---------------- 种子数据：登录记录 ---------------- */

type LoginRow = [string, string, LoginType, string, LoginState, string, boolean]

const LOGIN_ROWS: LoginRow[] = [
  ['admin', '张亦驰', '平台管理端登录', '192.168.13.161', '登录成功', '2026-08-12 09:37:23', true],
  ['admin.ops', '周敬', '平台管理端登录', '192.168.13.166', '登录成功', '2026-08-12 09:12:41', true],
  ['admin.news', '李雯', '平台管理端登录', '192.168.15.103', '登录成功', '2026-08-12 08:14:47', true],
  ['admin.normal', '王海涛', '平台管理端登录', '192.168.15.46', '登录成功', '2026-08-12 08:52:10', true],
  ['SG10231', '王建国', 'APP 登录', '10.24.66.18', '登录成功', '2026-08-12 08:05:32', true],
  ['SG20115', '陈晓东', '企业微信 H5 登录', '10.24.71.204', '登录成功', '2026-08-12 07:58:19', true],
  ['SG30142', '刘志强', 'APP 登录', '10.24.68.77', '登录成功', '2026-08-12 07:41:06', true],
  ['admin.forum', '刘思远', '平台管理端登录', '192.168.15.103', '登录成功', '2026-08-11 15:08:52', false],
  ['admin.media', '赵启明', '平台管理端登录', '192.168.13.166', '登录成功', '2026-08-11 17:23:05', false],
  ['admin.publish', '陈锐', '平台管理端登录', '192.168.12.111', '登录成功', '2026-08-11 16:40:31', false],
  ['admin.points', '孙可', '平台管理端登录', '192.168.15.46', '登录成功', '2026-08-11 14:22:18', false],
  ['yangfan', '杨帆', '平台管理端登录', '192.168.13.166', '登录失败', '2026-08-11 10:49:42', false],
  ['yangfan', '杨帆', '平台管理端登录', '192.168.13.166', '登录失败', '2026-08-11 10:48:15', false],
  ['yangfan', '杨帆', '平台管理端登录', '192.168.13.166', '登录失败', '2026-08-11 10:46:58', false],
  ['SG40108', '郑文博', 'APP 登录', '10.24.70.132', '登录成功', '2026-08-10 19:32:04', false],
  ['SG50127', '杨帆', '企业微信 H5 登录', '10.24.73.88', '登录成功', '2026-08-10 16:11:27', false],
  ['hejing', '何静', '平台管理端登录', '192.168.15.103', '登录成功', '2026-08-10 11:47:33', false],
  ['SG10287', '李慧敏', 'APP 登录', '10.24.66.51', '登录成功', '2026-08-09 20:14:53', false],
  ['zhengwb', '郑文博', '平台管理端登录', '192.168.12.111', '登录成功', '2026-08-09 16:19:02', false],
  ['SG20178', '周芸', '企业微信 H5 登录', '10.24.71.16', '登录失败', '2026-08-08 09:27:38', false],
  ['SG30196', '孙悦', 'APP 登录', '10.24.68.145', '登录成功', '2026-08-07 18:03:21', false],
  ['admin', '张亦驰', '平台管理端登录', '192.168.13.161', '登录成功', '2026-08-06 09:36:02', false],
  ['admin', '张亦驰', '平台管理端登录', '192.168.13.166', '登录失败', '2026-08-05 10:49:42', false],
  ['admin', '张亦驰', '平台管理端登录', '192.168.13.166', '登录成功', '2026-08-04 10:26:04', false],
]

const SEED_LOGIN_LOGS: LoginLog[] = LOGIN_ROWS.map(
  ([account, name, type, ip, state, loginAt, online], i) => ({
    id: `LI-${String(i + 1).padStart(3, '0')}`,
    account,
    name,
    type,
    ip,
    state,
    loginAt,
    online,
  }),
)

/* ---------------- 种子数据：导出日志 ---------------- */

type OpRow = [string, string, string, string, string]

const EXPORT_ROWS: OpRow[] = [
  ['张亦驰(管理端)', '资讯信息表#导出', '{"category":"要闻","status":"已发布","rows":128}', '192.168.13.161', '2026-08-12 09:41:05'],
  ['周敬(管理端)', '登录日志表#导出', '{"from":"2026-08-01","to":"2026-08-12","rows":486}', '192.168.13.166', '2026-08-12 09:28:33'],
  ['孙可(管理端)', '积分流水日志表#导出', '{"month":"2026-08","rows":2314}', '192.168.15.46', '2026-08-12 08:57:12'],
  ['李雯(管理端)', '资讯评论表#导出', '{"newsId":"NEWS-20260811-001","rows":42}', '192.168.15.103', '2026-08-11 17:14:26'],
  ['孙可(管理端)', '积分商城订单表#导出', '{"status":"待领取","rows":28}', '192.168.15.46', '2026-08-11 16:05:48'],
  ['王海涛(管理端)', '员工主数据表#导出', '{"company":"陕鼓集团","status":"在职","rows":7318}', '192.168.15.46', '2026-08-11 14:32:07'],
  ['刘思远(管理端)', '论坛帖子表#导出', '{"scope":"all","rows":316}', '192.168.15.103', '2026-08-11 11:19:54'],
  ['周敬(管理端)', '接口日志表#导出', '{"abnormal":true,"rows":37}', '192.168.13.166', '2026-08-10 17:48:21'],
  ['赵启明(管理端)', '视听内容表#导出', '{"type":"视频","rows":268}', '192.168.13.166', '2026-08-10 15:26:39'],
  ['王海涛(管理端)', '部门信息表#导出', '{"rows":42}', '192.168.15.46', '2026-08-10 10:03:15'],
  ['孙可(管理端)', '积分规则表#导出', '{"enabled":true,"rows":14}', '192.168.15.46', '2026-08-09 16:41:52'],
  ['李雯(管理端)', '资讯信息表#导出', '{"category":"通知","status":"全部","rows":86}', '192.168.15.103', '2026-08-09 14:07:33'],
  ['周敬(管理端)', '系统日志表#导出', '{"from":"2026-08-01","to":"2026-08-09","rows":1892}', '192.168.13.166', '2026-08-09 09:52:18'],
  ['刘思远(管理端)', '论坛评论表#导出', '{"status":"待处理","rows":73}', '192.168.15.103', '2026-08-08 15:38:44'],
  ['孙可(管理端)', '商城商品表#导出', '{"online":true,"rows":56}', '192.168.15.46', '2026-08-07 11:24:09'],
  ['王海涛(管理端)', '意见反馈表#导出', '{"status":"待回复","rows":19}', '192.168.15.46', '2026-08-06 16:52:31'],
  ['周敬(管理端)', '在线用户表#导出', '{"rows":7}', '192.168.13.166', '2026-08-05 09:14:27'],
  ['张亦驰(管理端)', '角色权限表#导出', '{"rows":8}', '192.168.13.161', '2026-08-04 10:31:56'],
]

const SEED_EXPORT_LOGS: OpLog[] = EXPORT_ROWS.map(
  ([operator, action, content, ip, operatedAt], i) => ({
    id: `EX-${String(i + 1).padStart(3, '0')}`,
    operator,
    action,
    content,
    ip,
    operatedAt,
  }),
)

/* ---------------- 种子数据：删除日志 ---------------- */

const DELETE_ROWS: OpRow[] = [
  ['周敬(管理端)', '通用代码#批量删除', '["CT-07","CT-08"]', '192.168.13.166', '2026-08-12 09:05:19'],
  ['李雯(管理端)', '资讯类目表#批量删除', '["CAT-08"]', '192.168.15.103', '2026-08-11 16:20:07'],
  ['刘思远(管理端)', '论坛帖子表#批量删除', '["FP-0231","FP-0244","FP-0250"]', '192.168.15.103', '2026-08-11 15:19:54'],
  ['刘思远(管理端)', '论坛评论表#批量删除', '["FC-1120","FC-1121"]', '192.168.15.103', '2026-08-11 11:11:39'],
  ['赵启明(管理端)', '视听内容表#删除', '["MD-0182"]', '192.168.13.166', '2026-08-10 17:41:22'],
  ['李雯(管理端)', '资讯评论表#批量删除', '["NC-2043","NC-2044","NC-2051","NC-2052"]', '192.168.15.103', '2026-08-10 14:33:48'],
  ['孙可(管理端)', '商城商品表#删除', '["PD-0067"]', '192.168.15.46', '2026-08-10 10:52:16'],
  ['周敬(管理端)', '菜单节点#删除', '["MN-97"]', '192.168.13.166', '2026-08-09 16:08:37'],
  ['王海涛(管理端)', '后台用户表#批量删除', '["SU-14","SU-15"]', '192.168.15.46', '2026-08-09 11:47:05'],
  ['刘思远(管理端)', '敏感词表#批量删除', '["SW-0112","SW-0118","SW-0119"]', '192.168.15.103', '2026-08-08 15:26:41'],
  ['李雯(管理端)', '资讯信息表#删除', '["NEWS-20260722-014"]', '192.168.15.103', '2026-08-08 09:38:52'],
  ['孙可(管理端)', '积分规则表#删除', '["PR-0021"]', '192.168.15.46', '2026-08-07 14:19:33'],
  ['周敬(管理端)', '系统参数表#批量删除', '["SP-11","SP-12"]', '192.168.13.166', '2026-08-07 09:04:28'],
  ['赵启明(管理端)', '视听评论表#批量删除', '["MC-0331","MC-0334"]', '192.168.13.166', '2026-08-06 16:47:14'],
  ['王海涛(管理端)', '部门信息表#删除', '["DP-0038"]', '192.168.15.46', '2026-08-06 10:22:51'],
  ['周敬(管理端)', '广告组件#删除', '["AD-04"]', '192.168.13.166', '2026-08-05 15:33:07'],
  ['张亦驰(管理端)', '角色权限表#删除', '["SR-09"]', '192.168.13.161', '2026-08-05 09:26:44'],
  ['王海涛(管理端)', '意见反馈表#批量删除', '["FB-0210","FB-0214"]', '192.168.15.46', '2026-08-04 11:20:07'],
]

const SEED_DELETE_LOGS: OpLog[] = DELETE_ROWS.map(
  ([operator, action, content, ip, operatedAt], i) => ({
    id: `DL-${String(i + 1).padStart(3, '0')}`,
    operator,
    action,
    content,
    ip,
    operatedAt,
  }),
)

/* ---------------- 种子数据：系统日志 ---------------- */

type SysRow = [string, string, string, string, number, string]

const SYS_ROWS: SysRow[] = [
  ['周敬(管理端)', '系统操作日志#查询', 'com.shaangu.media.admin.SysLogController.page', '{"page":1,"size":10}', 67, '2026-08-12 09:41:05'],
  ['周敬(管理端)', '接口日志#查询', 'com.shaangu.media.admin.ApiLogController.page', '{"page":1,"size":10,"abnormal":true}', 72, '2026-08-12 09:41:02'],
  ['周敬(管理端)', '登录日志#查询', 'com.shaangu.media.admin.LoginLogController.page', '{"page":1,"size":20}', 75, '2026-08-12 09:41:01'],
  ['周敬(管理端)', '在线用户#查询', 'com.shaangu.media.admin.OnlineController.list', '{}', 85, '2026-08-12 09:40:55'],
  ['周敬(管理端)', '部门管理#查询', 'com.shaangu.media.admin.DeptController.tree', '{}', 30, '2026-08-12 09:40:36'],
  ['周敬(管理端)', '广告组件#查询', 'com.shaangu.media.admin.AdSlotController.page', '{"page":1,"size":10}', 8, '2026-08-12 09:40:12'],
  ['周敬(管理端)', '通用代码#查询', 'com.shaangu.media.admin.CodeTypeController.page', '{"page":1,"size":10}', 12, '2026-08-12 09:39:34'],
  ['周敬(管理端)', '参数设置#查询', 'com.shaangu.media.admin.SysParamController.page', '{"page":1,"size":10}', 9, '2026-08-12 09:39:14'],
  ['周敬(管理端)', '角色管理#查询', 'com.shaangu.media.admin.RoleController.page', '{"page":1,"size":10}', 14, '2026-08-12 09:38:57'],
  ['张亦驰(管理端)', '员工主数据#导出', 'com.shaangu.media.admin.StaffController.export', '{"company":"陕鼓集团","status":"在职"}', 3841, '2026-08-12 09:22:18'],
  ['张亦驰(管理端)', '工作台看板#查询', 'com.shaangu.media.admin.WorkbenchController.overview', '{}', 268, '2026-08-12 09:18:42'],
  ['李雯(管理端)', '资讯管理#保存', 'com.shaangu.media.admin.NewsController.save', '{"id":"NEWS-20260812-003"}', 142, '2026-08-12 08:36:11'],
  ['李雯(管理端)', '资讯管理#查询', 'com.shaangu.media.admin.NewsController.page', '{"page":1,"size":10,"status":"草稿"}', 96, '2026-08-12 08:15:33'],
  ['王海涛(管理端)', '员工主数据#同步', 'com.shaangu.media.job.NcStaffSyncJob.execute', '{"batch":"NC-20260812-0200"}', 18426, '2026-08-12 02:14:09'],
  ['赵启明(管理端)', '视听内容#保存', 'com.shaangu.media.admin.MediaController.save', '{"id":"MD-0204","type":"音频"}', 1204, '2026-08-11 17:22:47'],
  ['陈锐(管理端)', '资讯管理#发布', 'com.shaangu.media.admin.NewsController.publish', '{"ids":["NEWS-20260811-001"]}', 356, '2026-08-11 16:41:02'],
  ['刘思远(管理端)', '论坛帖子#批量删除', 'com.shaangu.media.admin.ForumPostController.remove', '{"ids":["FP-0231","FP-0244"]}', 189, '2026-08-11 15:19:56'],
  ['刘思远(管理端)', '敏感词#查询', 'com.shaangu.media.admin.SensitiveWordController.page', '{"page":1,"size":20}', 41, '2026-08-11 15:02:24'],
  ['孙可(管理端)', '积分流水#导出', 'com.shaangu.media.admin.PointsLogController.export', '{"month":"2026-08"}', 5273, '2026-08-11 14:23:31'],
  ['孙可(管理端)', '商城订单#查询', 'com.shaangu.media.admin.OrderController.page', '{"page":1,"size":10,"status":"待领取"}', 118, '2026-08-11 14:06:52'],
  ['王海涛(管理端)', '意见反馈#回复', 'com.shaangu.media.admin.FeedbackController.reply', '{"id":"FB-0221"}', 87, '2026-08-10 17:41:19'],
  ['周敬(管理端)', '系统参数#保存', 'com.shaangu.media.admin.SysParamController.save', '{"key":"video.size","value":"500"}', 63, '2026-08-10 15:08:44'],
  ['张亦驰(管理端)', '角色权限#保存', 'com.shaangu.media.admin.RoleController.savePerms', '{"roleId":"SR-06","permCount":13}', 231, '2026-08-09 16:31:07'],
  ['周敬(管理端)', '对象存储#清理', 'com.shaangu.media.job.MediaCleanJob.execute', '{"removed":126}', 9412, '2026-08-09 03:00:12'],
]

const SEED_SYS_LOGS: SysLog[] = SYS_ROWS.map(
  ([operator, description, method, params, costMs, operatedAt], i) => ({
    id: `SL-${String(i + 1).padStart(3, '0')}`,
    operator,
    description,
    method,
    params,
    costMs,
    operatedAt,
  }),
)

/* ---------------- 种子数据：接口日志 ---------------- */

type ApiRow = [string, string, HttpMethod, string, boolean, string, string, number, string]

const API_ROWS: ApiRow[] = [
  ['https://nc.shaangu.com/api/hr/staff/page', '用友 NC 员工主数据同步', 'POST', '192.168.13.166', false, '{"batch":"NC-20260812-0200","pageNo":1,"pageSize":500}', '{"code":0,"total":8614,"records":[...]}', 2418, '2026-08-12 02:14:09'],
  ['https://nc.shaangu.com/api/hr/staff/page', '用友 NC 员工主数据同步', 'POST', '192.168.13.166', true, '{"batch":"NC-20260812-0200","pageNo":18,"pageSize":500}', '{"code":50012,"msg":"存在重复工号：SG10231"}', 1876, '2026-08-12 02:14:07'],
  ['https://nc.shaangu.com/api/hr/dept/tree', '用友 NC 部门树同步', 'GET', '192.168.13.166', false, '{}', '{"code":0,"total":42}', 863, '2026-08-12 02:13:41'],
  ['https://qyapi.weixin.qq.com/cgi-bin/gettoken', '企业微信鉴权取 token', 'GET', '192.168.13.161', false, '{"corpid":"ww***","corpsecret":"***"}', '{"errcode":0,"access_token":"***","expires_in":7200}', 348, '2026-08-12 09:37:20'],
  ['https://qyapi.weixin.qq.com/cgi-bin/user/get', '企业微信获取成员信息', 'GET', '192.168.13.161', false, '{"userid":"SG10231"}', '{"errcode":0,"name":"王建国","department":[3]}', 164, '2026-08-12 08:05:30'],
  ['https://qyapi.weixin.qq.com/cgi-bin/message/send', '企业微信应用消息推送', 'POST', '192.168.15.46', false, '{"touser":"@all","msgtype":"textcard","agentid":1000021}', '{"errcode":0,"errmsg":"ok"}', 623, '2026-08-11 16:06:12'],
  ['https://qyapi.weixin.qq.com/cgi-bin/message/send', '企业微信应用消息推送', 'POST', '192.168.15.46', true, '{"touser":"SG99999","msgtype":"text"}', '{"errcode":81013,"errmsg":"user not found"}', 410, '2026-08-11 16:06:09'],
  ['https://obs.shaangu.com/shaangu-media/app/video', '对象存储上传视频', 'PUT', '192.168.13.166', false, '{"key":"app/video/MD-0204.mp4","size":184320000}', '{"status":200,"etag":"\\"a7f3...\\""}', 8452, '2026-08-11 17:22:41'],
  ['https://obs.shaangu.com/shaangu-media/app/audio', '对象存储上传音频', 'PUT', '192.168.13.166', false, '{"key":"app/audio/MD-0205.mp3","size":12480000}', '{"status":200,"etag":"\\"3c81...\\""}', 1237, '2026-08-11 17:20:18'],
  ['https://obs.shaangu.com/shaangu-media/app/cover', '对象存储上传封面', 'PUT', '192.168.15.103', false, '{"key":"app/cover/NEWS-20260812-003.jpg","size":486000}', '{"status":200,"etag":"\\"91bd...\\""}', 287, '2026-08-12 08:36:08'],
  ['https://obs.shaangu.com/shaangu-media/app/cover', '对象存储上传封面', 'PUT', '192.168.15.103', true, '{"key":"app/cover/NEWS-20260810-009.jpg","size":13421772}', '{"status":413,"msg":"文件超过 10M 限制"}', 156, '2026-08-10 11:22:34'],
  ['https://media.shaangu.com/transcode/submit', '媒体转码任务提交', 'POST', '192.168.13.166', false, '{"mediaId":"MD-0204","preset":"h264_720p"}', '{"code":0,"taskId":"TC-20260811-0042"}', 542, '2026-08-11 17:23:02'],
  ['https://media.shaangu.com/transcode/status', '媒体转码状态查询', 'GET', '192.168.13.166', false, '{"taskId":"TC-20260811-0042"}', '{"code":0,"status":"SUCCESS","duration":186}', 137, '2026-08-11 17:31:45'],
  ['https://sso.shaangu.com/api/verify-code/send', '登录验证码下发（企业微信通道）', 'POST', '192.168.15.46', false, '{"account":"admin.normal","channel":"WECOM","template":"LOGIN_CODE"}', '{"code":0,"msgId":"VC-20260812-1183"}', 442, '2026-08-12 08:51:57'],
  ['https://sso.shaangu.com/api/verify-code/send', '登录验证码下发（企业微信通道）', 'POST', '192.168.15.46', true, '{"account":"majln","channel":"WECOM","template":"LOGIN_CODE"}', '{"code":40003,"msg":"账号已停用，禁止下发验证码"}', 388, '2026-08-10 09:14:22'],
  ['https://push.shaangu.com/api/v3/push', 'APP 推送通道下发', 'POST', '192.168.15.46', false, '{"audience":"all","title":"内刊 2026 年第 7 期上线"}', '{"code":0,"sendno":"20260810162"}', 731, '2026-08-10 16:20:41'],
  ['https://push.shaangu.com/api/v3/push', 'APP 推送通道下发', 'POST', '192.168.15.46', false, '{"audience":"tag:on_job","title":"年度信息安全培训通知"}', '{"code":0,"sendno":"20260809104"}', 694, '2026-08-09 10:48:33'],
  ['https://sso.shaangu.com/oauth2/token', '统一身份认证换取令牌', 'POST', '192.168.13.161', false, '{"grant_type":"authorization_code","client_id":"media-admin"}', '{"access_token":"***","expires_in":3600}', 213, '2026-08-12 09:37:18'],
  ['https://sso.shaangu.com/oauth2/introspect', '统一身份认证令牌校验', 'POST', '192.168.13.166', false, '{"token":"***"}', '{"active":true,"sub":"admin.ops"}', 96, '2026-08-12 09:12:38'],
  ['https://sso.shaangu.com/oauth2/token', '统一身份认证换取令牌', 'POST', '192.168.13.166', true, '{"grant_type":"password","username":"yangfan"}', '{"error":"invalid_grant","error_description":"账号已锁定"}', 174, '2026-08-11 10:49:40'],
]

const SEED_API_LOGS: ApiLog[] = API_ROWS.map(
  ([url, description, httpMethod, ip, abnormal, params, response, costMs, createdAt], i) => ({
    id: `AL-${String(i + 1).padStart(3, '0')}`,
    url,
    description,
    httpMethod,
    ip,
    abnormal,
    params,
    response,
    costMs,
    createdAt,
  }),
)

/* ---------------- store ---------------- */

type State = {
  loginLogs: LoginLog[]
  exportLogs: OpLog[]
  deleteLogs: OpLog[]
  sysLogs: SysLog[]
  apiLogs: ApiLog[]
}

let state: State = {
  loginLogs: SEED_LOGIN_LOGS,
  exportLogs: SEED_EXPORT_LOGS,
  deleteLogs: SEED_DELETE_LOGS,
  sysLogs: SEED_SYS_LOGS,
  apiLogs: SEED_API_LOGS,
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

export function useLogs(): State {
  return React.useSyncExternalStore(subscribe, snapshot, snapshot)
}

/* ---------------- 语义色 ---------------- */

export function loginStateTone(s: LoginState) {
  return s === '登录成功' ? ('success' as const) : ('danger' as const)
}

export function loginTypeTone(t: LoginType) {
  if (t === '平台管理端登录') return 'info' as const
  return t === 'APP 登录' ? ('neutral' as const) : ('success' as const)
}

export function abnormalTone(abnormal: boolean) {
  return abnormal ? ('danger' as const) : ('neutral' as const)
}

export function costTone(ms: number) {
  return ms > SLOW_MS ? ('warning' as const) : ('neutral' as const)
}

export function httpMethodTone(m: HttpMethod) {
  if (m === 'GET') return 'info' as const
  if (m === 'DELETE') return 'danger' as const
  return m === 'POST' ? ('success' as const) : ('warning' as const)
}

/* ---------------- 唯一写操作：强制下线 ---------------- */

/** 强制下线：把会话从在线列表移除，登录日志中的历史记录保留 */
export function forceOffline(ids: string[]): BatchResult[] {
  const hit = state.loginLogs.filter((l) => ids.includes(l.id))
  const results: BatchResult[] = hit.map((l) =>
    l.online
      ? { id: l.id, label: `${l.name}（${l.account}）`, ok: true, message: '会话已强制下线' }
      : { id: l.id, label: `${l.name}（${l.account}）`, ok: false, message: '该会话已不在线' },
  )

  const changed = results.filter((r) => r.ok).map((r) => r.id)
  if (changed.length > 0) {
    commit({
      loginLogs: state.loginLogs.map((l) =>
        changed.includes(l.id) ? { ...l, online: false } : l,
      ),
    })
  }
  return results
}
