'use client'

/**
 * 视听管理（视频 / 陕鼓之声 / 视听评论）原型数据与状态。
 * 与内容管理保持一致：模块级 store + useSyncExternalStore，跨页面共享同一份数据。
 * 仅用于原型演示，不连接真实 API，也不包含审批流程。
 */

import * as React from 'react'

/* ---------------- 类型 ---------------- */

/** 视听类型仅两种：视频、音频“陕鼓之声” */
export type MediaKind = '视频' | '陕鼓之声'

/** 内容状态仅三种：草稿、已发布、已下架。发布后默认上架，下架后可重新上架。 */
export type MediaStatus = '草稿' | '已发布' | '已下架'

/** 媒体文件转码处理状态，处理失败可重试 */
export type ProcessState = '待上传' | '处理中' | '处理完成' | '处理失败'

export type MediaItem = {
  id: string
  title: string
  kind: MediaKind
  summary: string
  /** 视频封面取首帧截图，陕鼓之声为手动上传 */
  cover: string
  /** 视频封面是否来自首帧自动截取 */
  coverFromFrame: boolean
  fileName: string
  fileSize: string
  /** 时长 mm:ss */
  duration: string
  process: ProcessState
  /** 处理失败原因 */
  failReason: string
  retryCount: number
  status: MediaStatus
  top: boolean
  sort: number
  author: string
  dept: string
  createdAt: string
  updatedAt: string
  publishedAt: string
  publisher: string
  plays: number
  likes: number
  commentCount: number
}

export type MediaComment = {
  id: string
  mediaId: string
  mediaTitle: string
  mediaKind: MediaKind
  content: string
  nickname: string
  author: string
  dept: string
  createdAt: string
  hidden: boolean
}

/** 视听类目（固定两类，不可新增或删除） */
export type MediaCategory = {
  id: string
  name: MediaKind
  /** 封面获取方式说明 */
  coverRule: string
  accept: string
  sort: number
  remark: string
}

/** 批量操作逐条结果，与内容管理共用展示组件 */
export type BatchResult = {
  id: string
  label: string
  ok: boolean
  message: string
}

/* ---------------- 常量 ---------------- */

export const MEDIA_KINDS: MediaKind[] = ['视频', '陕鼓之声']
export const MEDIA_STATUSES: MediaStatus[] = ['草稿', '已发布', '已下架']
export const PROCESS_STATES: ProcessState[] = [
  '待上传',
  '处理中',
  '处理完成',
  '处理失败',
]

export const VIDEO_ACCEPT = 'video/mp4,video/quicktime,video/x-msvideo'
export const AUDIO_ACCEPT = 'audio/mpeg,audio/mp4,audio/wav,audio/aac'

export function acceptOf(kind: MediaKind) {
  return kind === '视频' ? VIDEO_ACCEPT : AUDIO_ACCEPT
}

/* ---------------- 种子数据 ---------------- */

const SEED_CATEGORIES: MediaCategory[] = [
  {
    id: 'MCAT-01',
    name: '视频',
    coverRule: '自动截取视频第一帧',
    accept: 'MP4 / MOV / AVI',
    sort: 1,
    remark: '集团视频栏目，上传后系统转码并自动截取第一帧作为封面',
  },
  {
    id: 'MCAT-02',
    name: '陕鼓之声',
    coverRule: '手动上传封面图',
    accept: 'MP3 / M4A / WAV',
    sort: 2,
    remark: '音频栏目“陕鼓之声”，封面需管理员手动上传，建议 16:9',
  },
]

