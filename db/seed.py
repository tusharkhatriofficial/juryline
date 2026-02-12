"""
Juryline — Seed Script
Clears ALL data and creates fresh demo data with real accounts.

Accounts:
  Organizer: hello@tusharkhatri.in  (password: Password123!)
  Judge 1:   khatritushar420@gmail.com
  Judge 2:   khatritushar320@gmail.com

Run: python db/seed.py
"""

import os, sys, uuid, json
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "backend", ".env"))

from supabase import create_client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SERVICE_KEY  = os.environ["SUPABASE_SERVICE_KEY"]
sb = create_client(SUPABASE_URL, SERVICE_KEY)

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:4000")

# ─── Colors for terminal output ───
G = "\033[92m"  # green
Y = "\033[93m"  # yellow
R = "\033[91m"  # red
C = "\033[96m"  # cyan
B = "\033[1m"   # bold
X = "\033[0m"   # reset


def log(msg):
    print(f"  {G}✓{X} {msg}")

def section(msg):
    print(f"\n{B}{C}── {msg} ──{X}")


# ════════════════════════════════════════════════════════════════
# 1. NUKE EVERYTHING
# ════════════════════════════════════════════════════════════════
section("Clearing all existing data")

# Delete in FK-safe order
for table in [
    "reviews", "judge_assignments", "event_judges",
    "submissions", "criteria", "form_fields", "events", "profiles",
]:
    sb.table(table).delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    log(f"Cleared {table}")

# Delete all auth users
users = sb.auth.admin.list_users()
for u in users:
    sb.auth.admin.delete_user(u.id)
log(f"Deleted {len(users)} auth users")


# ════════════════════════════════════════════════════════════════
# 2. CREATE ACCOUNTS
# ════════════════════════════════════════════════════════════════
section("Creating accounts")

PASSWORD = "Password123!"

# Organizer
org_resp = sb.auth.admin.create_user({
    "email": "hello@tusharkhatri.in",
    "password": PASSWORD,
    "email_confirm": True,
    "user_metadata": {"name": "Tushar Khatri", "role": "organizer"},
})
ORGANIZER_ID = org_resp.user.id
log(f"Organizer: hello@tusharkhatri.in  (id: {ORGANIZER_ID})")

# Judge 1
j1_resp = sb.auth.admin.create_user({
    "email": "khatritushar420@gmail.com",
    "password": PASSWORD,
    "email_confirm": True,
    "user_metadata": {"name": "Tushar K. (Judge)", "role": "judge"},
})
JUDGE1_ID = j1_resp.user.id
log(f"Judge 1:   khatritushar420@gmail.com  (id: {JUDGE1_ID})")

# Judge 2
j2_resp = sb.auth.admin.create_user({
    "email": "khatritushar320@gmail.com",
    "password": PASSWORD,
    "email_confirm": True,
    "user_metadata": {"name": "TK Reviews (Judge)", "role": "judge"},
})
JUDGE2_ID = j2_resp.user.id
log(f"Judge 2:   khatritushar320@gmail.com  (id: {JUDGE2_ID})")

# 5 Participants
PARTICIPANTS = []
participant_data = [
    ("alice@demo.juryline.dev",   "Alice Chen",     "participant"),
    ("bob@demo.juryline.dev",     "Bob Martinez",    "participant"),
    ("carol@demo.juryline.dev",   "Carol Okonkwo",   "participant"),
    ("dan@demo.juryline.dev",     "Dan Park",        "participant"),
    ("emma@demo.juryline.dev",    "Emma Singh",      "participant"),
]
for email, name, role in participant_data:
    resp = sb.auth.admin.create_user({
        "email": email,
        "password": PASSWORD,
        "email_confirm": True,
        "user_metadata": {"name": name, "role": role},
    })
    PARTICIPANTS.append(resp.user.id)
    log(f"Participant: {email}")


# ════════════════════════════════════════════════════════════════
# 3. CREATE EVENTS
# ════════════════════════════════════════════════════════════════
section("Creating events")

now = datetime.now(timezone.utc)

