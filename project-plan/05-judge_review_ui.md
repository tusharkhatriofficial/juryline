# Phase 05 — Judge Card-Based Review UI

## Goal
Build the core judging experience: a focused, card-based review flow where judges see one submission at a time (including R2-hosted videos/images), rate each criterion with dynamic sliders, add notes, and navigate with keyboard shortcuts.

---

## Step 1: Backend — Review & Queue System

### 1.1 Review Models (`app/models/review.py`)

```python
class ReviewCreate(BaseModel):
    submission_id: str
    scores: dict[str, float]  # { criterion_id: score_value }
    notes: Optional[str] = Field(None, max_length=5000)

class ReviewUpdate(BaseModel):
    scores: Optional[dict[str, float]] = None
    notes: Optional[str] = None

class ReviewResponse(BaseModel):
    id: str
    submission_id: str
    judge_id: str
    event_id: str
    scores: dict[str, float]
    notes: Optional[str]
    submitted_at: str

class JudgeQueueResponse(BaseModel):
    total_assigned: int
    completed: int
    remaining: int
    current_index: int  # Resume position (first uncompleted)
    submissions: list[SubmissionWithReviewStatus]

class SubmissionWithReviewStatus(BaseModel):
    submission: SubmissionResponse  # Includes form_data + form_data_display
    form_fields: list[FormFieldResponse]  # Field definitions for rendering
    review: Optional[ReviewResponse]
    is_completed: bool
```

### 1.2 Review Router

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/judges/queue/{event_id}` | GET | Judge | Get queue + form fields + progress |
| `/api/v1/reviews` | POST | Judge | Submit/save a review |
| `/api/v1/reviews/{id}` | PUT | Judge | Update existing review |
| `/api/v1/reviews/{id}` | GET | Judge/Organizer | Get single review |
| `/api/v1/events/{event_id}/reviews` | GET | Organizer | All reviews for event |

### 1.3 Review Service (Supabase queries)

```python
class ReviewService:
    async def get_judge_queue(self, judge_id: str, event_id: str):
        # 1. Get event's form field definitions (for rendering submission data)
        form_fields = supabase.table("form_fields") \
            .select("*").eq("event_id", event_id) \
            .order("sort_order").execute()
        
        # 2. Get all assignments for this judge + event
        assignments = supabase.table("judge_assignments") \
            .select("*, submissions(*)") \
            .eq("judge_id", judge_id) \
            .eq("event_id", event_id) \
            .order("assigned_at") \
            .execute()
        
        # 3. Get existing reviews by this judge for this event
        reviews = supabase.table("reviews") \
            .select("*") \
            .eq("judge_id", judge_id) \
            .eq("event_id", event_id) \
            .execute()
        
        # 4. Enrich each submission's form_data with field labels
        # 5. Build queue with review status
        # 6. Find resume position (first uncompleted)
        # 7. Include form_fields in response so frontend knows how to render
        
    async def create_or_update_review(self, judge_id: str, data: ReviewCreate):
        # 1. Verify judge is assigned to this submission
        assignment = supabase.table("judge_assignments") \
            .select("*") \
            .eq("judge_id", judge_id) \
            .eq("submission_id", data.submission_id) \
            .single().execute()
        
        if not assignment.data:
            raise HTTPException(403, "Not assigned to this submission")
        
        # 2. Verify event is in "judging" status
        # 3. Validate scores against criteria
        # 4. Upsert review (insert or update on conflict)
        supabase.table("reviews").upsert({
            "submission_id": data.submission_id,
            "judge_id": judge_id,
            "event_id": assignment.data["event_id"],
            "scores": data.scores,
            "notes": data.notes,
        }, on_conflict="submission_id,judge_id").execute()
        
        # 5. Mark assignment as completed
        supabase.table("judge_assignments") \
            .update({"status": "completed"}) \
            .eq("id", assignment.data["id"]).execute()
