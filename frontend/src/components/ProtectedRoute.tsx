"use client";

import { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Center, Spinner } from "@chakra-ui/react";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
    /** If provided, renders this instead of redirecting when user is not authenticated */
    fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, allowedRoles, fallback }: ProtectedRouteProps) {
    const { user, loading, role } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (!loading && !user && !fallback) {
            const returnTo = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
            router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
        }

        if (!loading && user && allowedRoles && role && !allowedRoles.includes(role)) {
            router.push("/dashboard");
        }
    }, [user, loading, role, allowedRoles, router, pathname, searchParams, fallback]);

    if (loading) {
        return (
            <Center minH="100vh" bg="gray.900">
                <Spinner size="xl" color="brand.400" thickness="3px" />
            </Center>
        );
    }

    if (!user) {
        if (fallback) return <>{fallback}</>;
        return null;
    }

    if (allowedRoles && role && !allowedRoles.includes(role)) return null;

    return <>{children}</>;
}
