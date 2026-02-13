import api from "@/lib/api";
import type { Event, FormField, Criterion, EventJudge, Submission, Review, JudgeQueue } from "@/lib/types";

// ── Events ──

export async function createEvent(data: {
    name: string;
    description?: string;
    start_at: string;
    end_at: string;
    judges_per_submission?: number;
}): Promise<Event> {
    const res = await api.post("/events", data);
    return res.data;
}

export async function listEvents(): Promise<Event[]> {
    const res = await api.get("/events");
    return res.data;
}

export async function getEvent(eventId: string): Promise<Event> {
    const res = await api.get(`/events/${eventId}`);
    return res.data;
}

export async function updateEvent(
    eventId: string,
    data: Partial<{
        name: string;
        description: string;
        start_at: string;
        end_at: string;
        judges_per_submission: number;
    }>
): Promise<Event> {
    const res = await api.put(`/events/${eventId}`, data);
    return res.data;
}

export async function deleteEvent(eventId: string): Promise<void> {
    await api.delete(`/events/${eventId}`);
}

export async function transitionEventStatus(
    eventId: string,
    status: string
): Promise<{ status: string; message: string }> {
    const res = await api.patch(`/events/${eventId}/status`, { status });
    return res.data;
}

// ── Form Fields ──

export async function listFormFields(eventId: string): Promise<FormField[]> {
    const res = await api.get(`/events/${eventId}/form-fields`);
    return res.data;
}

export async function addFormField(
    eventId: string,
    data: {
        label: string;
        field_type: string;
        description?: string;
        is_required?: boolean;
        options?: Record<string, any> | string[];
        validation?: Record<string, any>;
    }
): Promise<FormField> {
    const res = await api.post(`/events/${eventId}/form-fields`, data);
    return res.data;
}

export async function updateFormField(
    eventId: string,
    fieldId: string,
    data: Partial<{
        label: string;
        description: string;
        is_required: boolean;
        options: Record<string, any> | string[];
        validation: Record<string, any>;
    }>
): Promise<FormField> {
    const res = await api.put(`/events/${eventId}/form-fields/${fieldId}`, data);
    return res.data;
}

export async function deleteFormField(
    eventId: string,
    fieldId: string
): Promise<void> {
    await api.delete(`/events/${eventId}/form-fields/${fieldId}`);
}

export async function duplicateFormField(
    eventId: string,
    fieldId: string
): Promise<FormField> {
    const res = await api.post(
        `/events/${eventId}/form-fields/duplicate/${fieldId}`
    );
    return res.data;
}

export async function reorderFormFields(
    eventId: string,
    order: { id: string; sort_order: number }[]
): Promise<void> {
    await api.put(`/events/${eventId}/form-fields/reorder`, { order });
}

// ── Criteria ──

export async function listCriteria(eventId: string): Promise<Criterion[]> {
    const res = await api.get(`/events/${eventId}/criteria`);
    return res.data;
}

export async function addCriterion(
    eventId: string,
    data: {
        name: string;
        scale_min?: number;
        scale_max?: number;
        weight?: number;
    }
): Promise<Criterion> {
    const res = await api.post(`/events/${eventId}/criteria`, data);
    return res.data;
}

export async function updateCriterion(
    eventId: string,
    criterionId: string,
    data: Partial<{
        name: string;
        scale_min: number;
        scale_max: number;
        weight: number;
    }>
): Promise<Criterion> {
    const res = await api.put(
        `/events/${eventId}/criteria/${criterionId}`,
        data
    );
    return res.data;
}

export async function deleteCriterion(
    eventId: string,
    criterionId: string
): Promise<void> {
    await api.delete(`/events/${eventId}/criteria/${criterionId}`);
}

// ── Judges ──

export async function listJudges(eventId: string): Promise<EventJudge[]> {
    const res = await api.get(`/events/${eventId}/judges`);
    return res.data;
}

export async function inviteJudge(
    eventId: string,
    data: { email: string; name: string }
): Promise<{ 
    message: string; 
    invite_link?: string; 
    judge_id?: string; 
    email_sent?: boolean;
    email_error?: string;
}> {
    const res = await api.post(`/events/${eventId}/judges/invite`, data);
    return res.data;
}

export async function removeJudge(
    eventId: string,
    judgeRecordId: string
): Promise<void> {
    await api.delete(`/events/${eventId}/judges/${judgeRecordId}`);
}

export async function getInviteInfo(eventId: string): Promise<{
    event: { id: string; name: string; description?: string; status: string };
    organizer: { name: string; email: string } | null;
    invite: { id: string; invite_status: string; invited_at: string } | null;
}> {
    const res = await api.get(`/events/${eventId}/judges/invite-info`);
    return res.data;
}

export async function acceptInvite(eventId: string): Promise<{ message: string }> {
    const res = await api.patch(`/events/${eventId}/judges/accept`);
    return res.data;
}

// ── Uploads (R2 Presigned) ──

export async function getPresignedUploadUrl(
    filename: string,
    contentType: string
): Promise<{ upload_url: string; file_key: string; public_url: string }> {
    const res = await api.post("/uploads/presign", {
        filename,
        content_type: contentType,
    });
    return res.data;
}

