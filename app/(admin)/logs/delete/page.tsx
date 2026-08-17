import { OpLogView } from '@/components/logs/op-log-view'

/** 删除日志：审计管理端的数据删除行为 */
export default function DeleteLogsPage() {
  return <OpLogView scope="delete" />
}
