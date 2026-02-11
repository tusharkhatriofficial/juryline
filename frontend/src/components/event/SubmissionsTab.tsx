"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Box,
    VStack,
    HStack,
    Text,
    Badge,
    Spinner,
    Center,
    Input,
    InputGroup,
    InputLeftElement,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Link,
    Image,
    Collapse,
    IconButton,
    Button,
    useToast,
    Tooltip,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
    HiOutlineMagnifyingGlass,
    HiOutlineChevronDown,
    HiOutlineChevronUp,
    HiOutlineArrowDownTray,
    HiOutlineEye,
} from "react-icons/hi2";
import { listSubmissions } from "@/lib/api-services";
import type { Submission, FormDataDisplayItem } from "@/lib/types";

const MotionBox = motion.create(Box);

interface SubmissionsTabProps {
    eventId: string;
}

export function SubmissionsTab({ eventId }: SubmissionsTabProps) {
    const toast = useToast();
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        loadSubmissions();
    }, [eventId]);

    const loadSubmissions = async () => {
        try {
            const data = await listSubmissions(eventId);
            setSubmissions(data);
        } catch {
            toast({
                title: "Failed to load submissions",
                status: "error",
                duration: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        if (!search.trim()) return submissions;
        const q = search.toLowerCase();
        return submissions.filter((sub) => {
            // Search through display fields
            if (sub.form_data_display) {
                return sub.form_data_display.some(
                    (item) =>
                        typeof item.value === "string" &&
                        item.value.toLowerCase().includes(q)
                );
            }
            // Fallback: search raw form_data values
            return Object.values(sub.form_data).some(
                (v) => typeof v === "string" && v.toLowerCase().includes(q)
            );
        });
    }, [submissions, search]);

    const exportCSV = () => {
        if (submissions.length === 0) return;

        // Use display fields from first submission for headers
        const first = submissions[0];
        const headers = first.form_data_display
            ? first.form_data_display.map((d) => d.label)
            : Object.keys(first.form_data);

        const headerKeys = first.form_data_display
            ? first.form_data_display.map((d) => d.field_id)
            : Object.keys(first.form_data);

        const rows = submissions.map((sub) =>
            headerKeys.map((key) => {
                const val = sub.form_data[key];
                if (Array.isArray(val)) return val.join("; ");
                return String(val ?? "");
            })
        );

        const csv = [
            ["Submitted At", ...headers].join(","),
            ...rows.map((row, i) =>
                [submissions[i].created_at, ...row]
                    .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
                    .join(",")
            ),
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `submissions-${eventId}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <Center py={20}>
                <Spinner size="lg" color="brand.400" thickness="3px" />
            </Center>
        );
    }

    if (submissions.length === 0) {
        return (
            <Center py={20}>
                <VStack spacing={3}>
                    <Text color="whiteAlpha.500" fontSize="lg">
                        No submissions yet
                    </Text>
                    <Text color="whiteAlpha.400" fontSize="sm">
                        Submissions will appear here once participants start submitting.
                    </Text>
                </VStack>
            </Center>
        );
    }

    // Get preview columns (first 3 text-like fields)
    const previewFields =
        submissions[0].form_data_display?.slice(0, 3) || [];

    return (
        <VStack spacing={4} align="stretch">
            {/* Toolbar */}
            <HStack justify="space-between">
                <InputGroup maxW="320px">
                    <InputLeftElement>
                        <HiOutlineMagnifyingGlass color="gray" />
                    </InputLeftElement>
                    <Input
                        placeholder="Search submissions..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        bg="whiteAlpha.50"
                        borderColor="whiteAlpha.200"
                        _hover={{ borderColor: "whiteAlpha.400" }}
                        _focus={{ borderColor: "brand.400" }}
                    />
                </InputGroup>
                <HStack spacing={2}>
                    <Badge colorScheme="purple" fontSize="sm" px={3} py={1}>
                        {filtered.length} submission{filtered.length !== 1 ? "s" : ""}
                    </Badge>
                    <Tooltip label="Export as CSV" hasArrow>
                        <IconButton
                            aria-label="Export CSV"
                            icon={<HiOutlineArrowDownTray />}
                            variant="outline"
                            size="sm"
                            borderColor="whiteAlpha.300"
                            color="whiteAlpha.700"
                            _hover={{ bg: "whiteAlpha.100" }}
                            onClick={exportCSV}
                        />
                    </Tooltip>
                </HStack>
            </HStack>

            {/* Table */}
            <Box
                overflowX="auto"
                bg="whiteAlpha.50"
                borderRadius="xl"
                border="1px solid"
                borderColor="whiteAlpha.100"
            >
                <Table variant="simple" size="sm">
                    <Thead>
                        <Tr>
                            <Th
                                borderColor="whiteAlpha.200"
                                color="whiteAlpha.500"
                                w="40px"
                            >
                                #
                            </Th>
                            {previewFields.map((pf) => (
                                <Th
                                    key={pf.field_id}
                                    borderColor="whiteAlpha.200"
                                    color="whiteAlpha.500"
                                >
                                    {pf.label}
                                </Th>
                            ))}
                            <Th borderColor="whiteAlpha.200" color="whiteAlpha.500">
                                Submitted
                            </Th>
                            <Th borderColor="whiteAlpha.200" color="whiteAlpha.500" w="80px">
                                Details
                            </Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {filtered.map((sub, idx) => (
                            <SubmissionRow
                                key={sub.id}
                                submission={sub}
                                index={idx + 1}
                                previewFields={previewFields}
                                isExpanded={expandedId === sub.id}
                                onToggle={() =>
                                    setExpandedId(expandedId === sub.id ? null : sub.id)
                                }
                            />
                        ))}
                    </Tbody>
                </Table>
            </Box>
        </VStack>
    );
}

function SubmissionRow({
    submission,
    index,
    previewFields,
    isExpanded,
    onToggle,
}: {
    submission: Submission;
    index: number;
    previewFields: FormDataDisplayItem[];
    isExpanded: boolean;
    onToggle: () => void;
}) {
    const display = submission.form_data_display || [];

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <>
            <Tr
                _hover={{ bg: "whiteAlpha.50" }}
                cursor="pointer"
                onClick={onToggle}
            >
                <Td borderColor="whiteAlpha.100" color="whiteAlpha.500">
                    {index}
                </Td>
                {previewFields.map((pf) => {
                    const val = submission.form_data[pf.field_id];
                    return (
                        <Td
                            key={pf.field_id}
                            borderColor="whiteAlpha.100"
                            color="whiteAlpha.800"
                            maxW="200px"
                            isTruncated
                        >
                            <CellValue value={val} fieldType={pf.field_type} />
                        </Td>
                    );
                })}
                <Td borderColor="whiteAlpha.100" color="whiteAlpha.500" fontSize="xs">
                    {formatDate(submission.created_at)}
                </Td>
                <Td borderColor="whiteAlpha.100">
                    <IconButton
                        aria-label="Toggle details"
                        icon={isExpanded ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
                        size="xs"
                        variant="ghost"
                        color="whiteAlpha.600"
                    />
                </Td>
            </Tr>
            {isExpanded && (
                <Tr>
                    <Td colSpan={previewFields.length + 3} borderColor="whiteAlpha.100" p={0}>
                        <Box bg="whiteAlpha.50" p={4}>
                            <VStack spacing={3} align="stretch">
                                {display.map((item) => (
                                    <HStack
                                        key={item.field_id}
                                        justify="space-between"
                                        align="start"
                                        py={1}
                                    >
                                        <Text
                                            color="whiteAlpha.500"
                                            fontSize="sm"
                                            fontWeight="medium"
                                            minW="120px"
                                        >
                                            {item.label}
                                        </Text>
                                        <Box flex={1} textAlign="right">
                                            <CellValue
                                                value={item.value}
                                                fieldType={item.field_type}
                                                full
                                            />
                                        </Box>
                                    </HStack>
                                ))}
                            </VStack>
                        </Box>
                    </Td>
                </Tr>
            )}
        </>
    );
}

function CellValue({
    value,
    fieldType,
    full,
}: {
    value: any;
    fieldType: string;
    full?: boolean;
}) {
    if (value === null || value === undefined) {
        return (
            <Text color="whiteAlpha.300" fontSize="sm" fontStyle="italic">
                --
            </Text>
        );
    }

    // File uploads — show links
    if (fieldType === "file_upload" && Array.isArray(value)) {
        return (
            <VStack align={full ? "end" : "start"} spacing={1}>
                {value.map((url: string, i: number) => {
                    const isImg = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
                    return (
                        <HStack key={i} spacing={2}>
                            {isImg && full && (
                                <Image
                                    src={url}
                                    alt=""
                                    boxSize={8}
                                    objectFit="cover"
                                    borderRadius="md"
                                />
                            )}
                            <Link
                                href={url}
                                isExternal
                                color="brand.300"
                                fontSize="sm"
                                noOfLines={1}
                            >
                                {url.split("/").pop() || `File ${i + 1}`}
                            </Link>
                        </HStack>
                    );
                })}
            </VStack>
        );
    }

    // Checkboxes — show as badges
    if (Array.isArray(value)) {
        return (
            <HStack spacing={1} flexWrap="wrap" justify={full ? "end" : "start"}>
                {value.map((v: string, i: number) => (
                    <Badge key={i} colorScheme="purple" fontSize="xs">
                        {v}
                    </Badge>
                ))}
            </HStack>
        );
    }

    // URL fields
    if (fieldType === "url" && typeof value === "string" && value.startsWith("http")) {
        return (
            <Link href={value} isExternal color="brand.300" fontSize="sm" noOfLines={full ? undefined : 1}>
                {value}
            </Link>
        );
    }

    return (
        <Text color="whiteAlpha.800" fontSize="sm" noOfLines={full ? undefined : 1}>
            {String(value)}
        </Text>
    );
}
