import Link from 'next/link'
import Image from 'next/image'
import { unstable_cache } from 'next/cache'
import { AdSlotPair } from '@/components/AdSlot'
import HomeLatestPosts, { HomeLatestPostsHeader } from '@/components/HomeLatestPosts'
import HomeRecommendations from '@/components/HomeRecommendations'
import HomeCategoryCardsLazy from '@/components/HomeCategoryCardsLazy'
import HomeSearchBar from '@/components/HomeSearchBar'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import { getPostsList } from '@/lib/getPostsList'
import { getRecommendations } from '@/lib/getRecommendations'
import { buildHomeLatestQuery, buildHomeRecQuery } from '@/lib/homeFeedParams'
import { stablePostsQueryKey } from '@/lib/buildPostsListParams'

export const revalidate = 60

const cachedHomeLatest = unstable_cache(
  async () => {
    const params = buildHomeLatestQuery(null, { random: false, excludeIds: [] })
    return getPostsList(params, null)
  },
  ['home-latest-nationwide'],
  { revalidate: 60 },
)

const cachedHomeRecommendations = unstable_cache(
  async () => {
    const params = buildHomeRecQuery(null)
    return getRecommendations(params)
  },
  ['home-rec-nationwide'],
  { revalidate: 60 },
)

export default async function HomePage() {
  const [latestData, recData] = await Promise.all([
    cachedHomeLatest(),
    cachedHomeRecommendations(),
  ])
  const latestKey = stablePostsQueryKey(
    buildHomeLatestQuery(null, { random: false, excludeIds: [] }),
  )
  const recKey = stablePostsQueryKey(buildHomeRecQuery(null))

  return (
    <div>
      {/*
        首页首屏 Hero：桌面端 (sm 及以上) 样式已定稿，请勿再改 sm: / md: / lg: 等相关类。
        若需微调，只改无前缀的窄屏样式；当前桌面钉死值含：section sm:pb-1.5、卡片 sm:min-h-[252px]、
        头图 sm:object-[center_22%]、内容区 sm:py-2.5、标题 sm:text-4xl 等。窄屏另有 text-2xl、CTA 竖排等。
      */}
      <section className="relative px-safe pt-2 pb-2 sm:pb-1.5">
        <div className="relative mx-auto min-h-[218px] max-w-6xl overflow-hidden rounded-[1.75rem] border border-border/60 bg-background shadow-[0_26px_60px_-36px_rgba(15,23,42,0.35)] sm:min-h-[252px]">
          {/* Banner 作为整块页头背景 */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/home-banner.png"
              alt=""
              fill
              priority
              sizes="(max-width: 768px) 100vw, 1152px"
              className="object-cover object-[center_26%] sm:object-[center_22%]"
              aria-hidden
            />
            {/* 轻遮罩：保证标题与控件可读，并与下方区块自然衔接 */}
            <div
              className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/45 to-background/75"
              aria-hidden
            />
            <div
              className="absolute inset-0 bg-gradient-to-r from-background/15 via-transparent to-background/12"
              aria-hidden
            />
            {/* 左右与背景融合：略窄、略淡，避免铺太满 */}
            <div
              className="pointer-events-none absolute inset-y-0 left-0 z-[2] w-[20%] max-w-[10rem] bg-gradient-to-r from-background via-background/65 to-transparent sm:max-w-[13rem]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-y-0 right-0 z-[2] w-[20%] max-w-[10rem] bg-gradient-to-l from-background via-background/65 to-transparent sm:max-w-[13rem]"
              aria-hidden
            />
          </div>
          <div className="relative z-10 flex min-h-[218px] sm:min-h-[252px] flex-col items-center justify-center px-safe py-2 sm:py-2.5">
            <div className="w-full max-w-3xl text-center">
              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight mb-2.5 sm:mb-3 [text-wrap:balance]">
                华人广场｜美国分类信息平台
              </h1>
              <p className="text-foreground/85 text-base sm:text-lg mb-3 sm:mb-4 leading-relaxed max-w-2xl mx-auto">
                专注租房、招聘与二手，
                <Link
                  href="/ai-search"
                  className="text-primary font-medium underline underline-offset-4 decoration-primary/50 hover:text-primary/90 hover:decoration-primary mx-0.5"
                >
                  AI 智能匹配
                </Link>
                +
                <Link
                  href="/credit"
                  className="text-primary font-medium underline underline-offset-4 decoration-primary/50 hover:text-primary/90 hover:decoration-primary mx-0.5"
                >
                  信用分筛选
                </Link>
                ，让信息更准、更可信
              </p>
              <div className="mb-4">
                <HomeSearchBar />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-stretch sm:items-center w-full max-w-md sm:max-w-none mx-auto">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/posts/new"><PlusCircle className="w-4 h-4 mr-2" />免费发布</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto bg-background/80 backdrop-blur-sm">
                  <Link href="/posts">浏览全部</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-muted/18">
        <div className="mx-auto max-w-6xl px-safe py-3 sm:py-4">
          <AdSlotPair base="HOME_TOP" variant="inline" />
        </div>
      </section>

      <section className="page-shell">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-8">
          <div className="w-full lg:w-[46%] lg:max-w-xl lg:shrink-0 min-w-0">
            <HomeCategoryCardsLazy />
          </div>
          <div className="w-full lg:flex-1 min-w-0 lg:pt-0">
            <HomeRecommendations
              initialPosts={recData.posts}
              serverQueryKey={recKey}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-safe pb-4">
        <AdSlotPair base="HOME_MIDDLE" variant="inline" />
      </section>

      <section className="mx-auto max-w-6xl px-safe pb-8 sm:pb-10">
        <HomeLatestPostsHeader />
        <HomeLatestPosts
          initialPosts={latestData.posts}
          serverQueryKey={latestKey}
        />
      </section>

      <section className="border-y border-border/60 bg-muted/18">
        <div className="mx-auto max-w-6xl px-safe py-3 sm:py-4">
          <AdSlotPair base="HOME_BOTTOM" variant="inline" />
        </div>
      </section>
    </div>
  )
}
