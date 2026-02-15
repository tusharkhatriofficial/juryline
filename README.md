# Juryline
<img width="1416" height="728" alt="Screenshot 2026-02-15 at 7 27 28 PM" src="https://github.com/user-attachments/assets/ef921e5f-bf72-483b-a552-d07281701541" />

**The AI-Native Hackathon Judging Platform**

Juryline is a modern, production-grade platform designed to fix the broken hackathon judging process. It replaces spreadsheets and manual entry with a streamlined, AI-orchestrated workflow that handles everything from submission ingestion to final leaderboards.

> **Live Demo:** [juryline.vercel.app](https://juryline.vercel.app)

---

## Key Features

- **Dynamic Form Builder**: Create custom submission forms (Text, URL, File Upload, etc.) instantly.
- **AI-Powered Orchestration**: Powered by **Archestra**, a swarm of 5 specialized agents:
  - **Ingest Agent**: Validates submission metadata for spam/quality.
  - **Assignment Agent**: Intelligently balances judging load across available reviewers.
  - **Progress Agent**: Tracks judging velocity and identifies bottlenecks.
  - **Aggregation Agent**: Calculates final weighted scores for unbiased rankings.
  - **Feedback Agent**: Synthesizes scores into constructive feedback for hackers.
- **Magic Link Auth**: Passwordless, secure login for judges (via Supabase Auth).
- **R2 Storage Integration**: Fast, scalable asset storage for submission videos and banners.
- **Real-time Leaderboard**: Instant, auto-calculating results dashboard.

---

## Architecture

Built for scale and reliability:

- **Frontend**: Next.js 14, TypeScript, Chakra UI, Framer Motion
- **Backend**: Python 3.12, FastAPI, Pydantic
- **Database**: PostgreSQL (Supabase) with Row Level Security (RLS)
- **AI Runtime**: Self-hosted Archestra Agent Swarm (JSON-RPC 2.0 A2A Protocol)
- **Storage**: Cloudflare R2 (S3-compatible)

---

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Supabase Project
- Cloudflare R2 Bucket (Optional, for uploads)
- Archestra API Key (Optional, for AI features)

### 1. Clone & Setup

```bash
git clone https://github.com/tusharkhatri/juryline.git
cd juryline
```

### 2. Environment Configuration

Create a `.env` file in the `backend/` directory:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key  # For backend admin access
SUPABASE_JWT_SECRET=your-jwt-secret          # For token verification

# Cloudflare R2 (File Storage)
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_URL=https://your-r2-public-domain.com

# Archestra AI (Self-Hosted)
ARCHESTRA_API_KEY=your-archestra-key
ARCHESTRA_BASE_URL=https://baserul.com
# Agent Prompt IDs (if running own swarm)
ARCHESTRA_INGEST_PROMPT_ID=...
ARCHESTRA_ASSIGN_PROMPT_ID=...
```

### 3. Run with Docker

Launch the full stack (Frontend + Backend):

```bash
docker compose up -d --build
```

- **Frontend:** `http://localhost:4000`
- **Backend:** `http://localhost:8888`
- **API Docs:** `http://localhost:8888/docs`

### 4. Database Seeding

Populate the database with a production-grade demo dataset (Events, Submissions, Videos, Reviews):

```bash
db/seed.py
```

This script will:
1. Clear existing data (safely).
2. Create an "Organizer" and multiple "Judges".
3. Create a live event ("Global AI Hackathon 2026").
4. Submit 20+ realistic projects with video links.
5. Simulate judge activity to populate the leaderboard.

---

## Deployment

The project is containerized and ready for deployment.

- **Backend**: Deploy the `backend/Dockerfile` to any container runtime (DigitalOcean App Platform, Fly.io, Railway, AWS ECS).
- **Frontend**: Deploy `frontend/` to Vercel or Netlify.
- **Archestra**: The AI agents run on a dedicated DigitalOcean Droplet for high-performance inference.

---

## License

MIT License. Built with ❤️ by Tushar Khatri.
