'use client'

/**
 * 导入 Word（.docx）为资讯正文富文本。
 *
 * 解析是真实的：用 mammoth 把 docx 转为 HTML，保留标题层级、段落、加粗、斜体、
 * 列表、超链接、基础表格与图片顺序；用 jszip 读 docx 内部 XML 检测无法还原的内容。
 *
 * 图片存储是原型实现：见 uploadImportedImage 的说明，它是接入真实对象存储时
 * 唯一需要替换的函数。
 */

import { paramValue } from '@/lib/system-store'

/* ---------------- 类型 ---------------- */

export type ImportPhase =
  | 'idle'
  /** 文件校验 */
  | 'validating'
  /** 读取文件（带真实进度） */
  | 'uploading'
  /** 解析文档与上传图片 */
  | 'parsing'
  /** 解析成功 */
  | 'success'
  /** 正文成功但部分图片失败 */
  | 'partial'
  /** 失败 */
  | 'failed'

export type ImportedImage = {
  id: string
  name: string
  contentType: string
  bytes: number
  sizeText: string
  ok: boolean
  message: string
  /** 原型下用于在编辑器中显示的地址 */
  url: string
  /** 接入对象存储后由服务端返回的最终路径 */
  storagePath: string
  /** 原始字节，仅保留在内存中，用于失败后重试 */
  raw: ArrayBuffer
}

/** 失败图片在 HTML 中的临时标记，随后被替换为占位提示 */
const FAILED_MARK = '#import-failed:'

export type ImportStats = {
  headings: number
  paragraphs: number
  lists: number
  tables: number
  links: number
  images: number
}

export type ImportOutcome = {
  html: string
  images: ImportedImage[]
  /** 无法还原的内容提示 */
  unsupported: string[]
  /** 解析器给出的其他警告 */
  warnings: string[]
  stats: ImportStats
}

/* ---------------- 校验规则 ---------------- */

/** 一期只支持 .docx */
export const ACCEPT_EXT = '.docx'
export const ACCEPT_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

/** 单个文档大小上限 */
export const MAX_DOC_MB = 50

export function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

/** 文件校验：扩展名、大小与空文件 */
export function validateWordFile(file: File): { ok: boolean; message: string } {
  const name = file.name.toLowerCase()

  if (name.endsWith('.doc')) {
    return {
      ok: false,
      message: '不支持 .doc 格式，请在 Word 中另存为 .docx 后重新导入',
    }
  }
  if (name.endsWith('.docm')) {
    return { ok: false, message: '不支持 .docm 宏文档，请另存为 .docx 后重新导入' }
  }
  if (!name.endsWith(ACCEPT_EXT)) {
    return { ok: false, message: '仅支持 .docx 格式的 Word 文档' }
  }
  if (file.size === 0) {
    return { ok: false, message: '文件内容为空，请确认文档已正确保存' }
  }
  if (file.size > MAX_DOC_MB * 1024 * 1024) {
    return {
      ok: false,
      message: `文档大小 ${formatBytes(file.size)} 超过 ${MAX_DOC_MB} MB 限制`,
    }
  }
  return { ok: true, message: '' }
}

/* ---------------- 读取文件（真实进度） ---------------- */

/** 用 FileReader 读取，onProgress 反映真实读取进度而非模拟动画 */
export function readFileWithProgress(
  file: File,
  onProgress: (percent: number) => void,
): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    reader.onload = () => {
      onProgress(100)
      resolve(reader.result as ArrayBuffer)
    }
    reader.onerror = () => reject(new Error('读取文件失败，请重试'))
    reader.readAsArrayBuffer(file)
  })
}

/* ---------------- 图片存储适配层 ---------------- */

/**
 * 允许的图片格式与大小，复用「系统管理 / 参数管理」中的 image.type 与 image.size，
 * 保证导入校验与平台其他上传口径一致。
 */
function imageRules() {
  const types = paramValue('image.type', '.jpg,.png,.jpeg,.webp')
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
  const maxMb = Number.parseFloat(paramValue('image.size', '10')) || 10
  return { types, maxMb }
}

/** contentType 到扩展名的映射 */
function extOf(contentType: string) {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/bmp': '.bmp',
    'image/tiff': '.tiff',
    'image/x-emf': '.emf',
    'image/x-wmf': '.wmf',
    'image/svg+xml': '.svg',
  }
  return map[contentType.toLowerCase()] ?? ''
}

let uploadSeq = 0

/**
 * 把文档内嵌图片「上传」到系统文件存储。
 *
 * ⚠️ 原型实现：本项目没有后端，这里用 Blob 生成可显示的本地地址，
 * 并给出接入对象存储后应有的目标路径（storagePath）。
 *
 * 接入真实存储时只需替换本函数：POST 上传 bytes，把服务端返回的 URL same
 * 赋给 url 与 storagePath，其余调用方代码无需改动。
 */
