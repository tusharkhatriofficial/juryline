"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Box,
    Container,
    Flex,
    HStack,
    Button,
    Text,
    Spinner,
    Center,
    VStack,
    IconButton,
    Tooltip,
    useToast,
    Kbd,
} from "@chakra-ui/react";
import {
    HiOutlineInboxStack,
    HiOutlineArrowLeft,
    HiOutlineArrowRight,
    HiOutlineCheck,
    HiOutlineXMark,
} from "react-icons/hi2";
import { motion, AnimatePresence } from "framer-motion";
import { getJudgeQueue, createReview, updateReview, listCriteria } from "@/lib/api-services";
import type { SubmissionWithReview, Criterion, FormDataDisplayItem } from "@/lib/types";
import ReviewCard from "@/components/judge/ReviewCard";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const MotionBox = motion.create(Box);

const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 300 : -300,
        opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({
        x: direction < 0 ? 300 : -300,
        opacity: 0,
    }),
};

export default function ReviewPage() {
    const params = useParams();
    const router = useRouter();
    const toast = useToast();

    const eventId = params.eventId as string;

    const [loading, setLoading] = useState(true);
    const [queue, setQueue] = useState<SubmissionWithReview[]>([]);
    const [criteria, setCriteria] = useState<Criterion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);
    const [saving, setSaving] = useState(false);

    // Per-submission scores and notes (keyed by submission id)
    const [scoresMap, setScoresMap] = useState<Record<string, Record<string, number>>>({});
    const [notesMap, setNotesMap] = useState<Record<string, string>>({});
    const [completedSet, setCompletedSet] = useState<Set<string>>(new Set());

    // Draft auto-save timer
    const draftTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Load queue and criteria
    useEffect(() => {
        async function load() {
            try {
                const [queueData, criteriaData] = await Promise.all([
                    getJudgeQueue(eventId),
                    listCriteria(eventId),
                ]);

                setQueue(queueData.submissions);
                setCriteria(criteriaData);
                setCurrentIndex(queueData.current_index);

                // Initialize scores/notes from existing reviews
                const sm: Record<string, Record<string, number>> = {};
                const nm: Record<string, string> = {};
                const cs = new Set<string>();

                for (const item of queueData.submissions) {
                    const subId = item.submission.id;
                    if (item.review) {
                        sm[subId] = item.review.scores;
                        nm[subId] = item.review.notes || "";
                        if (item.is_completed) cs.add(subId);
                    } else {
                        // Initialize with midpoint defaults
                        const defaults: Record<string, number> = {};
                        for (const c of criteriaData) {
                            defaults[c.id] = Math.round((c.scale_min + c.scale_max) / 2);
                        }
                        sm[subId] = defaults;
                        nm[subId] = "";
                    }

                    // Check localStorage for unsaved drafts
                    const draftKey = `review-draft-${subId}`;
                    const draft = localStorage.getItem(draftKey);
                    if (draft && !item.review) {
                        try {
                            const parsed = JSON.parse(draft);
                            if (parsed.scores) sm[subId] = parsed.scores;
                            if (parsed.notes) nm[subId] = parsed.notes;
                        } catch {}
                    }
                }

                setScoresMap(sm);
                setNotesMap(nm);
                setCompletedSet(cs);
            } catch (err: any) {
                toast({
                    title: "Failed to load review queue",
                    description: err?.response?.data?.detail || err.message,
                    status: "error",
                    duration: 5000,
                });
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [eventId, toast]);

    // Auto-save drafts to localStorage every 10s
    useEffect(() => {
        draftTimerRef.current = setInterval(() => {
            const current = queue[currentIndex];
            if (!current) return;
            const subId = current.submission.id;
            if (completedSet.has(subId)) return;

            const draftKey = `review-draft-${subId}`;
            localStorage.setItem(
                draftKey,
                JSON.stringify({
                    scores: scoresMap[subId],
                    notes: notesMap[subId],
                })
            );
        }, 10000);

        return () => {
            if (draftTimerRef.current) clearInterval(draftTimerRef.current);
        };
    }, [queue, currentIndex, scoresMap, notesMap, completedSet]);

    // -- Current item helpers --
    const currentItem = queue[currentIndex];
    const currentSubId = currentItem?.submission?.id;

    const handleScoreChange = useCallback(
        (criterionId: string, value: number) => {
            if (!currentSubId) return;
            setScoresMap((prev) => ({
                ...prev,
                [currentSubId]: { ...prev[currentSubId], [criterionId]: value },
            }));
        },
        [currentSubId]
    );

    const handleNotesChange = useCallback(
        (notes: string) => {
            if (!currentSubId) return;
            setNotesMap((prev) => ({ ...prev, [currentSubId]: notes }));
        },
        [currentSubId]
    );

    // -- Navigation --
    const goToPrevious = useCallback(() => {
        if (currentIndex > 0) {
            setDirection(-1);
            setCurrentIndex((i) => i - 1);
        }
    }, [currentIndex]);

    const goToNext = useCallback(() => {
        if (currentIndex < queue.length - 1) {
            setDirection(1);
            setCurrentIndex((i) => i + 1);
        }
    }, [currentIndex, queue.length]);

    // -- Save & Next --
    const saveAndNext = useCallback(async () => {
        if (!currentItem || saving) return;
        setSaving(true);

        try {
            const subId = currentItem.submission.id;
            const scores = scoresMap[subId] || {};
            const notes = notesMap[subId] || "";

            if (currentItem.review) {
                await updateReview(currentItem.review.id, { scores, notes });
            } else {
                await createReview({
                    submission_id: subId,
                    scores,
                    notes: notes || undefined,
                });
            }

            // Mark as completed
            setCompletedSet((prev) => new Set(prev).add(subId));

            // Clear draft
            localStorage.removeItem(`review-draft-${subId}`);

            // Update queue item
            setQueue((prev) =>
                prev.map((item, i) =>
                    i === currentIndex ? { ...item, is_completed: true } : item
                )
            );

            toast({
                title: "Review saved",
                status: "success",
                duration: 2000,
                isClosable: true,
            });

            // Go to next or stay
            if (currentIndex < queue.length - 1) {
                setDirection(1);
                setCurrentIndex((i) => i + 1);
            }
        } catch (err: any) {
            const detail = err?.response?.data?.detail;
            let description = err.message;
            if (typeof detail === "string") {
                description = detail;
            } else if (Array.isArray(detail)) {
                description = detail.map((d: any) => d.msg || JSON.stringify(d)).join("; ");
            } else if (detail && typeof detail === "object") {
                description = detail.msg || JSON.stringify(detail);
            }
            toast({
                title: "Failed to save review",
                description,
                status: "error",
                duration: 5000,
            });
        } finally {
            setSaving(false);
        }
    }, [currentItem, currentIndex, scoresMap, notesMap, saving, queue.length, toast]);

    // -- Keyboard shortcuts --
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (
                e.target instanceof HTMLTextAreaElement ||
                e.target instanceof HTMLInputElement
            )
                return;

            switch (e.key) {
                case "ArrowLeft":
                    goToPrevious();
                    break;
                case "ArrowRight":
                    goToNext();
                    break;
                case "Enter":
                    if (e.metaKey || e.ctrlKey) {
                        e.preventDefault();
                        saveAndNext();
                    }
                    break;
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [goToPrevious, goToNext, saveAndNext]);

    // -- All completed? --
    const allCompleted =
        queue.length > 0 && completedSet.size >= queue.length;

    // ── Loading ──
    if (loading) {
        return (
            <Center h="100vh" bg="gray.900">
                <VStack spacing={4}>
                    <Spinner size="xl" color="purple.400" />
                    <Text color="gray.400">Loading review queue...</Text>
                </VStack>
            </Center>
        );
    }

    // ── Empty Queue ──
    if (queue.length === 0) {
        return (
            <Center h="100vh" bg="gray.900">
                <VStack spacing={4}>
                    <Flex w={20} h={20} borderRadius="2xl" bg="whiteAlpha.50" border="1px solid" borderColor="whiteAlpha.100" align="center" justify="center">
                        <HiOutlineInboxStack size={36} color="var(--chakra-colors-whiteAlpha-500)" />
                    </Flex>
                    <Text color="white" fontSize="xl" fontWeight="bold">
                        No submissions assigned
                    </Text>
                    <Text color="gray.400">
                        You have no submissions to review for this event yet.
                    </Text>
                    <Button
                        colorScheme="purple"
                        variant="outline"
                        onClick={() => router.push("/dashboard")}
                    >
                        Back to Dashboard
                    </Button>
                </VStack>
            </Center>
        );
    }

    // ── Completion Screen ──
    if (allCompleted && currentIndex === queue.length - 1) {
        let totalScore = 0;
        let scoreCount = 0;
        for (const item of queue) {
            const subId = item.submission.id;
            const scores = scoresMap[subId];
            if (scores) {
                for (const v of Object.values(scores)) {
                    totalScore += v;
                    scoreCount++;
                }
            }
        }
        const avgScore = scoreCount > 0 ? (totalScore / scoreCount).toFixed(1) : "N/A";

        return (
            <Center h="100vh" bg="gray.900">
                <VStack spacing={6}>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    >
                        <Flex w={20} h={20} borderRadius="full" bg="brand.500" align="center" justify="center">
                            <HiOutlineCheck size={40} color="white" />
                        </Flex>
                    </motion.div>
                    <Text color="white" fontSize="2xl" fontWeight="bold">
                        You&apos;ve reviewed all {queue.length} submissions!
                    </Text>
                    <Box
                        bg="whiteAlpha.50"
                        p={4}
                        borderRadius="lg"
                        textAlign="center"
                    >
                        <Text color="gray.400" fontSize="sm">
                            Average score given
                        </Text>
                        <Text color="purple.300" fontSize="3xl" fontWeight="bold">
                            {avgScore}
                        </Text>
                    </Box>
                    <HStack spacing={4}>
                        <Button
                            colorScheme="purple"
                            variant="outline"
                            onClick={() => {
                                setCurrentIndex(0);
                                setDirection(-1);
                            }}
                        >
                            Review Again
                        </Button>
                        <Button
                            colorScheme="purple"
                            onClick={() => router.push("/dashboard")}
                        >
                            Back to Dashboard
                        </Button>
                    </HStack>
                </VStack>
            </Center>
        );
    }

    // ── Main Review UI ──
    const formDataDisplay: FormDataDisplayItem[] =
        currentItem?.submission?.form_data_display || [];

    return (
        <ProtectedRoute allowedRoles={["judge"]}>
            <Box bg="gray.900" minH="100vh">
                {/* Top Bar */}
                <Box
                    bg="gray.800"
                    borderBottom="1px solid"
                    borderColor="whiteAlpha.100"
                    py={3}
                    px={6}
                    position="sticky"
                    top={0}
                    zIndex={10}
                >
                    <Flex align="center" justify="space-between" maxW="1300px" mx="auto">
                        {/* Progress Dots */}
                        <HStack spacing={1.5} flexWrap="wrap">
                            {queue.map((item, i) => {
                                const isCompleted = completedSet.has(item.submission.id);
                                const isCurrent = i === currentIndex;
                                return (
                                    <Tooltip
                                        key={i}
                                        label={`Submission ${i + 1}${isCompleted ? " (reviewed)" : ""}`}
                                        fontSize="xs"
                                    >
                                        <Box
                                            w={isCurrent ? "12px" : "8px"}
                                            h={isCurrent ? "12px" : "8px"}
                                            borderRadius="full"
                                            bg={
                                                isCompleted
                                                    ? "green.400"
                                                    : isCurrent
                                                    ? "purple.400"
                                                    : "whiteAlpha.300"
                                            }
                                            cursor="pointer"
                                            onClick={() => {
                                                setDirection(i > currentIndex ? 1 : -1);
                                                setCurrentIndex(i);
                                            }}
                                            transition="all 0.2s"
                                            _hover={{ transform: "scale(1.3)" }}
                                            {...(isCurrent && {
                                                boxShadow: "0 0 0 3px rgba(128,90,213,0.3)",
                                            })}
                                        />
                                    </Tooltip>
                                );
                            })}
                        </HStack>

                        {/* Counter + Exit */}
                        <HStack spacing={4}>
                            <Text color="gray.400" fontSize="sm">
                                <Text as="span" color="purple.300" fontWeight="bold">
                                    {completedSet.size}
                                </Text>
                                /{queue.length} reviewed
                            </Text>
                            <IconButton
                                aria-label="Exit review"
                                icon={<HiOutlineXMark />}
                                variant="ghost"
                                color="gray.400"
                                size="sm"
                                onClick={() => router.push("/dashboard")}
                                _hover={{ color: "white" }}
                            />
                        </HStack>
                    </Flex>
                </Box>

                {/* Card Area */}
                <Container maxW="1300px" py={8}>
                    <AnimatePresence custom={direction} mode="wait">
                        <MotionBox
                            key={currentIndex}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                            <ReviewCard
                                formDataDisplay={formDataDisplay}
                                criteria={criteria}
                                scores={scoresMap[currentSubId] || {}}
                                notes={notesMap[currentSubId] || ""}
                                onScoreChange={handleScoreChange}
                                onNotesChange={handleNotesChange}
                            />
                        </MotionBox>
                    </AnimatePresence>

                    {/* Navigation */}
                    <Flex
                        justify="space-between"
                        align="center"
                        mt={6}
                        px={2}
                    >
                        <Button
                            leftIcon={<HiOutlineArrowLeft />}
                            variant="outline"
                            colorScheme="purple"
                            onClick={goToPrevious}
                            isDisabled={currentIndex === 0}
                        >
                            Previous
                        </Button>

                        <HStack spacing={4} color="gray.500" fontSize="xs">
                            <HStack>
                                <Kbd>←</Kbd>
                                <Kbd>→</Kbd>
                                <Text>Navigate</Text>
                            </HStack>
                            <HStack>
                                <Kbd>⌘</Kbd>
                                <Kbd>Enter</Kbd>
                                <Text>Save</Text>
                            </HStack>
                        </HStack>

                        <Button
                            rightIcon={
                                completedSet.has(currentSubId) ? (
                                    <HiOutlineCheck />
                                ) : (
                                    <HiOutlineArrowRight />
                                )
                            }
                            colorScheme="purple"
                            onClick={saveAndNext}
                            isLoading={saving}
                            loadingText="Saving..."
                        >
                            {completedSet.has(currentSubId)
                                ? "Update & Next"
                                : "Save & Next"}
                        </Button>
                    </Flex>
                </Container>
            </Box>
        </ProtectedRoute>
    );
}