const SEED_MEDIA: MediaItem[] = [
  {
    id: 'AV-20260810-001',
    title: '智能制造车间：一台大型鼓风机的诞生',
    kind: '视频',
    summary:
      '跟随镜头走进总装车间，记录大型能量转换设备从部件加工到整机试车的全过程。',
    cover: '/av/frame-workshop.png',
    coverFromFrame: true,
    fileName: 'workshop-4k.mp4',
    fileSize: '486.2 MB',
    duration: '08:42',
    process: '处理完成',
    failReason: '',
    retryCount: 0,
    status: '已发布',
    top: true,
    sort: 1,
    author: '赵启明',
    dept: '党群工作部',
    createdAt: '2026-08-09 09:12:04',
    updatedAt: '2026-08-10 10:02:18',
    publishedAt: '2026-08-10 10:02:18',
    publisher: '陈锐',
    plays: 12480,
    likes: 862,
    commentCount: 4,
  },
  {
    id: 'AV-20260808-002',
    title: '2026 年中工作会议现场纪实',
    kind: '视频',
    summary: '会议部署下半年重点任务，明确技术创新与数字化转型的推进节奏。',
    cover: '/av/frame-meeting.png',
    coverFromFrame: true,
    fileName: 'midyear-meeting.mp4',
    fileSize: '722.5 MB',
    duration: '15:20',
    process: '处理完成',
    failReason: '',
    retryCount: 0,
    status: '已发布',
    top: false,
    sort: 2,
    author: '赵启明',
    dept: '党群工作部',
    createdAt: '2026-08-07 14:40:11',
    updatedAt: '2026-08-08 09:30:00',
    publishedAt: '2026-08-08 09:30:00',
    publisher: '陈锐',
    plays: 8032,
    likes: 415,
    commentCount: 3,
  },
  {
    id: 'AV-20260806-003',
    title: '陕鼓之声第 42 期：一线班组的清晨',
    kind: '陕鼓之声',
    summary: '音频专栏走进检修班组，讲述交接班前后的三十分钟。',
    cover: '/av/audio-voice.png',
    coverFromFrame: false,
    fileName: 'voice-042.mp3',
    fileSize: '18.6 MB',
    duration: '12:05',
    process: '处理完成',
    failReason: '',
    retryCount: 0,
    status: '已发布',
    top: false,
    sort: 3,
    author: '赵启明',
    dept: '党群工作部',
    createdAt: '2026-08-05 16:22:39',
    updatedAt: '2026-08-06 08:50:12',
    publishedAt: '2026-08-06 08:50:12',
    publisher: '陈锐',
    plays: 5241,
    likes: 306,
    commentCount: 2,
  },
  {
    id: 'AV-20260804-004',
    title: '现场服务纪实：72 小时抢修',
    kind: '视频',
    summary: '服务团队奔赴用户现场，完成机组抢修与复产。',
    cover: '/av/frame-site.png',
    coverFromFrame: true,
    fileName: 'service-72h.mp4',
    fileSize: '540.9 MB',
    duration: '10:16',
    process: '处理完成',
    failReason: '',
    retryCount: 0,
    status: '已下架',
    top: false,
    sort: 4,
    author: '赵启明',
    dept: '服务事业部',
    createdAt: '2026-08-03 10:05:20',
    updatedAt: '2026-08-09 15:41:07',
    publishedAt: '2026-08-04 09:00:00',
    publisher: '陈锐',
    plays: 3390,
    likes: 168,
    commentCount: 1,
  },
  {
    id: 'AV-20260811-005',
    title: '陕鼓之声第 43 期：设备医生的听诊器',
    kind: '陕鼓之声',
    summary: '以振动分析为切口，讲述状态监测团队如何“听”出隐患。',
    cover: '/av/audio-story.png',
    coverFromFrame: false,
    fileName: 'voice-043.mp3',
    fileSize: '21.4 MB',
    duration: '14:38',
    process: '处理完成',
    failReason: '',
    retryCount: 0,
    status: '草稿',
    top: false,
    sort: 5,
    author: '赵启明',
    dept: '党群工作部',
    createdAt: '2026-08-11 08:30:44',
    updatedAt: '2026-08-11 09:12:10',
    publishedAt: '',
    publisher: '',
    plays: 0,
    likes: 0,
    commentCount: 0,
  },
  {
    id: 'AV-20260811-006',
    title: '技能大赛决赛集锦（待处理）',
    kind: '视频',
    summary: '决赛现场集锦，源文件较大，转码失败需重试。',
    cover: '',
    coverFromFrame: false,
    fileName: 'skill-final-raw.mov',
    fileSize: '1.6 GB',
    duration: '—',
    process: '处理失败',
    failReason: '源文件音轨编码不受支持（pcm_s24le），转码中断',
    retryCount: 1,
    status: '草稿',
    top: false,
    sort: 6,
    author: '赵启明',
    dept: '党群工作部',
    createdAt: '2026-08-11 10:05:02',
    updatedAt: '2026-08-11 10:18:35',
    publishedAt: '',
    publisher: '',
    plays: 0,
    likes: 0,
    commentCount: 0,
  },
  {
    id: 'AV-20260811-007',
    title: '新员工入职培训（第三讲）',
    kind: '视频',
    summary: '安全生产与信息安全专题，尚未上传媒体文件。',
    cover: '',
    coverFromFrame: false,
    fileName: '',
    fileSize: '—',
    duration: '—',
    process: '待上传',
    failReason: '',
    retryCount: 0,
    status: '草稿',
    top: false,
    sort: 7,
    author: '赵启明',
    dept: '人力资源部',
    createdAt: '2026-08-11 11:02:19',
    updatedAt: '2026-08-11 11:02:19',
    publishedAt: '',
    publisher: '',
    plays: 0,
    likes: 0,
    commentCount: 0,
  },
]

