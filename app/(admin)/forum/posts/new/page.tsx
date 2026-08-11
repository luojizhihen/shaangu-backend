import { Suspense } from 'react'

import { PostCreateView } from '@/components/forum/post-create-view'

export default function ForumPostNewPage() {
  return (
    <Suspense fallback={null}>
      <PostCreateView />
    </Suspense>
  )
}
