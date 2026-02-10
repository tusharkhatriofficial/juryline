# Phase 01 — Project Scaffolding, Supabase DB & Cloudflare R2

## Goal
Set up monorepo (`frontend/` + `backend/`), initialize Next.js 16.1.1 + Chakra UI, FastAPI + Supabase, create database schema via Supabase SQL, and configure Cloudflare R2 for file storage.

---

## Step 1: Backend Scaffolding (FastAPI)

### 1.1 Directory structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app, CORS, lifespan
│   ├── config.py               # Pydantic Settings (env vars)
│   ├── supabase_client.py      # Supabase admin client init
│   ├── r2_client.py            # Cloudflare R2 (boto3 S3-compatible)
│   ├── models/                 # Pydantic models (not ORM — Supabase handles DB)
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── event.py
│   │   ├── criteria.py
│   │   ├── submission.py
│   │   └── review.py
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py             # Auth helpers (verify Supabase JWT)
│   │   ├── events.py
│   │   ├── criteria.py
│   │   ├── submissions.py
│   │   ├── reviews.py
│   │   ├── judges.py
│   │   ├── uploads.py          # R2 presigned URL generation
│   │   └── archestra.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── event_service.py
│   │   ├── submission_service.py
│   │   ├── review_service.py
│   │   └── archestra_service.py
│   └── utils/
│       ├── __init__.py
│       └── dependencies.py     # get_current_user (from Supabase JWT)
├── supabase/
│   └── schema.sql              # Full DB schema (run in Supabase SQL editor)
├── requirements.txt
├── .env.example
└── Dockerfile
```

### 1.2 Key files

#### `backend/app/config.py`
```python
class Settings(BaseSettings):
    # Supabase
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str      # Admin/service role key (backend only)
    SUPABASE_JWT_SECRET: str       # To verify JWTs from frontend
    
    # Cloudflare R2
    R2_ACCOUNT_ID: str
    R2_ACCESS_KEY_ID: str
    R2_SECRET_ACCESS_KEY: str
    R2_BUCKET_NAME: str = "juryline-uploads"
    R2_PUBLIC_URL: str             # Public bucket URL for serving files
    
    # Archestra
    ARCHESTRA_BASE_URL: str = "http://localhost:9000"
    ARCHESTRA_API_KEY: str
    ARCHESTRA_INGEST_PROMPT_ID: str
    ARCHESTRA_ASSIGN_PROMPT_ID: str
    ARCHESTRA_PROGRESS_PROMPT_ID: str
    ARCHESTRA_AGGREGATE_PROMPT_ID: str
    ARCHESTRA_FEEDBACK_PROMPT_ID: str
    
    # App
    FRONTEND_URL: str = "http://localhost:3000"