const SEED_COMMENTS: MediaComment[] = [
  {
    id: 'AVC-001',
    mediaId: 'AV-20260810-001',
    mediaTitle: '智能制造车间：一台大型鼓风机的诞生',
    mediaKind: '视频',
    content: '试车那段拍得太震撼了，建议后面出一期装配工艺的专题。',
    nickname: '风叶如刀',
    author: '刘志强',
    dept: '总装分厂',
    createdAt: '2026-08-10 11:24:08',
    hidden: false,
  },
  {
    id: 'AVC-002',
    mediaId: 'AV-20260810-001',
    mediaTitle: '智能制造车间：一台大型鼓风机的诞生',
    mediaKind: '视频',
    content: '画面清晰度很高，手机上播放也很流畅。',
    nickname: '山鹰',
    author: '周文倩',
    dept: '数字化部',
    createdAt: '2026-08-10 13:52:41',
    hidden: false,
  },
  {
    id: 'AVC-003',
    mediaId: 'AV-20260810-001',
    mediaTitle: '智能制造车间：一台大型鼓风机的诞生',
    mediaKind: '视频',
    content: '这里的参数说明有点误导，建议核对后修改。',
    nickname: '匿名同事',
    author: '高鹏',
    dept: '技术中心',
    createdAt: '2026-08-10 15:09:30',
    hidden: true,
  },
  {
    id: 'AVC-004',
    mediaId: 'AV-20260810-001',
    mediaTitle: '智能制造车间：一台大型鼓风机的诞生',
    mediaKind: '视频',
    content: '第 6 分钟的字幕有错别字。',
    nickname: '细节控',
    author: '王宁',
    dept: '质量部',
    createdAt: '2026-08-10 17:31:12',
    hidden: false,
  },
  {
    id: 'AVC-005',
    mediaId: 'AV-20260808-002',
    mediaTitle: '2026 年中工作会议现场纪实',
    mediaKind: '视频',
    content: '会议精神总结得很到位，已转给班组学习。',
    nickname: '老班长',
    author: '孙建国',
    dept: '生产管理部',
    createdAt: '2026-08-08 10:12:55',
    hidden: false,
  },
  {
    id: 'AVC-006',
    mediaId: 'AV-20260808-002',
    mediaTitle: '2026 年中工作会议现场纪实',
    mediaKind: '视频',
    content: '希望能补充一份要点文字版，便于反复查看。',
    nickname: '小陈',
    author: '陈晓',
    dept: '财务部',
    createdAt: '2026-08-08 14:40:02',
    hidden: false,
  },
  {
    id: 'AVC-007',
    mediaId: 'AV-20260808-002',
    mediaTitle: '2026 年中工作会议现场纪实',
    mediaKind: '视频',
    content: '内容与我部门无关，随便刷一下。',
    nickname: '路人',
    author: '李海',
    dept: '后勤中心',
    createdAt: '2026-08-08 16:20:18',
    hidden: true,
  },
  {
    id: 'AVC-008',
    mediaId: 'AV-20260806-003',
    mediaTitle: '陕鼓之声第 42 期：一线班组的清晨',
    mediaKind: '陕鼓之声',
    content: '通勤路上听完，声音质感很好，期待下一期。',
    nickname: '晨跑的人',
    author: '张倩',
    dept: '检修分厂',
    createdAt: '2026-08-06 09:31:47',
    hidden: false,
  },
  {
    id: 'AVC-009',
    mediaId: 'AV-20260806-003',
    mediaTitle: '陕鼓之声第 42 期：一线班组的清晨',
    mediaKind: '陕鼓之声',
    content: '建议音量整体再提高一点。',
    nickname: '听风',
    author: '马涛',
    dept: '设备部',
    createdAt: '2026-08-06 20:14:09',
    hidden: false,
  },
  {
    id: 'AVC-010',
    mediaId: 'AV-20260804-004',
    mediaTitle: '现场服务纪实：72 小时抢修',
    mediaKind: '视频',
    content: '现场同事辛苦了，向服务团队致敬。',
    nickname: '同行者',
    author: '郭亮',
    dept: '服务事业部',
    createdAt: '2026-08-04 10:44:26',
    hidden: false,
  },
]

