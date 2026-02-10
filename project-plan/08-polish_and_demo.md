# Phase 08 — Polish, Seed Data, Demo Flow & Landing Page

## Goal
Final polish: stunning landing page, seed demo data (via Supabase), complete demo flow, README, and ensure everything is hackathon-demo-ready.

---

## Step 1: Landing Page (`/`)

### 1.1 Hero Design

```
┌────────────────────────────────────────────────────────────┐
│  🏛️ Juryline               [Login]  [Get Started →]        │
├────────────────────────────────────────────────────────────┤
│                                                             │
│     Hackathon Judging,                                     │
│     Reimagined. ✨                                          │
│                                                             │
│     AI-powered judging that makes hackathon                │
│     evaluation fast, fair, and fun.                        │
│                                                             │
│             [Create Your Event →]                          │
│                                                             │
│  ── Feature Cards ────────────────────────────────         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │ 🃏 Card  │  │ 📊 Live  │  │ 🤖 AI    │                 │
│  │  Based   │  │  Leader- │  │  Powered  │                 │
│  │  Review  │  │  board   │  │  Workflow │                 │
│  └──────────┘  └──────────┘  └──────────┘                 │
│                                                             │
│  ── How It Works ────────────────────────────────          │
│  1. Create Event → 2. Collect Submissions →               │
│  3. AI Assigns Judges → 4. Card Review →                  │
│  5. Instant Leaderboard 🏆                                │
│                                                             │
│  ── Powered By ──────────────────────────────────          │
│  [Archestra Logo] [Supabase Logo] [Cloudflare Logo]       │
│                                                             │
│  Built with ❤️ Archestra.ai                                │
└────────────────────────────────────────────────────────────┘
```

### 1.2 Landing Page Animations
- **Hero text**: Word-by-word fade-in with slight upward motion
- **Feature cards**: Staggered entrance from bottom, scale-on-hover with shadow
- **How It Works**: Step-by-step reveal as user scrolls (Intersection Observer)
- **Background**: Subtle animated gradient (brand colors)
- **CTA button**: Shimmer effect on hover, scale on press

### 1.3 Responsive
- Mobile: single-column, hamburger nav
- Tablet: 2-column features
- Desktop: full layout

---

## Step 2: Seed Data Script

### 2.1 `backend/seed.py`

```python
"""
Seeds demo data into Supabase for hackathon demonstration.
Creates: 1 event, 4 criteria, 1 organizer, 2 judges, 3 participants, 5 submissions, partial reviews.
"""

async def seed_demo_data():
    # 1. Create users via Supabase Auth Admin
    organizer = supabase.auth.admin.create_user({
        "email": "organizer@juryline.dev",
        "password": "demo123",
        "email_confirm": True,  # Skip email verification for demo
        "user_metadata": {"name": "Alex Morgan", "role": "organizer"}
    })
    
    judge1 = supabase.auth.admin.create_user({
        "email": "judge1@juryline.dev",
        "password": "demo123",
        "email_confirm": True,
        "user_metadata": {"name": "Sam Rivera", "role": "judge"}
    })
    
    judge2 = supabase.auth.admin.create_user({
        "email": "judge2@juryline.dev",
        "password": "demo123",
        "email_confirm": True,
        "user_metadata": {"name": "Jordan Lee", "role": "judge"}
    })
    
    # Participants...
    
    # 2. Create Event
    event = supabase.table("events").insert({
        "organizer_id": organizer.user.id,
        "name": "AI Hackathon 2025",
        "description": "Build innovative AI-powered solutions that change the world!",
        "start_at": "2025-02-10T00:00:00Z",
        "end_at": "2025-02-15T00:00:00Z",
        "status": "judging",
        "judges_per_submission": 2
    }).execute()
    
    # 3. Create 4 Criteria
    criteria = [
        {"event_id": event.data[0]["id"], "name": "Innovation", "weight": 1.5, "sort_order": 0},
        {"event_id": event.data[0]["id"], "name": "Technical Execution", "weight": 1.2, "sort_order": 1},
        {"event_id": event.data[0]["id"], "name": "Design & UX", "weight": 1.0, "sort_order": 2},
        {"event_id": event.data[0]["id"], "name": "Impact & Feasibility", "weight": 1.3, "sort_order": 3},
    ]
    supabase.table("criteria").insert(criteria).execute()
    
    # 4. Create 5 Submissions
    submissions = [
        {
            "event_id": event_id, "participant_id": p1_id,
            "project_name": "AI Recipe Generator",
            "team_name": "ByteCooks",
            "description": "An AI-powered platform that generates personalized recipes based on available ingredients, dietary preferences, and cooking skill level.",
            "demo_url": "https://ai-recipe-gen.demo.app",
            "repo_url": "https://github.com/bytecooks/ai-recipe-gen",
            "status": "in_review"
        },
        # ... 4 more submissions with varied quality
    ]
    
    # 5. Create event_judges + judge_assignments
    # 6. Create partial reviews (judge1 reviewed 3/5, judge2 reviewed 2/5)
    #    → Leaves room to demo the judging flow live
```

