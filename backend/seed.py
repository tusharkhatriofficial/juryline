"""
Juryline — Demo Seed Data
Seeds demo data into Supabase for hackathon demonstration.

Creates:
  - 1 organizer, 2 judges, 3 participants (via Supabase Auth Admin)
  - 1 event ("AI Hackathon 2025") in "judging" status
  - 6 form fields (project_name, team_name, description, demo_url, repo_url, pitch_video)
  - 4 criteria (Innovation, Technical Execution, Design & UX, Impact & Feasibility)
  - 5 submissions with realistic project data
  - Judge invitations + assignments
  - Partial reviews (judge1: 3/5, judge2: 2/5) — leaves room for live demo

Usage:
  cd backend
  python seed.py           # seed demo data
  python seed.py --clean   # remove all demo data first, then re-seed
"""

import os
import sys
import json
import random
import asyncio
from datetime import datetime, timezone, timedelta

# Load .env
from dotenv import load_dotenv
load_dotenv()

from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# ── Demo Users ──
DEMO_USERS = [
    {"email": "organizer@juryline.dev", "name": "Alex Morgan", "role": "organizer"},
    {"email": "judge1@juryline.dev", "name": "Sam Rivera", "role": "judge"},
    {"email": "judge2@juryline.dev", "name": "Jordan Lee", "role": "judge"},
    {"email": "p1@juryline.dev", "name": "Casey Chen", "role": "participant"},
    {"email": "p2@juryline.dev", "name": "Riley Patel", "role": "participant"},
    {"email": "p3@juryline.dev", "name": "Morgan Brooks", "role": "participant"},
]

# ── Demo Submissions ──
DEMO_SUBMISSIONS = [
    {
        "project_name": "AI Recipe Generator",
        "team_name": "ByteCooks",
        "description": "An AI-powered platform that generates personalized recipes based on available ingredients, dietary preferences, and cooking skill level. Uses GPT-4 for creative recipe suggestions and DALL-E for plating visualizations.",
        "demo_url": "https://ai-recipe-gen.demo.app",
        "repo_url": "https://github.com/bytecooks/ai-recipe-gen",
    },
    {
        "project_name": "EcoTrack",
        "team_name": "GreenByte",
        "description": "A carbon footprint tracker that uses computer vision to scan grocery receipts and calculate the environmental impact of purchases. Provides actionable suggestions to reduce carbon output.",
        "demo_url": "https://ecotrack.demo.app",
        "repo_url": "https://github.com/greenbyte/ecotrack",
    },
    {
        "project_name": "StudyBuddy AI",
        "team_name": "NeuralNotes",
        "description": "An intelligent study companion that generates flashcards, practice quizzes, and mind maps from uploaded lecture notes and textbook PDFs using RAG and GPT-4.",
        "demo_url": "https://studybuddy.demo.app",
        "repo_url": "https://github.com/neuralnotes/studybuddy-ai",
    },
    {
        "project_name": "MediScan",
        "team_name": "HealthHack",
        "description": "A mobile app that uses AI to analyze skin conditions from photos, providing preliminary assessments and connecting users with dermatologists. Built with TensorFlow and React Native.",
        "demo_url": "https://mediscan.demo.app",
        "repo_url": "https://github.com/healthhack/mediscan",
    },
    {
        "project_name": "CodeReview Bot",
        "team_name": "DevOps Wizards",
        "description": "An automated code review assistant that integrates with GitHub PRs to provide actionable feedback on code quality, security vulnerabilities, and performance optimizations using fine-tuned LLMs.",
        "demo_url": "https://codereview-bot.demo.app",
        "repo_url": "https://github.com/devopswizards/codereview-bot",
    },
]

# ── Demo Criteria ──
DEMO_CRITERIA = [
    {"name": "Innovation", "weight": 1.5, "sort_order": 0},
    {"name": "Technical Execution", "weight": 1.2, "sort_order": 1},
    {"name": "Design & UX", "weight": 1.0, "sort_order": 2},
    {"name": "Impact & Feasibility", "weight": 1.3, "sort_order": 3},
]