/* ---------------- store ---------------- */

type State = {
  categories: MediaCategory[]
  media: MediaItem[]
  comments: MediaComment[]
}

let state: State = {
  categories: SEED_CATEGORIES,
  media: SEED_MEDIA,
  comments: SEED_COMMENTS,
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

export function useMedia(): State {
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

export function formatSize(bytes: number) {
  if (bytes > 1024 * 1024 * 1024) {
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
  }
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

export function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '—'
  const s = Math.round(seconds)
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`
}

export function processTone(p: ProcessState) {
  if (p === '处理完成') return 'success' as const
  if (p === '处理中') return 'info' as const
  if (p === '处理失败') return 'danger' as const
  return 'neutral' as const
}

export function statusTone(s: MediaStatus) {
  if (s === '已发布') return 'success' as const
  if (s === '草稿') return 'neutral' as const
  return 'warning' as const
}

/* ---------------- 类目动作（固定两类，仅可维护排序与备注） ---------------- */

export function updateCategory(
  id: string,
  patch: Partial<Pick<MediaCategory, 'sort' | 'remark'>>,
) {
  commit({
    categories: state.categories.map((c) =>
      c.id === id ? { ...c, ...patch } : c,
    ),
  })
}

export function kindCount(kind: MediaKind) {
  const rows = state.media.filter((m) => m.kind === kind)
  return {
    total: rows.length,
    online: rows.filter((m) => m.status === '已发布').length,
    draft: rows.filter((m) => m.status === '草稿').length,
    offline: rows.filter((m) => m.status === '已下架').length,
    plays: rows.reduce((sum, m) => sum + m.plays, 0),
  }
}

/* ---------------- 视听内容动作 ---------------- */

export function getMediaItem(id: string): MediaItem | undefined {
  return state.media.find((m) => m.id === id)
}

export type MediaDraftInput = {
  title: string
  kind: MediaKind
  summary: string
  cover: string
  coverFromFrame: boolean
  fileName: string
  fileSize: string
  duration: string
  process: ProcessState
  failReason: string
  sort: number
  top: boolean
  author: string
  dept: string
}

export function createMediaItem(input: MediaDraftInput): MediaItem {
  const ts = stamp()
  const item: MediaItem = {
    id: `AV-${ts.slice(0, 10).replace(/-/g, '')}-${nextId('M').slice(2)}`,
    title: input.title.trim() || '未命名草稿',
    kind: input.kind,
    summary: input.summary,
    cover: input.cover,
    coverFromFrame: input.coverFromFrame,
    fileName: input.fileName,
    fileSize: input.fileSize || '—',
    duration: input.duration || '—',
    process: input.process,
    failReason: input.failReason,
    retryCount: 0,
    status: '草稿',
    top: input.top,
    sort: input.sort,
    author: input.author,
    dept: input.dept,
    createdAt: ts,
    updatedAt: ts,
    publishedAt: '',
    publisher: '',
    plays: 0,
    likes: 0,
    commentCount: 0,
  }
  commit({ media: [item, ...state.media] })
  return item
}

export function updateMediaItem(id: string, patch: Partial<MediaItem>) {
  commit({
    media: state.media.map((m) =>
      m.id === id ? { ...m, ...patch, updatedAt: stamp() } : m,
    ),
  })
}

/** 发布前置校验：标题、媒体文件、转码结果与封面 */
function publishBlocker(m: MediaItem): string {
  if (!m.title.trim()) return '标题为空'
  if (m.process === '待上传' || !m.fileName) return '尚未上传媒体文件'
  if (m.process === '处理中') return '媒体文件仍在处理中，请稍后再发布'
  if (m.process === '处理失败') return '媒体文件处理失败，请重试处理后再发布'
  if (!m.cover) {
    return m.kind === '视频'
      ? '缺少封面（请重新截取视频第一帧）'
      : '缺少封面（陕鼓之声需手动上传封面）'
  }
  return ''
}

/** 发布：仅草稿可发布，发布后默认上架；发布权限由固定发布人员持有 */
export function publishMedia(ids: string[], publisher: string): BatchResult[] {
  const ts = stamp()
  const results: BatchResult[] = []
  const media = state.media.map((m) => {
    if (!ids.includes(m.id)) return m
    if (m.status === '已发布') {
      results.push({ id: m.id, label: m.title, ok: false, message: '已是已发布状态' })
      return m
    }
    if (m.status === '已下架') {
      results.push({
        id: m.id,
        label: m.title,
        ok: false,
        message: '已下架内容请使用「上架」重新上架',
      })
      return m
    }
    const blocker = publishBlocker(m)
    if (blocker) {
      results.push({ id: m.id, label: m.title, ok: false, message: blocker })
      return m
    }
    results.push({ id: m.id, label: m.title, ok: true, message: '已发布并上架' })
    return {
      ...m,
      status: '已发布' as MediaStatus,
      publishedAt: ts,
      publisher,
      updatedAt: ts,
    }
  })
  commit({ media })
  return results
}

/** 上架：仅已下架可重新上架 */
export function putMediaOnline(ids: string[]): BatchResult[] {
  const ts = stamp()
  const results: BatchResult[] = []
  const media = state.media.map((m) => {
    if (!ids.includes(m.id)) return m
    if (m.status === '草稿') {
      results.push({
        id: m.id,
        label: m.title,
        ok: false,
        message: '草稿需先由固定发布人员发布',
      })
      return m
    }
    if (m.status === '已发布') {
      results.push({ id: m.id, label: m.title, ok: false, message: '已处于上架状态' })
      return m
    }
    const blocker = publishBlocker(m)
    if (blocker) {
      results.push({ id: m.id, label: m.title, ok: false, message: blocker })
      return m
    }
    results.push({ id: m.id, label: m.title, ok: true, message: '已重新上架' })
    return { ...m, status: '已发布' as MediaStatus, updatedAt: ts }
  })
  commit({ media })
  return results
}

/** 下架：仅已发布可下架，下架后用户端停止展示与播放 */
export function takeMediaOffline(ids: string[]): BatchResult[] {
  const ts = stamp()
  const results: BatchResult[] = []
  const media = state.media.map((m) => {
    if (!ids.includes(m.id)) return m
    if (m.status !== '已发布') {
      results.push({
        id: m.id,
        label: m.title,
        ok: false,
        message: m.status === '草稿' ? '草稿无需下架' : '已处于下架状态',
      })
      return m
    }
    results.push({
      id: m.id,
      label: m.title,
      ok: true,
      message: '已下架，用户端停止展示与播放',
    })
    return { ...m, status: '已下架' as MediaStatus, top: false, updatedAt: ts }
  })
  commit({ media })
  return results
}

export function setMediaTop(ids: string[], top: boolean): BatchResult[] {
  const results: BatchResult[] = []
  const media = state.media.map((m) => {
    if (!ids.includes(m.id)) return m
    if (top && m.status !== '已发布') {
      results.push({ id: m.id, label: m.title, ok: false, message: '仅已发布内容可置顶' })
      return m
    }
    if (m.top === top) {
      results.push({
        id: m.id,
        label: m.title,
        ok: false,
        message: top ? '已在置顶状态' : '当前未置顶',
      })
      return m
    }
    results.push({
      id: m.id,
      label: m.title,
      ok: true,
      message: top ? '已置顶' : '已取消置顶',
    })
    return { ...m, top, updatedAt: stamp() }
  })
  commit({ media })
  return results
}

export function setMediaSort(id: string, sort: number) {
  updateMediaItem(id, { sort })
}

export function removeMediaItems(ids: string[]): BatchResult[] {
  const results: BatchResult[] = []
  const keep: MediaItem[] = []
  for (const m of state.media) {
    if (!ids.includes(m.id)) {
      keep.push(m)
      continue
    }
    if (m.status === '已发布') {
      keep.push(m)
      results.push({ id: m.id, label: m.title, ok: false, message: '请先下架后再删除' })
      continue
    }
    results.push({ id: m.id, label: m.title, ok: true, message: '已删除' })
  }
  const removedIds = state.media
    .filter((m) => ids.includes(m.id) && !keep.includes(m))
    .map((m) => m.id)
  commit({
    media: keep,
    comments: state.comments.filter((c) => !removedIds.includes(c.mediaId)),
  })
  return results
}

/* ---------------- 媒体文件上传与处理 ---------------- */

/** 模拟转码：处理中 → 处理完成（第 1 次上传大文件会失败，便于演示重试） */
function simulateProcess(id: string, shouldFail: boolean) {
  window.setTimeout(() => {
    const target = getMediaItem(id)
    if (!target || target.process !== '处理中') return
    if (shouldFail) {
      updateMediaItem(id, {
        process: '处理失败',
        failReason: '转码任务超时，媒体处理服务未返回结果',
      })
      return
    }
    updateMediaItem(id, { process: '处理完成', failReason: '' })
  }, 1600)
}

/** 已入库内容重新上传媒体文件 */
export function attachMediaFile(
  id: string,
  file: { name: string; size: string; duration: string; shouldFail?: boolean },
) {
  updateMediaItem(id, {
    fileName: file.name,
    fileSize: file.size,
    duration: file.duration,
    process: '处理中',
    failReason: '',
  })
  simulateProcess(id, Boolean(file.shouldFail))
}

/** 处理失败重试：重新提交转码任务 */
export function retryProcess(ids: string[]): BatchResult[] {
  const results: BatchResult[] = []
  const media = state.media.map((m) => {
    if (!ids.includes(m.id)) return m
    if (m.process !== '处理失败') {
      results.push({
        id: m.id,
        label: m.title,
        ok: false,
        message:
          m.process === '待上传'
            ? '尚未上传媒体文件，无需重试'
            : `当前为「${m.process}」，无需重试`,
      })
      return m
    }
    results.push({
      id: m.id,
      label: m.title,
      ok: true,
      message: '已重新提交处理任务',
    })
    // 重试后走成功分支，处理完成时视频自动补齐首帧封面
    window.setTimeout(() => {
      const target = getMediaItem(m.id)
      if (!target || target.process !== '处理中') return
      updateMediaItem(m.id, {
        process: '处理完成',
        failReason: '',
        duration: target.duration === '—' ? '06:30' : target.duration,
        cover: target.cover || (target.kind === '视频' ? '/av/frame-site.png' : ''),
        coverFromFrame: target.kind === '视频' ? true : target.coverFromFrame,
      })
    }, 1600)
    return {
      ...m,
      process: '处理中' as ProcessState,
      failReason: '',
      retryCount: m.retryCount + 1,
      updatedAt: stamp(),
    }
  })
  commit({ media })
  return results
}

/* ---------------- 视听评论动作 ---------------- */

export function setMediaCommentHidden(ids: string[], hidden: boolean): BatchResult[] {
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

export function removeMediaComments(ids: string[]): BatchResult[] {
  const results: BatchResult[] = []
  const keep = state.comments.filter((c) => {
    if (!ids.includes(c.id)) return true
    results.push({ id: c.id, label: c.content.slice(0, 12), ok: true, message: '已删除' })
    return false
  })
  const media = state.media.map((m) => {
    const removed = ids.filter((id) =>
      state.comments.some((c) => c.id === id && c.mediaId === m.id),
    ).length
    return removed ? { ...m, commentCount: Math.max(0, m.commentCount - removed) } : m
  })
  commit({ comments: keep, media })
  return results
}
