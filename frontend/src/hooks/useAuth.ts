"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
    user: User | null;
    session: Session | null;
    loading: boolean;
    profile: Record<string, any> | null;
}

export function useAuth() {
    const [state, setState] = useState<AuthState>({
        user: null,
        session: null,
        loading: true,
        profile: null,
    });

    const supabase = createClient();

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data }) => {
            setState((prev) => ({
                ...prev,
                user: data.session?.user ?? null,
                session: data.session ?? null,
                loading: false,
            }));

            // Fetch profile if logged in
            if (data.session?.user) {
                fetchProfile(data.session.user.id);
            }
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setState((prev) => ({
                ...prev,
                user: session?.user ?? null,
                session: session ?? null,
                loading: false,
            }));

            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setState((prev) => ({ ...prev, profile: null }));
            }
        });

        return () => subscription.unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchProfile = async (userId: string) => {
        const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

        if (data) {
            setState((prev) => ({ ...prev, profile: data }));
        }
    };

    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
        setState({ user: null, session: null, loading: false, profile: null });
    }, [supabase.auth]);

    const role = state.user?.user_metadata?.role || state.profile?.role || null;

    return {
        user: state.user,
        session: state.session,
        profile: state.profile,
        loading: state.loading,
        role,
        signOut,
    };
}
