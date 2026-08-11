import { ForumDetailView } from '@/components/forum/forum-detail-view'

/** 投票帖只读详情：选项、模式、截止时间与结果全部锁定 */
export default async function ForumPollDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ForumDetailView id={id} expect="投票" />
}