```

#### `backend/app/supabase_client.py`
```python
from supabase import create_client
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
```

#### `backend/app/r2_client.py`
```python
import boto3
r2 = boto3.client(
    "s3",
    endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
    aws_access_key_id=settings.R2_ACCESS_KEY_ID,
    aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
    region_name="auto",
)
```

#### `backend/requirements.txt`
```
fastapi[standard]>=0.115.0
uvicorn[standard]>=0.30.0
supabase>=2.0.0
python-jose[cryptography]>=3.3.0
httpx>=0.27.0
boto3>=1.35.0
python-multipart>=0.0.9
pydantic>=2.0.0
pydantic-settings>=2.0.0
```

---

## Step 2: Supabase Database Schema

### 2.1 Create Supabase project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Note: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
3. Enable email confirmations: Auth → Settings → Enable email confirmations

### 2.2 SQL Schema (`backend/supabase/schema.sql`)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('organizer', 'judge', 'participant')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id UUID NOT NULL REFERENCES profiles(id),
    name TEXT NOT NULL,
    description TEXT,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'judging', 'closed')),
    judges_per_submission INT NOT NULL DEFAULT 2,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Form Fields (Google Forms-style dynamic fields per event)
-- Organizers can create ANY field type they want
CREATE TABLE form_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    label TEXT NOT NULL,                  -- "Project Name", "Demo Video", "Team Size"
    field_type TEXT NOT NULL CHECK (field_type IN (
        'short_text',       -- Single line text
        'long_text',        -- Multi-line textarea
        'number',           -- Numeric input
        'url',              -- URL with validation
        'email',            -- Email with validation
        'dropdown',         -- Select from options
        'multiple_choice',  -- Radio buttons
        'checkboxes',       -- Multi-select checkboxes
        'file_upload',      -- Upload to R2 (images, videos, PDFs)
        'date',             -- Date picker
        'linear_scale'      -- 1-5, 1-10 etc.
    )),
    description TEXT,                     -- Helper text shown below label
    is_required BOOLEAN NOT NULL DEFAULT false,
    options JSONB,                        -- For dropdown/multiple_choice/checkboxes:
                                          -- ["Option A", "Option B", "Option C"]
                                          -- For linear_scale: {"min": 1, "max": 10, "min_label": "Bad", "max_label": "Great"}
                                          -- For file_upload: {"accept": ["image/*", "video/*"], "max_size_mb": 100}
    validation JSONB,                     -- {"min_length": 1, "max_length": 500, "pattern": "regex"}
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criteria (separate from form fields — these are what judges RATE on)
CREATE TABLE criteria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    scale_min INT NOT NULL DEFAULT 0,
    scale_max INT NOT NULL DEFAULT 10,
    weight FLOAT DEFAULT 1.0,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Submissions (dynamic — stores responses to form_fields)
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id),
    participant_id UUID NOT NULL REFERENCES profiles(id),
    form_data JSONB NOT NULL DEFAULT '{}',
    -- form_data structure:
    -- {
    --   "field_id_1": "My Cool Project",          (short_text)
    --   "field_id_2": "Long description...",       (long_text)
    --   "field_id_3": 4,                           (number)
    --   "field_id_4": "https://demo.app",          (url)
    --   "field_id_5": ["https://r2.../vid.mp4"],   (file_upload → R2 URLs)
    --   "field_id_6": "Option B",                  (dropdown/multiple_choice)
    --   "field_id_7": ["A", "C"],                  (checkboxes)
    --   "field_id_8": {"value": 8}                 (linear_scale)
    -- }
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'in_review', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, participant_id)  -- One submission per participant per event
);

-- Event Judges (invitations)
CREATE TABLE event_judges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    judge_id UUID NOT NULL REFERENCES profiles(id),
    invite_status TEXT NOT NULL DEFAULT 'pending' CHECK (invite_status IN ('pending', 'accepted')),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, judge_id)
);

-- Judge Assignments (which judge reviews which submission)
CREATE TABLE judge_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id),
    judge_id UUID NOT NULL REFERENCES profiles(id),
    submission_id UUID NOT NULL REFERENCES submissions(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(judge_id, submission_id)
);

-- Reviews
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES submissions(id),
    judge_id UUID NOT NULL REFERENCES profiles(id),
    event_id UUID NOT NULL REFERENCES events(id),
    scores JSONB NOT NULL,         -- { "criterion_id": score_value }
    notes TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(submission_id, judge_id)
);

-- Indexes for performance
CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_form_fields_event ON form_fields(event_id);
CREATE INDEX idx_submissions_event ON submissions(event_id);
CREATE INDEX idx_submissions_participant ON submissions(participant_id);
CREATE INDEX idx_judge_assignments_judge ON judge_assignments(judge_id);
CREATE INDEX idx_judge_assignments_event ON judge_assignments(event_id);
CREATE INDEX idx_reviews_submission ON reviews(submission_id);
CREATE INDEX idx_reviews_judge ON reviews(judge_id);
CREATE INDEX idx_reviews_event ON reviews(event_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security (basic — backend uses service key to bypass)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own profile
CREATE POLICY "Users can read own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Allow service role full access (backend uses this)
CREATE POLICY "Service role full access profiles" ON profiles
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access events" ON events
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access submissions" ON submissions
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access reviews" ON reviews
    FOR ALL USING (auth.role() = 'service_role');
```

---

## Step 3: Cloudflare R2 Setup

### 3.1 Create R2 bucket
1. Go to Cloudflare Dashboard → R2 → Create Bucket
2. Name: `juryline-uploads`
3. Location: Auto
4. Enable public access (for serving uploaded files)

