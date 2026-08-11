import { Suspense } from 'react'

import { PollCreateView } from '@/components/forum/poll-create-view'

export default function ForumPollNewPage() {
  return (
    <Suspense fallback={null}>
      <PollCreateView />
    </Suspense>
  )
}
