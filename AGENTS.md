<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
# 项目结构说明（非常重要）

## 技术栈
- Next.js App Router
- Prisma + PostgreSQL
- API 在 /api 下
- 前端在 /app 目录

## 核心模块

### 1. 帖子（Post）
- 数据结构：prisma/schema.prisma
- API：/api/posts
- 页面：首页列表 / 详情页

### 2. 用户系统
- 登录状态：/api/auth/session
- 用户数据：User 表

### 3. 支付（Stripe）
- 支付逻辑：/api/stripe 或 webhook
- 用于置顶、广告

## 开发规则（AI必须遵守）
- 不要创建重复功能文件
- 修改前先搜索已有逻辑
- 优先复用 Post / User 模型
- 所有新功能必须包含：数据库 + API + 前端