"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Center, Spinner } from "@chakra-ui/react";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, loading, role } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }

        if (!loading && user && allowedRoles && role && !allowedRoles.includes(role)) {
            router.push("/dashboard");
        }
    }, [user, loading, role, allowedRoles, router]);

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
