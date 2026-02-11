"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Box,
    Container,
    Heading,
    Text,
    VStack,
    HStack,
    Badge,
    Button,
    Tabs,
    TabList,
    TabPanels,
    TabPanel,
    Tab,
    useToast,
    Spinner,
    Center,
    IconButton,
    Flex,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
    useDisclosure,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { HiOutlineArrowLeft } from "react-icons/hi2";
import { useRouter, useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
    getEvent,
    transitionEventStatus,
    listFormFields,
    listCriteria,
    listJudges,
} from "@/lib/api-services";
import type { Event, FormField, Criterion, EventJudge } from "@/lib/types";
import { FormBuilderTab } from "@/components/event/FormBuilderTab";
import { CriteriaTab } from "@/components/event/CriteriaTab";
import { JudgesTab } from "@/components/event/JudgesTab";
import { SettingsTab } from "@/components/event/SettingsTab";
import { SubmissionsTab } from "@/components/event/SubmissionsTab";

const MotionBox = motion.create(Box);

const STATUS_COLORS: Record<string, string> = {
    draft: "gray",
    open: "green",
    judging: "purple",
    closed: "red",
};

const NEXT_STATUS: Record<string, string> = {
    draft: "open",
    open: "judging",
    judging: "closed",
};

const STATUS_ACTION_LABEL: Record<string, string> = {
    draft: "Open for Submissions",
    open: "Start Judging",
    judging: "Close Event",
};

