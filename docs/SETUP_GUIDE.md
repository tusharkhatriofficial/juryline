# Juryline — Complete Setup Guide (Zero to Production)

This guide walks you through setting up the entire Juryline platform from scratch, including all third-party services, environment configuration, database setup, and production deployment.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Supabase Setup](#2-supabase-setup)
3. [Database Migrations](#3-database-migrations)
4. [Cloudflare R2 Setup (File Uploads)](#4-cloudflare-r2-setup-file-uploads)
5. [Archestra.ai Setup (AI Features)](#5-archestraai-setup-ai-features)
6. [Backend Configuration](#6-backend-configuration)
7. [Frontend Configuration](#7-frontend-configuration)
8. [Running Locally with Docker](#8-running-locally-with-docker)
9. [Running Locally without Docker](#9-running-locally-without-docker)
10. [Seeding Demo Data](#10-seeding-demo-data)
11. [Production Deployment](#11-production-deployment)
12. [Environment Variable Reference](#12-environment-variable-reference)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Prerequisites

- **Docker & Docker Compose** (recommended) — or Node.js 20+ and Python 3.12+
- A **Supabase** account (free tier works) — [supabase.com](https://supabase.com)
- A **Cloudflare** account (for R2 file storage, optional but recommended)
- An **Archestra.ai** account (for AI features, optional — the app works without it)

---

## 2. Supabase Setup

Supabase provides authentication, the PostgreSQL database, and real-time features.

### 2.1 Create a Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create an account
2. Click **"New Project"**
3. Choose an organization (create one if needed)
4. Fill in:
   - **Project name**: `juryline` (or anything)
   - **Database password**: Save this somewhere — you won't see it again
   - **Region**: Pick one closest to your users
5. Wait for the project to finish provisioning (1-2 minutes)

### 2.2 Collect Your Keys

Go to **Project Settings → API** and note down:

| Key | Where to find | Used by |
|-----|---------------|---------|
| **Project URL** | `Settings → API → Project URL` | Both backend and frontend |
| **anon (public) key** | `Settings → API → Project API Keys → anon` | Frontend only |
| **service_role key** | `Settings → API → Project API Keys → service_role` | Backend only (never expose this!) |
| **JWT Secret** | `Settings → API → JWT Settings → JWT Secret` | Backend only |

### 2.3 Configure Auth Settings

Go to **Authentication → Providers**:

1. Ensure **Email** provider is enabled
2. Under **Email Auth**:
   - Enable "Confirm email" (recommended for production)
   - For local development, you can disable it to skip email verification
3. Under **URL Configuration** (`Authentication → URL Configuration`):
   - **Site URL**: `http://localhost:4000` (or your production frontend URL)
   - **Redirect URLs**: Add `http://localhost:4000/auth/callback` (this is where magic links redirect judges)

### 2.4 Configure Email Templates (Optional)

Go to **Authentication → Email Templates**. You can customize:
- **Confirm signup** — sent when a user registers
- **Magic Link** — sent to judges when they're invited

For the Magic Link template, Supabase auto-generates the link. No custom setup needed.

---

## 3. Database Migrations

Run the three migration files in order via the **Supabase SQL Editor** (`SQL Editor` in the dashboard sidebar):

### Migration 1: Schema

Open `db/migrations/001_initial_schema.sql`, copy the entire contents, paste into the SQL Editor, and click **Run**. This creates:
- `profiles` — user profiles linked to Supabase Auth
- `events` — hackathon events
- `form_fields` — dynamic submission form schema
- `criteria` — judging criteria
- `submissions` — participant submissions
- `event_judges` — judge invitations
- `judge_assignments` — which judge reviews which submission
- `reviews` — judge scores and notes

### Migration 2: Profile Trigger

Open `db/migrations/002_profile_trigger.sql`, paste and run. This creates a database trigger that automatically creates a `profiles` row whenever a new user signs up through Supabase Auth.

### Migration 3: Trigger Fix

Open `db/migrations/003_fix_profile_trigger.sql`, paste and run. This fixes a schema-scoping issue with the trigger.

**Verify**: After running all three, go to **Table Editor** in Supabase. You should see all 8 tables listed.

---

## 4. Cloudflare R2 Setup (File Uploads)

R2 is used for file uploads (submission attachments like documents, images, videos). If you skip this, file upload fields won't work but everything else will.

### 4.1 Create an R2 Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **R2 Object Storage**
2. Click **"Create bucket"**
3. Name it `juryline-uploads` (or anything you like)
4. Choose **Automatic** location
5. Click **Create bucket**

### 4.2 Enable Public Access

1. Open your bucket → **Settings** tab
2. Under **Public access**, click **"Allow Access"**
3. Assign a custom domain or use the auto-generated `*.r2.dev` URL
4. Note down the public URL (e.g., `https://pub-abc123.r2.dev`)

### 4.3 Configure CORS for the Bucket

In your bucket settings → **CORS Policy**, add:

```json
[
  {
    "AllowedOrigins": ["http://localhost:4000", "https://your-production-domain.com"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

### 4.4 Create API Tokens

1. Go to **R2 Overview** → **Manage R2 API Tokens**
2. Click **"Create API Token"**
3. Permissions: **Object Read & Write**
4. Specify bucket: Select your `juryline-uploads` bucket
5. Click **Create API Token**
6. Note down the **Access Key ID** and **Secret Access Key** (shown only once!)
7. Also note your **Cloudflare Account ID** from the dashboard URL or R2 overview page

---

## 5. Archestra.ai Setup (AI Features)

Archestra provides the AI-powered features: intelligent judge assignment, progress monitoring, score aggregation, and AI-generated feedback. **This is entirely optional** — every AI feature has a deterministic Python fallback.

### What Archestra Does

| Feature | With Archestra | Without Archestra (Fallback) |
|---------|---------------|------------------------------|
| Judge Assignment | AI-optimized matching based on expertise | Balanced round-robin distribution |
| Progress Monitoring | Intelligent tracking with predictions | Percentage-based completion stats |
| Score Aggregation | AI-weighted, bias-aware aggregation | Standard weighted averages |
| Feedback Generation | AI-synthesized feedback from all reviews | Not available (button hidden) |

### 5.1 Create an Archestra Account

1. Go to [archestra.ai](https://archestra.ai) and create an account
2. Create a new **project**/workspace

### 5.2 Create AI Agents (Prompts)

Juryline uses Archestra's Agent-to-Agent (A2A) protocol. You need to create 5 prompt agents:

#### Agent 1: Ingest Agent
- **Purpose**: Validates submission data structure
- **Input**: `{ submissions: [...], form_fields: [...] }`
- **Expected output**: Validated submission data
- **Note the Prompt ID** → this becomes `ARCHESTRA_INGEST_PROMPT_ID`

#### Agent 2: Assignment Agent
- **Purpose**: Intelligently assigns judges to submissions
- **Input**: `{ judges: [...], submissions: [...], judges_per_submission: N }`
- **Expected output**: `{ assignments: [{ judge_id, submission_id }] }`
- **Note the Prompt ID** → this becomes `ARCHESTRA_ASSIGN_PROMPT_ID`

#### Agent 3: Progress Agent
- **Purpose**: Monitors judging progress
- **Input**: `{ judges: [...], assignments: [...], reviews: [...] }`
- **Expected output**: Completion stats, predictions, reminders
- **Note the Prompt ID** → this becomes `ARCHESTRA_PROGRESS_PROMPT_ID`

#### Agent 4: Aggregation Agent
- **Purpose**: Aggregates scores into final rankings
- **Input**: `{ reviews: [...], criteria: [...], submissions: [...] }`
- **Expected output**: Ranked leaderboard with weighted scores
- **Note the Prompt ID** → this becomes `ARCHESTRA_AGGREGATE_PROMPT_ID`

#### Agent 5: Feedback Agent
- **Purpose**: Generates human-readable feedback from judge reviews
- **Input**: `{ reviews: [...], criteria: [...], submission: {...} }`
- **Expected output**: Synthesized feedback text
- **Note the Prompt ID** → this becomes `ARCHESTRA_FEEDBACK_PROMPT_ID`

### 5.3 Get Your API Key

1. Go to your Archestra project settings
2. Generate an API key
3. Note it down → this becomes `ARCHESTRA_API_KEY`
4. Note the base URL of your Archestra instance → `ARCHESTRA_BASE_URL`

### 5.4 Without Archestra

If you don't set up Archestra, just leave the `ARCHESTRA_*` env vars empty or omit them entirely. The fallback system will handle everything automatically.

---

## 6. Backend Configuration

### 6.1 Create the .env File

Create `backend/.env` with the following values:

```env
# ── Supabase ──
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci...your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# ── Cloudflare R2 (optional — skip if not using file uploads) ──
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=juryline-uploads
R2_PUBLIC_URL=https://pub-abc123.r2.dev

# ── App Settings ──
APP_ENV=development
FRONTEND_URL=http://localhost:4000
CORS_ORIGINS=http://localhost:4000,http://localhost:3000
PORT=8888

# ── Archestra AI (optional — leave empty to use fallbacks) ──
ARCHESTRA_API_KEY=
ARCHESTRA_BASE_URL=
ARCHESTRA_INGEST_PROMPT_ID=
ARCHESTRA_ASSIGN_PROMPT_ID=
ARCHESTRA_PROGRESS_PROMPT_ID=
ARCHESTRA_AGGREGATE_PROMPT_ID=
ARCHESTRA_FEEDBACK_PROMPT_ID=
```

---

## 7. Frontend Configuration

### 7.1 Create the .env File

Create `frontend/.env` (or `frontend/.env.local`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8888/api/v1
```

**Important**: The `anon` key is safe to expose in the frontend. Never put the `service_role` key here.

---

## 8. Running Locally with Docker

This is the recommended way to run — everything is containerized.

```bash
# From the project root
docker compose up -d --build
```

This starts:
- **Backend** at `http://localhost:8888` (FastAPI with hot reload)
- **Frontend** at `http://localhost:4000` (Next.js with Turbopack)

To view logs:
```bash
docker compose logs -f          # all services
docker compose logs -f backend  # backend only
docker compose logs -f frontend # frontend only
```

To stop:
```bash
docker compose down
```

---

## 9. Running Locally without Docker

### 9.1 Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Run the server
uvicorn app.main:app --host 0.0.0.0 --port 8888 --reload
```

### 9.2 Frontend

```bash
cd frontend
npm install

# Run the dev server
npx next dev --hostname 0.0.0.0 --port 4000
```

---

## 10. Seeding Demo Data

The seed script creates demo users, an event, submissions, criteria, and partial reviews — perfect for demos.

```bash
cd backend
source .venv/bin/activate   # if not using Docker
python3 seed.py             # seed demo data
python3 seed.py --clean     # clear + re-seed
```

Or with Docker:
```bash
docker compose exec backend python seed.py --clean
```

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Organizer | `organizer@juryline.dev` | `demo123` |
| Judge 1 | `judge1@juryline.dev` | `demo123` |
| Judge 2 | `judge2@juryline.dev` | `demo123` |
| Participant | `p1@juryline.dev` | `demo123` |

---

## 11. Production Deployment

### 11.1 Environment Changes

Update these for production:

```env
# backend/.env
APP_ENV=production
FRONTEND_URL=https://your-domain.com
CORS_ORIGINS=https://your-domain.com
PORT=8888

# frontend/.env
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api/v1
```

### 11.2 Supabase Production Settings

1. **Site URL**: Update to `https://your-domain.com`
2. **Redirect URLs**: Add `https://your-domain.com/auth/callback`
3. **Email Confirmation**: Enable "Confirm email" in Authentication settings
4. **Email**: Configure a custom SMTP (Supabase Settings → Authentication → SMTP Settings) for reliable email delivery. The default Supabase email sender has rate limits.

### 11.3 R2 CORS for Production

Update your R2 bucket CORS policy to include your production domain.

### 11.4 Deployment Options

The app can be deployed on any platform that supports Docker:

**Option A: Single VPS (simplest)**
```bash
# On your server
git clone <your-repo>
cd juryline
# Update .env files with production values
docker compose up -d --build
# Set up nginx as reverse proxy for SSL
```

**Option B: Container platforms**
- **Railway** / **Render** / **Fly.io** — deploy backend and frontend as separate services
- Point frontend at backend URL via `NEXT_PUBLIC_API_URL`

**Option C: Hybrid**
- Frontend on **Vercel** (optimal for Next.js)
- Backend on **Railway** / **Fly.io** / **Cloud Run**

### 11.5 Nginx Reverse Proxy Example

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8888;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 12. Environment Variable Reference

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SUPABASE_URL` | Yes | — | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Yes | — | Service role key (full DB access) |
| `SUPABASE_JWT_SECRET` | Yes | — | JWT secret for token verification |
| `R2_ACCOUNT_ID` | No | `""` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | No | `""` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | No | `""` | R2 secret key |
| `R2_BUCKET_NAME` | No | `"juryline-uploads"` | R2 bucket name |
| `R2_PUBLIC_URL` | No | `""` | Public URL for uploaded files |
| `APP_ENV` | No | `"development"` | `development` or `production` |
| `FRONTEND_URL` | No | `"http://localhost:3000"` | Frontend origin (for redirects) |
| `PORT` | No | `8000` | Server port |
| `CORS_ORIGINS` | No | `""` | Extra CORS origins (comma-separated) |
| `ARCHESTRA_API_KEY` | No | `""` | Archestra API key |
| `ARCHESTRA_BASE_URL` | No | `""` | Archestra server URL |
| `ARCHESTRA_INGEST_PROMPT_ID` | No | `""` | Prompt ID for ingest agent |
| `ARCHESTRA_ASSIGN_PROMPT_ID` | No | `""` | Prompt ID for assignment agent |
| `ARCHESTRA_PROGRESS_PROMPT_ID` | No | `""` | Prompt ID for progress agent |
| `ARCHESTRA_AGGREGATE_PROMPT_ID` | No | `""` | Prompt ID for aggregation agent |
| `ARCHESTRA_FEEDBACK_PROMPT_ID` | No | `""` | Prompt ID for feedback agent |

### Frontend (`frontend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | — | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | — | Supabase anon (public) key |
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:9000/api/v1` | Backend API base URL |

---

## 13. Troubleshooting

### CORS Errors
- Ensure `CORS_ORIGINS` in `backend/.env` includes your frontend URL
- Ensure `FRONTEND_URL` matches exactly (no trailing slash)
- Check R2 CORS policy if file uploads fail

### Empty Submissions in Dashboard
- If seed data shows `--` for all fields: the seed script was using label strings instead of field UUIDs as `form_data` keys. Re-run `python3 seed.py --clean` to fix.

### Magic Links Not Working (Judge Invites)
- Check Supabase **Authentication → URL Configuration** — the **Redirect URL** must include `http://localhost:4000/auth/callback` (or your production callback URL)
- For local dev, check if Supabase email delivery is working (check Supabase logs under **Authentication → Logs**)

### "Module not found" Errors
- If you see `@chakra-ui/icons` errors: the project uses `react-icons/hi2` exclusively, not `@chakra-ui/icons`
- Run `npm install` in the frontend to ensure all deps are installed

### Database Trigger Issues
- If profiles aren't auto-created on signup: make sure all 3 migrations were run in order
- Check Supabase **Database → Functions** to verify `handle_new_user()` exists

### Port Mismatches
- Backend runs on port `8888` (set in docker-compose and `.env`)
- Frontend runs on port `4000`
- Ensure `NEXT_PUBLIC_API_URL` in `frontend/.env` points to `http://localhost:8888/api/v1`
