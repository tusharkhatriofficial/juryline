# Phase 04 — Dynamic Submission Form with R2 Uploads

## Goal
Build the **dynamic submission form** that renders based on the organizer's custom form fields (from the form builder). All field types render automatically. File uploads go to Cloudflare R2 via presigned URLs. Submissions store responses as `form_data` JSONB.

---

## Step 1: Backend — R2 Upload System

### 1.1 Upload Router (`app/routers/uploads.py`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/uploads/presign` | POST | Any auth | Generate R2 presigned upload URL |

### 1.2 Presigned URL Generation

```python
@router.post("/uploads/presign")
async def get_presigned_url(
    request: PresignRequest,  # { filename, content_type }
    user = Depends(get_current_user)
):
    file_key = f"uploads/{user['id']}/{uuid4()}_{request.filename}"
    
    presigned = r2.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": settings.R2_BUCKET_NAME,
            "Key": file_key,
            "ContentType": request.content_type,
        },
        ExpiresIn=3600
    )
    
    return {
        "upload_url": presigned,
        "file_key": file_key,
        "public_url": f"{settings.R2_PUBLIC_URL}/{file_key}"
    }
```

---

## Step 2: Backend — Dynamic Submission CRUD

### 2.1 Submission Models (`app/models/submission.py`)

```python
class SubmissionCreate(BaseModel):
    form_data: dict  # { field_id: value } — dynamic, matches form_fields

class SubmissionUpdate(BaseModel):
    form_data: dict

class SubmissionResponse(BaseModel):
    id: str
    event_id: str
    participant_id: str
    form_data: dict       # Raw stored data
    form_data_display: Optional[list] = None  # Enriched with field labels for display
    status: str
    created_at: str
    updated_at: str
```

