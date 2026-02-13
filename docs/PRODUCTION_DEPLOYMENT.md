# 🚀 Juryline Production Deployment Guide

This guide covers production deployment of Juryline using both **Docker** and **standard** approaches.

**Target Deployment:**
- **Backend**: Heroku (or any cloud provider)
- **Frontend**: Vercel (or any static hosting)

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Option A: Docker Deployment](#option-a-docker-deployment)
4. [Option B: Heroku + Vercel (Standard)](#option-b-heroku--vercel-standard)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Services

1. **Supabase Account** (Database & Auth)
   - Create a project at [supabase.com](https://supabase.com)
   - Run all migrations from `db/migrations/`
   - Note your: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_ANON_KEY`, `SUPABASE_JWT_SECRET`

2. **Cloudflare R2** (File Storage)
   - Create bucket at [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Enable public access for uploads
   - Note your: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PUBLIC_URL`

3. **Archestra.ai** (Optional, AI Features)
   - Get API key from [archestra.ai](https://archestra.ai)
   - Note your: `ARCHESTRA_API_KEY`, `ARCHESTRA_BASE_URL`

4. **Heroku Account** (Backend hosting)
   - Install [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)

5. **Vercel Account** (Frontend hosting)
   - Install [Vercel CLI](https://vercel.com/cli): `npm i -g vercel`

---

## Pre-Deployment Checklist

### 1. Database Setup

Run all migrations in Supabase SQL Editor:

```sql
-- Run in order:
-- 1. db/migrations/001_initial_schema.sql
-- 2. db/migrations/002_profile_trigger.sql
-- 3. db/migrations/003_fix_profile_trigger.sql
```

### 2. Environment Configuration

Create `.env` files for both backend and frontend using the examples:

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your production values

# Frontend
cp frontend/.env.local.example frontend/.env.local
# Edit frontend/.env.local with your production values
```

### 3. Update CORS Origins

In `backend/.env`, set:
```env
CORS_ORIGINS=https://your-frontend-domain.vercel.app,https://your-custom-domain.com
```

### 4. Test Locally

```bash
# Test backend
cd backend
python -m uvicorn app.main:app --port 8000

# Test frontend (new terminal)
cd frontend
npm run build
npm start
```

---

## Option A: Docker Deployment

### Using Docker Compose (Self-Hosted)

#### 1. Build Production Images

```bash
# Build both services
docker-compose -f docker-compose.prod.yml build
```

#### 2. Configure Environment

Ensure `.env` files exist in both `backend/` and `frontend/` directories.

```env
# backend/.env
APP_ENV=production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_JWT_SECRET=your-jwt-secret
R2_ACCOUNT_ID=your-r2-account
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=juryline-uploads
R2_PUBLIC_URL=https://pub-xxx.r2.dev
FRONTEND_URL=https://your-frontend-domain.com
CORS_ORIGINS=https://your-frontend-domain.com
PORT=8000

# Optional Archestra
ARCHESTRA_API_KEY=your-key
ARCHESTRA_BASE_URL=https://api.archestra.ai
```

```env
# frontend/.env.local
NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

#### 3. Deploy

```bash
# Start services in detached mode
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Check health
curl http://localhost:8000/health
curl http://localhost:3000
```

#### 4. SSL/HTTPS Setup (Recommended)

Use a reverse proxy like **Nginx** or **Caddy**:

**Caddy Example (`Caddyfile`):**
```
your-backend-domain.com {
    reverse_proxy localhost:8000
}

your-frontend-domain.com {
    reverse_proxy localhost:3000
}
```

Run Caddy:
```bash
caddy run
```

---

## Option B: Heroku + Vercel (Standard)

### Part 1: Deploy Backend to Heroku

#### 1. Create Heroku App

```bash
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Or use existing app
heroku git:remote -a your-app-name
```

#### 2. Add Buildpack

```bash
heroku buildpacks:set heroku/python
```

#### 3. Create `Procfile`

Create `backend/Procfile`:
```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 4
```

#### 4. Create `runtime.txt`

Create `backend/runtime.txt`:
```
python-3.12.0
```

#### 5. Set Environment Variables

```bash
cd backend

# Set all required env vars
heroku config:set APP_ENV=production
heroku config:set SUPABASE_URL=https://your-project.supabase.co
heroku config:set SUPABASE_SERVICE_KEY=your-service-key
heroku config:set SUPABASE_JWT_SECRET=your-jwt-secret
heroku config:set R2_ACCOUNT_ID=your-r2-account
heroku config:set R2_ACCESS_KEY_ID=your-access-key
heroku config:set R2_SECRET_ACCESS_KEY=your-secret-key
heroku config:set R2_BUCKET_NAME=juryline-uploads
heroku config:set R2_PUBLIC_URL=https://pub-xxx.r2.dev
heroku config:set FRONTEND_URL=https://your-app.vercel.app
heroku config:set PORT=8000

# Optional: Archestra
heroku config:set ARCHESTRA_API_KEY=your-key
heroku config:set ARCHESTRA_BASE_URL=https://api.archestra.ai
```

#### 6. Deploy

```bash
# Initialize git if needed
git init
git add .
git commit -m "Initial commit"

# Deploy
git push heroku main

# Or if on different branch:
git push heroku your-branch:main
```

#### 7. Scale Dynos

```bash
# Use at least standard-1x for production
heroku ps:scale web=1:standard-1x

# Or for higher traffic:
heroku ps:scale web=2:standard-2x
```

#### 8. Verify Deployment

```bash
heroku logs --tail

# Test health endpoint
curl https://your-app-name.herokuapp.com/health
```

#### 9. Set CORS Origins (Important!)

After deploying frontend, update CORS:
```bash
heroku config:set CORS_ORIGINS=https://your-app.vercel.app,https://your-custom-domain.com
```

---

### Part 2: Deploy Frontend to Vercel

#### 1. Install Vercel CLI

```bash
npm i -g vercel
```

#### 2. Configure Environment Variables

Create `frontend/.env.production`:
```env
NEXT_PUBLIC_API_URL=https://your-app-name.herokuapp.com/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

#### 3. Deploy

```bash
cd frontend

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

OR use Vercel Dashboard:

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Set **Root Directory**: `frontend`
4. Configure **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: `https://your-app-name.herokuapp.com/api/v1`
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://your-project.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `your-anon-key`
5. Click **Deploy**

#### 4. Configure Custom Domain (Optional)

In Vercel Dashboard:
- Go to **Settings → Domains**
- Add your custom domain
- Update DNS records as instructed
- Update Heroku `CORS_ORIGINS` with new domain

---

## Post-Deployment Verification

### 1. Health Checks

```bash
# Backend health
curl https://your-backend.com/health
# Should return: {"status":"healthy","service":"juryline-api","version":"0.1.0"}

curl https://your-backend.com/api/v1/health
# Should return database status

# Frontend
curl https://your-frontend.com
# Should return 200 OK
```

### 2. Test Authentication

1. Visit `https://your-frontend.com/register`
2. Create an account
3. Check email for verification link
4. Login and verify dashboard loads

### 3. Test File Upload

1. Create an event
2. Add a file upload field
3. Make a test submission
4. Verify file appears in R2 bucket

### 4. Test Judge Review Flow

1. Invite a judge
2. Judge signs in via magic link
3. Verify review card interface works
4. Submit review
5. Check dashboard for updated scores

---

## Monitoring & Maintenance

### Backend Monitoring (Heroku)

```bash
# View logs
heroku logs --tail --app your-app-name

# Check dyno status
heroku ps --app your-app-name

# Restart if needed
heroku restart --app your-app-name

# View metrics
heroku addons:create librato:development
```

### Frontend Monitoring (Vercel)

- View logs in [Vercel Dashboard](https://vercel.com/dashboard)
- Enable **Analytics** in project settings
- Set up **Slack/Discord** notifications for deployment failures

### Database Monitoring (Supabase)

- Monitor query performance in **Database → Query Performance**
- Set up **Database Webhooks** for critical events
- Enable **Point-in-Time Recovery** for backups

### File Storage (Cloudflare R2)

- Monitor storage usage in Cloudflare Dashboard
- Set up **Budget Alerts**
- Configure **Lifecycle Rules** for old files (if needed)

---

## Security Hardening

### 1. Enable HTTPS Only

Heroku and Vercel handle SSL automatically, but ensure:
```python
# In backend/app/main.py (already added)
# TrustedHostMiddleware ensures secure connections
```

### 2. Rate Limiting

Add rate limiting to prevent abuse:

```bash
# Install dependency
pip install slowapi
```

Update `backend/requirements.txt`:
```
slowapi==0.1.9
```

Create `backend/app/middleware/rate_limit.py`:
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
```

Use in routes:
```python
from app.middleware.rate_limit import limiter

@router.post("/auth/login")
@limiter.limit("5/minute")
async def login(...):
    ...
```

### 3. Environment Variable Security

- **Never** commit `.env` files
- Rotate secrets quarterly
- Use **Heroku Config Vars** and **Vercel Environment Variables**
- Enable **Supabase RLS** (Row Level Security) policies

### 4. CORS Configuration

Update `backend/.env`:
```env
# Only allow your frontend domains
CORS_ORIGINS=https://your-app.vercel.app,https://yourdomain.com
```

---

## Backup Strategy

### 1. Database Backups (Supabase)

Supabase provides automatic backups on paid plans. For free tier:
```bash
# Manual backup script
pg_dump -h db.your-project.supabase.co -U postgres -d postgres > backup.sql
```

### 2. File Storage Backups (R2)

Use Cloudflare's **R2 Replication** or:
```bash
# Use rclone for backups
rclone sync r2:juryline-uploads /local/backup
```

### 3. Code Backups

- Push to GitHub/GitLab
- Tag releases: `git tag -a v1.0.0 -m "Release 1.0.0"`

---

## Scaling Considerations

### Horizontal Scaling

**Heroku:**
```bash
# Scale to multiple dynos
heroku ps:scale web=4:standard-2x
```

**Vercel:**
- Automatically scales with traffic
- Configure **Edge Functions** for global performance

### Database Optimization

1. **Add Indexes** for frequently queried columns:
```sql
CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_submissions_event ON submissions(event_id);
CREATE INDEX idx_reviews_judge ON reviews(judge_id, event_id);
```

2. **Connection Pooling** (Supabase handles this automatically)

3. **Read Replicas** (available on Supabase Pro plan)

### Caching

Add Redis for session caching:
```bash
# Heroku Redis addon
heroku addons:create heroku-redis:mini
```

---

## Troubleshooting

### Issue: "CORS Error" in Frontend

**Solution:**
```bash
# Update Heroku backend CORS
heroku config:set CORS_ORIGINS=https://your-frontend.vercel.app
```

### Issue: "500 Internal Server Error"

**Solution:**
```bash
# Check Heroku logs
heroku logs --tail --app your-app-name

# Common causes:
# - Missing environment variables
# - Supabase connection issues
# - R2 credentials incorrect
```

### Issue: "Build Failed" on Vercel

**Solution:**
- Check `frontend/.env.production` exists
- Verify all `NEXT_PUBLIC_*` env vars are set in Vercel Dashboard
- Check build logs for missing dependencies

### Issue: File Uploads Not Working

**Solution:**
1. Verify R2 bucket is public
2. Check CORS policy on R2 bucket:
```json
[
  {
    "AllowedOrigins": ["https://your-frontend.vercel.app"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedHeaders": ["*"]
  }
]
```

### Issue: Slow Response Times

**Solution:**
1. Upgrade Heroku dyno: `heroku ps:scale web=1:standard-2x`
2. Enable Supabase connection pooling
3. Add database indexes (see Scaling section)
4. Enable **Vercel Edge Network**

---

## Cost Estimation

### Minimal Setup (Free Tier)

| Service | Plan | Cost |
|---------|------|------|
| Supabase | Free | $0/mo |
| Cloudflare R2 | Free (10GB) | $0/mo |
| Heroku | Eco Dyno | $5/mo |
| Vercel | Hobby | $0/mo |
| **Total** | | **$5/mo** |

### Production Setup

| Service | Plan | Cost |
|---------|------|------|
| Supabase | Pro | $25/mo |
| Cloudflare R2 | Pay-as-you-go | ~$5-10/mo |
| Heroku | Standard-1x (2 dynos) | $50/mo |
| Vercel | Pro | $20/mo |
| **Total** | | **$100-105/mo** |

---

## Maintenance Checklist

### Weekly
- [ ] Review error logs
- [ ] Check disk space and storage usage
- [ ] Verify backup completion

### Monthly
- [ ] Review and optimize database queries
- [ ] Update dependencies (`npm audit`, `pip check`)
- [ ] Review security alerts
- [ ] Test disaster recovery plan

### Quarterly
- [ ] Rotate API keys and secrets
- [ ] Review and update CORS policies
- [ ] Audit user access and permissions
- [ ] Performance testing and optimization

---

## Additional Resources

- [FastAPI Deployment Guide](https://fastapi.tiangolo.com/deployment/)
- [Next.js Production Checklist](https://nextjs.org/docs/going-to-production)
- [Heroku Python Best Practices](https://devcenter.heroku.com/articles/python-gunicorn)
- [Vercel Deployment Documentation](https://vercel.com/docs/deployments/overview)
- [Supabase Production Guide](https://supabase.com/docs/guides/platform/going-into-prod)

---

## Support & Contact

For issues or questions:
- **GitHub Issues**: [your-repo/issues](https://github.com/your-org/juryline/issues)
- **Email**: support@yourdomain.com
- **Documentation**: [yourdomain.com/docs](https://yourdomain.com/docs)

---

**Last Updated**: February 2026  
**Version**: 1.0.0