# ── Demo Form Fields ──
DEMO_FORM_FIELDS = [
    {"label": "Project Name", "field_type": "short_text", "is_required": True, "sort_order": 0, "description": "What is your project called?"},
    {"label": "Team Name", "field_type": "short_text", "is_required": True, "sort_order": 1, "description": "Your team name"},
    {"label": "Project Description", "field_type": "long_text", "is_required": True, "sort_order": 2, "description": "Describe your project in detail (500 words max)"},
    {"label": "Demo URL", "field_type": "url", "is_required": False, "sort_order": 3, "description": "Link to your live demo or prototype"},
    {"label": "Repository URL", "field_type": "url", "is_required": True, "sort_order": 4, "description": "Link to your source code repository"},
    {"label": "Pitch Video URL", "field_type": "url", "is_required": False, "sort_order": 5, "description": "Link to your 3-minute pitch video (YouTube, Loom, etc.)"},
]


def clean_demo_data():
    """Remove all demo data (users & cascaded records)."""
    print("\n🧹 Cleaning existing demo data...")

    for user_info in DEMO_USERS:
        # Find user by email
        try:
            users_resp = supabase.auth.admin.list_users()
            for u in users_resp:
                # users_resp may be a list or have .users attribute
                user_list = u if isinstance(u, list) else [u]
                for user in user_list:
                    if hasattr(user, 'email') and user.email == user_info["email"]:
                        uid = user.id
                        # Delete related data first (cascade may not always apply via API)
                        try:
                            supabase.table("reviews").delete().eq("judge_id", uid).execute()
                        except:
                            pass
                        try:
                            supabase.table("judge_assignments").delete().eq("judge_id", uid).execute()
                        except:
                            pass
                        try:
                            supabase.table("event_judges").delete().eq("judge_id", uid).execute()
                        except:
                            pass
                        try:
                            supabase.table("submissions").delete().eq("participant_id", uid).execute()
                        except:
                            pass
                        try:
                            supabase.table("events").delete().eq("organizer_id", uid).execute()
                        except:
                            pass
                        try:
                            supabase.table("profiles").delete().eq("id", uid).execute()
                        except:
                            pass
                        try:
                            supabase.auth.admin.delete_user(uid)
                        except:
                            pass
                        print(f"  🗑️  Removed {user_info['email']} ({uid})")
        except Exception as e:
            print(f"  ⚠️  Error cleaning {user_info['email']}: {e}")

    print("✅ Cleanup complete\n")


def create_demo_user(email: str, name: str, role: str) -> str:
    """Create a demo user via Supabase Auth Admin API, return user ID."""
    try:
        resp = supabase.auth.admin.create_user({
            "email": email,
            "password": "demo123",
            "email_confirm": True,
            "user_metadata": {"name": name, "role": role}
        })
        uid = resp.user.id
        print(f"  ✅ Created user: {name} ({email}) → {uid}")
        return uid
    except Exception as e:
        # User might already exist — try to find them
        err_str = str(e)
        if "already" in err_str.lower() or "duplicate" in err_str.lower():
            # Look up existing user
            users_resp = supabase.auth.admin.list_users()
            for item in users_resp:
                user_list = item if isinstance(item, list) else [item]
                for user in user_list:
                    if hasattr(user, 'email') and user.email == email:
                        print(f"  ♻️  User exists: {name} ({email}) → {user.id}")
                        return user.id
        raise Exception(f"Failed to create {email}: {e}")