### 2.2 Submission Router

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/events/{event_id}/submissions` | POST | Participant | Submit (create) |
| `/api/v1/events/{event_id}/submissions` | GET | Organizer/Judge | List all |
| `/api/v1/submissions/{id}` | GET | Any auth | Get with enriched display |
| `/api/v1/submissions/{id}` | PUT | Participant (owner) | Update |
| `/api/v1/submissions/{id}` | DELETE | Participant (owner) | Delete |
| `/api/v1/events/{event_id}/my-submission` | GET | Participant | Get own |

### 2.3 Dynamic Validation Service

**This is the key piece** — validates `form_data` against the event's `form_fields`:

```python
class SubmissionService:
    async def validate_form_data(self, event_id: str, form_data: dict):
        """Validate submitted form_data against event's form_fields schema"""
        
        # 1. Fetch the event's form field definitions
        fields = supabase.table("form_fields") \
            .select("*").eq("event_id", event_id) \
            .order("sort_order").execute()
        
        errors = []
        
        for field in fields.data:
            fid = field["id"]
            value = form_data.get(fid)
            ftype = field["field_type"]
            label = field["label"]
            
            # 2. Check required
            if field["is_required"] and (value is None or value == "" or value == []):
                errors.append(f"{label} is required")
                continue
            
            if value is None:
                continue  # Optional and not provided
            
            # 3. Type-specific validation
            match ftype:
                case "short_text":
                    if not isinstance(value, str):
                        errors.append(f"{label} must be text")
                    elif field.get("validation"):
                        v = field["validation"]
                        if v.get("max_length") and len(value) > v["max_length"]:
                            errors.append(f"{label} exceeds {v['max_length']} characters")
                
                case "long_text":
                    if not isinstance(value, str):
                        errors.append(f"{label} must be text")
                
                case "number":
                    if not isinstance(value, (int, float)):
                        errors.append(f"{label} must be a number")
                    elif field.get("validation"):
                        v = field["validation"]
                        if v.get("min") is not None and value < v["min"]:
                            errors.append(f"{label} must be ≥ {v['min']}")
                        if v.get("max") is not None and value > v["max"]:
                            errors.append(f"{label} must be ≤ {v['max']}")
                
                case "url":
                    if not isinstance(value, str) or not value.startswith("http"):
                        errors.append(f"{label} must be a valid URL")
                
                case "email":
                    if not isinstance(value, str) or "@" not in value:
                        errors.append(f"{label} must be a valid email")
                
                case "dropdown" | "multiple_choice":
                    options = field.get("options", [])
                    if value not in options:
                        errors.append(f"{label}: invalid option '{value}'")
                
                case "checkboxes":
                    options = field.get("options", [])
                    if not isinstance(value, list):
                        errors.append(f"{label} must be a list")
                    elif not all(v in options for v in value):
                        errors.append(f"{label}: invalid option(s)")
                
                case "file_upload":
                    # Value is a list of R2 URLs (already uploaded)
                    if not isinstance(value, list):
                        errors.append(f"{label} must be a list of file URLs")
                
                case "date":
                    # Validate ISO date string
                    try:
                        datetime.fromisoformat(value)
                    except (ValueError, TypeError):
                        errors.append(f"{label} must be a valid date")
                
                case "linear_scale":
                    opts = field.get("options", {})
                    min_val = opts.get("min", 1)
                    max_val = opts.get("max", 10)
                    if not isinstance(value, (int, float)) or not (min_val <= value <= max_val):
                        errors.append(f"{label} must be between {min_val} and {max_val}")
        
        # 4. Check for unknown fields
        known_ids = {f["id"] for f in fields.data}
        for key in form_data:
            if key not in known_ids:
                errors.append(f"Unknown field: {key}")
        
        if errors:
            raise HTTPException(400, {"errors": errors})
    
    async def create_submission(self, event_id, participant_id, data):
        # Verify event is open
        event = supabase.table("events").select("status").eq("id", event_id).single().execute()
        if event.data["status"] != "open":
            raise HTTPException(400, "Event is not accepting submissions")
        
        # Validate form data against field schema
        await self.validate_form_data(event_id, data.form_data)
        
        # Check no duplicate
        existing = supabase.table("submissions") \
            .select("id").eq("event_id", event_id) \
            .eq("participant_id", participant_id).execute()
        if existing.data:
            raise HTTPException(409, "You already submitted to this event")
        
        result = supabase.table("submissions").insert({
            "event_id": event_id,
            "participant_id": participant_id,
            "form_data": data.form_data,
        }).execute()
        
        return result.data[0]
    
    async def enrich_for_display(self, submission: dict):
        """Enrich form_data with field labels and types for frontend display"""
        fields = supabase.table("form_fields") \
            .select("*").eq("event_id", submission["event_id"]) \
            .order("sort_order").execute()
        
        display = []
        for field in fields.data:
            display.append({
                "field_id": field["id"],
                "label": field["label"],
                "field_type": field["field_type"],
                "value": submission["form_data"].get(field["id"]),
            })
        
        submission["form_data_display"] = display
        return submission
```

---

## Step 3: Frontend — Dynamic Form Renderer

### 3.1 Architecture

```
GET /events/{eventId}/form-fields  →  field definitions
                                        │
                                        ▼
                            ┌──────────────────────┐
                            │  DynamicFormRenderer  │
                            │                      │
                            │  Maps field_type →   │
                            │  React component     │
                            └──────────┬───────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
            ShortTextField     FileUploadField    DropdownField
            LongTextField      DateField          CheckboxesField
            NumberField        EmailField         LinearScaleField
            UrlField           MultipleChoiceField
```

### 3.2 Field Type → Component Map

```typescript
// components/submission/FieldRenderer.tsx

const FIELD_COMPONENTS: Record<string, React.FC<FieldProps>> = {
    short_text:      ShortTextField,
    long_text:       LongTextField,
    number:          NumberField,
    url:             UrlField,
    email:           EmailField,
    dropdown:        DropdownField,
    multiple_choice: MultipleChoiceField,
    checkboxes:      CheckboxesField,
    file_upload:     FileUploadField,     // → R2 presigned upload
    date:            DateField,
    linear_scale:    LinearScaleField,
};

