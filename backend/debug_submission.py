
import os
import sys
import json
from dotenv import load_dotenv
from supabase import create_client

# Locate env
backend_path = os.path.join(os.path.dirname(__file__), "app") 
sys.path.append(backend_path)

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")

if not url or not key:
    print("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY")
    sys.exit(1)

sb = create_client(url, key)

print("Searching for submission 'Eventara'...")

# We can't easily query inside JSONB with simple filters in all supabase-py versions depending on setup,
# so let's fetch all submissions and filter in python (dataset is small).
subs = sb.table("submissions").select("*").execute()

found = None
for s in subs.data:
    fd = s.get("form_data")
    if isinstance(fd, str):
        try:
            fd = json.loads(fd)
        except:
            pass
    
    if isinstance(fd, dict):
        # Check Project Name
        if fd.get("Project Name") == "Eventara" or fd.get("project_name") == "Eventara":
            found = s
            found["form_data"] = fd
            break

if found:
    print(f"FOUND Submission: {found['id']}")
    print(json.dumps(found['form_data'], indent=2))
else:
    print("Submission 'Eventara' not found.")
    print("--- Listing all submissions ---")
    for s in subs.data:
        fd = s.get("form_data")
        if isinstance(fd, str):
            try:
                fd = json.loads(fd)
            except:
                pass
        if isinstance(fd, dict):
            name = fd.get('Project Name') or fd.get('project_name') or fd.get('Design Title')
            if name:
                print(f"- {name}")
            else:
                print(f"- [Unknown Name] ID: {s['id']}")
                print(json.dumps(fd, indent=2))
                
                # Fetch event fields to see what's missing
                event_id = s.get("event_id")
                if event_id:
                    print(f"\nChecking fields for Event: {event_id}")
                    fields = sb.table("form_fields").select("*").eq("event_id", event_id).execute()
                    for f in fields.data:
                        val = fd.get(f['id'])
                        icon = "✅" if val else "❌"
                        print(f"  {icon} [{f['field_type']}] {f['label']} (ID: {f['id']})")
                        if val:
                            print(f"      Value: {val}")