# Event 1: HackSphere 2026 — Open for submissions
EVENT1_ID = str(uuid.uuid4())
sb.table("events").insert({
    "id": EVENT1_ID,
    "organizer_id": str(ORGANIZER_ID),
    "name": "HackSphere 2026",
    "description": "A 48-hour global hackathon challenging teams to build AI-powered solutions for sustainable cities. Open to all skill levels — prizes include $10K, mentorship, and cloud credits.",
    "start_at": (now - timedelta(days=2)).isoformat(),
    "end_at": (now + timedelta(days=5)).isoformat(),
    "status": "open",
    "judges_per_submission": 2,
}).execute()
log(f"Event: HackSphere 2026 (open)")

# Event 2: DesignJam Spring — In judging phase
EVENT2_ID = str(uuid.uuid4())
sb.table("events").insert({
    "id": EVENT2_ID,
    "organizer_id": str(ORGANIZER_ID),
    "name": "DesignJam Spring",
    "description": "A 24-hour design sprint where UI/UX designers reimagine everyday apps. Submissions are judged on creativity, usability, and visual polish.",
    "start_at": (now - timedelta(days=10)).isoformat(),
    "end_at": (now - timedelta(days=3)).isoformat(),
    "status": "judging",
    "judges_per_submission": 2,
}).execute()
log(f"Event: DesignJam Spring (judging)")

# Event 3: CodeVault CTF — Draft
EVENT3_ID = str(uuid.uuid4())
sb.table("events").insert({
    "id": EVENT3_ID,
    "organizer_id": str(ORGANIZER_ID),
    "name": "CodeVault CTF 2026",
    "description": "Capture-the-flag cybersecurity competition. Solve challenges across web exploitation, reverse engineering, cryptography, and forensics. Top 3 teams win hardware prizes.",
    "start_at": (now + timedelta(days=30)).isoformat(),
    "end_at": (now + timedelta(days=32)).isoformat(),
    "status": "draft",
    "judges_per_submission": 3,
}).execute()
log(f"Event: CodeVault CTF 2026 (draft)")


# ════════════════════════════════════════════════════════════════
# 4. FORM FIELDS
# ════════════════════════════════════════════════════════════════
section("Creating form fields")

# ── HackSphere 2026 fields ──
hacksphere_fields = [
    {
        "event_id": EVENT1_ID, "sort_order": 0,
        "label": "Project Name",
        "field_type": "short_text",
        "description": "Give your project a catchy name",
        "is_required": True,
    },
    {
        "event_id": EVENT1_ID, "sort_order": 1,
        "label": "Team Members",
        "field_type": "short_text",
        "description": "List all team members (comma-separated)",
        "is_required": True,
    },
    {
        "event_id": EVENT1_ID, "sort_order": 2,
        "label": "Project Description",
        "field_type": "long_text",
        "description": "Describe what your project does, the problem it solves, and your tech stack (200 words max)",
        "is_required": True,
    },
    {
        "event_id": EVENT1_ID, "sort_order": 3,
        "label": "Demo Video URL",
        "field_type": "url",
        "description": "Link to a 3-minute demo video (YouTube, Loom, etc.)",
        "is_required": True,
    },
    {
        "event_id": EVENT1_ID, "sort_order": 4,
        "label": "GitHub Repository",
        "field_type": "url",
        "description": "Link to your public repo",
        "is_required": True,
    },
    {
        "event_id": EVENT1_ID, "sort_order": 5,
        "label": "Category",
        "field_type": "dropdown",
        "description": "Select the category that best fits your project",
        "is_required": True,
        "options": json.dumps({"choices": ["AI/ML", "IoT & Hardware", "Green Energy", "Smart Mobility", "Health & Wellbeing", "Other"]}),
    },
    {
        "event_id": EVENT1_ID, "sort_order": 6,
        "label": "Pitch Deck",
        "field_type": "file_upload",
        "description": "Upload your pitch deck (PDF, max 10 MB)",
        "is_required": False,
    },
    {
        "event_id": EVENT1_ID, "sort_order": 7,
        "label": "Anything else?",
        "field_type": "long_text",
        "description": "Optional — share anything the judges should know",
        "is_required": False,
    },
]
sb.table("form_fields").insert(hacksphere_fields).execute()
log(f"HackSphere 2026 — {len(hacksphere_fields)} fields")