async function uploadImportedImage(
  bytes: ArrayBuffer,
  contentType: string,
): Promise<ImportedImage> {
  uploadSeq += 1
  const ext = extOf(contentType)
  const name = `image-${String(uploadSeq).padStart(2, '0')}${ext || ''}`
  const size = bytes.byteLength
  const base: Omit<ImportedImage, 'ok' | 'message' | 'url' | 'storagePath'> = {
    id: `IMG-${Date.now()}-${uploadSeq}`,
    name,
    contentType,
    bytes: size,
    sizeText: formatBytes(size),
    raw: bytes,
  }

  const { types, maxMb } = imageRules()

  if (!ext || !types.includes(ext)) {
    return {
      ...base,
      ok: false,
      message: `格式 ${contentType || '未知'} 不在允许范围（${types.join('、')}）`,
      url: '',
      storagePath: '',
    }
  }
  if (size > maxMb * 1024 * 1024) {
    return {
      ...base,
      ok: false,
      message: `图片 ${formatBytes(size)} 超过 ${maxMb} MB 限制`,
      url: '',
      storagePath: '',
    }
  }

  const url = URL.createObjectURL(new Blob([bytes], { type: contentType }))
  return {
    ...base,
    ok: true,
    message: '已上传',
    url,
    storagePath: `/content/imported/${name}`,
  }
}

/* ---------------- 不支持内容检测 ---------------- */

const UNSUPPORTED_HINTS: {
  label: string
  /** 命中任一 zip 条目名前缀即认为存在 */
  entries?: string[]
  /** 或在 document.xml 中命中任一特征字符串 */
  marks?: string[]
}[] = [
  { label: '文本框', marks: ['<w:txbxContent', '<v:textbox'] },
  { label: '艺术字', marks: ['<v:textpath'] },
  { label: 'SmartArt 图形', entries: ['word/diagrams/'], marks: ['<dgm:'] },
  { label: '图表', entries: ['word/charts/'], marks: ['<c:chart'] },
  { label: '嵌入对象（OLE）', entries: ['word/embeddings/'], marks: ['<w:object'] },
  { label: '页眉', entries: ['word/header'] },
  { label: '页脚', entries: ['word/footer'] },
  { label: '批注', entries: ['word/comments.xml'] },
  { label: '修订记录', marks: ['<w:ins ', '<w:del '] },
  { label: '脚注 / 尾注', entries: ['word/footnotes.xml', 'word/endnotes.xml'] },
  { label: '手动分页与分节', marks: ['w:type="page"', '<w:sectPr'] },
]

/**
 * 读取 docx 内部 XML，检测无法完整还原的内容。
 * 只做存在性判断，不解析细节。
 */
async function detectUnsupported(buffer: ArrayBuffer): Promise<string[]> {
  try {
    const JSZip = (await import('jszip')).default
    const zip = await JSZip.loadAsync(buffer)
    const names = Object.keys(zip.files)

    const docEntry = zip.file('word/document.xml')
    const xml = docEntry ? await docEntry.async('string') : ''

    const found: string[] = []
    for (const hint of UNSUPPORTED_HINTS) {
      const byEntry = hint.entries?.some((prefix) =>
        names.some((n) => n.startsWith(prefix) && !n.endsWith('/')),
      )
      const byMark = hint.marks?.some((m) => xml.includes(m))
      if (byEntry || byMark) found.push(hint.label)
    }

    // 分节符在任何 docx 中都存在，只有多于一个时才提示复杂分页
    const sectCount = (xml.match(/<w:sectPr/g) ?? []).length
    if (sectCount <= 1) {
      const i = found.indexOf('手动分页与分节')
      if (i >= 0 && !xml.includes('w:type="page"')) found.splice(i, 1)
    }

    return found
  } catch {
    // 检测失败不影响正文导入
    return []
  }
}

/* ---------------- 样式映射 ---------------- */

/**
 * 中文版 Word 的标题样式名为「标题 1」等，mammoth 默认只识别英文样式 ID，
 * 因此显式补充中文样式映射，并保留下划线与删除线。
 */
const STYLE_MAP = [
  "p[style-name='Title'] => h1:fresh",
  "p[style-name='标题'] => h1:fresh",
  "p[style-name='Heading 1'] => h1:fresh",
  "p[style-name='标题 1'] => h1:fresh",
  "p[style-name='Heading 2'] => h2:fresh",
  "p[style-name='标题 2'] => h2:fresh",
  "p[style-name='Heading 3'] => h3:fresh",
  "p[style-name='标题 3'] => h3:fresh",
  "p[style-name='Heading 4'] => h4:fresh",
  "p[style-name='标题 4'] => h4:fresh",
  "p[style-name='Quote'] => blockquote:fresh",
  "p[style-name='引用'] => blockquote:fresh",
  'u => u',
  'strike => s',
]

/* ---------------- HTML 统计与清理 ---------------- */

