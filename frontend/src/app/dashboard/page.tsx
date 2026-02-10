"use client";

import { useState, useEffect } from "react";
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
    Button,
    IconButton,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    useToast,
    Spinner,
    Center,
    Flex,
    Tooltip,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
    HiOutlinePlus,
    HiOutlineCalendar,
    HiOutlineUsers,
    HiOutlineDocumentText,
    HiOutlineEllipsisVertical,
    HiOutlineTrash,
    HiOutlinePencil,
    HiOutlineArrowRight,
} from "react-icons/hi2";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { listEvents, deleteEvent } from "@/lib/api-services";
import type { Event } from "@/lib/types";

const MotionBox = motion(Box);

const STATUS_COLORS: Record<string, string> = {
    draft: "gray",
    open: "green",
    judging: "purple",
    closed: "red",
};

function OrganizerDashboard() {
    const { profile } = useAuth();
    const router = useRouter();
    const toast = useToast();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    const displayName = profile?.name || "Organizer";

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            const data = await listEvents();
            setEvents(data);
        } catch {
            toast({
                title: "Failed to load events",
                status: "error",
                duration: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (eventId: string, eventName: string) => {
        if (!confirm(`Delete "${eventName}"? This cannot be undone.`)) return;
        try {
            await deleteEvent(eventId);
            setEvents((prev) => prev.filter((e) => e.id !== eventId));
            toast({ title: "Event deleted", status: "success", duration: 2000 });
        } catch (err: any) {
            toast({
                title: "Failed to delete",
                description: err.response?.data?.detail || "Unknown error",
                status: "error",
                duration: 3000,
            });
        }
    };

    const activeEvents = events.filter(
        (e) => e.status === "open" || e.status === "judging"
    ).length;
    const totalJudges = events.reduce(
        (sum, e) => sum + (e.judge_count || 0),
        0
    );

    return (
        <Box minH="100vh" bg="gray.900">
            <Navbar />
            <Container maxW="container.xl" py={10}>
                <VStack spacing={8} align="stretch">
                    <MotionBox
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
                            <Box>
                                <HStack spacing={3} align="baseline">
                                    <Heading size="lg" color="white">
                                        Welcome, {displayName}
                                    </Heading>
                                    <Badge
                                        colorScheme="blue"
                                        fontSize="sm"
                                        px={3}
                                        py={0.5}
                                        borderRadius="full"
                                    >
                                        Organizer
                                    </Badge>
                                </HStack>
                                <Text color="whiteAlpha.600" mt={2}>
                                    Manage your events, build submission forms, and invite judges.
                                </Text>
                            </Box>
                            <Button
                                colorScheme="brand"
                                leftIcon={<HiOutlinePlus />}
                                onClick={() => router.push("/events/new")}
                                size="lg"
                            >
                                Create Event
                            </Button>
                        </Flex>
                    </MotionBox>

                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                        {[
                            {
                                label: "Total Events",
                                value: events.length.toString(),
                                icon: HiOutlineCalendar,
                            },
                            {
                                label: "Active Events",
                                value: activeEvents.toString(),
                                icon: HiOutlineDocumentText,
                            },
                            {
                                label: "Total Judges",
                                value: totalJudges.toString(),
                                icon: HiOutlineUsers,
                            },
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
                                <HStack spacing={4}>
                                    <Box p={3} borderRadius="xl" bg="brand.500" color="white">
                                        <stat.icon size={20} />
                                    </Box>
                                    <Stat>
                                        <StatLabel color="whiteAlpha.600">{stat.label}</StatLabel>
                                        <StatNumber fontSize="3xl" fontWeight="700" color="white">
                                            {stat.value}
                                        </StatNumber>
                                    </Stat>
                                </HStack>
                            </MotionBox>
                        ))}
                    </SimpleGrid>

                    {loading ? (
                        <Center py={20}>
                            <Spinner size="xl" color="brand.400" thickness="3px" />
                        </Center>
                    ) : events.length === 0 ? (
                        <MotionBox
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            p={16}
                            borderRadius="2xl"
                            bg="whiteAlpha.50"
                            border="1px solid"
                            borderColor="whiteAlpha.100"
                            textAlign="center"
                        >
                            <VStack spacing={4}>
                                <HiOutlineCalendar size={48} color="var(--chakra-colors-whiteAlpha-400)" />
                                <Text color="whiteAlpha.400" fontSize="lg">
                                    No events yet. Create your first event to get started.
                                </Text>
                                <Button
                                    colorScheme="brand"
                                    leftIcon={<HiOutlinePlus />}
                                    onClick={() => router.push("/events/new")}
                                >
                                    Create Event
                                </Button>
                            </VStack>
                        </MotionBox>
                    ) : (
                        <VStack spacing={4} align="stretch">
                            <Heading size="md" color="white">Your Events</Heading>
                            <AnimatePresence>
                                {events.map((event, i) => (
                                    <MotionBox
                                        key={event.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ delay: i * 0.05, duration: 0.3 }}
                                        p={6}
                                        borderRadius="2xl"
                                        bg="whiteAlpha.50"
                                        backdropFilter="blur(20px)"
                                        border="1px solid"
                                        borderColor="whiteAlpha.100"
                                        _hover={{
                                            borderColor: "brand.400",
                                            boxShadow: "0 0 20px rgba(124, 58, 237, 0.15)",
                                            cursor: "pointer",
                                        }}
                                        onClick={() => router.push(`/events/${event.id}`)}
                                        role="group"
                                    >
                                        <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
                                            <Box flex={1} minW={0}>
                                                <HStack spacing={3} mb={1}>
                                                    <Heading size="sm" color="white" noOfLines={1}>
                                                        {event.name}
                                                    </Heading>
                                                    <Badge
                                                        colorScheme={STATUS_COLORS[event.status]}
                                                        fontSize="xs"
                                                        px={2}
                                                        py={0.5}
                                                        borderRadius="full"
                                                        textTransform="capitalize"
                                                    >
                                                        {event.status}
                                                    </Badge>
                                                </HStack>
                                                {event.description && (
                                                    <Text color="whiteAlpha.500" fontSize="sm" noOfLines={1}>
                                                        {event.description}
                                                    </Text>
                                                )}
                                                <HStack spacing={4} mt={2} fontSize="xs" color="whiteAlpha.400">
                                                    <Text>
                                                        {new Date(event.start_at).toLocaleDateString()} -{" "}
                                                        {new Date(event.end_at).toLocaleDateString()}
                                                    </Text>
                                                </HStack>
                                            </Box>
                                            <HStack spacing={2}>
                                                <Tooltip label="Manage event">
                                                    <IconButton
                                                        aria-label="Open event"
                                                        icon={<HiOutlineArrowRight />}
                                                        variant="ghost"
                                                        color="whiteAlpha.600"
                                                        _hover={{ color: "brand.300" }}
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            router.push(`/events/${event.id}`);
                                                        }}
                                                    />
                                                </Tooltip>
                                                <Menu>
                                                    <MenuButton
                                                        as={IconButton}
                                                        aria-label="Options"
                                                        icon={<HiOutlineEllipsisVertical />}
                                                        variant="ghost"
                                                        color="whiteAlpha.600"
                                                        size="sm"
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                    <MenuList bg="gray.800" borderColor="whiteAlpha.200" minW="160px">
                                                        <MenuItem
                                                            bg="gray.800"
                                                            _hover={{ bg: "whiteAlpha.100" }}
                                                            icon={<HiOutlinePencil />}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.push(`/events/${event.id}`);
                                                            }}
                                                        >
                                                            Edit
                                                        </MenuItem>
                                                        {event.status === "draft" && (
                                                            <MenuItem
                                                                bg="gray.800"
                                                                _hover={{ bg: "red.900" }}
                                                                color="red.300"
                                                                icon={<HiOutlineTrash />}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDelete(event.id, event.name);
                                                                }}
                                                            >
                                                                Delete
                                                            </MenuItem>
                                                        )}
                                                    </MenuList>
                                                </Menu>
                                            </HStack>
                                        </Flex>
                                    </MotionBox>
                                ))}
                            </AnimatePresence>
                        </VStack>
                    )}
                </VStack>
            </Container>
        </Box>
    );
}

