"use client";

import {
    Box,
    Container,
    Heading,
    Text,
    VStack,
    HStack,
    Badge,
    Stat,
    StatLabel,
    StatNumber,
    SimpleGrid,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";

const MotionBox = motion(Box);

function DashboardContent() {
    const { profile, role } = useAuth();

    const displayName = profile?.name || "User";

    return (
        <Box minH="100vh" bg="gray.900">
            <Navbar />

            <Container maxW="container.xl" py={10}>
                <VStack spacing={8} align="stretch">
                    {/* Welcome header */}
                    <MotionBox
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <HStack spacing={3} align="baseline">
                            <Heading size="lg" color="white">
                                Welcome, {displayName}
                            </Heading>
                            <Badge
                                colorScheme={
                                    role === "organizer"
                                        ? "blue"
                                        : role === "judge"
                                            ? "purple"
                                            : "green"
                                }
                                fontSize="sm"
                                px={3}
                                py={0.5}
                                borderRadius="full"
                                textTransform="capitalize"
                            >
                                {role}
                            </Badge>
                        </HStack>
                        <Text color="whiteAlpha.600" mt={2}>
                            {role === "organizer"
                                ? "Manage your events, build submission forms, and invite judges."
                                : role === "judge"
                                    ? "Review assigned submissions and submit your scores."
                                    : "Browse open events and submit your projects."}
                        </Text>
                    </MotionBox>

                    {/* Stats placeholder */}
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                        {[
                            { label: "Events", value: "0" },
                            { label: "Submissions", value: "0" },
                            { label: role === "judge" ? "Reviews" : "Pending", value: "0" },
                        ].map((stat, i) => (
                            <MotionBox
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + i * 0.1, duration: 0.4 }}
                                p={6}
                                borderRadius="2xl"
                                bg="whiteAlpha.50"
                                backdropFilter="blur(20px)"
                                border="1px solid"
                                borderColor="whiteAlpha.100"
                            >
                                <Stat>
                                    <StatLabel color="whiteAlpha.600">{stat.label}</StatLabel>
                                    <StatNumber
                                        fontSize="3xl"
                                        fontWeight="700"
                                        bgGradient="linear(to-r, white, brand.300)"
                                        bgClip="text"
                                    >
                                        {stat.value}
                                    </StatNumber>
                                </Stat>
                            </MotionBox>
                        ))}
                    </SimpleGrid>

                    {/* Content will be filled in later phases */}
                    <MotionBox
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        p={12}
                        borderRadius="2xl"
                        bg="whiteAlpha.50"
                        border="1px solid"
                        borderColor="whiteAlpha.100"
                        textAlign="center"
                    >
                        <Text color="whiteAlpha.400" fontSize="lg">
                            {role === "organizer"
                                ? "Create your first event to get started."
                                : role === "judge"
                                    ? "No events assigned yet. Waiting for invitations."
                                    : "No open events available right now."}
                        </Text>
                    </MotionBox>
                </VStack>
            </Container>
        </Box>
    );
}

export default function DashboardPage() {
    return (
        <ProtectedRoute>
            <DashboardContent />
        </ProtectedRoute>
    );
}
