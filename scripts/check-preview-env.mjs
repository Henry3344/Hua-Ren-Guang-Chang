const requiredByEnv = {
  preview: [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'NEXT_PUBLIC_SITE_URL',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'RESEND_API_KEY',
    'EMAIL_FROM',
    'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
    'TURNSTILE_SECRET_KEY',
  ],
  production: [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'NEXT_PUBLIC_SITE_URL',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'RESEND_API_KEY',
    'EMAIL_FROM',
    'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
    'TURNSTILE_SECRET_KEY',
  ],
}

const target = process.argv[2] === 'production' ? 'production' : 'preview'
const missing = requiredByEnv[target].filter((key) => !process.env[key]?.trim())
const warnings = []

const databaseUrl = process.env.DATABASE_URL?.trim()
if (databaseUrl) {
  try {
    const parsed = new URL(databaseUrl)
    const isNeon = parsed.hostname.includes('neon.tech')
    if (isNeon && parsed.searchParams.get('sslmode') !== 'require') {
      warnings.push('DATABASE_URL looks like Neon; add ?sslmode=require if it is not already present.')
    }
  } catch {
    warnings.push('DATABASE_URL is present but is not a valid URL.')
  }
}

if (!process.env.DIRECT_URL?.trim()) {
  warnings.push('DIRECT_URL is not set. Runtime is OK, but keep a Neon direct/unpooled URL for local Prisma migrations.')
}

if (missing.length > 0) {
  console.error(`Missing ${target} env vars:`)
  for (const key of missing) {
    console.error(`- ${key}`)
  }
  process.exit(1)
}

for (const warning of warnings) {
  console.warn(`Warning: ${warning}`)
}

console.log(`All ${target} env vars are present.`)
