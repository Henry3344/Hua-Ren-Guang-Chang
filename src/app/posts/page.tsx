import PostsPageClient from './PostsPageClient'
import { getPostsList } from '@/lib/getPostsList'
import { buildPostsListParams, stablePostsQueryKey } from '@/lib/buildPostsListParams'

export const revalidate = 60

function searchParamsFromPage(
  sp: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const url = new URLSearchParams()
  for (const [k, v] of Object.entries(sp)) {
    if (v === undefined) continue
    if (Array.isArray(v)) v.forEach((x) => url.append(k, x))
    else url.set(k, v)
  }
  return url
}

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const raw = await searchParams
  const url = searchParamsFromPage(raw)
  const params = buildPostsListParams(url, null)
  const data = await getPostsList(params, null)
  const serverQueryKey = stablePostsQueryKey(params)

  return (
    <PostsPageClient
      initialPosts={data.posts}
      initialTotal={data.total}
      initialTotalPages={data.totalPages}
      serverQueryKey={serverQueryKey}
    />
  )
}
