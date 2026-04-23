# Vercel Preview And Stripe Rollout

## Branch Strategy
- `main`: production
- `staging`: stable preview deployment for Stripe test mode

不要把 Stripe webhook 指到临时 PR 域名。请把测试 webhook 固定到 `staging` 对应的 Vercel 预览域名或手动绑定的预览别名。

## Vercel Environment Variables

### Preview and Production
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_SITE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`

### Optional
- `CRON_SECRET`
- `VISITOR_STATS_SALT`
- AI related env vars if preview also needs AI search

## Database Strategy
- Preview must use a dedicated test database.
- Do not point Vercel Preview to the production database.
- Before deploying payment changes, run the latest Prisma migration on the preview database first.

## Stripe Setup

### Recommended test webhook target
- `https://<your-staging-preview-domain>/api/stripe/webhook`

### Events to subscribe
- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`

### Current paid flows
- Post pin
- Merchant onboarding review fee
- Ad purchase
- Ad renewal

## Verification Commands

### Local env sanity check
```bash
npm run check:preview-env
```

### Prisma client regeneration
```bash
npx prisma generate
```

### Lint
```bash
npm run lint
```

## Preview Smoke Test Checklist
1. Register a user and confirm login works on the preview domain.
2. Verify password reset emails contain the preview domain.
3. Publish a post and complete Stripe test checkout for post pin.
4. Submit a merchant application and complete Stripe test checkout.
5. Approve the merchant from the admin panel.
6. Create an ad draft, complete Stripe checkout, and confirm it becomes active.
7. Renew the paid ad and confirm `endAt` extends after webhook delivery.

## Notes
- Merchant applications only enter the review queue after payment succeeds.
- Ads stay hidden until payment succeeds.
- Existing post pin free trial and credit logic still applies before Stripe checkout.
