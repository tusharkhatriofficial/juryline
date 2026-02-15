"use client";

import { useState, useEffect } from "react";
import {
    Box,
    VStack,
    HStack,
    Heading,
    Text,
    Button,
    SimpleGrid,
    Progress,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Badge,
    useToast,
    Spinner,
    Center,
    Flex,
    Icon,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    Collapse,
    IconButton,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    Tooltip,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
    HiOutlineUsers,
    HiOutlineDocumentText,
    HiOutlineCheckCircle,
    HiOutlineTrophy,
    HiOutlineArrowDownTray,
    HiOutlineArrowPath,
    HiOutlineExclamationTriangle,
    HiOutlineChevronDown,
    HiOutlineChevronUpDown,
    HiOutlineStar,
    HiOutlineSparkles,
    HiOutlineCpuChip,
} from "react-icons/hi2";
import {
    getDashboard,
    exportCSV,
    archestraAggregateScores,
    getBiasReport,
    archestraAssignJudges,
    archestraGetProgress,
} from "@/lib/api-services";

const MotionBox = motion.create(Box);
const MotionFlex = motion.create(Flex);

interface DashboardTabProps {
    eventId: string;
}

const STATUS_ICONS = {
    completed: "★",
    in_progress: "✓",
    not_started: "○",
};

const STATUS_COLORS = {
    completed: "green",
    in_progress: "blue",
    not_started: "gray",
};

