
"""
Juryline — Production Seed Script
Clears ALL data and creates a realistic, high-volume demo environment.

State:
- 1 Active Event (Target for Demo): "Global AI Hackathon 2026"
  - 20 Submissions
  - 3 Judges (Invite Accepted)
  - Partial Reviews (Leaderboard visible but not finalized)
- 1 Completed Event: "Design Systems Summit"
  - 10 Submissions
  - Fully Reviewed (Winner declared)
- 1 Draft Event: "Crypto Heist CTF"
  - No submissions, ready for setup demo

Assets:
- Real Banners
- MPL/YouTube Video Links

Run within Docker: docker compose exec backend python seed.py
"""

import os, sys, uuid, json, random
from datetime import datetime, timedelta, timezone

# Ensure we can import 'app'
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

# Try loading .env if not in Docker (optional)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from supabase import create_client

# Environment Variables
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SERVICE_KEY  = os.environ.get("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SERVICE_KEY:
    print("Error: SUPABASE_URL or SUPABASE_SERVICE_KEY not set.")
    sys.exit(1)

sb = create_client(SUPABASE_URL, SERVICE_KEY)

# ─── Colors ───
G = "\033[92m"  # green
Y = "\033[93m"  # yellow
B = "\033[1m"   # bold
X = "\033[0m"   # reset

def log(msg): print(f"  {G}✓{X} {msg}")
def section(msg): print(f"\n{B}── {msg} ──{X}")

# ─── Assets ───
BANNER_AI = "https://pub-a76579fd32a3438c969fa3e15cd52614.r2.dev/uploads/bfa5ea23-4f7c-4ece-b206-a695d6f01b67/9ae9ee06-8bd1-4f98-b430-178432d656a8_cover.webp"
BANNER_DESIGN = "https://pub-a76579fd32a3438c969fa3e15cd52614.r2.dev/uploads/bfa5ea23-4f7c-4ece-b206-a695d6f01b67/0998c328-69d7-43b3-8f8a-a98fbd875453_cover.webp"

VIDEOS = [
    "https://pub-a76579fd32a3438c969fa3e15cd52614.r2.dev/uploads/6124ec82-1b44-4cb3-9701-b7d386a63464/2d4c55cc-63f4-4ac7-867a-bb57eed6b94d_Eventara%20Demo.mp4"
]

# ════════════════════════════════════════════════════════════════
# 1. CLEANUP
# ════════════════════════════════════════════════════════════════
section("Nuking Database")

tables = ["reviews", "judge_assignments", "event_judges", "submissions", "criteria", "form_fields", "events", "profiles"]
for t in tables:
    sb.table(t).delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    log(f"Cleared {t}")

try:
    users = sb.auth.admin.list_users()
    for u in users:
        sb.auth.admin.delete_user(u.id)
    log(f"Deleted {len(users)} auth users")
except Exception as e:
    log(f"Warning: Could not clear auth users (check permissions): {e}")


# ════════════════════════════════════════════════════════════════
# 2. USERS
# ════════════════════════════════════════════════════════════════
section("Creating Users")

PASSWORD = "Password123!"

def create_user(email, name, role):
    try:
        res = sb.auth.admin.create_user({
            "email": email,
            "password": PASSWORD,
            "email_confirm": True,
            "user_metadata": {"name": name, "role": role}
        })
        return res.user.id
    except Exception as e:
        print(f"Error creating {email}: {e}")
        # Try to find if exists
        try:
             # This part might fail if profile table cleared but auth user remains
             pass 
        except:
             pass
        return str(uuid.uuid4())

# Organizer
ORG_ID = create_user("hello@tusharkhatri.in", "Tushar Khatri", "organizer")
log(f"Organizer: hello@tusharkhatri.in")

# Judges
JUDGES = []
JUDGES.append(create_user("khatritushar420@gmail.com", "Judge Tushar", "judge"))
JUDGES.append(create_user("khatritushar320@gmail.com", "Judge TK", "judge"))
JUDGES.append(create_user("alex@juryline.dev", "Alex Rivera", "judge"))
log(f"Created 3 Judges")

# Participants
PARTICIPANTS = []
p_names = [
    "Alice Chen", "Bob Smith", "Charlie Kim", "David Lo", "Eva Green", 
    "Frank Wright", "Grace Ho", "Henry Ford", "Ivy Blue", "Jack Black",
    "Kevin Hart", "Laura Lin", "Mike Ross", "Nancy Drew", "Oscar Wilde",
    "Paul Atreides", "Quinn Fabray", "Rachel Green", "Steve Jobs", "Tony Stark"
]
for i, name in enumerate(p_names):
    email = f"p{i+1}@demo.juryline.dev"
    pid = create_user(email, name, "participant")
    PARTICIPANTS.append(pid)
log(f"Created {len(PARTICIPANTS)} Participants")


# ════════════════════════════════════════════════════════════════
# 3. EVENT 1: GLOBAL AI HACKATHON (MAIN DEMO)
# ════════════════════════════════════════════════════════════════
section("Seeding Event 1: Global AI Hackathon")

now = datetime.now(timezone.utc)
EVENT1_ID = str(uuid.uuid4())

# Create Event
sb.table("events").insert({
    "id": EVENT1_ID,
    "organizer_id": ORG_ID,
    "name": "Global AI Hackathon 2026",
    "description": "The world's largest AI build-a-thon. We are looking for agents, LLMs, and computer vision projects that solve real problems.",
    "start_at": (now - timedelta(days=2)).isoformat(),
    "end_at": (now + timedelta(days=5)).isoformat(),
    "status": "judging",
    "judges_per_submission": 2,
    "banner_url": BANNER_AI
}).execute()

# Fields
fields_e1 = [
    {"event_id": EVENT1_ID, "label": "Project Name", "field_type": "short_text", "is_required": True, "sort_order": 0},
    {"event_id": EVENT1_ID, "label": "Tagline", "field_type": "short_text", "is_required": True, "sort_order": 1},
    {"event_id": EVENT1_ID, "label": "Description", "field_type": "long_text", "is_required": True, "sort_order": 2},
    {"event_id": EVENT1_ID, "label": "Demo Video", "field_type": "file_upload", "description": "3-minute demo", "is_required": True, "sort_order": 3},
    {"event_id": EVENT1_ID, "label": "GitHub Repo", "field_type": "url", "is_required": True, "sort_order": 4},
    {"event_id": EVENT1_ID, "label": "Category", "field_type": "dropdown", "options": json.dumps({"choices": ["Health", "Finance", "Education", "Uncategorized"]}), "is_required": True, "sort_order": 5},
]
sb.table("form_fields").insert(fields_e1).execute()

# Criteria
crit_e1 = [
    {"event_id": EVENT1_ID, "name": "Innovation", "scale_min": 1, "scale_max": 10, "weight": 2.0, "sort_order": 0},
    {"event_id": EVENT1_ID, "name": "Technical Complexity", "scale_min": 1, "scale_max": 10, "weight": 1.5, "sort_order": 1},
    {"event_id": EVENT1_ID, "name": "Business Value", "scale_min": 1, "scale_max": 10, "weight": 1.0, "sort_order": 2},
]
c_resp = sb.table("criteria").insert(crit_e1).execute()
CRITERIA_IDS_E1 = [c["id"] for c in c_resp.data]

# Invite Judges
for jid in JUDGES:
    sb.table("event_judges").insert({"event_id": EVENT1_ID, "judge_id": jid, "invite_status": "accepted"}).execute()

# Submissions (20 items)
projects = [
    ("EcoScan", "Health", "AI recycling assistant"),
    ("MediBot", "Health", "Doctor in your pocket"),
    ("FinWiz", "Finance", "Personal finance AI"),
    ("LearnX", "Education", "Personalized tutor"),
    ("CodeGpt", "Uncategorized", "Better coding assistant"),
    ("SafeWalk", "Health", "Walking companion app"),
    ("AgriTech", "Uncategorized", "Smart farming sensors"),
    ("CryptoSafe", "Finance", "Wallet security"),
    ("LegalEagle", "Uncategorized", "Contract review AI"),
    ("MusicGen", "Uncategorized", "Generative music"),
    ("TravelAI", "Uncategorized", "Itinerary planner"),
    ("ShopSmart", "Uncategorized", "Price comparison"),
    ("FitLife", "Health", "Workout tracker"),
    ("MindWell", "Health", "Mental health chatbot"),
    ("InvestMate", "Finance", "Stock predictor"),
    ("LangLearn", "Education", "Language practice"),
    ("HistoryChat", "Education", "Talk to history figures"),
    ("ArtFlow", "Uncategorized", "Generative art tool"),
    ("WriteGood", "Uncategorized", "Grammar checker"),
    ("DataViz", "Uncategorized", "Instant charts")
]

E1_SUB_IDS = []
for i, (name, cat, desc) in enumerate(projects):
    video = VIDEOS[i % len(VIDEOS)]
    fd = {
        "Project Name": name,
        "Tagline": f"The future of {cat}",
        "Description": f"{desc}. Built with Python and React. Solves key problems in the {cat} industry.",
        "Demo Video": [video],
        "GitHub Repo": f"https://github.com/demo/{name.lower()}",
        "Category": cat
    }
    
    res = sb.table("submissions").insert({
        "event_id": EVENT1_ID,
        "participant_id": PARTICIPANTS[i],
        "status": "submitted",
        "form_data": json.dumps(fd)
    }).execute()
    E1_SUB_IDS.append(res.data[0]["id"])

# Assign & Review (Partial)
# Judge 1 (User): Assigned 10, Reviewed 5
# Judge 2: Assigned 10, Reviewed 8
# Judge 3: Assigned 10, Reviewed 2

# Distribute assignments (Simple round robin manually)
# J1 gets 0-9, J2 gets 5-14, J3 gets 10-19 (Overlaps ensure multi-reviews)
assign_map = {
    JUDGES[0]: list(range(0, 10)),
    JUDGES[1]: list(range(5, 15)),
    JUDGES[2]: list(range(10, 20))
}

for jid, indices in assign_map.items():
    for idx in indices:
        sid = E1_SUB_IDS[idx]
        sb.table("judge_assignments").insert({"event_id": EVENT1_ID, "judge_id": jid, "submission_id": sid, "status": "pending"}).execute()

# Reviews
# J1 reviews first 5
for idx in range(0, 5):
    sid = E1_SUB_IDS[idx]
    scores = {cid: random.randint(6, 10) for cid in CRITERIA_IDS_E1}
    sb.table("reviews").insert({"submission_id": sid, "judge_id": JUDGES[0], "event_id": EVENT1_ID, "scores": json.dumps(scores), "notes": "Solid entry."}).execute()
    sb.table("judge_assignments").update({"status": "completed"}).eq("submission_id", sid).eq("judge_id", JUDGES[0]).execute()

# J2 reviews first 8 assigned (5-12)
for idx in range(5, 13):
    sid = E1_SUB_IDS[idx]
    scores = {cid: random.randint(5, 9) for cid in CRITERIA_IDS_E1}
    sb.table("reviews").insert({"submission_id": sid, "judge_id": JUDGES[1], "event_id": EVENT1_ID, "scores": json.dumps(scores), "notes": "Nice work."}).execute()
    sb.table("judge_assignments").update({"status": "completed"}).eq("submission_id", sid).eq("judge_id", JUDGES[1]).execute()

log(f"Seeded 20 subs, assignments, and reviews for Event 1")


# ════════════════════════════════════════════════════════════════
# 4. EVENT 2: DESIGN SUMMIT (COMPLETED)
# ════════════════════════════════════════════════════════════════
section("Seeding Event 2: Design Systems Summit")
EVENT2_ID = str(uuid.uuid4())

sb.table("events").insert({
    "id": EVENT2_ID,
    "organizer_id": ORG_ID,
    "name": "Design Systems Summit",
    "description": "Celebrating UI excellence.",
    "start_at": (now - timedelta(days=60)).isoformat(),
    "end_at": (now - timedelta(days=55)).isoformat(),
    "status": "closed",
    "judges_per_submission": 2,
    "banner_url": BANNER_DESIGN
}).execute()

# Minimal fields/criteria just to exist
sb.table("form_fields").insert([{"event_id": EVENT2_ID, "label": "Title", "field_type": "short_text", "is_required": True, "sort_order": 0}]).execute()
sb.table("criteria").insert([{"event_id": EVENT2_ID, "name": "Beauty", "scale_min": 1, "scale_max": 10, "weight": 1.0, "sort_order": 0}]).execute()

# 5 Submissions, fully reviewed
for i in range(5):
    res = sb.table("submissions").insert({
        "event_id": EVENT2_ID,
        "participant_id": PARTICIPANTS[i], # Reuse participants
        "status": "submitted",
        "form_data": json.dumps({"Title": f"Design Project {i+1}"})
    }).execute()
    sid = res.data[0]["id"]
    # J1 reviewed all
    sb.table("reviews").insert({"submission_id": sid, "judge_id": JUDGES[0], "event_id": EVENT2_ID, "scores": json.dumps({}), "notes": "Winner candidate."}).execute()

log("Seeded completed event")


# ════════════════════════════════════════════════════════════════
# 5. SUMMARY
# ════════════════════════════════════════════════════════════════
section("SEED DONE")
print(f"Organizer: hello@tusharkhatri.in | {PASSWORD}")
print(f"Judge:     khatritushar420@gmail.com | {PASSWORD}")
