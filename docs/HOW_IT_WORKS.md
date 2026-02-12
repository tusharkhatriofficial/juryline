# Juryline — How It Works

A real-world guide to how Juryline works, from creating an event to publishing results. Written for organizers, judges, and participants.

---

## Table of Contents

1. [The Three Roles](#1-the-three-roles)
2. [Creating an Account](#2-creating-an-account)
3. [Organizer: Creating an Event](#3-organizer-creating-an-event)
4. [Organizer: Building the Submission Form](#4-organizer-building-the-submission-form)
5. [Organizer: Setting Judging Criteria](#5-organizer-setting-judging-criteria)
6. [Organizer: Inviting Judges](#6-organizer-inviting-judges)
7. [How Judges Receive & Accept Invitations](#7-how-judges-receive--accept-invitations)
8. [Participant: Submitting Work](#8-participant-submitting-work)
9. [Starting the Judging Phase](#9-starting-the-judging-phase)
10. [How Judge Assignment Works](#10-how-judge-assignment-works)
11. [Judge: Reviewing Submissions](#11-judge-reviewing-submissions)
12. [Scoring & the Leaderboard](#12-scoring--the-leaderboard)
13. [AI Features (Archestra)](#13-ai-features-archestra)
14. [Closing an Event](#14-closing-an-event)
15. [Event Lifecycle Summary](#15-event-lifecycle-summary)

---

## 1. The Three Roles

Juryline has three user roles:

| Role | How they get an account | What they do |
|------|------------------------|--------------|
| **Organizer** | Self-registers on the platform | Creates events, builds forms, sets criteria, invites judges, manages everything |
| **Participant** | Self-registers on the platform | Submits work to open events |
| **Judge** | Invited by an organizer (cannot self-register as judge) | Reviews and scores assigned submissions |

Key point: **No one can sign up as a judge directly.** Judge accounts are created through the invitation process. This ensures judges are always tied to specific events.

---

## 2. Creating an Account

### For Organizers & Participants

1. Go to the Juryline landing page
2. Click **"Register"** (or navigate to `/register`)
3. Choose your role: **Organizer** or **Participant**
4. Fill in your name, email, and password
5. Check your email for a confirmation link
6. Click the link — you're in!

### For Judges (Invitation-Only)

Judges don't register themselves. Here's how it works:

1. An organizer invites a judge by email (see [Section 6](#6-organizer-inviting-judges))
2. The judge receives a **magic link** email
3. Clicking the magic link automatically:
   - Creates their account (if they didn't have one)
   - Sets their role to "judge"
   - Logs them in
   - Redirects them to the dashboard
4. The judge now sees the event(s) they've been invited to

If someone already has a Juryline account (say, as a participant) and they're invited as a judge, the magic link simply logs them in and associates them with the event. Their existing account is used.

---

## 3. Organizer: Creating an Event

Once logged in, an organizer can create a hackathon/competition:

1. Click **"Create New Event"** from the dashboard
2. Fill in:
   - **Event name** — e.g., "Spring Hackathon 2025"
   - **Description** — what the event is about
   - **Submission deadline** — when participants must submit by
3. The event is created in **"draft"** status

While in draft, the organizer can freely edit the submission form, criteria, and settings. Nothing is locked yet.

---

## 4. Organizer: Building the Submission Form

The organizer defines what participants need to submit by building a dynamic form. This is done in the **Form Builder** tab of the event.

### Available Field Types

| Field Type | Use Case | Example |
|-----------|----------|---------|
| **Short Text** | Single-line answers | "Team Name", "Project Title" |
| **Long Text** | Multi-line answers | "Describe your approach", "What problem does it solve?" |
| **Dropdown** | Pick one from a list | "Category: AI / Web / Mobile / Hardware" |
| **Checkbox** | Select multiple options | "Technologies used: React, Python, Docker, etc." |
| **File Upload** | Attach documents, images, code | "Upload your demo video", "Attach your slide deck" |
| **Linear Scale** | Rate on a numeric scale | "Confidence level (1-10)" |

Each field has:
- A label (the question text)
- A type (from the list above)
- Required or optional setting
- Options (for dropdown and checkbox fields)

### Editing Rules

- Fields can only be edited while the event is in **draft** status
- Once the event opens for submissions, the form is **locked**
- The locked view shows a preview of what participants will see

---

## 5. Organizer: Setting Judging Criteria

Judges need to know what to evaluate. The organizer defines **criteria** in the Criteria tab:

For each criterion, set:
- **Name** — e.g., "Innovation", "Technical Execution", "Presentation"
- **Description** — what this criterion means
- **Max score** — the maximum score for this criterion
- **Weight** — how heavily this criterion counts toward the final score

Example setup for a typical hackathon:

| Criterion | Max Score | Weight |
|-----------|-----------|--------|
| Innovation | 10 | 30% |
| Technical Execution | 10 | 30% |
| User Experience | 10 | 20% |
| Presentation Quality | 10 | 20% |

### Requirements

- The event must have **at least one criterion** before it can be opened
- Criteria can only be added/edited while the event is in draft

---

## 6. Organizer: Inviting Judges

This is a key workflow in Juryline. Judges are invited by email.

### How to Invite

1. Go to your event → **Judges** tab
2. Enter the judge's email address
3. Click **"Invite"**

### What Happens Behind the Scenes

1. The system checks if this email already has a Juryline account
2. If not, **an account is automatically created** for them with the role "judge"
3. An `event_judges` record is created, linking this judge to the event with status **"pending"**
4. A **magic link email** is generated and sent to the judge
5. The Judges tab shows this judge with a "pending" badge

### After Inviting

- The organizer can see all invited judges and their status (pending / accepted)
- The organizer can remove a judge if needed
- Multiple judges can be invited to the same event

---

## 7. How Judges Receive & Accept Invitations

### The Judge's Experience

1. They receive an email with a **magic link**
2. They click the link
3. They're automatically:
   - Logged in (account created if needed)
   - Redirected to the Juryline dashboard
4. On their dashboard, they see the events they've been invited to
5. Their status on the event automatically changes from **"pending"** to **"accepted"** once they interact with the event

### Important Notes

- Judges do NOT need to remember a password — they authenticate via magic link
- If a judge is invited to multiple events, they see all of them on their dashboard
- Judges can only see submissions they've been assigned to (not all submissions)

---

## 8. Participant: Submitting Work

### How Participants Find the Submission Form

There are two ways:

**Option A: Direct Link (most common)**
- The organizer shares a submission link: `https://juryline.com/submit/<event-id>`
- Anyone with this link can submit — they just need to log in or register first
- If someone visits the link without being logged in, they see a **sign-in gate** and can register right there

**Option B: Browse Events**
- Participants can also find events from their dashboard or event listings

### The Submission Flow

1. Participant opens the submission link
2. If not logged in, they're prompted to sign in or register  
3. They see the form the organizer built (all the fields from Section 4)
4. They fill in text fields, select dropdowns, check boxes, and upload files
5. They click **Submit**
6. Their submission appears with **"submitted"** status

### File Uploads

When a participant uploads a file:
1. The frontend requests a **presigned upload URL** from the backend
2. The file is uploaded **directly** to Cloudflare R2 (not through the backend)
3. The file URL is saved as part of the submission data
4. Judges can later view/download these files

### Editing Submissions

- Participants can update existing submissions while the event is in **"open"** status
- Once the event moves to **"judging"**, submissions are locked

---

## 9. Starting the Judging Phase

When the organizer is ready to begin judging:

### Prerequisites

Before the event can move from "open" to "judging", it must have:
- At least **one criterion** defined
- At least **one form field** defined
- At least **one judge** invited (ideally more, for balanced reviewing)
- At least some **submissions** to judge

### How It Works

1. Organizer goes to the event **Settings** tab
2. Changes the event status from **"open"** to **"judging"**
3. This triggers the **judge assignment** process (automatic — see next section)
4. Judges can now start reviewing their assigned submissions

---

## 10. How Judge Assignment Works

When judging begins, each submission needs to be assigned to judges. Juryline handles this automatically:

### With Archestra AI Enabled

The AI assignment agent analyzes:
- The number of judges and submissions
- The target number of judges per submission (default: 3)
- Optimizes for balanced workload distribution

### Without Archestra (Fallback)

The deterministic fallback uses **balanced round-robin assignment**:
1. Each submission is assigned to `judges_per_submission` judges (default: 3)
2. Judges are distributed as evenly as possible
3. No judge gets significantly more work than another
4. The system ensures every submission has enough reviewers

### Key Rules

- Each judge only sees **their assigned submissions**, not all of them
- A single judge can review multiple submissions
- A single submission is reviewed by multiple judges (typically 3)
- Judges cannot review the same submission twice

---

## 11. Judge: Reviewing Submissions

### The Review Experience

1. The judge opens their event from the dashboard
2. They see a **card-based review interface** — one submission at a time
3. For each submission, they see:
   - All the participant's submitted data (text answers, file attachments, etc.)
   - Each criterion that needs scoring
4. For each criterion, they:
   - Adjust the **score** using a slider (0 to max score)
   - Optionally add **notes** for that criterion
5. They click **"Submit Review"** to save

### Navigation

Judges navigate between submissions using:
- **Arrow buttons** (previous / next)
- **Keyboard shortcuts** (left/right arrows for navigation)
- A progress indicator showing "Reviewing 2/5 submissions"

### Viewing Submitted Data

The review card displays each field from the submission form:
- **Text fields**: Shown inline
- **File uploads**: Shown as download links or previews
- **Dropdowns/Checkboxes**: Show selected values
- **Linear scales**: Show the chosen number

### Review Status

- Each assignment starts as **"assigned"** (not yet reviewed)
- After submitting a review, it changes to **"reviewed"**
- Judges can update their scores until the event is closed

---

## 12. Scoring & the Leaderboard

### How Scores Are Calculated

Each submission's final score is computed from all its reviews:

1. **Per-review score**: For each judge's review, the weighted criterion scores are summed
2. **Final score**: All reviews for a submission are averaged

**Formula**: 

$$\text{Final Score} = \frac{1}{n}\sum_{j=1}^{n}\left(\sum_{c=1}^{m} \frac{\text{score}_{j,c}}{\text{max}_{c}} \times \text{weight}_{c}\right)$$

Where $n$ is the number of judges who reviewed, $m$ is the number of criteria, and weights are normalized to sum to 1 (or percentages sum to 100).

### The Leaderboard

The organizer (and judges) can see a **live leaderboard** on the Dashboard tab:
- Submissions ranked by final weighted score
- Gold/Silver/Bronze indicators for the top 3
- Score breakdown per criterion
- Number of reviews completed vs. total

### With Archestra AI

If Archestra is enabled, the aggregation agent provides:
- Bias detection (flagging outlier scores)
- Confidence-adjusted scoring
- More sophisticated ranking

---

## 13. AI Features (Archestra)

When Archestra is configured, the following AI features activate:

### Smart Judge Assignment
Instead of simple round-robin, the AI considers workload optimization and can factor in judge expertise for better matching.

### Progress Monitoring
The AI tracks judging progress and can predict completion times, identify lagging judges, and suggest reminders.

### Intelligent Score Aggregation
Goes beyond simple averaging — detects scoring bias, adjusts for judge leniency/strictness, and provides confidence scores.

### AI Feedback Generation
The organizer (or judges) can click **"Generate AI Feedback"** on a submission to get a synthesized summary of all reviews. This is useful for giving structured feedback to participants.

### Graceful Fallback

If any Archestra agent is unavailable or not configured:
- The system silently falls back to the deterministic Python implementation
- No error is shown to the user
- All features work, just without the AI enhancement
- This means you can demo the full platform without Archestra

---

## 14. Closing an Event

When judging is complete:

1. Organizer goes to **Settings** tab
2. Changes status to **"closed"**
3. This:
   - Locks all reviews (no more changes)
   - Finalizes the leaderboard
   - Prevents new submissions

---

## 15. Event Lifecycle Summary

```
DRAFT ──→ OPEN ──→ JUDGING ──→ CLOSED
```

| Status | What's Happening | Who's Active |
|--------|-----------------|--------------|
| **Draft** | Organizer builds the event: form fields, criteria, settings | Organizer only |
| **Open** | Participants submit their work | Participants |
| **Judging** | Judges review and score assigned submissions | Judges, Organizer (monitoring) |
| **Closed** | Results are final, leaderboard is locked | Everyone (view-only) |

### What Gets Locked at Each Transition

| Transition | What Gets Locked |
|-----------|-----------------|
| Draft → Open | Form fields, criteria (no more editing) |
| Open → Judging | Submissions (no more changes), judge assignments made |
| Judging → Closed | Reviews (no more score changes), leaderboard finalized |

---

## Quick Reference: Who Does What

### Organizer
- Creates events
- Designs submission forms
- Sets judging criteria (with weights)
- Invites judges by email
- Controls event lifecycle (draft → open → judging → closed)
- Views leaderboard and progress
- Can request AI feedback for submissions

### Judge
- Receives magic link invitation (no password needed)
- Reviews only assigned submissions
- Scores each criterion using sliders
- Adds optional notes per criterion
- Navigates submissions with cards/keyboard

### Participant
- Registers with email and password
- Submits work via the event submission link
- Uploads files (documents, images, etc.)
- Can update submissions while the event is open
