import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Providers from '@/components/Providers'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import RightSidebar from '@/components/RightSidebar'
import AiAssistantFab from '@/components/AiAssistantFab'
import JsonLdSite from '@/components/JsonLdSite'
import { getSiteUrl } from '@/lib/site'

const geist = Geist({ subsets: ['latin'] })

const siteUrl = getSiteUrl()

const footerLinkClass =
  'inline-flex rounded-full px-2.5 py-1 -ml-2.5 text-muted-foreground hover:bg-background/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: '华人广场 - 租房 · 找房 · 招聘 · 找工 · 二手 · 商家黄页',
    template: '%s · 华人广场',
  },
  description: '华人社区分类信息平台：租房/找房、招聘/找工、二手与商家黄页',
  applicationName: '华人广场',
  keywords: ['华人', '美国', '租房', '招聘', '二手', '分类信息', '黄页'],
  authors: [{ name: '华人广场' }],
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: siteUrl,
    siteName: '华人广场',
    title: '华人广场 - 美国华人分类信息',
    description: '租房/找房、招聘/找工、二手交易与商家黄页，信用分机制助力可信社区。',
    images: [
      {
        url: '/home-banner.png',
        width: 1200,
        height: 630,
        alt: '华人广场',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '华人广场 - 美国华人分类信息',
    description: '租房/找房、招聘/找工、二手与商家黄页。',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={geist.className}>
        <JsonLdSite />
        <Providers>
          <Navbar />
          <main className="min-h-screen bg-background pb-[env(safe-area-inset-bottom,0px)]">
            {children}
          </main>
          <RightSidebar />
          <AiAssistantFab />
          <footer
            id="site-footer"
            className="mt-12 border-t border-border/70 bg-[linear-gradient(to_bottom,color-mix(in_oklab,var(--background)_96%,white),color-mix(in_oklab,var(--muted)_82%,white))] py-10 sm:mt-16 sm:py-12 pb-[max(2rem,env(safe-area-inset-bottom,0px))] dark:bg-[linear-gradient(to_bottom,color-mix(in_oklab,var(--background)_96%,black),color-mix(in_oklab,var(--muted)_72%,black))]"
          >
            <div className="max-w-6xl mx-auto px-safe">
              <div className="mb-8 flex flex-col gap-2 border-b border-border/60 pb-6 sm:mb-10 sm:pb-8">
                <p className="text-base font-semibold tracking-tight text-foreground">华人广场</p>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  服务美国华人社区的分类信息平台，聚焦租房、招聘、二手和本地商家，
                  用更清晰的浏览体验帮助用户更快找到可信信息。
                </p>
              </div>
              <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3 sm:gap-10">
                <div>
                  <p className="mb-3 text-sm font-semibold text-foreground">平台与合规</p>
                  <nav aria-label="平台与合规" className="text-muted-foreground">
                    <ul className="space-y-2">
                      <li>
                        <Link href="/about" className={footerLinkClass}>
                          关于我们
                        </Link>
                      </li>
                      <li>
                        <Link href="/advertising" className={footerLinkClass}>
                          广告合作
                        </Link>
                      </li>
                      <li>
                        <Link href="/disclaimer" className={footerLinkClass}>
                          免责声明
                        </Link>
                      </li>
                      <li>
                        <Link href="/privacy" className={footerLinkClass}>
                          隐私声明
                        </Link>
                      </li>
                      <li>
                        <Link href="/credit" className={footerLinkClass}>
                          信用分机制说明
                        </Link>
                      </li>
                    </ul>
                  </nav>
                </div>
                <div>
                  <p className="mb-3 text-sm font-semibold text-foreground">分类信息</p>
                  <nav aria-label="分类入口" className="text-muted-foreground">
                    <ul className="space-y-2">
                      <li>
                        <Link href="/posts?category=RENT" className={footerLinkClass}>
                          租房
                        </Link>
                      </li>
                      <li>
                        <Link href="/posts?category=RENT_SEEK" className={footerLinkClass}>
                          找房
                        </Link>
                      </li>
                      <li>
                        <Link href="/posts?category=JOB" className={footerLinkClass}>
                          招聘
                        </Link>
                      </li>
                      <li>
                        <Link href="/posts?category=JOB_SEEK" className={footerLinkClass}>
                          找工
                        </Link>
                      </li>
                      <li>
                        <Link href="/posts?category=SECONDHAND" className={footerLinkClass}>
                          二手
                        </Link>
                      </li>
                      <li>
                        <Link href="/yellowpages" className={footerLinkClass}>
                          商家黄页
                        </Link>
                      </li>
                    </ul>
                  </nav>
                </div>
                <div>
                  <p className="mb-3 text-sm font-semibold text-foreground">用户功能</p>
                  <nav aria-label="用户功能" className="text-muted-foreground">
                    <ul className="space-y-2">
                      <li>
                        <Link href="/posts/new" className={footerLinkClass}>
                          免费发布
                        </Link>
                      </li>
                      <li>
                        <Link href="/dashboard" className={footerLinkClass}>
                          我的发布
                        </Link>
                      </li>
                      <li>
                        <Link href="/merchant/apply" className={footerLinkClass}>
                          商家入驻
                        </Link>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
              <div className="mt-8 border-t border-border/60 pt-6 text-center text-xs leading-6 text-muted-foreground">
                <p>© 2026 华人广场 · 社区分类信息平台 · 本平台仅提供信息发布服务，不对内容真实性负责</p>
                <p className="mt-1">© 2026 Huaren Plaza · Community classifieds platform · We only provide an information posting service and do not guarantee the authenticity of user-generated content.</p>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  )
}