export function DashboardTab({ eventId }: DashboardTabProps) {
    const toast = useToast();
    const { isOpen: isBiasOpen, onOpen: onBiasOpen, onClose: onBiasClose } = useDisclosure();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [data, setData] = useState<any>(null);
    const [progressData, setProgressData] = useState<any>(null);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [biasData, setBiasData] = useState<any[]>([]);

    useEffect(() => {
        loadDashboard();
        loadProgress();
    }, [eventId]);

    const loadDashboard = async () => {
        try {
            const result = await getDashboard(eventId);
            setData(result);
        } catch (err: any) {
            toast({
                title: "Failed to load dashboard",
                description: err.response?.data?.detail || "Unknown error",
                status: "error",
                duration: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    const loadProgress = async () => {
        try {
            const result = await archestraGetProgress(eventId);
            setProgressData(result);
        } catch (err) {
            // Silently fail if progress agent isn't available or fails
            console.error("Failed to load AI progress report", err);
        }
    };

    const handleAutoAssign = async () => {
        setAssigning(true);
        try {
            const result = await archestraAssignJudges(eventId);
            await loadDashboard();
            toast({
                title: "AI Assignment Complete",
                description: result.message || "Judges have been assigned.",
                status: "success",
                duration: 3000,
            });
        } catch (err: any) {
            toast({
                title: "Assignment failed",
                description: err.response?.data?.detail || "Could not assign judges.",
                status: "error",
                duration: 3000,
            });
        } finally {
            setAssigning(false);
        }
    };

    const handleArchestraRefresh = async () => {
        setRefreshing(true);
        try {
            await archestraAggregateScores(eventId);
            await loadDashboard();
            toast({
                title: "Scores aggregated",
                description: "Leaderboard refreshed via Archestra",
                status: "success",
                duration: 2000,
            });
        } catch (err: any) {
            toast({
                title: "Refresh failed",
                description: err.response?.data?.detail || "Using fallback computation",
                status: "warning",
                duration: 3000,
            });
        } finally {
            setRefreshing(false);
        }
    };

    const handleExportCSV = async () => {
        setExporting(true);
        try {
            const blob = await exportCSV(eventId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `leaderboard_${eventId.slice(0, 8)}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            toast({
                title: "CSV exported",
                status: "success",
                duration: 2000,
            });
        } catch (err: any) {
            toast({
                title: "Export failed",
                description: err.response?.data?.detail || "Unknown error",
                status: "error",
                duration: 3000,
            });
        } finally {
            setExporting(false);
        }
    };

    const handleBiasReport = async () => {
        try {
            const report = await getBiasReport(eventId);
            setBiasData(report);
            onBiasOpen();
        } catch (err: any) {
            toast({
                title: "Failed to load bias report",
                description: err.response?.data?.detail || "Unknown error",
                status: "error",
                duration: 3000,
            });
        }
    };

    const toggleRow = (submissionId: string) => {
        setExpandedRows((prev) => {
            const next = new Set(prev);
            if (next.has(submissionId)) {
                next.delete(submissionId);
            } else {
                next.add(submissionId);
            }
            return next;
        });
    };

    if (loading) {
        return (
            <Center py={20}>
                <Spinner size="xl" color="brand.400" thickness="3px" />
            </Center>
        );
    }

    if (!data) {
        return (
            <Center py={20}>
                <Text color="whiteAlpha.500">No data available</Text>
            </Center>
        );
    }

    const { stats, judge_progress, leaderboard } = data;

    return (
        <VStack spacing={8} align="stretch">
            {/* AI Progress Report */}
            {progressData && progressData.summary && (
                <MotionBox
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Alert
                        status="info"
                        variant="subtle"
                        flexDirection="column"
                        alignItems="flex-start"
                        justifyContent="center"
                        textAlign="left"
                        bg="purple.900"
                        borderColor="purple.500"
                        borderWidth="1px"
                        borderRadius="md"
                        color="white"
                        p={4}
                    >
                        <HStack spacing={2} mb={2}>
                            <Icon as={HiOutlineSparkles} color="purple.300" boxSize={5} />
                            <AlertTitle fontSize="lg">Archestra Status Report</AlertTitle>
                        </HStack>
                        <AlertDescription maxWidth="sm" color="whiteAlpha.900">
                            {progressData.summary}
                        </AlertDescription>
                    </Alert>
                </MotionBox>
            )}

            {/* Stats Cards */}
            <SimpleGrid columns={{ base: 2, lg: 4 }} spacing={6}>
                <AnimatedStatCard
                    icon={HiOutlineDocumentText}
                    label="Submissions"
                    value={stats.total_submissions}
                    color="purple.400"
                    delay={0}
                />
                <AnimatedStatCard
                    icon={HiOutlineUsers}
                    label="Judges"
                    value={stats.total_judges}
                    color="blue.400"
                    delay={0.1}
                />
                <AnimatedStatCard
                    icon={HiOutlineCheckCircle}
                    label="Reviews"
                    value={`${stats.reviews_completed}/${stats.total_reviews}`}
                    color="green.400"
                    delay={0.2}
                />
                <AnimatedStatCard
                    icon={HiOutlineTrophy}
                    label="Completion"
                    value={`${stats.completion_percent}%`}
                    color="orange.400"
                    delay={0.3}
                    helpText={
                        stats.avg_score !== null
                            ? `Avg Score: ${stats.avg_score.toFixed(1)}`
                            : undefined
                    }
                />
            </SimpleGrid>

            {/* Actions */}
            <Flex gap={3} wrap="wrap">
                <Button
                    leftIcon={<HiOutlineCpuChip />}
                    colorScheme="purple"
                    onClick={handleAutoAssign}
                    isLoading={assigning}
                    loadingText="Assigning..."
                >
                    Auto-Assign Judges (AI)
                </Button>
                <Button
                    leftIcon={<HiOutlineArrowDownTray />}
                    colorScheme="gray"
                    variant="outline"
                    onClick={handleExportCSV}
                    isLoading={exporting}
                >
                    Export CSV
                </Button>
                <Button
                    leftIcon={<HiOutlineArrowPath />}
                    colorScheme="brand"
                    variant="outline"
                    onClick={handleArchestraRefresh}
                    isLoading={refreshing}
                >
                    Archestra Refresh
                </Button>
                <Button
                    leftIcon={<HiOutlineExclamationTriangle />}
                    colorScheme="orange"
                    variant="outline"
                    onClick={handleBiasReport}
                >
                    Bias Report
                </Button>
            </Flex>

            {/* Judge Progress */}
            {judge_progress.length > 0 && (
                <MotionBox
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    p={6}
                    borderRadius="xl"
                    bg="whiteAlpha.50"
                    border="1px solid"
                    borderColor="whiteAlpha.100"
                >
                    <Heading size="md" color="white" mb={4}>
                        Judge Progress
                    </Heading>
                    <VStack spacing={4} align="stretch">
                        {judge_progress.map((judge: any, idx: number) => (
                            <MotionBox
                                key={judge.judge_id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + idx * 0.05 }}
                            >
                                <Flex justify="space-between" align="center" mb={2}>
                                    <HStack spacing={2}>
                                        <Text
                                            fontSize="xl"
                                            title={judge.status}
                                        >
                                            {STATUS_ICONS[judge.status as keyof typeof STATUS_ICONS]}
                                        </Text>
                                        <Text color="white" fontWeight="medium">
                                            {judge.judge_name}
                                        </Text>
                                        <Badge
                                            colorScheme={STATUS_COLORS[judge.status as keyof typeof STATUS_COLORS]}
                                            fontSize="xs"
                                        >
                                            {judge.status.replace("_", " ")}
                                        </Badge>
                                    </HStack>
                                    <HStack spacing={3}>
                                        <Text color="whiteAlpha.600" fontSize="sm">
                                            {judge.completed}/{judge.assigned}
                                        </Text>
                                        <Text
                                            color={
                                                judge.percent === 100
                                                    ? "green.300"
                                                    : judge.percent > 50
                                                        ? "blue.300"
                                                        : "orange.300"
                                            }
                                            fontWeight="bold"
                                            fontSize="sm"
                                            minW="45px"
                                            textAlign="right"
                                        >
                                            {judge.percent}%
                                        </Text>
                                    </HStack>
                                </Flex>
                                <Progress
                                    value={judge.percent}
                                    colorScheme={
                                        judge.percent === 100
                                            ? "green"
                                            : judge.percent > 50
                                                ? "blue"
                                                : "orange"
                                    }
                                    borderRadius="full"
                                    h="8px"
                                    bg="whiteAlpha.100"
                                />
                            </MotionBox>
                        ))}
                    </VStack>
                </MotionBox>
            )}

            {/* Leaderboard */}
            {leaderboard.length > 0 ? (
                <MotionBox
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    p={6}
                    borderRadius="xl"
                    bg="whiteAlpha.50"
                    border="1px solid"
                    borderColor="whiteAlpha.100"
                >
                    <Heading size="md" color="white" mb={4}>
                        Leaderboard
                    </Heading>
                    <Box overflowX="auto">
                        <Table variant="simple" size="sm">
                            <Thead>
                                <Tr>
                                    <Th color="whiteAlpha.600">Rank</Th>
                                    <Th color="whiteAlpha.600">Project</Th>
                                    <Th color="whiteAlpha.600" isNumeric>
                                        Score
                                    </Th>
                                    <Th color="whiteAlpha.600" isNumeric>
                                        Reviews
                                    </Th>
                                    <Th color="whiteAlpha.600"></Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {leaderboard.map((entry: any, idx: number) => (
                                    <LeaderboardRow
                                        key={entry.submission_id}
                                        entry={entry}
                                        isExpanded={expandedRows.has(entry.submission_id)}
                                        onToggle={() => toggleRow(entry.submission_id)}
                                        delay={0.7 + idx * 0.05}
                                    />
                                ))}
                            </Tbody>
                        </Table>
                    </Box>
                </MotionBox>
            ) : (
                <Center py={10}>
                    <Text color="whiteAlpha.500">No submissions with reviews yet</Text>
                </Center>
            )}

            {/* Bias Report Modal */}
            <Modal isOpen={isBiasOpen} onClose={onBiasClose} size="xl">
                <ModalOverlay />
                <ModalContent bg="gray.800" borderColor="whiteAlpha.200">
                    <ModalHeader color="white">Judge Bias Report</ModalHeader>
                    <ModalCloseButton color="whiteAlpha.600" />
                    <ModalBody pb={6}>
                        {biasData.length === 0 ? (
                            <Text color="whiteAlpha.500">No bias data available</Text>
                        ) : (
                            <VStack spacing={4} align="stretch">
                                {biasData.map((judge: any) => (
                                    <Box
                                        key={judge.judge_id}
                                        p={4}
                                        borderRadius="lg"
                                        bg={judge.is_outlier ? "red.900" : "whiteAlpha.50"}
                                        border="1px solid"
                                        borderColor={
                                            judge.is_outlier ? "red.500" : "whiteAlpha.100"
                                        }
                                    >
                                        <HStack justify="space-between" mb={2}>
                                            <HStack>
                                                <Text color="white" fontWeight="bold">
                                                    {judge.judge_name}
                                                </Text>
                                                {judge.is_outlier && (
                                                    <Badge colorScheme="red">Outlier</Badge>
                                                )}
                                            </HStack>
                                            <Text
                                                color={
                                                    judge.deviation > 0
                                                        ? "green.300"
                                                        : judge.deviation < 0
                                                            ? "red.300"
                                                            : "whiteAlpha.600"
                                                }
                                                fontWeight="bold"
                                            >
                                                {judge.deviation > 0 ? "+" : ""}
                                                {judge.deviation.toFixed(2)}
                                            </Text>
                                        </HStack>
                                        <HStack spacing={4} fontSize="sm">
                                            <Text color="whiteAlpha.600">
                                                Avg Given: {judge.avg_score_given.toFixed(2)}
                                            </Text>
                                            <Text color="whiteAlpha.600">
                                                Event Avg: {judge.event_avg.toFixed(2)}
                                            </Text>
                                        </HStack>
                                    </Box>
                                ))}
                            </VStack>
                        )}
                    </ModalBody>
                </ModalContent>
            </Modal>
        </VStack>
    );
}

function AnimatedStatCard({
    icon,
    label,
    value,
    color,
    delay,
    helpText,
}: {
    icon: any;
    label: string;
    value: string | number;
    color: string;
    delay: number;
    helpText?: string;
}) {
    return (
        <MotionBox
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, duration: 0.3 }}
            whileHover={{ scale: 1.02 }}
            p={6}
            borderRadius="xl"
            bg="whiteAlpha.50"
            border="1px solid"
            borderColor="whiteAlpha.100"
            _hover={{
                borderColor: "whiteAlpha.300",
                shadow: "lg",
            }}
        >
            <Stat>
                <StatLabel color="whiteAlpha.600" fontSize="sm" mb={2}>
                    <HStack spacing={2}>
                        <Icon as={icon} color={color} boxSize={5} />
                        <Text>{label}</Text>
                    </HStack>
                </StatLabel>
                <StatNumber color="white" fontSize="3xl" fontWeight="bold">
                    {value}
                </StatNumber>
                {helpText && (
                    <StatHelpText color="whiteAlpha.500" fontSize="xs" mb={0}>
                        {helpText}
                    </StatHelpText>
                )}
            </Stat>
        </MotionBox>
    );
}

function LeaderboardRow({
    entry,
    isExpanded,
    onToggle,
    delay,
}: {
    entry: any;
    isExpanded: boolean;
    onToggle: () => void;
    delay: number;
}) {
    const medalColors = ["yellow.400", "gray.300", "orange.300"];
    const medalColor = entry.rank <= 3 ? medalColors[entry.rank - 1] : null;

    return (
        <>
            <MotionFlex
                as={Tr}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay }}
                _hover={{ bg: "whiteAlpha.50" }}
                cursor="pointer"
                onClick={onToggle}
            >
                <Td color="white" fontWeight="bold">
                    {medalColor ? (
                        <HStack spacing={2}>
                            <Icon as={HiOutlineTrophy} boxSize={5} color={medalColor} />
                            <Text>{entry.rank}</Text>
                        </HStack>
                    ) : (
                        entry.rank
                    )}
                </Td>
                <Td color="white">{entry.project_name}</Td>
                <Td color="white" fontWeight="bold" isNumeric>
                    <HStack spacing={2} justify="flex-end">
                        <Progress
                            value={(entry.weighted_score / 10) * 100}
                            w="80px"
                            h="6px"
                            colorScheme="brand"
                            borderRadius="full"
                            bg="whiteAlpha.100"
                        />
                        <Text minW="40px">{entry.weighted_score.toFixed(1)}</Text>
                    </HStack>
                </Td>
                <Td color="whiteAlpha.600" isNumeric>
                    {entry.review_count}
                </Td>
                <Td>
                    <IconButton
                        aria-label="Toggle details"
                        icon={isExpanded ? <HiOutlineChevronUpDown /> : <HiOutlineChevronDown />}
                        size="xs"
                        variant="ghost"
                        color="whiteAlpha.600"
                    />
                </Td>
            </MotionFlex>
            <Tr>
                <Td colSpan={5} p={0} border="none">
                    <Collapse in={isExpanded}>
                        <Box p={4} bg="whiteAlpha.30" borderRadius="md" m={2}>
                            <Heading size="xs" color="white" mb={3}>
                                Criterion Breakdown
                            </Heading>
                            <VStack spacing={3} align="stretch">
                                {Object.values(entry.criteria_scores).map((score: any) => (
                                    <Box key={score.criterion_name}>
                                        <Flex justify="space-between" mb={1}>
                                            <Text color="whiteAlpha.700" fontSize="sm">
                                                {score.criterion_name}
                                            </Text>
                                            <Text color="white" fontSize="sm" fontWeight="bold">
                                                {score.average.toFixed(1)} (×{score.weight})
                                            </Text>
                                        </Flex>
                                        <Progress
                                            value={(score.average / 10) * 100}
                                            colorScheme="purple"
                                            borderRadius="full"
                                            h="4px"
                                            bg="whiteAlpha.100"
                                        />
                                        <Flex justify="space-between" mt={1}>
                                            <Text color="whiteAlpha.500" fontSize="xs">
                                                Min: {score.min_score}
                                            </Text>
                                            <Text color="whiteAlpha.500" fontSize="xs">
                                                Max: {score.max_score}
                                            </Text>
                                        </Flex>
                                    </Box>
                                ))}
                            </VStack>
                        </Box>
                    </Collapse>
                </Td>
            </Tr>
        </>
    );
}
