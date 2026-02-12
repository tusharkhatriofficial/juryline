"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Center, Spinner, Text, VStack } from "@chakra-ui/react";
import { createClient } from "@/lib/supabase/client";

/**
 * Client-side auth confirmation page.
 * 
 * Supabase magic links / invite links redirect here with token info
 * in the URL hash fragment (#access_token=...&type=magiclink).
 * Hash fragments are never sent to the server, so the server-side
 * callback route can't process them — this client page handles it.
 * 
 * The Supabase client SDK automatically detects the hash params
 * via onAuthStateChange and establishes the session.
 */
function AuthConfirmContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const eventId = searchParams.get("event_id");
    const [status, setStatus] = useState("Verifying your sign-in link...");

    useEffect(() => {
        const supabase = createClient();

        // The Supabase client SDK automatically detects hash fragment tokens
        // and processes them. We listen for the session to be established.
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (
                event === "SIGNED_IN" ||
                event === "TOKEN_REFRESHED" ||
                event === "INITIAL_SESSION"
            ) {
                if (session?.user) {
                    const role = session.user.user_metadata?.role;

                    // Judge with event_id → go to invitation page
                    if (role === "judge" && eventId) {
                        setStatus("Redirecting to your invitation...");
                        router.replace(`/judge/invite/${eventId}`);
                        return;
                    }

                    // Otherwise → dashboard
                    setStatus("Redirecting to dashboard...");
                    router.replace("/dashboard");
                    return;
                }
            }
        });

        // Safety timeout: if nothing happens in 5 seconds, 
        // there's probably no valid token — redirect to login
        const timeout = setTimeout(() => {
            setStatus("Link may be expired. Redirecting to login...");
            setTimeout(() => router.replace("/login"), 1500);
        }, 5000);

        return () => {
            subscription.unsubscribe();
            clearTimeout(timeout);
        };
    }, [router, eventId]);

    return (
        <VStack spacing={4}>
            <Spinner size="xl" color="brand.400" thickness="3px" />
            <Text color="whiteAlpha.600" fontSize="sm">
                {status}
            </Text>
        </VStack>
    );
}

export default function AuthConfirmPage() {
    return (
        <Box minH="100vh" bg="gray.900">
            <Center minH="100vh">
                <Suspense
                    fallback={
                        <VStack spacing={4}>
                            <Spinner size="xl" color="brand.400" thickness="3px" />
                            <Text color="whiteAlpha.600" fontSize="sm">
                                Loading...
                            </Text>
                        </VStack>
                    }
                >
                    <AuthConfirmContent />
                </Suspense>
            </Center>
        </Box>
    );
}
