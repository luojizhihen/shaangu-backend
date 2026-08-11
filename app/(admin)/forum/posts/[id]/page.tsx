import { ForumDetailView } from '@/components/forum/forum-detail-view'

/** 普通图文帖只读详情 */
export default async function ForumPostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ForumDetailView id={id} expect="普通图文" />
}
