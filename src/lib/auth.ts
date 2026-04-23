import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { incrementLoginAttempts, resetLoginAttempts } from '@/lib/rateLimit'
import { getLoginIdentifierKind, normalizeLoginIdentifier } from '@/lib/account'

/** Use the site origin you open in the browser (http vs https, localhost vs 127.0.0.1 must match). */
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        identifier: { label: 'Email or Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.identifier || !credentials?.password) return null
          const rawIdentifier = credentials.identifier.trim()
          const identifier = normalizeLoginIdentifier(rawIdentifier)
          const kind = getLoginIdentifierKind(rawIdentifier)

          const where =
            kind === 'email'
              ? { email: identifier }
              : kind === 'username'
                ? { username: identifier }
                : kind === 'phone'
                  ? { phone: rawIdentifier }
                  : null

          if (!where) {
            incrementLoginAttempts(identifier)
            return null
          }

          const user = await prisma.user.findFirst({
            where,
          })

          if (!user) {
            incrementLoginAttempts(identifier)
            return null
          }

          const valid = await bcrypt.compare(credentials.password, user.password)
          if (!valid) {
            incrementLoginAttempts(identifier)
            return null
          }

          if (user.isDeleted || user.isBanned) {
            return null
          }

          resetLoginAttempts(identifier)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            username: user.username,
            isAdmin: user.isAdmin,
          }
        } catch (e) {
          console.error('[next-auth] authorize error', e)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      try {
        if (user) {
          token.id = user.id
          token.sub = user.id
          token.isAdmin = user.isAdmin
          token.username = user.username
        }
        return token
      } catch (e) {
        console.error('[next-auth] jwt callback error', e)
        return token
      }
    },
    async session({ session, token }) {
      try {
        let uid = (token as { id?: string }).id || token.sub
        if (session.user && !uid && session.user.email) {
          try {
            const row = await prisma.user.findFirst({
              where: { email: session.user.email.trim().toLowerCase() },
              select: { id: true },
            })
            uid = row?.id
          } catch {
            uid = undefined
          }
        }
        if (session.user && uid) {
          ;(session.user as { id?: string }).id = uid as string
          try {
            const u = await prisma.user.findUnique({
              where: { id: uid as string },
              select: { name: true, avatar: true, isAdmin: true, username: true },
            })
            if (u) {
              session.user.name = u.name ?? session.user.name
              ;(session.user as { avatar?: string | null }).avatar = u.avatar
              ;(session.user as { isAdmin?: boolean }).isAdmin = u.isAdmin
              ;(session.user as { username?: string }).username = u.username
            } else {
              ;(session.user as { isAdmin?: boolean }).isAdmin = Boolean(token.isAdmin)
              ;(session.user as { username?: string }).username = (token as { username?: string }).username
            }
          } catch {
            ;(session.user as { isAdmin?: boolean }).isAdmin = Boolean(token.isAdmin)
            ;(session.user as { username?: string }).username = (token as { username?: string }).username
          }
        }
        return session
      } catch (e) {
        console.error('[next-auth] session callback error', e)
        const uid = ((token as { id?: string }).id || token.sub) as string | undefined
        if (session.user && uid) {
          ;(session.user as { id?: string }).id = uid
          ;(session.user as { isAdmin?: boolean }).isAdmin = Boolean(token.isAdmin)
          ;(session.user as { username?: string }).username = (token as { username?: string }).username
        }
        return session
      }
    },
  },
}
