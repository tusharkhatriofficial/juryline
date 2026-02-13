# 🏛️ Juryline — AI-Powered Hackathon Judging Platform

<p align="center">
  <strong>Build custom submission forms. Assign judges with AI. Get instant leaderboards.</strong>
</p>

<p align="center">
  <img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" />
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white" />
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img alt="Chakra UI" src="https://img.shields.io/badge/Chakra_UI-319795?style=flat-square&logo=chakraui&logoColor=white" />
</p>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Dynamic Form Builder** | 11 field types (text, URL, file upload, linear scale, etc.) — like Google Forms |
| **Card-Based Reviews** | Judges swipe through submissions with sliders + keyboard shortcuts (← → Ctrl+Enter) |
| **AI-Powered Assignment** | Archestra.ai auto-assigns submissions to judges via A2A protocol |
| **Live Leaderboard** | Weighted scoring, expandable score breakdowns per criterion |
| **Bias Detection** | Statistical outlier analysis flags judges scoring >1.5σ from mean |
| **CSV Export** | One-click download of all scores and rankings |
| **File Uploads** | Cloudflare R2 storage with presigned URLs for videos, images, documents |
| **Real-Time Dashboard** | Animated stat cards, judge progress tracking, completion rates |

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 + TypeScript + Chakra UI v3 + Framer Motion |
| **Backend** | Python 3.12 + FastAPI 0.115 |
| **Database** | Supabase PostgreSQL (with Row Level Security) |
| **Auth** | Supabase Auth (email/password + magic links for judges) |
| **File Storage** | Cloudflare R2 (S3-compatible) |
| **AI Orchestration** | Archestra.ai (A2A JSON-RPC 2.0) |
| **Containerization** | Docker Compose |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+
- **Python** 3.11+
- **Docker** & Docker Compose
- **Supabase** account (free tier works)
- **Cloudflare R2** bucket (optional — for file uploads)

### 1. Clone & Setup

```bash
git clone https://github.com/your-org/juryline.git
cd juryline
```

### 2. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run the database migrations in the SQL editor:
   ```
   db/migrations/001_initial_schema.sql
   db/migrations/002_profile_trigger.sql
   db/migrations/003_fix_profile_trigger.sql
   ```
3. Copy your project URL, anon key, service key, and JWT secret

### 3. Backend Setup

```bash
cd backend
cp .env.example .env   # Fill in your Supabase + R2 + Archestra values
```

**Required `.env` variables:**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
SUPABASE_JWT_SECRET=your-jwt-secret

# Cloudflare R2 (optional)
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=juryline-uploads
R2_PUBLIC_URL=https://your-r2-domain.com

# Archestra (optional)
ARCHESTRA_API_KEY=your-key
ARCHESTRA_BASE_URL=http://localhost:9000
```

### 4. Frontend Setup

```bash
cd frontend
cp .env.example .env   # Fill in Supabase public keys + API URL
```

**Required `.env` variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=http://localhost:8888/api/v1
```

### 5. Run with Docker

```bash
# From project root
docker compose up -d

# Backend:  http://localhost:8888
# Frontend: http://localhost:4000
# API Docs: http://localhost:8888/docs
```

### 6. Seed Demo Data (Optional)

```bash
docker compose exec backend python seed.py

# To clean and re-seed:
docker compose exec backend python seed.py --clean
```

---

## 🎭 Demo Walkthrough

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Organizer | `organizer@juryline.dev` | `demo123` |
| Judge 1 | `judge1@juryline.dev` | `demo123` |
| Judge 2 | `judge2@juryline.dev` | `demo123` |
| Participant | `p1@juryline.dev` | `demo123` |

### 15-Step Demo Flow

| # | Action | What to Show |
|---|--------|-------------|
| 1 | Open `localhost:4000` | Animated landing page with hero, features, powered-by |
| 2 | Login as organizer | Email/password auth |
| 3 | View organizer dashboard | Event cards with status badges |
| 4 | Open "AI Hackathon 2025" | Tabbed event management |
| 5 | Check Criteria tab | 4 criteria with weights (Innovation 1.5×, Tech 1.2×, etc.) |
| 6 | Check Dashboard tab | Animated stats, judge progress bars, leaderboard |
| 7 | View judge progress | Sam Rivera: 3/5 ✓, Jordan Lee: 2/5 ✓ |
| 8 | View leaderboard | Ranked submissions with expandable score breakdowns |
| 9 | Export CSV | Download results file |
| 10 | Logout → Login as `judge1@juryline.dev` | Judge dashboard with assigned events |
| 11 | Start reviewing | Card-based UI with sliders per criterion |
| 12 | Navigate with keyboard | ← → to move, Ctrl+Enter to submit review |
| 13 | Complete remaining 2 reviews | Auto-advance between submissions |
| 14 | Switch back to organizer | Updated progress bars + leaderboard scores |
| 15 | Open bias report | Judge scoring analysis in modal |

