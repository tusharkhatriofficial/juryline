import axios from "axios";
import { createClient } from "@/lib/supabase/client";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Attach Supabase JWT to every request
api.interceptors.request.use(async (config) => {
    const supabase = createClient();
    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }

    return config;
});

// Global error handler
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired — redirect to login
            if (typeof window !== "undefined") {
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default api;