### 3.2 Create API token
1. R2 → Manage R2 API Tokens → Create Token
2. Permissions: Object Read & Write
3. Bucket: `juryline-uploads`
4. Save: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`

### 3.3 Upload flow (presigned URLs)
```
Frontend                    Backend (FastAPI)              Cloudflare R2
   │                             │                              │
   │  POST /uploads/presign      │                              │
   │  { filename, contentType }  │                              │
   │ ──────────────────────────▶ │                              │
   │                             │  generate_presigned_url()    │
   │                             │ ────────────────────────────▶│
   │  { uploadUrl, fileKey }     │                              │
   │ ◀────────────────────────── │                              │
   │                             │                              │
   │  PUT uploadUrl (file blob)  │                              │
   │ ────────────────────────────────────────────────────────── ▶│
   │                             │                              │
   │  (save fileKey in submission)                              │
```

---

## Step 4: Frontend Scaffolding (Next.js 16.1.1)

### 4.1 Initialize Next.js
```bash
npx -y create-next-app@16.1.1 frontend --typescript --app --eslint --no-tailwind --src-dir --import-alias "@/*"
```

### 4.2 Install dependencies
```bash
cd frontend
npm install @chakra-ui/react @emotion/react @emotion/styled framer-motion
npm install @chakra-ui/icons react-icons
npm install @supabase/supabase-js @supabase/ssr
npm install axios date-fns
```

### 4.3 Directory structure
```
frontend/src/
├── app/
│   ├── layout.tsx              # Root layout + providers
│   ├── page.tsx                # Landing page
│   ├── providers.tsx           # ChakraProvider + Supabase + theme
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── verify-email/page.tsx      # "Check your email!" page
│   │   ├── auth/callback/route.ts     # Supabase auth callback
│   │   └── magic-link/[token]/page.tsx
│   ├── (organizer)/
│   │   ├── dashboard/page.tsx
│   │   └── events/[eventId]/
│   │       ├── page.tsx
│   │       ├── criteria/page.tsx
│   │       ├── judges/page.tsx
│   │       └── leaderboard/page.tsx
│   ├── (participant)/
│   │   └── submit/[eventId]/page.tsx
│   └── (judge)/
│       └── review/[eventId]/page.tsx
├── components/
│   ├── layout/ (Navbar, Sidebar, Footer)
│   ├── common/ (AnimatedCard, MotionBox, FileUploader)
│   ├── organizer/
│   ├── judge/
│   └── participant/
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser Supabase client
│   │   └── server.ts           # Server-side Supabase client
│   ├── api.ts                  # Axios client for FastAPI
│   └── types.ts                # TypeScript interfaces
├── theme/
│   └── index.ts                # Chakra theme (light, brand colors)
└── hooks/
    ├── useAuth.ts              # Supabase auth hook
    └── useApi.ts
```

### 4.4 Supabase Client Setup

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### 4.5 Chakra Theme (light, modern, vibrant)
```typescript
const theme = extendTheme({
  config: { initialColorMode: "light", useSystemColorMode: false },
  colors: {
    brand: {
      50: "#E8F5FE", 100: "#B8E2FC", 200: "#88CFF9",
      300: "#58BCF7", 400: "#28A9F5", 500: "#0891DB",
      600: "#0673AE", 700: "#045681", 800: "#023854", 900: "#011B27",
    },
    accent: { 500: "#7C3AED" },
  },
  fonts: { heading: "'Inter', sans-serif", body: "'Inter', sans-serif" },
  styles: { global: { body: { bg: "gray.50", color: "gray.800" } } },
});
```

---

## Step 5: Docker Compose (Local Dev)

```yaml
services:
  backend:
    build: ./backend
    ports: ["8000:8000"]
    env_file: ./backend/.env
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    volumes: [./backend:/app]

  archestra:
    image: archestra/platform:latest
    ports: ["9000:9000", "3001:3000"]
    environment:
      ARCHESTRA_QUICKSTART: "true"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - archestra-postgres-data:/var/lib/postgresql/data
      - archestra-app-data:/app/data

volumes:
  archestra-postgres-data:
  archestra-app-data:
```

> **Note**: PostgreSQL is NOT in Docker — it's hosted by Supabase (cloud). R2 is Cloudflare (cloud). Only backend + Archestra run locally.

---

## Verification Checklist

- [ ] `backend/` runs → `GET /health` returns `{"status": "ok"}`
- [ ] Supabase client connects → can query `profiles` table
- [ ] R2 client connects → can generate presigned URLs
- [ ] Frontend runs with `npm run dev` → Chakra themed page renders
- [ ] CORS allows frontend ↔ backend communication
- [ ] Supabase schema applied → all 8 tables exist (including `form_fields`)