---

## 📁 Project Structure

```
juryline/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app + router registration
│   │   ├── config.py            # Pydantic settings
│   │   ├── supabase_client.py   # Supabase service client
│   │   ├── r2_client.py         # Cloudflare R2 (S3) client
│   │   ├── models/              # Pydantic request/response models
│   │   ├── routers/             # API route handlers
│   │   │   ├── auth.py          # Login, register, verify
│   │   │   ├── events.py        # CRUD events
│   │   │   ├── form_fields.py   # Dynamic form management
│   │   │   ├── criteria.py      # Scoring criteria
│   │   │   ├── judges.py        # Invite, assign, manage
│   │   │   ├── submissions.py   # Submit + list entries
│   │   │   ├── uploads.py       # Presigned URL generation
│   │   │   ├── reviews.py       # Judge scoring
│   │   │   ├── dashboard.py     # Leaderboard, stats, export
│   │   │   └── archestra.py     # AI orchestration
│   │   ├── services/            # Business logic
│   │   └── utils/               # Auth dependencies
│   ├── seed.py                  # Demo data seeder
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js pages
│   │   │   ├── page.tsx         # Landing page
│   │   │   ├── dashboard/       # Role-based dashboard
│   │   │   ├── events/          # Event management
│   │   │   ├── submit/          # Submission form
│   │   │   └── review/          # Judge card review UI
│   │   ├── components/          # Reusable UI components
│   │   ├── hooks/               # useAuth hook
│   │   ├── lib/                 # API client, types, Supabase
│   │   └── theme/               # Chakra UI theme config
│   ├── package.json
│   └── Dockerfile
├── db/migrations/               # SQL schema files
├── project-plan/                # Phase-by-phase specs
└── docker-compose.yml
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/register` | Register new user |
| `POST` | `/api/v1/auth/login` | Login with email/password |
| `GET` | `/api/v1/events` | List events |
| `POST` | `/api/v1/events` | Create event |
| `GET` | `/api/v1/events/:id/form-fields` | Get form fields |
| `POST` | `/api/v1/events/:id/form-fields` | Add form field |
| `GET` | `/api/v1/events/:id/criteria` | Get criteria |
| `POST` | `/api/v1/events/:id/criteria` | Add criterion |
| `POST` | `/api/v1/events/:id/judges/invite` | Invite judge |
| `POST` | `/api/v1/events/:id/submissions` | Submit entry |
| `POST` | `/api/v1/submissions/:id/reviews` | Submit review |
| `GET` | `/api/v1/events/:id/dashboard` | Full dashboard data |
| `GET` | `/api/v1/events/:id/leaderboard` | Ranked leaderboard |
| `GET` | `/api/v1/events/:id/judge-progress` | Judge completion stats |
| `GET` | `/api/v1/events/:id/bias-report` | Scoring bias analysis |
| `GET` | `/api/v1/events/:id/export` | CSV export |

Full Swagger docs available at `http://localhost:8888/docs`

---

## 🧪 Development

### Run without Docker

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8888
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev -- --port 4000
```

### Archestra Setup (Optional)

For AI-powered features, run Archestra locally:
```bash
docker run -p 9000:9000 -p 3001:3000 \
  -e ARCHESTRA_QUICKSTART=true \
  archestra/platform:latest
```
Then configure agents via `localhost:3001`. See `project-plan/06-archestra_integration.md` for details.

---

## � Production Deployment

Juryline is production-ready with support for:
- **Backend**: Heroku, Docker, or any Python hosting
- **Frontend**: Vercel, Netlify, or any Node.js hosting

### Quick Deploy Commands

**Heroku (Backend):**
```bash
cd backend
heroku create your-app-name
heroku config:set APP_ENV=production
# ... set other env vars
git push heroku main
```

**Vercel (Frontend):**
```bash
cd frontend
vercel --prod
```

**Docker (Self-hosted):**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Documentation

- **📘 [Production Deployment Guide](docs/PRODUCTION_DEPLOYMENT.md)** - Complete deployment walkthrough
- **⚡ [Quick Deploy Reference](docs/QUICK_DEPLOY.md)** - Cheat sheet with commands
- **✅ [Production Checklist](docs/PRODUCTION_CHECKLIST.md)** - Pre-launch verification
- **📦 [Production Improvements](docs/PRODUCTION_IMPROVEMENTS.md)** - What's been optimized

---

## �📝 License

Built for hackathon demonstration purposes.