# ── DesignJam Spring fields ──
designjam_fields = [
    {
        "event_id": EVENT2_ID, "sort_order": 0,
        "label": "Design Title",
        "field_type": "short_text",
        "description": "Name your redesign concept",
        "is_required": True,
    },
    {
        "event_id": EVENT2_ID, "sort_order": 1,
        "label": "Original App Redesigned",
        "field_type": "dropdown",
        "description": "Which app did you redesign?",
        "is_required": True,
        "options": json.dumps({"choices": ["Spotify", "Instagram", "Google Maps", "Slack", "Notion", "Other"]}),
    },
    {
        "event_id": EVENT2_ID, "sort_order": 2,
        "label": "Design Rationale",
        "field_type": "long_text",
        "description": "Explain your design decisions, user research, and key improvements",
        "is_required": True,
    },
    {
        "event_id": EVENT2_ID, "sort_order": 3,
        "label": "Figma / Prototype Link",
        "field_type": "url",
        "description": "Link to your interactive prototype",
        "is_required": True,
    },
    {
        "event_id": EVENT2_ID, "sort_order": 4,
        "label": "Design Mockups",
        "field_type": "file_upload",
        "description": "Upload key screens as images or PDF",
        "is_required": False,
    },
    {
        "event_id": EVENT2_ID, "sort_order": 5,
        "label": "Confidence Level",
        "field_type": "linear_scale",
        "description": "How confident are you this design improves the original?",
        "is_required": True,
        "options": json.dumps({"min": 1, "max": 10, "min_label": "Not sure", "max_label": "Extremely confident"}),
    },
]
sb.table("form_fields").insert(designjam_fields).execute()
log(f"DesignJam Spring — {len(designjam_fields)} fields")


# ════════════════════════════════════════════════════════════════
# 5. CRITERIA
# ════════════════════════════════════════════════════════════════
section("Creating judging criteria")

# ── HackSphere criteria ──
hs_criteria = [
    {"event_id": EVENT1_ID, "name": "Innovation",        "scale_min": 0, "scale_max": 10, "weight": 1.5, "sort_order": 0},
    {"event_id": EVENT1_ID, "name": "Technical Depth",    "scale_min": 0, "scale_max": 10, "weight": 1.2, "sort_order": 1},
    {"event_id": EVENT1_ID, "name": "Impact & Feasibility","scale_min": 0, "scale_max": 10, "weight": 1.0, "sort_order": 2},
    {"event_id": EVENT1_ID, "name": "Presentation Quality","scale_min": 0, "scale_max": 10, "weight": 0.8, "sort_order": 3},
    {"event_id": EVENT1_ID, "name": "Code Quality",       "scale_min": 0, "scale_max": 10, "weight": 1.0, "sort_order": 4},
]
hs_criteria_resp = sb.table("criteria").insert(hs_criteria).execute()
HS_CRITERIA_IDS = [c["id"] for c in hs_criteria_resp.data]
log(f"HackSphere 2026 — {len(hs_criteria)} criteria")

# ── DesignJam criteria ──
dj_criteria = [
    {"event_id": EVENT2_ID, "name": "Creativity & Originality", "scale_min": 0, "scale_max": 10, "weight": 1.5, "sort_order": 0},
    {"event_id": EVENT2_ID, "name": "Usability & UX",           "scale_min": 0, "scale_max": 10, "weight": 1.3, "sort_order": 1},
    {"event_id": EVENT2_ID, "name": "Visual Design",            "scale_min": 0, "scale_max": 10, "weight": 1.0, "sort_order": 2},
    {"event_id": EVENT2_ID, "name": "Design Rationale",         "scale_min": 0, "scale_max": 10, "weight": 0.8, "sort_order": 3},
]
dj_criteria_resp = sb.table("criteria").insert(dj_criteria).execute()
DJ_CRITERIA_IDS = [c["id"] for c in dj_criteria_resp.data]
log(f"DesignJam Spring — {len(dj_criteria)} criteria")


