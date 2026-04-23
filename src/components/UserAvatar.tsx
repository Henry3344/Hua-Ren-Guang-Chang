import { userAvatarSrc } from '@/lib/avatar'
import { cn } from '@/lib/utils'

type Props = {
  src?: string | null
  name?: string | null
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClass = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-16 h-16' }

export default function UserAvatar({ src, name, className, size = 'md' }: Props) {
  const url = userAvatarSrc(src)
  return (
    <div className={cn('rounded-full shrink-0 overflow-hidden bg-muted ring-1 ring-border', sizeClass[size], className)}>
      <img src={url} alt={name || '用户'} className="w-full h-full object-cover" />
    </div>
  )
}
