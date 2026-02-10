# 🏛️ Juryline — Master Project Plan

## Project Overview

**Juryline** is a hackathon judging platform that enables organizers to create events with custom judging criteria, participants to submit projects (with video/image uploads), and judges to review submissions in a focused card-based flow. Archestra.ai orchestrates all judging workflows.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16.1.1 (App Router, Vite) + TypeScript |
| **UI Library** | Chakra UI v3 + Framer Motion animations |
| **Auth** | Supabase Auth (email verification, magic links, OAuth) |
| **Database** | Supabase PostgreSQL (with Row Level Security) |
| **File Storage** | Cloudflare R2 (10GB free tier — demo videos + images) |
| **Backend API** | FastAPI (Python 3.11+) — business logic + Archestra integration |
| **Orchestration** | Archestra.ai (A2A agents via JSON-RPC 2.0) |
| **Deployment** | Vercel (frontend) + Render/Railway (backend) |

## Why This Stack?

- **Supabase Auth**: No custom JWT/password hashing — built-in email verification, magic links for judges, OAuth. Solves the "heheboy@gmail.com" problem with email confirmation.
- **Cloudflare R2**: Free 10GB/month for demo videos and project images. S3-compatible API.
- **Next.js 16.1.1 + Vite**: Latest Next.js with Vite bundler for blazing-fast HMR.
- **FastAPI remains**: Needed for business logic, Archestra A2A calls, and complex queries.

## Phase Breakdown

| # | Phase | Description | Est. Time |
|---|-------|-------------|-----------|
| 01 | Project Scaffolding & DB | Monorepo, Next.js 16, FastAPI, Supabase schema, R2 setup | ~4 hrs |
| 02 | Auth & User Management | Supabase Auth with email verification, magic links, RBAC | ~2 hrs |
| 03 | Event & Criteria Management | Organizer creates events, defines criteria, invites judges | ~3 hrs |
| 04 | Submission System + File Uploads | Participant form with R2 video/image uploads | ~3 hrs |
| 05 | Judge Card-Based Review UI | Card-based review flow with sliders, keyboard shortcuts | ~4 hrs |
| 06 | Archestra Integration | 5 workflow agents, A2A client, fallbacks | ~5 hrs |
| 07 | Scoring, Leaderboard & Dashboard | Aggregation, weighted totals, analytics dashboard | ~4 hrs |
| 08 | Polish, Export & Demo Data | Landing page, seed data, demo flow, README | ~3 hrs |

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│              Next.js 16.1.1 Frontend (Vite)              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ Organizer│  │  Judge   │  │Participant│               │
│  │  Pages   │  │  Pages   │  │  Pages    │               │
│  └────┬─────┘  └────┬─────┘  └────┬──────┘               │
│       └──────────────┼──────────────┘                      │
│                      │                                     │
│   Supabase Client    │   REST API calls                    │
│   (Auth + Realtime)  │   (Business Logic)                  │
└──────────┬───────────┼─────────────────────────────────────┘
           │           │
    ┌──────▼──────┐    │
    │  Supabase   │    │
    │  ─ Auth     │    │
    │  ─ Postgres │    │
    │  ─ Realtime │    │
    └──────┬──────┘    │
           │           │
┌──────────┼───────────┼─────────────────────────────────────┐
│          │      FastAPI Backend                             │
│  ┌───────▼──────┐  ┌──────────┐  ┌──────────┐             │
│  │  Supabase    │  │  CRUD    │  │ Archestra│             │
│  │  Admin Client│  │  Routes  │  │  Client  │             │
│  └──────────────┘  └──────────┘  └────┬─────┘             │
│                                       │                    │
│  ┌──────────────────┐                 │                    │
│  │ Cloudflare R2    │                 │                    │
│  │ (File Uploads)   │                 │                    │
│  └──────────────────┘                 │                    │
└───────────────────────────────────────┼────────────────────┘
                                        │ A2A (JSON-RPC 2.0)
┌───────────────────────────────────────┼────────────────────┐
│                Archestra.ai Platform                       │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐             │
│  │ Submission │ │   Judge    │ │  Review    │             │
│  │ Ingestion  │ │ Assignment │ │  Progress  │             │
│  └────────────┘ └────────────┘ └────────────┘             │
│  ┌────────────┐ ┌────────────┐                            │
│  │   Score    │ │  Feedback  │                            │
│  │ Aggregation│ │  Summary   │                            │
│  └────────────┘ └────────────┘                            │
└────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

1. **Supabase for Auth + DB**: Email verification built-in, magic links for judges, RLS for security, zero custom auth code
2. **Cloudflare R2**: S3-compatible, free 10GB/month, presigned URLs for direct browser uploads
3. **FastAPI as middleware**: Handles business logic, Archestra A2A calls, R2 presigned URL generation
4. **Chakra UI + Framer Motion**: Light theme, animated everything, modern aesthetic
5. **Monorepo**: `frontend/` + `backend/` in one repo for hackathon simplicity