function statsOf(html: string): ImportStats {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return {
    headings: doc.querySelectorAll('h1,h2,h3,h4,h5,h6').length,
    paragraphs: doc.querySelectorAll('p').length,
    lists: doc.querySelectorAll('ul,ol').length,
    tables: doc.querySelectorAll('table').length,
    links: doc.querySelectorAll('a[href]').length,
    images: doc.querySelectorAll('img').length,
  }
}

/**
 * 把上传失败的图片替换为带原因的占位提示，并兜底清除任何残留的
 * base64 / 本地路径图片，确保正文里不会写入这类地址。
 */
function replaceFailedImages(html: string, images: ImportedImage[]) {
  const doc = new DOMParser().parseFromString(html, 'text/html')

  doc.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src') ?? ''
    const failedId = src.startsWith(FAILED_MARK)
      ? src.slice(FAILED_MARK.length)
      : ''
    const unsafe =
      src.startsWith('data:') || src.startsWith('file:') || src.trim() === ''

    if (!failedId && !unsafe) return

    const hit = images.find((i) => i.id === failedId)
    const tip = doc.createElement('p')
    tip.className = 'import-missing'
    tip.textContent = hit
      ? `［图片未能导入：${hit.name} —— ${hit.message}，请手动上传］`
      : '［图片未能导入：未通过存储校验，请手动上传］'
    img.replaceWith(tip)
  })

  return doc.body.innerHTML
}

/* ---------------- 主流程 ---------------- */

/**
 * 解析 docx 为正文 HTML。
 * onPhase 用于驱动界面状态机，onProgress 反映文件读取进度。
 */
export async function importWordDocument(
  file: File,
  hooks: {
    onPhase: (phase: ImportPhase) => void
    onProgress: (percent: number) => void
    onImageProgress: (done: number, total: number) => void
  },
): Promise<ImportOutcome> {
  hooks.onPhase('validating')
  const check = validateWordFile(file)
  if (!check.ok) throw new Error(check.message)

  hooks.onPhase('uploading')
  const buffer = await readFileWithProgress(file, hooks.onProgress)

  hooks.onPhase('parsing')

  const unsupported = await detectUnsupported(buffer)

  const images: ImportedImage[] = []
  let imageTotal = 0

  const mammoth = (await import('mammoth')).default

  let result: { value: string; messages: { type: string; message: string }[] }
  try {
    result = await mammoth.convertToHtml(
      // mammoth 会消耗 buffer，检测阶段已单独读取，这里传副本避免相互影响
      { arrayBuffer: buffer.slice(0) },
      {
        styleMap: STYLE_MAP,
        ignoreEmptyParagraphs: true,
        convertImage: mammoth.images.imgElement(async (image) => {
          imageTotal += 1
          const bytes = await image.readAsArrayBuffer()
          const uploaded = await uploadImportedImage(bytes, image.contentType)
          images.push(uploaded)
          hooks.onImageProgress(images.length, imageTotal)

          // 失败的图片先写入标记，随后被替换为带原因的占位提示
          return { src: uploaded.ok ? uploaded.url : `${FAILED_MARK}${uploaded.id}` }
        }),
      },
    )
  } catch (e) {
    throw new Error(
      `文档解析失败：${e instanceof Error ? e.message : '文件可能已损坏或不是有效的 .docx'}`,
    )
  }

  const html = replaceFailedImages(result.value, images).trim()

  if (!html) {
    throw new Error('文档中没有可导入的正文内容')
  }

  const warnings = Array.from(
    new Set(
      result.messages
        .filter((m) => m.type === 'warning' || m.type === 'error')
        .map((m) => m.message),
    ),
  ).slice(0, 8)

  const failed = images.filter((i) => !i.ok).length
  hooks.onPhase(failed > 0 ? 'partial' : 'success')

  return { html, images, unsupported, warnings, stats: statsOf(html) }
}

/**
 * 重试单张失败图片：用内存中保留的原始字节重新走一次存储流程。
 * 原型下失败原因是格式或大小校验，重试前可先在参数管理中调整 image.type / image.size。
 */
export async function retryImage(image: ImportedImage): Promise<ImportedImage> {
  const next = await uploadImportedImage(image.raw, image.contentType)
  return { ...next, id: image.id, name: image.name }
}

/**
 * 重试成功后，把正文里对应的占位提示替换回真实图片。
 */
export function restoreRetriedImage(html: string, image: ImportedImage) {
  if (!image.ok || !image.url) return html
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const target = Array.from(doc.querySelectorAll('p.import-missing')).find((p) =>
    p.textContent?.includes(image.name),
  )
  if (!target) return html

  const img = doc.createElement('img')
  img.setAttribute('src', image.url)
  img.setAttribute('alt', image.name)
  target.replaceWith(img)
  return doc.body.innerHTML
}

/** 把导入结果合并进现有正文 */
export function mergeBody(current: string, incoming: string, mode: 'replace' | 'append') {
  if (mode === 'replace' || !current.trim()) return incoming
  return `${current}\n${incoming}`
}
