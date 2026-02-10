# Phase 03 — Event Management, Form Builder & Criteria (Organizer)

## Goal
Build the full organizer experience: create/edit events, **design custom submission forms (Google Forms-style)**, define judging criteria, manage event lifecycle, and invite judges — all using Supabase.

---

## Step 1: Backend — Event CRUD

### 1.1 Pydantic Models (`app/models/event.py`)

```python
class EventCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    start_at: datetime
    end_at: datetime
    judges_per_submission: int = Field(default=2, ge=1, le=10)

class EventUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None

class EventResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    start_at: str
    end_at: str
    status: str
    judges_per_submission: int
    submission_count: int = 0
    judge_count: int = 0
    form_field_count: int = 0
    created_at: str
```

### 1.2 Event Router (`app/routers/events.py`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/events` | POST | Organizer | Create event |
| `/api/v1/events` | GET | Organizer | List organizer's events |
| `/api/v1/events/{id}` | GET | Any auth | Get event details |
| `/api/v1/events/{id}` | PUT | Organizer (owner) | Update event |
| `/api/v1/events/{id}` | DELETE | Organizer (owner) | Delete draft event |
| `/api/v1/events/{id}/status` | PATCH | Organizer (owner) | Transition event status |

### 1.3 Event Service Logic

```python
class EventService:
    async def transition_status(self, event_id: str, new_status: str):
        event = await self.get_event(event_id)
        current = event["status"]
        
        valid_transitions = {
            "draft": ["open"],
            "open": ["judging"],
            "judging": ["closed"],
        }
        
        if new_status not in valid_transitions.get(current, []):
            raise HTTPException(400, f"Cannot transition from {current} to {new_status}")
        
        # Pre-conditions for opening
        if new_status == "open":
            criteria = supabase.table("criteria").select("id").eq("event_id", event_id).execute()
            if not criteria.data:
                raise HTTPException(400, "Add at least 1 judging criterion before opening")
            
            fields = supabase.table("form_fields").select("id").eq("event_id", event_id).execute()
            if not fields.data:
                raise HTTPException(400, "Add at least 1 form field before opening")
        
        supabase.table("events").update({"status": new_status}).eq("id", event_id).execute()
```

---

## Step 2: Backend — Form Builder CRUD (⭐ NEW — Google Forms-style)

### 2.1 Field Type System

| Type | Input | Options Column | Example |
|------|-------|---------------|---------|
| `short_text` | Single-line text | `validation: {min_length, max_length}` | "Project Name" |
| `long_text` | Multi-line textarea | `validation: {max_length}` | "Description" |
| `number` | Numeric input | `validation: {min, max}` | "Team Size" |
| `url` | URL input | `validation: {pattern}` | "Demo URL" |
| `email` | Email input | — | "Team Lead Email" |
| `dropdown` | Select from list | `options: ["A", "B", "C"]` | "Category" |
| `multiple_choice` | Radio buttons | `options: ["A", "B", "C"]` | "Track" |
| `checkboxes` | Multi-select | `options: ["A", "B", "C"]` | "Technologies Used" |
| `file_upload` | Upload to R2 | `options: {accept: ["image/*"], max_size_mb: 100}` | "Demo Video" |
| `date` | Date picker | `validation: {min_date, max_date}` | "Start Date" |
| `linear_scale` | Slider / radio 1-N | `options: {min: 1, max: 10, min_label, max_label}` | "Confidence" |

### 2.2 Form Field Models (`app/models/form_field.py`)

```python
class FormFieldCreate(BaseModel):
    label: str = Field(..., min_length=1, max_length=255)
    field_type: Literal[
        "short_text", "long_text", "number", "url", "email",
        "dropdown", "multiple_choice", "checkboxes",
        "file_upload", "date", "linear_scale"
    ]
    description: Optional[str] = None
    is_required: bool = False
    options: Optional[dict | list] = None   # varies by type
    validation: Optional[dict] = None

class FormFieldUpdate(BaseModel):
    label: Optional[str] = None
    description: Optional[str] = None
    is_required: Optional[bool] = None
    options: Optional[dict | list] = None
    validation: Optional[dict] = None

class FormFieldResponse(BaseModel):
    id: str
    event_id: str
    label: str
    field_type: str
    description: Optional[str]
    is_required: bool
    options: Optional[dict | list]
    validation: Optional[dict]
    sort_order: int
```