# ════════════════════════════════════════════════════════════════
# 6. INVITE JUDGES
# ════════════════════════════════════════════════════════════════
section("Inviting judges to events")

# Both judges → HackSphere (accepted)
sb.table("event_judges").insert([
    {"event_id": EVENT1_ID, "judge_id": str(JUDGE1_ID), "invite_status": "accepted"},
    {"event_id": EVENT1_ID, "judge_id": str(JUDGE2_ID), "invite_status": "accepted"},
]).execute()
log("HackSphere 2026 — 2 judges (accepted)")

# Both judges → DesignJam (accepted)
sb.table("event_judges").insert([
    {"event_id": EVENT2_ID, "judge_id": str(JUDGE1_ID), "invite_status": "accepted"},
    {"event_id": EVENT2_ID, "judge_id": str(JUDGE2_ID), "invite_status": "accepted"},
]).execute()
log("DesignJam Spring — 2 judges (accepted)")


# ════════════════════════════════════════════════════════════════
# 7. SUBMISSIONS (HackSphere — 5 projects)
# ════════════════════════════════════════════════════════════════
section("Creating submissions for HackSphere 2026")

hacksphere_submissions = [
    {
        "project": "EcoRoute AI",
        "team": "Alice Chen, Marcus Liu",
        "desc": "An AI-powered route optimizer that reduces carbon emissions by suggesting greener commute paths. Uses real-time traffic, weather, and public transit data to find the most eco-friendly route. Built with Python, FastAPI, React, and OpenAI API. Reduces average commute emissions by 23%.",
        "video": "https://youtube.com/watch?v=demo-ecoroute",
        "repo": "https://github.com/alice-chen/ecoroute-ai",
        "category": "Smart Mobility",
    },
    {
        "project": "MediScan",
        "team": "Bob Martinez, Priya Sharma, Leo Wang",
        "desc": "Mobile-first app that uses computer vision to identify medication from photos and provides dosage info, interactions, and side effects in plain language. Aimed at elderly users and caregivers. Built with React Native, TensorFlow Lite, and a custom pharma knowledge graph.",
        "video": "https://youtube.com/watch?v=demo-mediscan",
        "repo": "https://github.com/bob-dev/mediscan",
        "category": "Health & Wellbeing",
    },
    {
        "project": "GridShare",
        "team": "Carol Okonkwo, James Nkemelu",
        "desc": "A peer-to-peer energy trading platform for neighborhoods with solar panels. Residents can sell excess solar energy to neighbors at fair prices. Uses blockchain-based smart contracts on Polygon for transparent billing. Dashboard shows real-time generation and consumption.",
        "video": "https://youtube.com/watch?v=demo-gridshare",
        "repo": "https://github.com/carol-labs/gridshare",
        "category": "Green Energy",
    },
    {
        "project": "SensorHive",
        "team": "Dan Park, Yuki Tanaka",
        "desc": "Low-cost IoT air quality monitoring network for schools. Raspberry Pi-based sensors measure PM2.5, CO2, humidity, and temperature. Data streams to a Next.js dashboard with alerts for teachers when air quality drops below safe levels. Already piloted in 3 schools in Seoul.",
        "video": "https://youtube.com/watch?v=demo-sensorhive",
        "repo": "https://github.com/danpark/sensorhive",
        "category": "IoT & Hardware",
    },
    {
        "project": "UrbanMind",
        "team": "Emma Singh, Fatima Al-Rashid, Noah Kim",
        "desc": "AI city planner that generates optimized urban layouts from satellite imagery and demographic data. Uses GANs to propose zoning changes that maximize green space while maintaining walkability. Evaluated against 50 real city districts with a 31% improvement in green coverage.",
        "video": "https://youtube.com/watch?v=demo-urbanmind",
        "repo": "https://github.com/emma-s/urbanmind",
        "category": "AI/ML",
    },
]

