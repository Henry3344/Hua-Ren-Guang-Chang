'use client'
import Turnstile from 'react-turnstile'

interface Props {
  onVerify: (token: string) => void
  onExpire?: () => void
  resetKey?: number
}

export default function TurnstileWidget({ onVerify, onExpire, resetKey }: Props) {
  return (
    <Turnstile
      key={resetKey}
      sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
      onVerify={onVerify}
      onExpire={onExpire}
      theme="light"
      language="zh-cn"
    />
  )
}
