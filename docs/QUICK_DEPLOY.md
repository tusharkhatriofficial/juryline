# 🚀 Quick Production Deployment Cheat Sheet

## Heroku Backend Deployment

```bash
# 1. Create and configure Heroku app
heroku create your-app-name
heroku buildpacks:set heroku/python

# 2. Set environment variables
heroku config:set APP_ENV=production
heroku config:set SUPABASE_URL=your-url
heroku config:set SUPABASE_SERVICE_KEY=your-key
heroku config:set SUPABASE_JWT_SECRET=your-secret
heroku config:set R2_ACCOUNT_ID=your-id
heroku config:set R2_ACCESS_KEY_ID=your-key
heroku config:set R2_SECRET_ACCESS_KEY=your-secret
heroku config:set R2_BUCKET_NAME=juryline-uploads
heroku config:set R2_PUBLIC_URL=your-url
heroku config:set FRONTEND_URL=https://your-app.vercel.app
heroku config:set PORT=8000

# 3. Deploy from backend directory
cd backend
git init
git add .
git commit -m "Deploy backend"
git push heroku main

# 4. Scale dynos
heroku ps:scale web=1:standard-1x

# 5. Verify
heroku logs --tail
curl https://your-app-name.herokuapp.com/health
```

## Vercel Frontend Deployment

```bash
# 1. Navigate to frontend
cd frontend

# 2. Create .env.production
cat > .env.production << EOF
NEXT_PUBLIC_API_URL=https://your-app-name.herokuapp.com/api/v1
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EOF

# 3. Deploy
vercel login
vercel --prod

# OR use Vercel Dashboard
# - Import repo
# - Set Root Directory: frontend
# - Add environment variables
# - Deploy
```

## Docker Deployment

```bash
# 1. Set environment variables in .env files
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
# Edit both files with production values

# 2. Build and run
docker-compose -f docker-compose.prod.yml up -d

# 3. Check status
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f

# 4. Verify
curl http://localhost:8000/health
curl http://localhost:3000
```

## Post-Deployment Checklist

- [ ] Run database migrations in Supabase
- [ ] Update CORS origins on backend
- [ ] Test health endpoints
- [ ] Test authentication flow
- [ ] Test file uploads to R2
- [ ] Set up monitoring/alerts
- [ ] Configure custom domains
- [ ] Enable SSL/HTTPS
- [ ] Set up backups
- [ ] Document credentials in secure location

## Common Issues

**CORS Error**: Update `CORS_ORIGINS` on Heroku with frontend URL
**500 Error**: Check Heroku logs with `heroku logs --tail`
**Build Failed**: Verify all env vars are set correctly
**Uploads Fail**: Check R2 bucket permissions and CORS policy

## Useful Commands

```bash
# Heroku
heroku logs --tail                    # View logs
heroku ps                             # Check dyno status
heroku restart                        # Restart app
heroku config                         # List env vars

# Vercel
vercel logs                          # View logs
vercel env ls                        # List env vars
vercel --prod                        # Deploy to production

# Docker
docker-compose -f docker-compose.prod.yml up -d     # Start
docker-compose -f docker-compose.prod.yml down      # Stop
docker-compose -f docker-compose.prod.yml restart   # Restart
docker-compose -f docker-compose.prod.yml logs -f   # Logs
```

For detailed instructions, see [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)