### 2.3 Form Field Router (`app/routers/form_fields.py`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/events/{event_id}/form-fields` | POST | Organizer | Add field |
| `/api/v1/events/{event_id}/form-fields` | GET | Any auth | Get all fields (ordered) |
| `/api/v1/events/{event_id}/form-fields/{id}` | PUT | Organizer | Update field |
| `/api/v1/events/{event_id}/form-fields/{id}` | DELETE | Organizer | Delete field |
| `/api/v1/events/{event_id}/form-fields/reorder` | PUT | Organizer | Reorder fields |
| `/api/v1/events/{event_id}/form-fields/duplicate/{id}` | POST | Organizer | Duplicate a field |

### 2.4 Business Rules

- **Lock after open**: Cannot add/edit/delete form fields when event status ≠ `draft`
- **At least 1 field required** before `draft → open`
- **Duplicate field**: copies all properties, appends "(Copy)" to label
- **Reorder**: accepts `[{ id, sort_order }]` array, batch updates

---

## Step 3: Backend — Criteria CRUD (unchanged, separate from form fields)

Criteria = what judges **rate** on (Innovation, Design, etc.)
Form fields = what participants **fill out** (Project Name, Demo Video, etc.)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/events/{event_id}/criteria` | POST | Organizer | Add criterion |
| `/api/v1/events/{event_id}/criteria` | GET | Any auth | List criteria |
| `/api/v1/events/{event_id}/criteria/{id}` | PUT | Organizer | Update criterion |
| `/api/v1/events/{event_id}/criteria/{id}` | DELETE | Organizer | Delete criterion |
| `/api/v1/events/{event_id}/criteria/reorder` | PUT | Organizer | Reorder criteria |

---

## Step 4: Backend — Judge Invitation

### 4.1 Judge Router

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/events/{event_id}/judges` | GET | Organizer | List invited judges |
| `/api/v1/events/{event_id}/judges/invite` | POST | Organizer | Invite judge (magic link) |
| `/api/v1/events/{event_id}/judges/{id}` | DELETE | Organizer | Remove judge |

### 4.2 Invite Flow (Supabase magic links)

1. Organizer enters judge email + name
2. Backend calls `supabase.auth.admin.generate_link()` → creates user if not exists
3. Backend creates `event_judges` record
4. Returns invite URL to organizer → organizer shares it manually
5. Judge clicks link → verified + logged in → redirected to review page

---

## Step 5: Frontend — Organizer Pages

### 5.1 Dashboard / Events List (`/dashboard`)

- **Animated card grid** of all events
- Each card: name, status badge (color-coded), date range, stats
- Status badge colors: draft=gray, open=green, judging=orange, closed=blue
- "Create Event" floating action button
- Staggered fade-in animation on load

### 5.2 Create Event Page (`/events/new`)

- Clean form: Event name, Description, Start/End date, Judges per submission
- Animated form with Framer Motion `fadeInUp`
- Save → redirects to event detail with form builder

### 5.3 Event Detail Page (`/events/[eventId]`)

- Event header: name, status badge, date range
- **4 Tabs**:
  - **📝 Form Builder** → Google Forms-style field editor (⭐ NEW)
  - **📊 Criteria** → judging criteria editor
  - **👨‍⚖️ Judges** → invite + manage judges
  - **📋 Submissions** → list (when event is open+)
  - **🏆 Leaderboard** → scoring results (when judging+)
- Status transition buttons in header

### 5.4 ⭐ Form Builder Tab (THE HERO FEATURE)

This is the Google Forms-style drag-and-drop form creator. **Must look modern, premium, and buttery smooth.**

#### Layout:

