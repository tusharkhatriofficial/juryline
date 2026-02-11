"use client";

import { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Center, Spinner } from "@chakra-ui/react";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, loading, role } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (!loading && !user) {
            const returnTo = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
            router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
        }

        if (!loading && user && allowedRoles && role && !allowedRoles.includes(role)) {
            router.push("/dashboard");
        }
    }, [user, loading, role, allowedRoles, router, pathname, searchParams]);

    if (loading) {
        return (
            <Center minH="100vh" bg="gray.900">
                <Spinner size="xl" color="brand.400" thickness="3px" />
            </Center>
        );
    }

    if (!user) return null;

    if (allowedRoles && role && !allowedRoles.includes(role)) return null;

    return <>{children}</>;
}
