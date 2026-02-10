import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");

    if (code) {
        const supabase = await createServerSupabaseClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Get user role for redirect
            const {
                data: { user },
            } = await supabase.auth.getUser();
            const role = user?.user_metadata?.role;

            const redirectMap: Record<string, string> = {
                organizer: "/dashboard",
                judge: "/dashboard",
                participant: "/dashboard",
            };

            const redirectTo = redirectMap[role || ""] || "/dashboard";
            return NextResponse.redirect(`${origin}${redirectTo}`);
        }
    }

    // Fallback: redirect to login on error
    return NextResponse.redirect(`${origin}/login`);
}
