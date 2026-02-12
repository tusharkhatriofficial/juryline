"use client";

import { useState, useEffect, use } from "react";
import {
    Box,
    Container,
    Heading,
    Text,
    VStack,
    HStack,
    Button,
    Spinner,
    Center,
    Icon,
    Badge,
    Flex,
    useToast,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
    HiOutlineScale,
    HiOutlineEnvelope,
    HiOutlineUser,
    HiOutlineCheckCircle,
    HiOutlineCalendar,
} from "react-icons/hi2";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { getInviteInfo, acceptInvite } from "@/lib/api-services";

const MotionBox = motion.create(Box);

export default function JudgeInvitePage({
    params,
}: {
    params: Promise<{ eventId: string }>;
}) {
    const { eventId } = use(params);
    const router = useRouter();
    const toast = useToast();

    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);
    const [inviteData, setInviteData] = useState<{
        event: { id: string; name: string; description?: string; status: string };
        organizer: { name: string; email: string } | null;
        invite: { id: string; invite_status: string; invited_at: string } | null;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchInvite() {
            try {
                const data = await getInviteInfo(eventId);
                setInviteData(data);
            } catch (err: any) {
                setError(
                    err?.response?.data?.detail || "Failed to load invitation details"
                );
            } finally {
                setLoading(false);
            }
        }
        fetchInvite();
    }, [eventId]);

    const handleAccept = async () => {
        setAccepting(true);
        try {
            await acceptInvite(eventId);
            toast({
                title: "Invitation accepted",
                description: "Welcome aboard! Redirecting to your dashboard...",
                status: "success",
                duration: 2000,
            });
            setTimeout(() => router.push("/dashboard"), 1500);
        } catch (err: any) {
            toast({
                title: "Error",
                description:
                    err?.response?.data?.detail || "Failed to accept invitation",
                status: "error",
                duration: 4000,
            });
        } finally {
            setAccepting(false);
        }
    };

    const handleDecline = () => {
        router.push("/dashboard");
    };

    if (loading) {
        return (
            <ProtectedRoute>
                <Navbar />
                <Center minH="80vh">
                    <Spinner size="xl" color="brand.400" />
                </Center>
            </ProtectedRoute>
        );
    }

    if (error || !inviteData) {
        return (
            <ProtectedRoute>
                <Navbar />
                <Center minH="80vh">
                    <VStack spacing={4}>
                        <Text color="red.400" fontSize="lg">
                            {error || "Invitation not found"}
                        </Text>
                        <Button
                            colorScheme="brand"
                            onClick={() => router.push("/dashboard")}
                        >
                            Go to Dashboard
                        </Button>
                    </VStack>
                </Center>
            </ProtectedRoute>
        );
    }

    const { event, organizer, invite } = inviteData;
    const alreadyAccepted = invite?.invite_status === "accepted";
    const organizerDisplay = organizer?.name || organizer?.email || "an organizer";

    return (
        <ProtectedRoute>
            <Navbar />
            <Box minH="calc(100vh - 64px)" bg="gray.900" py={20}>
                <Container maxW="lg">
                    <MotionBox
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <VStack spacing={0}>
                            {/* Icon header */}
                            <Flex
                                w={20}
                                h={20}
                                borderRadius="full"
                                bg="brand.500"
                                align="center"
                                justify="center"
                                mb={6}
                                boxShadow="0 0 40px rgba(124, 58, 237, 0.4)"
                            >
                                <Icon
                                    as={HiOutlineScale}
                                    boxSize={10}
                                    color="white"
                                />
                            </Flex>

                            {/* Main message */}
                            <Heading
                                size="xl"
                                textAlign="center"
                                color="white"
                                mb={3}
                            >
                                {alreadyAccepted
                                    ? "You're a Judge!"
                                    : "You've Been Invited!"}
                            </Heading>

                            <Text
                                fontSize="lg"
                                color="gray.300"
                                textAlign="center"
                                maxW="md"
                                mb={8}
                            >
                                {alreadyAccepted
                                    ? `You've already accepted the invitation to judge this event.`
                                    : `You have been invited to be a judge for this event.`}
                            </Text>

                            {/* Event card */}
                            <Box
                                w="full"
                                bg="gray.800"
                                borderRadius="2xl"
                                border="1px solid"
                                borderColor="gray.700"
                                p={8}
                                mb={8}
                            >
                                <VStack spacing={5} align="stretch">
                                    {/* Event name */}
                                    <Box>
                                        <Text
                                            fontSize="xs"
                                            fontWeight="bold"
                                            textTransform="uppercase"
                                            letterSpacing="wider"
                                            color="brand.300"
                                            mb={1}
                                        >
                                            Event
                                        </Text>
                                        <Heading size="lg" color="white">
                                            {event.name}
                                        </Heading>
                                        {event.description && (
                                            <Text
                                                color="gray.400"
                                                mt={2}
                                                fontSize="sm"
                                            >
                                                {event.description}
                                            </Text>
                                        )}
                                    </Box>

                                    {/* Divider */}
                                    <Box
                                        h="1px"
                                        bg="gray.700"
                                        w="full"
                                    />

                                    {/* Invited by */}
                                    <HStack spacing={4}>
                                        <Flex
                                            w={10}
                                            h={10}
                                            borderRadius="lg"
                                            bg="purple.900"
                                            align="center"
                                            justify="center"
                                            flexShrink={0}
                                        >
                                            <Icon
                                                as={HiOutlineUser}
                                                boxSize={5}
                                                color="brand.300"
                                            />
                                        </Flex>
                                        <Box>
                                            <Text
                                                fontSize="xs"
                                                color="gray.500"
                                                textTransform="uppercase"
                                                letterSpacing="wider"
                                            >
                                                Invited by
                                            </Text>
                                            <Text
                                                color="white"
                                                fontWeight="semibold"
                                            >
                                                {organizer?.name || "—"}
                                            </Text>
                                            {organizer?.email && (
                                                <Text
                                                    color="gray.400"
                                                    fontSize="sm"
                                                >
                                                    {organizer.email}
                                                </Text>
                                            )}
                                        </Box>
                                    </HStack>

                                    {/* Status */}
                                    <HStack spacing={4}>
                                        <Flex
                                            w={10}
                                            h={10}
                                            borderRadius="lg"
                                            bg="purple.900"
                                            align="center"
                                            justify="center"
                                            flexShrink={0}
                                        >
                                            <Icon
                                                as={HiOutlineCalendar}
                                                boxSize={5}
                                                color="brand.300"
                                            />
                                        </Flex>
                                        <Box>
                                            <Text
                                                fontSize="xs"
                                                color="gray.500"
                                                textTransform="uppercase"
                                                letterSpacing="wider"
                                            >
                                                Event Status
                                            </Text>
                                            <Badge
                                                colorScheme={
                                                    event.status === "judging"
                                                        ? "green"
                                                        : event.status === "open"
                                                        ? "blue"
                                                        : "gray"
                                                }
                                                fontSize="sm"
                                                px={3}
                                                py={1}
                                                borderRadius="full"
                                            >
                                                {event.status.charAt(0).toUpperCase() +
                                                    event.status.slice(1)}
                                            </Badge>
                                        </Box>
                                    </HStack>

                                    {/* Invite status */}
                                    <HStack spacing={4}>
                                        <Flex
                                            w={10}
                                            h={10}
                                            borderRadius="lg"
                                            bg="purple.900"
                                            align="center"
                                            justify="center"
                                            flexShrink={0}
                                        >
                                            <Icon
                                                as={HiOutlineEnvelope}
                                                boxSize={5}
                                                color="brand.300"
                                            />
                                        </Flex>
                                        <Box>
                                            <Text
                                                fontSize="xs"
                                                color="gray.500"
                                                textTransform="uppercase"
                                                letterSpacing="wider"
                                            >
                                                Your Invitation
                                            </Text>
                                            <Badge
                                                colorScheme={
                                                    alreadyAccepted
                                                        ? "green"
                                                        : "yellow"
                                                }
                                                fontSize="sm"
                                                px={3}
                                                py={1}
                                                borderRadius="full"
                                            >
                                                {alreadyAccepted
                                                    ? "Accepted"
                                                    : "Pending"}
                                            </Badge>
                                        </Box>
                                    </HStack>
                                </VStack>
                            </Box>

                            {/* Action buttons */}
                            {alreadyAccepted ? (
                                <Button
                                    colorScheme="brand"
                                    size="lg"
                                    w="full"
                                    maxW="sm"
                                    onClick={() => router.push("/dashboard")}
                                    leftIcon={
                                        <Icon as={HiOutlineCheckCircle} />
                                    }
                                >
                                    Go to Dashboard
                                </Button>
                            ) : (
                                <VStack w="full" maxW="sm" spacing={3}>
                                    <Button
                                        colorScheme="brand"
                                        size="lg"
                                        w="full"
                                        onClick={handleAccept}
                                        isLoading={accepting}
                                        loadingText="Accepting..."
                                        leftIcon={
                                            <Icon
                                                as={HiOutlineCheckCircle}
                                            />
                                        }
                                    >
                                        Accept Invitation
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="md"
                                        color="gray.500"
                                        w="full"
                                        onClick={handleDecline}
                                        _hover={{ color: "gray.300" }}
                                    >
                                        Skip for now
                                    </Button>
                                </VStack>
                            )}
                        </VStack>
                    </MotionBox>
                </Container>
            </Box>
        </ProtectedRoute>
    );
}
