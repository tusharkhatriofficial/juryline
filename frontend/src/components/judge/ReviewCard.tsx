"use client";

import {
    Box,
    VStack,
    Divider,
    Text,
    Textarea,
    Flex,
} from "@chakra-ui/react";
import type { Criterion, FormDataDisplayItem } from "@/lib/types";
import SubmissionFieldDisplay from "./SubmissionFieldDisplay";
import CriteriaSlider from "./CriteriaSlider";

interface Props {
    formDataDisplay: FormDataDisplayItem[];
    criteria: Criterion[];
    scores: Record<string, number>;
    notes: string;
    onScoreChange: (criterionId: string, value: number) => void;
    onNotesChange: (notes: string) => void;
}

export default function ReviewCard({
    formDataDisplay,
    criteria,
    scores,
    notes,
    onScoreChange,
    onNotesChange,
}: Props) {
    return (
        <Box
            bg="gray.800"
            borderRadius="xl"
            border="1px solid"
            borderColor="whiteAlpha.100"
            overflow="hidden"
        >
            {/* Submission Details */}
            <Box p={6}>
                <Text
                    fontSize="xs"
                    fontWeight="bold"
                    textTransform="uppercase"
                    letterSpacing="wide"
                    color="purple.300"
                    mb={4}
                >
                    Submission Details
                </Text>
                <VStack align="stretch" spacing={4}>
                    {formDataDisplay.map((item) => (
                        <SubmissionFieldDisplay key={item.field_id} item={item} />
                    ))}
                </VStack>
            </Box>

            <Divider borderColor="whiteAlpha.100" />

            {/* Rating Section */}
            <Box p={6}>
                <Text
                    fontSize="xs"
                    fontWeight="bold"
                    textTransform="uppercase"
                    letterSpacing="wide"
                    color="purple.300"
                    mb={4}
                >
                    Rate This Project
                </Text>
                <VStack spacing={4}>
                    {criteria.map((crit) => (
                        <CriteriaSlider
                            key={crit.id}
                            criterion={crit}
                            value={scores[crit.id] ?? Math.round((crit.scale_min + crit.scale_max) / 2)}
                            onChange={(v) => onScoreChange(crit.id, v)}
                        />
                    ))}
                </VStack>
            </Box>

            <Divider borderColor="whiteAlpha.100" />

            {/* Notes */}
            <Box p={6}>
                <Flex justify="space-between" align="center" mb={2}>
                    <Text
                        fontSize="xs"
                        fontWeight="bold"
                        textTransform="uppercase"
                        letterSpacing="wide"
                        color="purple.300"
                    >
                        Notes
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                        {notes.length}/5000
                    </Text>
                </Flex>
                <Textarea
                    value={notes}
                    onChange={(e) => onNotesChange(e.target.value)}
                    placeholder="Share your feedback about this project..."
                    maxLength={5000}
                    bg="whiteAlpha.50"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                    color="white"
                    _placeholder={{ color: "gray.500" }}
                    _focus={{
                        borderColor: "purple.400",
                        boxShadow: "0 0 0 1px var(--chakra-colors-purple-400)",
                    }}
                    resize="vertical"
                    minH="100px"
                    fontSize="sm"
                />
            </Box>
        </Box>
    );
}
