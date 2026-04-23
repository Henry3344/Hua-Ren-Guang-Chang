import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id?: string
      avatar?: string | null
      isAdmin?: boolean
      username?: string
    }
  }

  interface User {
    isAdmin?: boolean
    username?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    isAdmin?: boolean
    username?: string
  }
}