```

### 1.4 Score Validation

```python
async def validate_scores(self, event_id: str, scores: dict):
    criteria = supabase.table("criteria") \
        .select("*").eq("event_id", event_id).execute()
    
    criteria_map = {c["id"]: c for c in criteria.data}
    
    for crit_id, score in scores.items():
        if crit_id not in criteria_map:
            raise HTTPException(400, f"Unknown criterion: {crit_id}")
        crit = criteria_map[crit_id]
        if not (crit["scale_min"] <= score <= crit["scale_max"]):
            raise HTTPException(400, f"Score {score} out of range for {crit['name']}")
    
    # Ensure ALL criteria are scored
    if set(scores.keys()) != set(criteria_map.keys()):
        raise HTTPException(400, "Must rate all criteria")
```

---

## Step 2: Frontend — Card-Based Review UI

### 2.1 Review Page (`/review/[eventId]`)

**This is THE hero feature. Must feel smooth, modern, and focused.**

#### Page Layout:
```
┌──────────────────────────────────────────────┐
│  ● ● ● ○ ○ ○ ○ ○   3/8 reviewed      [Exit]│
├──────────────────────────────────────────────┤
│                                               │
│  ┌────────────────────────────────────────┐   │
│  │        SUBMISSION CARD                 │   │
│  │                                        │   │
│  │  ── Submission Details ──              │   │
│  │  (Rendered dynamically from form_data) │   │
│  │                                        │   │
│  │  Project Name: "AI Recipe Generator"   │   │  ← short_text
│  │  Description: "An AI-powered..."       │   │  ← long_text
│  │  Team Size: 4                          │   │  ← number
│  │  Track: AI/ML                          │   │  ← multiple_choice
│  │  Technologies: [Python, React, GPT-4]  │   │  ← checkboxes
│  │  Demo URL: https://demo.app ↗          │   │  ← url (clickable)
│  │  ▶ [Demo Video Player]                 │   │  ← file_upload (R2 video)
│  │  🖼 [Image Gallery]                    │   │  ← file_upload (R2 images)
│  │                                        │   │
│  │  ── Rate This Project ──               │   │
│  │  Innovation    [━━━━━━━●━━] 7/10       │   │
│  │  Feasibility   [━━━━●━━━━━] 5/10       │   │
│  │  Design        [━━━━━━━━●━] 8/10       │   │
│  │                                        │   │
│  │  📝 Notes:                             │   │
│  │  ┌──────────────────────────────────┐  │   │
│  │  │ Great concept, needs polish...   │  │   │
│  │  └──────────────────────────────────┘  │   │
│  │                                        │   │
│  │  [◀ Previous]     [Save & Next ▶]      │   │
│  └────────────────────────────────────────┘   │
│                                               │
│  ← → Navigate    Ctrl+Enter Save              │
└──────────────────────────────────────────────┘
```

### 2.2 Components

#### `ReviewCard` — Main submission card (⭐ renders dynamic form_data)
- Framer Motion `AnimatePresence` for slide transitions
- **Renders `form_data_display` dynamically** — each field shown by type:

| Field Type | Display in Review Card |
|-----------|----------------------|
| `short_text` | Label: "value" (bold label, inline text) |
| `long_text` | Label + multi-line text block |
| `number` | Label: value |
| `url` | Label: clickable link with ↗ icon (opens new tab) |
| `email` | Label: clickable mailto link |
| `dropdown` | Label: selected value badge |
| `multiple_choice` | Label: selected value badge |
| `checkboxes` | Label: list of colored tags/chips |
| `file_upload` (video) | Embedded HTML5 `<video>` player (R2 URL) |
| `file_upload` (image) | Thumbnail gallery with lightbox |
| `file_upload` (other) | Download link with file icon |
| `date` | Label: formatted date |
| `linear_scale` | Label: value / max |

- Uses a `SubmissionFieldDisplay` component that maps `field_type` → display

```typescript
// components/judge/SubmissionFieldDisplay.tsx
function SubmissionFieldDisplay({ field, value }: { field: FormField; value: any }) {
    switch (field.field_type) {
        case "file_upload":
            return <FilePreview urls={value} accept={field.options?.accept} />;
        case "url":
            return <ExternalLink href={value} />;
        case "checkboxes":
            return <TagList items={value} />;
        case "long_text":
            return <TextBlock text={value} />;
        // ... etc
    }
}
```

#### `CriteriaSlider` — Dynamic rating input per criterion
- Chakra UI `Slider` with custom track and thumb
- Label: criterion name + weight badge
- Value display: large animated number
- Color gradient track: red → yellow → green
- Generated from event criteria dynamically
- Slider thumb has scale animation on drag

#### `NotesTextarea` — Free-text notes
- Auto-resizing textarea
- Character counter (max 5000)
- Placeholder: "Share your feedback about this project..."

#### `ProgressDots` — Top progress indicator
- Dot per submission: filled = reviewed, empty = pending, current = pulsing
- Fraction text: "3 of 8 reviewed"
- Animated fill on completion

#### `NavigationControls` — Prev / Save & Next
- "Previous" (outline) and "Save & Next" (solid, primary)
- Disabled at boundaries
- Loading state on Save & Next
- Keyboard shortcut hints displayed below

### 2.3 Keyboard Shortcuts

```typescript
useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Don't capture when typing in textarea
        if (e.target instanceof HTMLTextAreaElement) return;
        if (e.target instanceof HTMLInputElement) return;
        
        switch (e.key) {
            case "ArrowLeft":  goToPrevious(); break;
            case "ArrowRight": goToNext(); break;
            case "Enter":
                if (e.metaKey || e.ctrlKey) saveAndNext();
                break;
        }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
}, [currentIndex]);
```

### 2.4 Card Transition Animations

```typescript
const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir < 0 ? 300 : -300, opacity: 0 }),
};

