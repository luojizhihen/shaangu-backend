import { ForumListView } from '@/components/forum/forum-list-view'

/** 投票内容管理：仅展示投票帖，发布后选项与结果锁定 */
export default function ForumPollsPage() {
  return <ForumListView scope="poll" />
}