### 2.2 Run seed
```bash
cd backend && python seed.py
```

---

## Step 3: Demo Flow

### 3.1 15-Step Demo Walkthrough

| # | Action | What to Show |
|---|--------|-------------|
| 1 | Open landing page | Animated hero, features, powered-by logos |
| 2 | Login as organizer | Supabase Auth, verified email indicator |
| 3 | View dashboard | Stats cards, judge progress, partial leaderboard |
| 4 | Show criteria page | 4 criteria with weights |
| 5 | Show judge progress | 2 judges with partial completion |
| 6 | Show leaderboard | Ranked submissions with expandable scores |
| 7 | Export CSV | Download results file |
| 8 | Trigger Archestra aggregation | "Archestra Refresh" → AI-powered scoring |
| 9 | Login as judge1 | Magic link or password login |
| 10 | Review a submission card | Slider ratings, video player, notes |
| 11 | Navigate with keyboard (← → Ctrl+Enter) | Smooth card transitions |
| 12 | Complete remaining reviews | Auto-advance + completion celebration |
| 13 | Switch to organizer view | Updated progress bars + leaderboard |
| 14 | Show bias report | Judge scoring analysis |
| 15 | Show AI feedback summary | Archestra-generated team feedback |

### 3.2 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Organizer | organizer@juryline.dev | demo123 |
| Judge 1 | judge1@juryline.dev | demo123 |
| Judge 2 | judge2@juryline.dev | demo123 |
| Participant | p1@juryline.dev | demo123 |

---

## Step 4: Final Polish

### 4.1 Toast Notifications
- Chakra `useToast()` everywhere: success (green), error (red), info (blue)
- Consistent position (top-right)
- Animated entrance/exit

### 4.2 Loading States
- Skeleton screens for data-loading pages
- Branded loading spinner with Juryline icon
- Progressive loading for lists

### 4.3 Empty States
- No events: illustration + "Create your first event" CTA
- No submissions: "Waiting for submissions..." + countdown
- No reviews: "Start reviewing!" with arrow pointing to first card

### 4.4 Error Handling
- API errors: toast + retry button
- Network offline: banner at top
- 404: animated "lost" illustration

### 4.5 Accessibility
- Focus management for keyboard navigation
- ARIA labels on interactive elements
- Sufficient contrast ratios

---

## Step 5: README.md

```markdown
# 🏛️ Juryline — AI-Powered Hackathon Judging Platform

## Tech Stack
- **Frontend**: Next.js 16.1.1 + TypeScript + Chakra UI
- **Backend**: FastAPI + Supabase + Cloudflare R2
- **Orchestration**: Archestra.ai (A2A protocol)

## Quick Start

### Prerequisites
Node.js 20+, Python 3.11+, Docker

### 1. Supabase
- Create project at supabase.com
- Run schema.sql in SQL editor
- Copy URL + keys to .env files

### 2. Cloudflare R2
- Create bucket "juryline-uploads"
- Create API token → save to .env

### 3. Backend
cd backend
pip install -r requirements.txt
cp .env.example .env  # Fill in Supabase + R2 + Archestra values
python seed.py
uvicorn app.main:app --reload

### 4. Frontend
cd frontend
npm install
cp .env.example .env.local  # Fill in Supabase + API URL
npm run dev

### 5. Archestra
docker run -p 9000:9000 -p 3001:3000 \
  -e ARCHESTRA_QUICKSTART=true \
  archestra/platform:latest
# Create agents via localhost:3001 (see project-plan/06)

## Demo
Login as organizer@juryline.dev / demo123
(See project-plan/08 for full 15-step demo flow)

## API Docs
http://localhost:8000/docs (Swagger UI)
```

---

## Verification Checklist (End-to-End)

- [ ] Landing page renders with all animations
- [ ] Seed data populates all tables correctly
- [ ] Demo users can log in (email verified via admin API)
- [ ] Full 15-step demo flow works end-to-end
- [ ] File uploads to R2 work (video + images accessible)
- [ ] Judge card-based review flow is smooth
- [ ] Leaderboard updates after new reviews
- [ ] CSV export downloads valid file
- [ ] Archestra agents respond to A2A calls
- [ ] All pages responsive (mobile + desktop)
- [ ] No console errors, no 500 errors
- [ ] README provides complete setup instructions
