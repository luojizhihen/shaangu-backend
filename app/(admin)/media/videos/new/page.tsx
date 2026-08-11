'use client'

import { MediaCreateView } from '@/components/media/media-create-view'

export default function NewVideoPage() {
  return (
    <MediaCreateView kind="视频" backHref="/media/videos" title="新增视频" />
  )
}