export function FieldRenderer({ field, value, onChange, error }: FieldProps) {
    const Component = FIELD_COMPONENTS[field.field_type];
    if (!Component) return null;
    return <Component field={field} value={value} onChange={onChange} error={error} />;
}
```

### 3.3 Individual Field Components

#### `ShortTextField` → Chakra `Input`
- Single line, placeholder from `field.description`
- Character counter if `validation.max_length` exists

#### `LongTextField` → Chakra `Textarea`
- Auto-resize, character counter
- Placeholder from description

#### `NumberField` → Chakra `NumberInput`
- Min/max from `validation`
- Stepper buttons

#### `UrlField` → Chakra `Input` with URL icon prefix
- `type="url"`, validates on blur
- Shows green check when valid URL

#### `EmailField` → Chakra `Input` with email icon prefix
- `type="email"`, validates format

#### `DropdownField` → Chakra `Select`
- Options from `field.options[]`
- Animated dropdown

#### `MultipleChoiceField` → Chakra `RadioGroup`
- Radio buttons from `field.options[]`
- Animated selection with scale effect

#### `CheckboxesField` → Chakra `CheckboxGroup`
- Multi-select from `field.options[]`
- Animated check with bounce effect

#### `FileUploadField` → Custom R2 upload component
- Drag-and-drop zone
- Accepted types from `field.options.accept`
- Max size from `field.options.max_size_mb`
- Upload flow: get presigned URL → PUT to R2 → store public URL
- Progress bar during upload
- Preview: thumbnail for images, video player for videos
- Multiple files if needed

#### `DateField` → Native date input or date picker
- Min/max from `validation`

#### `LinearScaleField` → Chakra `Slider` or numbered radio row
- Min/Max from `field.options`
- Labels from `min_label` / `max_label`
- Number displayed above thumb

### 3.4 Submission Page (`/submit/[eventId]`)

```
┌───────────────────────────────────────────────────┐
│  🏛️ AI Hackathon 2025                             │
│  Submissions close in: 2d 5h 32m ⏰               │
├───────────────────────────────────────────────────┤
│                                                    │
│  ── Your Submission ────────────────────────       │
│                                                    │
│  [Dynamically rendered fields from form_fields]    │
│                                                    │
│  Each field renders as its type:                   │
│  • ShortTextField for "Project Name"               │
│  • LongTextField for "Description"                 │
│  • FileUploadField for "Demo Video" (→ R2)         │
│  • UrlField for "GitHub Repo"                      │
│  • DropdownField for "Track"                       │
│  • CheckboxesField for "Technologies Used"         │
│  • etc.                                            │
│                                                    │
│            [  Submit Project  ▶]                   │
└───────────────────────────────────────────────────┘
```

**Key behaviors:**
- Fetches `form_fields` from API → renders fields dynamically
- Maintains `formData: Record<string, any>` state
- Real-time validation per field (on blur)
- Submit button validates all required fields
- Toast + confetti on successful first submission
- Edit mode: preloads existing `form_data` into fields
- Countdown timer for deadline

### 3.5 Form Animations

- Fields animate in with staggered `fadeInUp` on page load
- Validation errors: shake animation + red border
- File upload: progress bar with smooth fill animation
- Submit button: loading spinner → success checkmark burst
- Confetti on first submission

---

## Step 4: Frontend — Submission List for Organizer

### Organizer view (`/events/[eventId]/submissions`)

- Table/card list of all submissions
- Each row shows values of the first 2-3 form fields (e.g., project name, team)
- Click → expands to show all form_data_display with labels + values
- File uploads shown as clickable thumbnails/links
- Status badge (submitted / in_review / completed)
- Search/filter: by any text field value
- Export all submissions as CSV (field labels as column headers)

---

## Verification Checklist

- [ ] `GET /form-fields` returns ordered field definitions
- [ ] Dynamic form renders all 11 field types correctly
- [ ] `POST /submissions` validates `form_data` against `form_fields`
- [ ] Required field validation catches missing values
- [ ] Type validation catches wrong types (number in text field, etc.)
- [ ] Unknown fields in `form_data` are rejected
- [ ] File upload → R2 presigned URL → successful upload → URL stored
- [ ] Submission creates with correct `form_data` JSONB
- [ ] Edit mode preloads existing data into correct field components
- [ ] Countdown timer displays and animates correctly
- [ ] Organizer submission list shows enriched data with labels
- [ ] All field components render with proper Chakra styling + animations