<AnimatePresence custom={direction} mode="wait">
    <motion.div
        key={currentIndex}
        custom={direction}
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.3, ease: "easeInOut" }}
    >
        <ReviewCard ... />
    </motion.div>
</AnimatePresence>
```

### 2.5 Auto-Resume Logic

```typescript
// On mount:
// 1. Fetch queue: GET /judges/queue/{eventId}
// 2. Set currentIndex = response.current_index (first uncompleted)
// 3. Pre-fill slider values if review exists (judge revisiting)

// On Save & Next:
// 1. POST /reviews (or PUT if updating)
// 2. Optimistic UI: mark as completed
// 3. Transition to next card
// 4. If last → show completion screen

// localStorage draft backup:
// Every 10s, save current scores + notes to localStorage
// On load, check for draft → prompt "Resume unsaved review?"
```

### 2.6 Completion Screen

```
🎉 You've reviewed all 8 submissions!

Average score you gave: 6.8/10
Time spent: ~25 minutes

[Review Again]  [Back to Events]
```
- Animated confetti burst
- Stats summary
- Smooth entrance animation

---

## Verification Checklist

- [ ] Judge queue endpoint returns submissions with `form_data_display` + `form_fields`
- [ ] Score validation ensures all criteria rated within bounds
- [ ] Upsert: re-saving a review updates (doesn't duplicate)
- [ ] Assignment marked "completed" after review saved
- [ ] **Dynamic form_data renders correctly** — all 11 field types display properly
- [ ] File uploads show as video players (video) or thumbnail gallery (images)
- [ ] URLs render as clickable links opening in new tabs
- [ ] Checkboxes render as colored tag chips
- [ ] Criteria sliders generated dynamically from event criteria
- [ ] Keyboard shortcuts work (←, →, Ctrl+Enter)
- [ ] Card transitions animate smoothly on navigation
- [ ] Resume position correct (first uncompleted submission)
- [ ] Completion screen shows after all submissions reviewed
- [ ] Notes textarea doesn't capture keyboard shortcuts
- [ ] Previously-saved review pre-fills sliders + notes