function EventDetailContent() {
    const params = useParams();
    const eventId = params.id as string;
    const router = useRouter();
    const toast = useToast();

    const [event, setEvent] = useState<Event | null>(null);
    const [fields, setFields] = useState<FormField[]>([]);
    const [criteria, setCriteria] = useState<Criterion[]>([]);
    const [judges, setJudges] = useState<EventJudge[]>([]);
    const [loading, setLoading] = useState(true);
    const [transitioning, setTransitioning] = useState(false);

    const { isOpen, onOpen, onClose } = useDisclosure();
    const cancelRef = { current: null as any };

    const loadAll = useCallback(async () => {
        try {
            const [ev, ff, cr, jd] = await Promise.all([
                getEvent(eventId),
                listFormFields(eventId),
                listCriteria(eventId),
                listJudges(eventId),
            ]);
            setEvent(ev);
            setFields(ff);
            setCriteria(cr);
            setJudges(jd);
        } catch {
            toast({ title: "Failed to load event", status: "error", duration: 3000 });
            router.push("/dashboard");
        } finally {
            setLoading(false);
        }
    }, [eventId, router, toast]);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    const handleTransition = async () => {
        if (!event) return;
        const nextStatus = NEXT_STATUS[event.status];
        if (!nextStatus) return;

        setTransitioning(true);
        try {
            await transitionEventStatus(eventId, nextStatus);
            setEvent((prev) => prev ? { ...prev, status: nextStatus as Event["status"] } : prev);
            toast({
                title: `Event is now "${nextStatus}"`,
                status: "success",
                duration: 2000,
            });
            onClose();
        } catch (err: any) {
            toast({
                title: "Transition failed",
                description: err.response?.data?.detail || "Unknown error",
                status: "error",
                duration: 4000,
            });
        } finally {
            setTransitioning(false);
        }
    };

    if (loading) {
        return (
            <Box minH="100vh" bg="gray.900">
                <Navbar />
                <Center py={40}>
                    <Spinner size="xl" color="brand.400" thickness="3px" />
                </Center>
            </Box>
        );
    }

    if (!event) return null;

    const isDraft = event.status === "draft";
    const nextStatus = NEXT_STATUS[event.status];

    return (
        <Box minH="100vh" bg="gray.900">
            <Navbar />
            <Container maxW="container.xl" py={10}>
                <VStack spacing={8} align="stretch">
                    {/* Header */}
                    <MotionBox
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <Flex justify="space-between" align="start" wrap="wrap" gap={4}>
                            <Box>
                                <HStack spacing={3} mb={2}>
                                    <IconButton
                                        aria-label="Back"
                                        icon={<HiOutlineArrowLeft />}
                                        variant="ghost"
                                        color="whiteAlpha.700"
                                        onClick={() => router.push("/dashboard")}
                                        size="sm"
                                    />
                                    <Heading size="lg" color="white">
                                        {event.name}
                                    </Heading>
                                    <Badge
                                        colorScheme={STATUS_COLORS[event.status]}
                                        fontSize="sm"
                                        px={3}
                                        py={0.5}
                                        borderRadius="full"
                                        textTransform="capitalize"
                                    >
                                        {event.status}
                                    </Badge>
                                </HStack>
                                {event.description && (
                                    <Text color="whiteAlpha.500" ml={10}>
                                        {event.description}
                                    </Text>
                                )}
                            </Box>
                            {nextStatus && (
                                <Button
                                    colorScheme={isDraft ? "green" : "brand"}
                                    onClick={onOpen}
                                    isLoading={transitioning}
                                >
                                    {STATUS_ACTION_LABEL[event.status]}
                                </Button>
                            )}
                        </Flex>
                    </MotionBox>

                    {/* Tabs */}
                    <MotionBox
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15, duration: 0.4 }}
                    >
                        <Tabs variant="soft-rounded" colorScheme="brand">
                            <TabList
                                bg="whiteAlpha.50"
                                p={1}
                                borderRadius="xl"
                                border="1px solid"
                                borderColor="whiteAlpha.100"
                                overflowX="auto"
                            >
                                <Tab color="whiteAlpha.600" _selected={{ color: "white", bg: "brand.500" }}>
                                    Form Builder ({fields.length})
                                </Tab>
                                <Tab color="whiteAlpha.600" _selected={{ color: "white", bg: "brand.500" }}>
                                    Criteria ({criteria.length})
                                </Tab>
                                <Tab color="whiteAlpha.600" _selected={{ color: "white", bg: "brand.500" }}>
                                    Judges ({judges.length})
                                </Tab>
                                <Tab color="whiteAlpha.600" _selected={{ color: "white", bg: "brand.500" }}>
                                    Settings
                                </Tab>
                                {event && event.status !== "draft" && (
                                    <Tab color="whiteAlpha.600" _selected={{ color: "white", bg: "brand.500" }}>
                                        Submissions
                                    </Tab>
                                )}
                            </TabList>

                            <TabPanels mt={6}>
                                <TabPanel p={0}>
                                    <FormBuilderTab
                                        eventId={eventId}
                                        fields={fields}
                                        setFields={setFields}
                                        isDraft={isDraft}
                                    />
                                </TabPanel>
                                <TabPanel p={0}>
                                    <CriteriaTab
                                        eventId={eventId}
                                        criteria={criteria}
                                        setCriteria={setCriteria}
                                        isDraft={isDraft}
                                    />
                                </TabPanel>
                                <TabPanel p={0}>
                                    <JudgesTab
                                        eventId={eventId}
                                        judges={judges}
                                        setJudges={setJudges}
                                    />
                                </TabPanel>
                                <TabPanel p={0}>
                                    <SettingsTab
                                        event={event}
                                        setEvent={setEvent}
                                        isDraft={isDraft}
                                    />
                                </TabPanel>
                                {event && event.status !== "draft" && (
                                    <TabPanel p={0}>
                                        <SubmissionsTab eventId={eventId} />
                                    </TabPanel>
                                )}
                            </TabPanels>
                        </Tabs>
                    </MotionBox>
                </VStack>
            </Container>

            {/* Status transition confirmation */}
            <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
                <AlertDialogOverlay>
                    <AlertDialogContent bg="gray.800" borderColor="whiteAlpha.200">
                        <AlertDialogHeader color="white">
                            {STATUS_ACTION_LABEL[event.status]}?
                        </AlertDialogHeader>
                        <AlertDialogBody color="whiteAlpha.700">
                            {event.status === "draft"
                                ? "Once open, form fields and criteria cannot be modified. Participants will be able to submit projects."
                                : event.status === "open"
                                ? "Submissions will be locked and judges can start reviewing."
                                : "Judging will be finalized and scores will be locked."}
                        </AlertDialogBody>
                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={onClose} variant="ghost" color="whiteAlpha.600">
                                Cancel
                            </Button>
                            <Button
                                colorScheme={isDraft ? "green" : "brand"}
                                onClick={handleTransition}
                                isLoading={transitioning}
                                ml={3}
                            >
                                Confirm
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </Box>
    );
}

export default function EventDetailPage() {
    return (
        <ProtectedRoute allowedRoles={["organizer"]}>
            <EventDetailContent />
        </ProtectedRoute>
    );
}
