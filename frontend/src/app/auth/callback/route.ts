import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const eventId = searchParams.get("event_id");
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");

    // Handle PKCE code exchange (email/password sign-ups, OAuth)
    if (code) {
        const supabase = await createServerSupabaseClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            const role = user?.user_metadata?.role;

            if (role === "judge" && eventId) {
                return NextResponse.redirect(
                    `${origin}/judge/invite/${eventId}`
                );
            }

            const redirectTo =
                { organizer: "/dashboard", judge: "/dashboard", participant: "/dashboard" }[
                    role || ""
                ] || "/dashboard";
            return NextResponse.redirect(`${origin}${redirectTo}`);
        }
    }

    // Handle token_hash verification (magic links, invite links)
    // Supabase may send token_hash as a query param after server-side redirect
    if (tokenHash && type) {
        const supabase = await createServerSupabaseClient();
        const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as any,
        });

        if (!error) {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            const role = user?.user_metadata?.role;

            if (role === "judge" && eventId) {
                return NextResponse.redirect(
                    `${origin}/judge/invite/${eventId}`
                );
            }

            const redirectTo =
                { organizer: "/dashboard", judge: "/dashboard", participant: "/dashboard" }[
                    role || ""
                ] || "/dashboard";
            return NextResponse.redirect(`${origin}${redirectTo}`);
        }
    }

    // If we have an event_id but couldn't process the token server-side,
    // redirect to the client-side handler which can read hash fragments
    // (hash fragments are never sent to the server)
    return NextResponse.redirect(
        `${origin}/auth/confirm${eventId ? `?event_id=${eventId}` : ""}`
    );
}