def seed():
    """Main seed function."""
    print("🌱 Seeding Juryline Demo Data...")
    print("=" * 50)

    # ── 1. Create Users ──
    print("\n📋 Creating demo users...")
    user_ids = {}
    for user_info in DEMO_USERS:
        uid = create_demo_user(user_info["email"], user_info["name"], user_info["role"])
        user_ids[user_info["email"]] = uid

    organizer_id = user_ids["organizer@juryline.dev"]
    judge1_id = user_ids["judge1@juryline.dev"]
    judge2_id = user_ids["judge2@juryline.dev"]
    p1_id = user_ids["p1@juryline.dev"]
    p2_id = user_ids["p2@juryline.dev"]
    p3_id = user_ids["p3@juryline.dev"]

    # ── 2. Ensure profiles exist ──
    print("\n👤 Ensuring profiles...")
    for user_info in DEMO_USERS:
        uid = user_ids[user_info["email"]]
        try:
            supabase.table("profiles").upsert({
                "id": uid,
                "email": user_info["email"],
                "name": user_info["name"],
                "role": user_info["role"],
            }).execute()
        except Exception as e:
            print(f"  ⚠️  Profile upsert for {user_info['email']}: {e}")

    # ── 3. Create Event ──
    print("\n🎯 Creating event: AI Hackathon 2025...")
    now = datetime.now(timezone.utc)
    event_resp = supabase.table("events").insert({
        "organizer_id": organizer_id,
        "name": "AI Hackathon 2025",
        "description": "Build innovative AI-powered solutions that change the world! 48 hours to ideate, build, and pitch your project. Open to all skill levels.",
        "start_at": (now - timedelta(days=5)).isoformat(),
        "end_at": (now - timedelta(days=2)).isoformat(),
        "status": "judging",
        "judges_per_submission": 2,
    }).execute()
    event_id = event_resp.data[0]["id"]
    print(f"  ✅ Event created: {event_id}")

    # ── 4. Create Form Fields ──
    print("\n📝 Creating form fields...")
    for field in DEMO_FORM_FIELDS:
        field["event_id"] = event_id
    ff_resp = supabase.table("form_fields").insert(DEMO_FORM_FIELDS).execute()
    # Build a label→id mapping so submissions use UUIDs as keys
    field_id_map = {f["label"]: f["id"] for f in ff_resp.data}
    print(f"  ✅ {len(ff_resp.data)} form fields created")

    # ── 5. Create Criteria ──
    print("\n⚖️ Creating criteria...")
    criteria_list = []
    for c in DEMO_CRITERIA:
        criteria_list.append({**c, "event_id": event_id})
    crit_resp = supabase.table("criteria").insert(criteria_list).execute()
    criteria_ids = [c["id"] for c in crit_resp.data]
    print(f"  ✅ {len(criteria_ids)} criteria created")

    # ── 6. Create Submissions ──
    print("\n📦 Creating submissions...")
    participant_ids = [p1_id, p2_id, p3_id, p1_id, p2_id]
    # Split 5 submissions across 3 participants (p1 gets 2, p2 gets 2, p3 gets 1)
    # Actually use unique participant per submission — we have 5 submissions but only 3 participants
    # Let's just use 3 unique submissions (one per participant) and add 2 more with p1 email variations
    # Actually the schema has UNIQUE(event_id, participant_id) — so max 1 submission per participant per event
    # Let's create 3 submissions (one per participant)
    submission_ids = []
    for i, (sub_data, pid) in enumerate(zip(DEMO_SUBMISSIONS[:3], [p1_id, p2_id, p3_id])):
        form_data = {
            field_id_map["Project Name"]: sub_data["project_name"],
            field_id_map["Team Name"]: sub_data["team_name"],
            field_id_map["Project Description"]: sub_data["description"],
            field_id_map["Demo URL"]: sub_data["demo_url"],
            field_id_map["Repository URL"]: sub_data["repo_url"],
        }
        sub_resp = supabase.table("submissions").insert({
            "event_id": event_id,
            "participant_id": pid,
            "form_data": form_data,
            "status": "in_review",
        }).execute()
        submission_ids.append(sub_resp.data[0]["id"])
        print(f"  ✅ Submission {i+1}: {sub_data['project_name']} ({sub_data['team_name']})")

    # We also want 5 submissions — create 2 more participants on the fly
    extra_participants = [
        {"email": "p4@juryline.dev", "name": "Taylor Swift", "role": "participant"},
        {"email": "p5@juryline.dev", "name": "Alex Kim", "role": "participant"},
    ]
    for j, (ep, sub_data) in enumerate(zip(extra_participants, DEMO_SUBMISSIONS[3:])):
        ep_id = create_demo_user(ep["email"], ep["name"], ep["role"])
        try:
            supabase.table("profiles").upsert({
                "id": ep_id, "email": ep["email"], "name": ep["name"], "role": ep["role"]
            }).execute()
        except:
            pass
        form_data = {
            field_id_map["Project Name"]: sub_data["project_name"],
            field_id_map["Team Name"]: sub_data["team_name"],
            field_id_map["Project Description"]: sub_data["description"],
            field_id_map["Demo URL"]: sub_data["demo_url"],
            field_id_map["Repository URL"]: sub_data["repo_url"],
        }
        sub_resp = supabase.table("submissions").insert({
            "event_id": event_id,
            "participant_id": ep_id,
            "form_data": form_data,
            "status": "in_review",
        }).execute()
        submission_ids.append(sub_resp.data[0]["id"])
        print(f"  ✅ Submission {4+j}: {sub_data['project_name']} ({sub_data['team_name']})")

    print(f"\n  📊 Total submissions: {len(submission_ids)}")

    # ── 7. Invite Judges ──
    print("\n👨‍⚖️ Inviting judges...")
    for jid in [judge1_id, judge2_id]:
        supabase.table("event_judges").insert({
            "event_id": event_id,
            "judge_id": jid,
            "invite_status": "accepted",
        }).execute()
    print("  ✅ 2 judges invited and accepted")

    # ── 8. Create Judge Assignments ──
    print("\n📋 Assigning submissions to judges...")
    for sub_id in submission_ids:
        for jid in [judge1_id, judge2_id]:
            supabase.table("judge_assignments").insert({
                "event_id": event_id,
                "judge_id": jid,
                "submission_id": sub_id,
                "status": "pending",
            }).execute()
    print(f"  ✅ {len(submission_ids) * 2} assignments created (2 judges × {len(submission_ids)} submissions)")

    # ── 9. Create Partial Reviews ──
    # Judge 1 reviews first 3 submissions, Judge 2 reviews first 2
    # This leaves room to demo the judging flow live
    print("\n📝 Creating partial reviews...")

    def make_scores(criteria_ids: list, quality: str = "good") -> dict:
        """Generate realistic scores for a given quality level."""
        ranges = {
            "excellent": (8, 10),
            "good": (6, 9),
            "average": (4, 7),
            "below_avg": (3, 6),
        }
        lo, hi = ranges.get(quality, (5, 8))
        return {cid: random.randint(lo, hi) for cid in criteria_ids}

    # Judge 1: reviews submissions 0, 1, 2 (3 out of 5)
    quality_levels = ["excellent", "good", "average", "below_avg", "good"]
    for i in range(3):
        scores = make_scores(criteria_ids, quality_levels[i])
        notes_list = [
            "Really impressive use of AI APIs. The recipe suggestions were surprisingly creative and the UX is clean.",
            "Solid technical execution. The CV model works well but the UI could use some polish.",
            "Interesting concept but the implementation feels unfinished. The quiz generation is buggy.",
        ]
        supabase.table("reviews").insert({
            "submission_id": submission_ids[i],
            "judge_id": judge1_id,
            "event_id": event_id,
            "scores": scores,
            "notes": notes_list[i],
        }).execute()
        # Mark assignment completed
        supabase.table("judge_assignments").update({"status": "completed"}).eq(
            "judge_id", judge1_id
        ).eq("submission_id", submission_ids[i]).execute()
        print(f"  ✅ Judge 1 reviewed: {DEMO_SUBMISSIONS[i]['project_name']}")

    # Judge 2: reviews submissions 0, 1 (2 out of 5)
    for i in range(2):
        quality = "good" if i == 0 else "excellent"
        scores = make_scores(criteria_ids, quality)
        notes_list = [
            "Great project overall. The ingredient detection is accurate. Would love to see meal planning features.",
            "Outstanding work on the carbon calculation engine. This could have real-world impact.",
        ]
        supabase.table("reviews").insert({
            "submission_id": submission_ids[i],
            "judge_id": judge2_id,
            "event_id": event_id,
            "scores": scores,
            "notes": notes_list[i],
        }).execute()
        supabase.table("judge_assignments").update({"status": "completed"}).eq(
            "judge_id", judge2_id
        ).eq("submission_id", submission_ids[i]).execute()
        print(f"  ✅ Judge 2 reviewed: {DEMO_SUBMISSIONS[i]['project_name']}")

    # ── Summary ──
    print("\n" + "=" * 50)
    print("🎉 Seed complete!")
    print("=" * 50)
    print(f"\n📊 Summary:")
    print(f"   • Event: AI Hackathon 2025 (status: judging)")
    print(f"   • Criteria: {len(criteria_ids)} (Innovation, Tech, Design, Impact)")
    print(f"   • Submissions: {len(submission_ids)}")
    print(f"   • Judge 1 (Sam Rivera): 3/{len(submission_ids)} reviewed")
    print(f"   • Judge 2 (Jordan Lee): 2/{len(submission_ids)} reviewed")
    print(f"\n🔐 Demo Credentials:")
    print(f"   Organizer:    organizer@juryline.dev / demo123")
    print(f"   Judge 1:      judge1@juryline.dev / demo123")
    print(f"   Judge 2:      judge2@juryline.dev / demo123")
    print(f"   Participant:  p1@juryline.dev / demo123")
    print(f"\n💡 What to demo:")
    print(f"   • Login as organizer → view dashboard, leaderboard, judge progress")
    print(f"   • Login as judge1 → complete remaining 2 reviews via card UI")
    print(f"   • Switch back to organizer → see updated scores")


if __name__ == "__main__":
    if "--clean" in sys.argv:
        clean_demo_data()
    seed()