```
┌─────────────────────────────────────────────────────────────┐
│  📝 Submission Form                     [Preview] [+ Add]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─ 1 ──────────────────────────────── ≡ ──── ✎ 🗑 ──────┐ │
│  │  Project Name *                               short_text │ │
│  │  ┌────────────────────────────────────────────────────┐ │ │
│  │  │  Short answer text                                 │ │ │
│  │  └────────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─ 2 ──────────────────────────────── ≡ ──── ✎ 🗑 ──────┐ │
│  │  Project Description                          long_text │ │
│  │  ┌────────────────────────────────────────────────────┐ │ │
│  │  │  Long answer text                                  │ │ │
│  │  │                                                    │ │ │
│  │  └────────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─ 3 ──────────────────────────────── ≡ ──── ✎ 🗑 ──────┐ │
│  │  Demo Video *                              file_upload │ │
│  │  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐ │ │
│  │  │  📁 Drag & drop or click (video/*, max 500MB)     │ │ │
│  │  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘ │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─ 4 ──────────────────────────────── ≡ ──── ✎ 🗑 ──────┐ │
│  │  Track *                           multiple_choice │ │
│  │  ○ AI/ML    ○ Web3    ○ FinTech    ○ HealthTech        │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │             + Add Field                                  │ │
│  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐     │ │
│  │  │ Aa  │ │ ¶   │ │ #   │ │ 🔗  │ │ 📁  │ │ ▼   │     │ │
│  │  │Short│ │Long │ │Num  │ │URL  │ │File │ │Drop │     │ │
│  │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘     │ │
│  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐             │ │
│  │  │ ○   │ │ ☑   │ │ 📅  │ │ 📧  │ │ ━●━ │             │ │
│  │  │Radio│ │Check│ │Date │ │Email│ │Scale│             │ │
│  │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘             │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Key Components:

##### `FormFieldCard` — Each field in the builder
- Number badge (1, 2, 3...) on left
- Field label (editable inline on click)
- Type badge (color-coded pill)
- Required indicator (red asterisk)
- Actions: Edit (opens config panel), Delete, Drag handle (≡)
- Preview: shows what the field will look like to participants
- Animated entrance (slideDown), animated removal (slideUp + fadeOut)

##### `AddFieldPanel` — Type selector grid
- Icon grid with 11 field types
- Each type: icon + label
- Hover: scale up + tooltip with description
- Click → instantly adds field with default config → opens editor
- Animated grid entrance on open

##### `FieldEditor` — Slide-out config panel (per field)
- Opens as a right slide-out or modal when clicking ✎ on a field
- Configuration depends on field type:

| Setting | Applies To | UI Element |
|---------|-----------|------------|
| Label | All | Text input |
| Description / Helper text | All | Textarea |
| Required toggle | All | Switch |
| Options list | dropdown, multiple_choice, checkboxes | Editable list + "Add option" |
| Min / Max value | number, linear_scale | Number inputs |
| Min / Max label | linear_scale | Text inputs ("Bad"/"Great") |
| Accepted file types | file_upload | Checkboxes (images/videos/PDFs) |
| Max file size (MB) | file_upload | Number input |
| Min / Max length | short_text, long_text | Number inputs |
| URL pattern | url | Dropdown (Any / GitHub / YouTube) |

##### `FormPreview` — Live preview modal
- "Preview" button → opens full-screen modal
- Shows the form exactly as participants will see it
- All fields rendered read-only (disabled inputs)
- Animated modal entrance

##### Drag-and-Drop Reorder
- Grab ≡ handle → drag to reorder
- Animated placeholder indicator while dragging
- On drop → `PUT /form-fields/reorder` with new sort_order values
- Smooth spring animation on rearrange

#### Animations:
- **Add field**: new card slides down from type selector, soft bounce
- **Delete field**: card fades + slides up, remaining cards close gap smoothly
- **Reorder**: spring physics drag animation
- **Edit panel**: slides in from right, darkened backdrop
- **Field type hover**: gentle scale + shadow increase

### 5.5 Criteria Editor Tab

Same as before — list of judging criteria with inline editing, separate from form fields.
- Each row: name, min, max, weight, edit/delete
- "Add Criterion" → slides in a new form row
- Lock indicator when event is no longer in draft

### 5.6 Judge Management Tab

- Table of invited judges: name, email, status (pending/accepted)
- "Invite Judge" form: name + email inputs
- "Copy Invite Link" button → toast confirmation

---

## Verification Checklist

- [ ] Create event → saved in Supabase, visible in dashboard
- [ ] Event CRUD: update name, description, dates
- [ ] Status transitions enforce valid paths
- [ ] Cannot open event without at least 1 form field AND 1 criterion
- [ ] **Form field CRUD**: add all 11 types, edit, delete, reorder
- [ ] **Drag-and-drop reorder** persists new order to DB
- [ ] **Field editor** shows correct config options per field type
- [ ] **Form preview** renders all field types correctly
- [ ] **Duplicate field** creates copy with "(Copy)" suffix
- [ ] Lock: cannot modify form fields after event opens
- [ ] Criteria CRUD works; locked after event opens
- [ ] Judge invitation returns magic link URL
- [ ] All form builder animations run at 60fps
