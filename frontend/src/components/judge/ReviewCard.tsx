"use client";

import {
    Box,
    VStack,
    Text,
    Textarea,
    Flex,
    Grid,
    GridItem,
    HStack,
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

function getAvgColor(val: number): string {
    if (val < 3) return "red";
    if (val < 5) return "orange";
    if (val < 7) return "yellow";
    return "green";
}

export default function ReviewCard({
    formDataDisplay,
    criteria,
    scores,
    notes,
    onScoreChange,
    onNotesChange,
}: Props) {
    // Compute live weighted average (normalized to 0-10)
    const computeWeightedAverage = (): string => {
        if (criteria.length === 0) return "\u2014";
        let weightedSum = 0;
        let totalWeight = 0;
        for (const crit of criteria) {
            const score =
                scores[crit.id] ??
                Math.round((crit.scale_min + crit.scale_max) / 2);
            const range = crit.scale_max - crit.scale_min;
            const normalized =
                range > 0 ? (score - crit.scale_min) / range : 0;
            weightedSum += normalized * crit.weight;
            totalWeight += crit.weight;
        }
        return totalWeight > 0
            ? ((weightedSum / totalWeight) * 10).toFixed(1)
            : "0.0";
    };

    const avgScore = computeWeightedAverage();
    const avgNum = parseFloat(avgScore);
    const avgColor = getAvgColor(avgNum);

    return (
        <Grid
            templateColumns={{ base: "1fr", lg: "1fr 1fr" }}
            gap={6}
            alignItems="start"
        >
            {/* ── Left Panel: Submission Details ── */}
            <GridItem>
                <Box
                    bg="gray.800"
                    borderRadius="2xl"
                    border="1px solid"
                    borderColor="whiteAlpha.100"
                    overflow="hidden"
                >
                    <Box px={7} pt={7} pb={2}>
                        <HStack spacing={3} mb={5}>
                            <Box
                                w="3px"
                                h={5}
                                bg="purple.400"
                                borderRadius="full"
                            />
                            <Text
                                fontSize="sm"
                                fontWeight="bold"
                                textTransform="uppercase"
                                letterSpacing="wider"
                                color="purple.300"
                            >
                                Submission Details
                            </Text>
                        </HStack>
                    </Box>
                    <Box px={7} pb={7}>
                        <VStack align="stretch" spacing={5}>
                            {formDataDisplay.map((item) => (
                                <SubmissionFieldDisplay
                                    key={item.field_id}
                                    item={item}
                                />
                            ))}
                        </VStack>
                    </Box>
                </Box>
            </GridItem>

            {/* ── Right Panel: Scoring ── */}
            <GridItem>
                <VStack
                    spacing={5}
                    position={{ lg: "sticky" }}
                    top={{ lg: "80px" }}
                    alignSelf="start"
                >
                    {/* Live Weighted Score Card */}
                    <Box
                        bg="gray.800"
                        borderRadius="2xl"
                        border="1px solid"
                        borderColor="whiteAlpha.100"
                        p={6}
                        w="100%"
                        textAlign="center"
                    >
                        <Text
                            fontSize="xs"
                            fontWeight="bold"
                            textTransform="uppercase"
                            letterSpacing="wider"
                            color="gray.400"
                            mb={2}
                        >
                            Weighted Score
                        </Text>
                        <Flex
                            align="baseline"
                            justify="center"
                            gap={1}
                        >
                            <Text
                                fontSize="5xl"
                                fontWeight="bold"
                                color={`${avgColor}.400`}
                                fontFamily="mono"
                                lineHeight={1}
                                transition="color 0.3s"
                            >
                                {avgScore}
                            </Text>
                            <Text
                                fontSize="lg"
                                color="gray.500"
                                fontFamily="mono"
                            >
                                /10
                            </Text>
                        </Flex>
                    </Box>

                    {/* Criteria Sliders */}
                    <Box
                        bg="gray.800"
                        borderRadius="2xl"
                        border="1px solid"
                        borderColor="whiteAlpha.100"
                        p={7}
                        w="100%"
                    >
                        <HStack spacing={3} mb={6}>
                            <Box
                                w="3px"
                                h={5}
                                bg="purple.400"
                                borderRadius="full"
                            />
                            <Text
                                fontSize="sm"
                                fontWeight="bold"
                                textTransform="uppercase"
                                letterSpacing="wider"
                                color="purple.300"
                            >
                                Rate This Submission
                            </Text>
                        </HStack>
                        <VStack spacing={5}>
                            {criteria.map((crit) => (
                                <CriteriaSlider
                                    key={crit.id}
                                    criterion={crit}
                                    value={
                                        scores[crit.id] ??
                                        Math.round(
                                            (crit.scale_min +
                                                crit.scale_max) /
                                                2
                                        )
                                    }
                                    onChange={(v) =>
                                        onScoreChange(crit.id, v)
                                    }
                                />
                            ))}
                        </VStack>
                    </Box>

                    {/* Notes / Feedback */}
                    <Box
                        bg="gray.800"
                        borderRadius="2xl"
                        border="1px solid"
                        borderColor="whiteAlpha.100"
                        p={7}
                        w="100%"
                    >
                        <Flex
                            justify="space-between"
                            align="center"
                            mb={4}
                        >
                            <HStack spacing={3}>
                                <Box
                                    w="3px"
                                    h={5}
                                    bg="purple.400"
                                    borderRadius="full"
                                />
                                <Text
                                    fontSize="sm"
                                    fontWeight="bold"
                                    textTransform="uppercase"
                                    letterSpacing="wider"
                                    color="purple.300"
                                >
                                    Your Feedback
                                </Text>
                            </HStack>
                            <Text fontSize="xs" color="gray.500">
                                {notes.length}/5000
                            </Text>
                        </Flex>
                        <Textarea
                            value={notes}
                            onChange={(e) =>
                                onNotesChange(e.target.value)
                            }
                            placeholder="What stood out? What could be improved? Share constructive feedback..."
                            maxLength={5000}
                            bg="whiteAlpha.50"
                            border="1px solid"
                            borderColor="whiteAlpha.200"
                            color="white"
                            _placeholder={{ color: "gray.500" }}
                            _focus={{
                                borderColor: "purple.400",
                                boxShadow:
                                    "0 0 0 1px var(--chakra-colors-purple-400)",
                            }}
                            resize="vertical"
                            minH="120px"
                            fontSize="sm"
                            borderRadius="xl"
                        />
                    </Box>
                </VStack>
            </GridItem>
        </Grid>
    );
}
