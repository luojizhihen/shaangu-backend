'use client'

import { MediaCreateView } from '@/components/media/media-create-view'

export default function NewAudioPage() {
  return (
    <MediaCreateView
      kind="陕鼓之声"
      backHref="/media/audios"
      title="新增“陕鼓之声”音频"
    />
  )
}
