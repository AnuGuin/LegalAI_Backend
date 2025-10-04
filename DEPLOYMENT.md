# LegalAI Backend - Render Deployment

## Prerequisites
- PostgreSQL database (Render PostgreSQL or external)
- Redis instance (Upstash Redis recommended)
- Environment variables configured

## Environment Variables Required

### Core
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens
- `FRONTEND_URL` - Your frontend application URL

### Optional Services
- `UPSTASH_REDIS_REST_URL` - Redis URL for caching
- `UPSTASH_REDIS_REST_TOKEN` - Redis token
- `PYTHON_BACKEND_URL` - Your Python AI backend URL

### OAuth (Optional)
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`
- `META_APP_ID` & `META_APP_SECRET`

## Deployment Steps

1. **Push to GitHub**
2. **Connect to Render**
3. **Set Environment Variables**
4. **Deploy**

## Health Check
The app provides a health endpoint at `/health`

## Database Migration
Migrations run automatically during build via `prisma migrate deploy`