function JudgeDashboard() {
    const { profile } = useAuth();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        listEvents().then(setEvents).finally(() => setLoading(false));
    }, []);

    return (
        <Box minH="100vh" bg="gray.900">
            <Navbar />
            <Container maxW="container.xl" py={10}>
                <VStack spacing={8} align="stretch">
                    <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <HStack spacing={3} align="baseline">
                            <Heading size="lg" color="white">
                                Welcome, {profile?.name || "Judge"}
                            </Heading>
                            <Badge colorScheme="purple" fontSize="sm" px={3} py={0.5} borderRadius="full">
                                Judge
                            </Badge>
                        </HStack>
                        <Text color="whiteAlpha.600" mt={2}>
                            Review assigned submissions and submit your scores.
                        </Text>
                    </MotionBox>

                    {loading ? (
                        <Center py={20}>
                            <Spinner size="xl" color="brand.400" thickness="3px" />
                        </Center>
                    ) : events.length === 0 ? (
                        <MotionBox
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            p={16}
                            borderRadius="2xl"
                            bg="whiteAlpha.50"
                            border="1px solid"
                            borderColor="whiteAlpha.100"
                            textAlign="center"
                        >
                            <Text color="whiteAlpha.400" fontSize="lg">
                                No events assigned yet. Waiting for invitations.
                            </Text>
                        </MotionBox>
                    ) : (
                        <VStack spacing={4} align="stretch">
                            {events.map((event) => (
                                <MotionBox
                                    key={event.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    p={6}
                                    borderRadius="2xl"
                                    bg="whiteAlpha.50"
                                    border="1px solid"
                                    borderColor="whiteAlpha.100"
                                    _hover={{ borderColor: "purple.400" }}
                                    cursor="pointer"
                                >
                                    <Heading size="sm" color="white">{event.name}</Heading>
                                    <Badge colorScheme={STATUS_COLORS[event.status]} mt={2} textTransform="capitalize">
                                        {event.status}
                                    </Badge>
                                </MotionBox>
                            ))}
                        </VStack>
                    )}
                </VStack>
            </Container>
        </Box>
    );
}

