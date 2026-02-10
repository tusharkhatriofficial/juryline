import api from "@/lib/api";
import type { Event, FormField, Criterion, EventJudge } from "@/lib/types";

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
): Promise<{ message: string; invite_link?: string; judge_id?: string }> {
    const res = await api.post(`/events/${eventId}/judges/invite`, data);
    return res.data;
}

export async function removeJudge(
    eventId: string,
    judgeRecordId: string
): Promise<void> {
    await api.delete(`/events/${eventId}/judges/${judgeRecordId}`);
}
