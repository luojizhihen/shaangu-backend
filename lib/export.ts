import type { ExportTask } from '@/lib/mock'

/** 超过该行数的导出转为后台异步任务，避免前端长时间阻塞 */
export const ASYNC_EXPORT_THRESHOLD = 5000

/** 生成一条异步导出任务（原型内用本地状态模拟队列推进） */
export function createExportTask(
  name: string,
  rows: number,
  operator: string,
): ExportTask {
  const seq = String(Date.now() % 10000).padStart(4, '0')
  return {
    id: `EXP-20260811-${seq}`,
    name,
    rows,
    state: '排队中',
    progress: 0,
    operator,
    createdAt: '2026-08-11 08:30',
  }
}

/** 前端 CSV 导出工具：带 UTF-8 BOM，保证 Excel 打开中文不乱码 */
export function downloadCsv(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
) {
  const escape = (v: string | number) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [headers, ...rows]
    .map((row) => row.map(escape).join(','))
    .join('\r\n')

  const blob = new Blob([`\uFEFF${csv}`], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
