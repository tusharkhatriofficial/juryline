-- Juryline Database Schema
-- Migration 001: Initial Schema
-- Creates all core tables for the Juryline hackathon judging platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. Profiles (extends Supabase auth.users)
-- ============================================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('organizer', 'judge', 'participant')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. Events
-- ============================================================
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id UUID NOT NULL REFERENCES profiles(id),
    name TEXT NOT NULL,
    description TEXT,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'judging', 'closed')),
    judges_per_submission INT NOT NULL DEFAULT 2,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. Form Fields (Google Forms-style dynamic fields per event)
-- ============================================================
CREATE TABLE form_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    field_type TEXT NOT NULL CHECK (field_type IN (
        'short_text',
        'long_text',
        'number',
        'url',
        'email',
        'dropdown',
        'multiple_choice',
        'checkboxes',
        'file_upload',
        'date',
        'linear_scale'
    )),
    description TEXT,
    is_required BOOLEAN NOT NULL DEFAULT false,
    options JSONB,
    validation JSONB,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. Criteria (what judges rate on — separate from form fields)
-- ============================================================
CREATE TABLE criteria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    scale_min INT NOT NULL DEFAULT 0,
    scale_max INT NOT NULL DEFAULT 10,
    weight FLOAT DEFAULT 1.0,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. Submissions (dynamic — stores responses to form_fields)
-- ============================================================
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id),
    participant_id UUID NOT NULL REFERENCES profiles(id),
    form_data JSONB NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'in_review', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, participant_id)
);

-- ============================================================
-- 6. Event Judges (invitations)
-- ============================================================
CREATE TABLE event_judges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    judge_id UUID NOT NULL REFERENCES profiles(id),
    invite_status TEXT NOT NULL DEFAULT 'pending' CHECK (invite_status IN ('pending', 'accepted')),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, judge_id)
);

-- ============================================================
-- 7. Judge Assignments
-- ============================================================
CREATE TABLE judge_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id),
    judge_id UUID NOT NULL REFERENCES profiles(id),
    submission_id UUID NOT NULL REFERENCES submissions(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(judge_id, submission_id)
);

-- ============================================================
-- 8. Reviews
-- ============================================================
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES submissions(id),
    judge_id UUID NOT NULL REFERENCES profiles(id),
    event_id UUID NOT NULL REFERENCES events(id),
    scores JSONB NOT NULL,
    notes TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(submission_id, judge_id)
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_form_fields_event ON form_fields(event_id);
CREATE INDEX idx_submissions_event ON submissions(event_id);
CREATE INDEX idx_submissions_participant ON submissions(participant_id);
CREATE INDEX idx_judge_assignments_judge ON judge_assignments(judge_id);
CREATE INDEX idx_judge_assignments_event ON judge_assignments(event_id);
CREATE INDEX idx_reviews_submission ON reviews(submission_id);
CREATE INDEX idx_reviews_judge ON reviews(judge_id);
CREATE INDEX idx_reviews_event ON reviews(event_id);

-- ============================================================
-- Auto-update updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_assignments ENABLE ROW LEVEL SECURITY;

-- Service role full access (backend uses service key)
CREATE POLICY "Service role full access profiles" ON profiles
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access events" ON events
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access submissions" ON submissions
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access reviews" ON reviews
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access form_fields" ON form_fields
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access criteria" ON criteria
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access event_judges" ON event_judges
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access judge_assignments" ON judge_assignments
    FOR ALL USING (auth.role() = 'service_role');

-- Authenticated users can read their own profile
CREATE POLICY "Users can read own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Authenticated users can read events
CREATE POLICY "Authenticated users can read events" ON events
    FOR SELECT USING (auth.role() = 'authenticated');

-- Authenticated users can read form fields
CREATE POLICY "Authenticated users can read form_fields" ON form_fields
    FOR SELECT USING (auth.role() = 'authenticated');

-- Authenticated users can read criteria
CREATE POLICY "Authenticated users can read criteria" ON criteria
    FOR SELECT USING (auth.role() = 'authenticated');
