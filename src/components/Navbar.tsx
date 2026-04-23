'use client'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PlusCircle, LogOut, Settings, ChevronDown, Store, Share2, MapPin } from 'lucide-react'
import { useSiteLocation } from '@/contexts/SiteLocationContext'
import UserAvatar from '@/components/UserAvatar'
import GlobalAnnouncement from '@/components/GlobalAnnouncement'

const categories = [
  { label: '租房', href: '/posts?category=RENT' },
  { label: '找房', href: '/posts?category=RENT_SEEK' },
  { label: '招聘', href: '/posts?category=JOB' },
  { label: '找工', href: '/posts?category=JOB_SEEK' },
  { label: '二手', href: '/posts?category=SECONDHAND' },
  { label: '商家', href: '/yellowpages' },
]

function NavLocationBadge() {
  const { pref, ready, openPicker } = useSiteLocation()
  /** 未写入 localStorage 且 guess 失败时 pref 可能仍为 null，勿显示「全美」以免误以为已选全美 */
  const label = !ready ? '定位中…' : pref?.label ?? '未选地区'
  return (
    <div className="inline-flex min-w-0 max-w-[140px] items-center gap-1.5 rounded-full border border-border/70 bg-background/75 px-2.5 py-1 text-[11px] shadow-sm shadow-black/5 backdrop-blur-sm sm:max-w-[220px] sm:text-xs text-muted-foreground">
      <MapPin className="w-3.5 h-3.5 shrink-0 text-primary" />
      <span className="truncate" title={label}>
        {label}
      </span>
      <button
        type="button"
        onClick={openPicker}
        className="shrink-0 whitespace-nowrap text-primary hover:text-primary/80"
      >
        切换城市
      </button>
    </div>
  )
}

export default function Navbar() {
  const { data: session } = useSession()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/88 shadow-[0_12px_30px_-28px_rgba(15,23,42,0.55)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/68 pt-[env(safe-area-inset-top,0px)]">
      <div className="max-w-6xl mx-auto px-safe flex h-[3.75rem] items-center justify-between gap-3 sm:h-16 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
          <Link
            href="/"
            className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-base font-semibold tracking-tight text-primary-foreground shadow-sm sm:text-lg"
          >
            华人广场
          </Link>
          <NavLocationBadge />
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {categories.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground hover:bg-accent/75 hover:text-foreground transition-colors"
            >
              {cat.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {session ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex gap-1 text-xs">
                <Link href="/merchant/apply">
                  <Store className="w-4 h-4" />
                  商家入驻
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex gap-1 text-xs">
                <Link href="/share">
                  <Share2 className="w-4 h-4" />
                  分享本站
                </Link>
              </Button>
              <Button asChild size="sm" className="hidden sm:flex gap-1">
                <Link href="/posts/new">
                  <PlusCircle className="w-4 h-4" />
                  发布
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 pl-1.5 max-w-[200px]">
                    <UserAvatar
                      src={(session.user as { avatar?: string | null }).avatar}
                      name={session.user?.name}
                      size="sm"
                    />
                    <span className="hidden sm:inline truncate">
                      {session.user?.name || session.user?.email || (session.user as { username?: string }).username}
                    </span>
                    <ChevronDown className="w-3 h-3 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">我的资料</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">我的发布</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/favorites">我的收藏</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/merchant/apply">商家入驻</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/merchant">商家中心</Link>
                  </DropdownMenuItem>
                  {(session.user as { isAdmin?: boolean })?.isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <Settings className="w-4 h-4 mr-2" />
                        管理后台
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => signOut({ callbackUrl: '/' })}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">登录</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">注册</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="border-t border-border/60 md:hidden">
        <div className="max-w-6xl mx-auto px-safe py-2.5 flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-ps-2">
          {categories.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className="shrink-0 inline-flex items-center min-h-11 rounded-full border border-border/70 bg-background/80 px-3.5 text-sm font-medium text-muted-foreground shadow-sm shadow-black/5 hover:bg-accent/75 hover:text-foreground active:bg-accent/85 transition-colors whitespace-nowrap"
            >
              {cat.label}
            </Link>
          ))}
        </div>
      </div>

      <GlobalAnnouncement />
    </header>
  )
}
