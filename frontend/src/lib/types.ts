// ── Juryline TypeScript Interfaces ──

// ── User / Profile ──
export interface UserProfile {
    id: string;
    email: string;
    name: string;
    role: "organizer" | "judge" | "participant";
    avatar_url?: string;
    created_at: string;
    updated_at: string;
}

// ── Event ──
export interface Event {
    id: string;
    organizer_id: string;
    name: string;
    description?: string;
    banner_url?: string;
    start_at: string;
    end_at: string;
    status: "draft" | "open" | "judging" | "closed";
    judges_per_submission: number;
    submission_count?: number;
    judge_count?: number;
    form_field_count?: number;
    criteria_count?: number;
    created_at: string;
    updated_at: string;
}

// ── Form Field (Google Forms-style) ──
export type FieldType =
    | "short_text"
    | "long_text"
    | "number"
    | "url"
    | "email"
    | "dropdown"
    | "multiple_choice"
    | "checkboxes"
    | "file_upload"
    | "date"
    | "linear_scale";

export interface FormField {
    id: string;
    event_id: string;
    label: string;
    field_type: FieldType;
    description?: string;
    is_required: boolean;
    options?: Record<string, any> | string[];
    validation?: Record<string, any>;
    sort_order: number;
    created_at: string;
}

// ── Criterion ──
export interface Criterion {
    id: string;
    event_id: string;
    name: string;
    scale_min: number;
    scale_max: number;
    weight: number;
    sort_order: number;
    created_at: string;
}

// ── Submission ──
export interface Submission {
    id: string;
    event_id: string;
    participant_id: string;
    form_data: Record<string, any>;
    form_data_display?: FormDataDisplayItem[];
    status: "submitted" | "in_review" | "completed";
    created_at: string;
    updated_at: string;
}

export interface FormDataDisplayItem {
    field_id: string;
    label: string;
    field_type: FieldType;
    value: any;
}

// ── Review ──
export interface Review {
    id: string;
    submission_id: string;
    judge_id: string;
    event_id: string;
    scores: Record<string, number>;
    notes?: string;
    submitted_at: string;
    updated_at: string;
}

// ── Judge Queue ──
export interface JudgeQueue {
    total_assigned: number;
    completed: number;
    remaining: number;
    current_index: number;
    submissions: SubmissionWithReview[];
}

export interface SubmissionWithReview {
    submission: Submission;
    form_fields: FormField[];
    review?: Review;
    is_completed: boolean;
}

// ── Event Judge ──
export interface EventJudge {
    id: string;
    event_id: string;
    judge_id: string;
    invite_status: "pending" | "accepted";
    invited_at: string;
}