HS_SUBMISSION_IDS = []
for i, s in enumerate(hacksphere_submissions):
    sub_id = str(uuid.uuid4())
    HS_SUBMISSION_IDS.append(sub_id)
    sb.table("submissions").insert({
        "id": sub_id,
        "event_id": EVENT1_ID,
        "participant_id": str(PARTICIPANTS[i]),
        "form_data": json.dumps({
            "Project Name": s["project"],
            "Team Members": s["team"],
            "Project Description": s["desc"],
            "Demo Video URL": s["video"],
            "GitHub Repository": s["repo"],
            "Category": s["category"],
        }),
        "status": "submitted",
    }).execute()
    log(f"{s['project']} — by {s['team'].split(',')[0].strip()}")


# ════════════════════════════════════════════════════════════════
# 8. SUBMISSIONS (DesignJam — 4 projects)
# ════════════════════════════════════════════════════════════════
section("Creating submissions for DesignJam Spring")

designjam_submissions = [
    {
        "title": "Spotify Flow",
        "app": "Spotify",
        "rationale": "Redesigned the queue and playlist management to feel more tactile and visual. Introduced a 'mood board' view that clusters songs by energy and vibe rather than just a flat list. Added gesture-based controls for quicker navigation while driving.",
        "figma": "https://figma.com/file/spotify-flow-demo",
        "confidence": 8,
    },
    {
        "title": "MapSense",
        "app": "Google Maps",
        "rationale": "Focused on accessibility — redesigned the navigation UI for visually impaired users. Larger touch targets, high-contrast mode by default, haptic feedback at each turn, and audio descriptions of surroundings pulled from Street View metadata.",
        "figma": "https://figma.com/file/mapsense-demo",
        "confidence": 9,
    },
    {
        "title": "InstaCreate",
        "app": "Instagram",
        "rationale": "Reimagined the content creation flow for small business owners. Added built-in product tagging templates, scheduling calendar, and analytics dashboard right in the creation screen. Reduced steps to publish a shoppable post from 7 to 3.",
        "figma": "https://figma.com/file/instacreate-demo",
        "confidence": 7,
    },
    {
        "title": "SlackZen",
        "app": "Slack",
        "rationale": "Tackled notification overload by adding an AI-powered 'Focus Mode' that batches and summarizes conversations. Introduced a calm UI theme with softer colors and reduced visual noise. Thread summaries appear as sticky cards instead of nested messages.",
        "figma": "https://figma.com/file/slackzen-demo",
        "confidence": 8,
    },
]

DJ_SUBMISSION_IDS = []
for i, s in enumerate(designjam_submissions):
    sub_id = str(uuid.uuid4())
    DJ_SUBMISSION_IDS.append(sub_id)
    sb.table("submissions").insert({
        "id": sub_id,
        "event_id": EVENT2_ID,
        "participant_id": str(PARTICIPANTS[i]),
        "form_data": json.dumps({
            "Design Title": s["title"],
            "Original App Redesigned": s["app"],
            "Design Rationale": s["rationale"],
            "Figma / Prototype Link": s["figma"],
            "Confidence Level": s["confidence"],
        }),
        "status": "in_review",
    }).execute()
    log(f"{s['title']} — redesign of {s['app']}")


# ════════════════════════════════════════════════════════════════
# 9. JUDGE ASSIGNMENTS (DesignJam — "judging" phase)
# ════════════════════════════════════════════════════════════════
section("Creating judge assignments for DesignJam Spring")

for sub_id in DJ_SUBMISSION_IDS:
    sb.table("judge_assignments").insert([
        {"event_id": EVENT2_ID, "judge_id": str(JUDGE1_ID), "submission_id": sub_id, "status": "pending"},
        {"event_id": EVENT2_ID, "judge_id": str(JUDGE2_ID), "submission_id": sub_id, "status": "pending"},
    ]).execute()
log(f"Assigned {len(DJ_SUBMISSION_IDS)} submissions × 2 judges = {len(DJ_SUBMISSION_IDS)*2} assignments")


# ════════════════════════════════════════════════════════════════
# 10. REVIEWS (DesignJam — Judge 1 has reviewed 2 submissions)
# ════════════════════════════════════════════════════════════════
section("Creating sample reviews for DesignJam Spring")