export async function uploadFileToR2(
    file: File,
    onProgress?: (pct: number) => void
): Promise<string> {
    const { upload_url, public_url } = await getPresignedUploadUrl(
        file.name,
        file.type
    );

    await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", upload_url);
        xhr.setRequestHeader("Content-Type", file.type);

        if (onProgress) {
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    onProgress(Math.round((e.loaded / e.total) * 100));
                }
            };
        }

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
            } else {
                reject(new Error(`Upload failed: ${xhr.status}`));
            }
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.send(file);
    });

    return public_url;
}

// ── Submissions ──

export async function createSubmission(
    eventId: string,
    formData: Record<string, any>
): Promise<Submission> {
    const res = await api.post(`/events/${eventId}/submissions`, {
        form_data: formData,
    });
    return res.data;
}

export async function listSubmissions(eventId: string): Promise<Submission[]> {
    const res = await api.get(`/events/${eventId}/submissions`);
    return res.data;
}

export async function getMySubmission(eventId: string): Promise<Submission> {
    const res = await api.get(`/events/${eventId}/my-submission`);
    return res.data;
}

export async function getSubmission(submissionId: string): Promise<Submission> {
    const res = await api.get(`/submissions/${submissionId}`);
    return res.data;
}

export async function updateSubmission(
    submissionId: string,
    formData: Record<string, any>
): Promise<Submission> {
    const res = await api.put(`/submissions/${submissionId}`, {
        form_data: formData,
    });
    return res.data;
}

export async function deleteSubmission(submissionId: string): Promise<void> {
    await api.delete(`/submissions/${submissionId}`);
}

// ── Reviews ──

export async function getJudgeQueue(eventId: string): Promise<JudgeQueue> {
    const res = await api.get(`/judges/queue/${eventId}`);
    return res.data;
}

export async function createReview(data: {
    submission_id: string;
    scores: Record<string, number>;
    notes?: string;
}): Promise<Review> {
    const res = await api.post("/reviews", data);
    return res.data;
}

export async function updateReview(
    reviewId: string,
    data: { scores?: Record<string, number>; notes?: string }
): Promise<Review> {
    const res = await api.put(`/reviews/${reviewId}`, data);
    return res.data;
}

export async function getReview(reviewId: string): Promise<Review> {
    const res = await api.get(`/reviews/${reviewId}`);
    return res.data;
}

export async function listEventReviews(eventId: string): Promise<Review[]> {
    const res = await api.get(`/events/${eventId}/reviews`);
    return res.data;
}

// ── Dashboard & Scoring ──

export async function getDashboard(eventId: string): Promise<{
    event: Event;
    stats: {
        total_submissions: number;
        total_judges: number;
        total_reviews: number;
        reviews_completed: number;
        reviews_pending: number;
        completion_percent: number;
        avg_score: number | null;
    };
    judge_progress: Array<{
        judge_id: string;
        judge_name: string;
        assigned: number;
        completed: number;
        percent: number;
        status: string;
    }>;
    leaderboard: Array<{
        rank: number;
        submission_id: string;
        project_name: string;
        weighted_score: number;
        criteria_scores: Record<string, {
            criterion_name: string;
            average: number;
            min_score: number;
            max_score: number;
            weight: number;
        }>;
        review_count: number;
    }>;
}> {
    const res = await api.get(`/events/${eventId}/dashboard`);
    return res.data;
}

export async function getLeaderboard(eventId: string): Promise<Array<{
    rank: number;
    submission_id: string;
    project_name: string;
    weighted_score: number;
    criteria_scores: Record<string, any>;
    review_count: number;
}>> {
    const res = await api.get(`/events/${eventId}/leaderboard`);
    return res.data;
}

export async function getJudgeProgress(eventId: string): Promise<Array<{
    judge_id: string;
    judge_name: string;
    assigned: number;
    completed: number;
    percent: number;
    status: string;
}>> {
    const res = await api.get(`/events/${eventId}/judge-progress`);
    return res.data;
}

export async function getBiasReport(eventId: string): Promise<Array<{
    judge_id: string;
    judge_name: string;
    avg_score_given: number;
    event_avg: number;
    deviation: number;
    is_outlier: boolean;
}>> {
    const res = await api.get(`/events/${eventId}/bias-report`);
    return res.data;
}

export async function exportCSV(eventId: string): Promise<Blob> {
    const res = await api.get(`/events/${eventId}/export`, {
        responseType: "blob",
    });
    return res.data;
}

// ── Archestra ──

export async function archestraAssignJudges(eventId: string): Promise<any> {
    const res = await api.post(`/archestra/assign-judges/${eventId}`);
    return res.data;
}

export async function archestraGetProgress(eventId: string): Promise<any> {
    const res = await api.get(`/archestra/progress/${eventId}`);
    return res.data;
}

export async function archestraAggregateScores(eventId: string): Promise<any> {
    const res = await api.post(`/archestra/aggregate/${eventId}`);
    return res.data;
}

export async function archestraGenerateFeedback(submissionId: string): Promise<any> {
    const res = await api.post(`/archestra/feedback/${submissionId}`);
    return res.data;
}
