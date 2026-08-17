import { LoginLogView } from '@/components/logs/login-log-view'

/** 登录日志：含登录成功与失败的全部记录 */
export default function LoginLogsPage() {
  return <LoginLogView scope="history" />
}
