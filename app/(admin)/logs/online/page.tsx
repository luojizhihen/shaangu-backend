import { LoginLogView } from '@/components/logs/login-log-view'

/** 在线用户：仅展示未过期的会话，可强制下线 */
export default function OnlineLogsPage() {
  return <LoginLogView scope="online" />
}