# Judge 1 reviewed Spotify Flow
sb.table("reviews").insert({
    "submission_id": DJ_SUBMISSION_IDS[0],
    "judge_id": str(JUDGE1_ID),
    "event_id": EVENT2_ID,
    "scores": json.dumps({
        DJ_CRITERIA_IDS[0]: 9,   # Creativity
        DJ_CRITERIA_IDS[1]: 8,   # Usability
        DJ_CRITERIA_IDS[2]: 9,   # Visual Design
        DJ_CRITERIA_IDS[3]: 7,   # Rationale
    }),
    "notes": "Stunning visual direction — the mood board concept is genuinely novel. The gesture controls feel natural. Would love to see accessibility considerations for the gesture-based navigation.",
}).execute()
# Mark assignment completed
sb.table("judge_assignments").update({"status": "completed"}).eq("judge_id", str(JUDGE1_ID)).eq("submission_id", DJ_SUBMISSION_IDS[0]).execute()
log("Judge 1 reviewed: Spotify Flow (9/8/9/7)")

# Judge 1 reviewed MapSense
sb.table("reviews").insert({
    "submission_id": DJ_SUBMISSION_IDS[1],
    "judge_id": str(JUDGE1_ID),
    "event_id": EVENT2_ID,
    "scores": json.dumps({
        DJ_CRITERIA_IDS[0]: 8,
        DJ_CRITERIA_IDS[1]: 10,
        DJ_CRITERIA_IDS[2]: 7,
        DJ_CRITERIA_IDS[3]: 9,
    }),
    "notes": "Incredible attention to accessibility. The haptic feedback system is well thought out. Visual design could be more polished, but the UX reasoning is best-in-class. This should be shared with Google's accessibility team.",
}).execute()
sb.table("judge_assignments").update({"status": "completed"}).eq("judge_id", str(JUDGE1_ID)).eq("submission_id", DJ_SUBMISSION_IDS[1]).execute()
log("Judge 1 reviewed: MapSense (8/10/7/9)")

# Judge 2 reviewed Spotify Flow
sb.table("reviews").insert({
    "submission_id": DJ_SUBMISSION_IDS[0],
    "judge_id": str(JUDGE2_ID),
    "event_id": EVENT2_ID,
    "scores": json.dumps({
        DJ_CRITERIA_IDS[0]: 8,
        DJ_CRITERIA_IDS[1]: 9,
        DJ_CRITERIA_IDS[2]: 8,
        DJ_CRITERIA_IDS[3]: 8,
    }),
    "notes": "Great rethinking of queue management. The clustering by mood/energy is a feature I'd actually want. Consider how this scales for playlists with 500+ songs.",
}).execute()
sb.table("judge_assignments").update({"status": "completed"}).eq("judge_id", str(JUDGE2_ID)).eq("submission_id", DJ_SUBMISSION_IDS[0]).execute()
log("Judge 2 reviewed: Spotify Flow (8/9/8/8)")


# ════════════════════════════════════════════════════════════════
# SUMMARY
# ════════════════════════════════════════════════════════════════
section("Seed complete!")

print(f"""
{B}Accounts{X} (all passwords: {Y}{PASSWORD}{X})
  {G}Organizer:{X}   hello@tusharkhatri.in
  {G}Judge 1:{X}     khatritushar420@gmail.com
  {G}Judge 2:{X}     khatritushar320@gmail.com
  {G}Participants:{X} alice@demo.juryline.dev, bob@demo.juryline.dev,
                 carol@demo.juryline.dev, dan@demo.juryline.dev,
                 emma@demo.juryline.dev

{B}Events{X}
  {C}HackSphere 2026{X}    — open, 8 form fields, 5 criteria, 5 submissions, 2 judges
  {C}DesignJam Spring{X}   — judging, 6 form fields, 4 criteria, 4 submissions, 3 reviews done
  {C}CodeVault CTF 2026{X} — draft (future event, no fields yet)

{B}Review Progress{X} (DesignJam)
  Judge 1 has reviewed 2/4 submissions
  Judge 2 has reviewed 1/4 submissions
  "Spotify Flow" is fully reviewed (2/2 judges)
""")
