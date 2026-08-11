import { redirect } from 'next/navigation'

/**
 * 运营数据已合并到工作台同一页面内，
 * 保留 /analytics 作为旧链接与外部深链入口，直接定位到工作台的运营数据区。
 */
export default function AnalyticsPage() {
  redirect('/workbench#analytics')
}
