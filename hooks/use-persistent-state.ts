'use client'

import * as React from 'react'

/** 刷新后保留筛选条件、分页等页面状态 */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = React.useState<T>(initial)
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key)
      if (raw) setValue({ ...initial, ...(JSON.parse(raw) as T) })
    } catch {
      // 忽略损坏的本地状态
    }
    setReady(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  React.useEffect(() => {
    if (!ready) return
    window.localStorage.setItem(key, JSON.stringify(value))
  }, [key, value, ready])

  return [value, setValue, ready] as const
}