function ParticipantDashboard() {
    const { profile } = useAuth();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        listEvents().then(setEvents).finally(() => setLoading(false));
    }, []);

    return (
        <Box minH="100vh" bg="gray.900">
            <Navbar />
            <Container maxW="container.xl" py={10}>
                <VStack spacing={8} align="stretch">
                    <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <HStack spacing={3} align="baseline">
                            <Heading size="lg" color="white">
                                Welcome, {profile?.name || "Participant"}
                            </Heading>
                            <Badge colorScheme="green" fontSize="sm" px={3} py={0.5} borderRadius="full">
                                Participant
                            </Badge>
                        </HStack>
                        <Text color="whiteAlpha.600" mt={2}>
                            Browse open events and submit your projects.
                        </Text>
                    </MotionBox>

                    {loading ? (
                        <Center py={20}>
                            <Spinner size="xl" color="brand.400" thickness="3px" />
                        </Center>
                    ) : events.length === 0 ? (
                        <MotionBox
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            p={16}
                            borderRadius="2xl"
                            bg="whiteAlpha.50"
                            border="1px solid"
                            borderColor="whiteAlpha.100"
                            textAlign="center"
                        >
                            <Text color="whiteAlpha.400" fontSize="lg">
                                No open events available right now.
                            </Text>
                        </MotionBox>
                    ) : (
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                            {events.map((event) => (
                                <MotionBox
                                    key={event.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    p={6}
                                    borderRadius="2xl"
                                    bg="whiteAlpha.50"
                                    border="1px solid"
                                    borderColor="whiteAlpha.100"
                                    _hover={{ borderColor: "green.400" }}
                                    cursor="pointer"
                                >
                                    <Heading size="sm" color="white">{event.name}</Heading>
                                    {event.description && (
                                        <Text color="whiteAlpha.500" fontSize="sm" mt={1} noOfLines={2}>
                                            {event.description}
                                        </Text>
                                    )}
                                    <HStack mt={3} spacing={3}>
                                        <Badge colorScheme={STATUS_COLORS[event.status]} textTransform="capitalize">
                                            {event.status}
                                        </Badge>
                                        <Text color="whiteAlpha.400" fontSize="xs">
                                            Ends {new Date(event.end_at).toLocaleDateString()}
                                        </Text>
                                    </HStack>
                                </MotionBox>
                            ))}
                        </SimpleGrid>
                    )}
                </VStack>
            </Container>
        </Box>
    );
}

function DashboardContent() {
    const { role } = useAuth();
    if (role === "organizer") return <OrganizerDashboard />;
    if (role === "judge") return <JudgeDashboard />;
    return <ParticipantDashboard />;
}

export default function DashboardPage() {
    return (
        <ProtectedRoute>
            <DashboardContent />
        </ProtectedRoute>
    );
}
