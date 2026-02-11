"use client";

import {
    Box,
    Flex,
    Text,
    Slider,
    SliderTrack,
    SliderFilledTrack,
    SliderThumb,
    Tag,
} from "@chakra-ui/react";
import type { Criterion } from "@/lib/types";

interface Props {
    criterion: Criterion;
    value: number;
    onChange: (value: number) => void;
}

function getTrackColor(pct: number): string {
    if (pct < 0.35) return "red.400";
    if (pct < 0.65) return "yellow.400";
    return "green.400";
}

export default function CriteriaSlider({ criterion, value, onChange }: Props) {
    const range = criterion.scale_max - criterion.scale_min;
    const pct = range > 0 ? (value - criterion.scale_min) / range : 0;
    const color = getTrackColor(pct);

    return (
        <Box
            bg="whiteAlpha.50"
            p={4}
            borderRadius="lg"
            border="1px solid"
            borderColor="whiteAlpha.100"
        >
            <Flex justify="space-between" align="center" mb={3}>
                <Flex align="center" gap={2}>
                    <Text color="white" fontWeight="semibold" fontSize="sm">
                        {criterion.name}
                    </Text>
                    {criterion.weight !== 1 && (
                        <Tag size="sm" colorScheme="purple" variant="subtle">
                            {criterion.weight}x
                        </Tag>
                    )}
                </Flex>
                <Text
                    color={color}
                    fontWeight="bold"
                    fontSize="xl"
                    fontFamily="mono"
                    minW="60px"
                    textAlign="right"
                >
                    {value}/{criterion.scale_max}
                </Text>
            </Flex>

            <Slider
                min={criterion.scale_min}
                max={criterion.scale_max}
                step={1}
                value={value}
                onChange={onChange}
                focusThumbOnChange={false}
            >
                <SliderTrack bg="whiteAlpha.200" h="8px" borderRadius="full">
                    <SliderFilledTrack bg={color} borderRadius="full" />
                </SliderTrack>
                <SliderThumb
                    boxSize={6}
                    bg="white"
                    border="2px solid"
                    borderColor={color}
                    _focus={{ boxShadow: `0 0 0 3px var(--chakra-colors-purple-500)` }}
                />
            </Slider>

            <Flex justify="space-between" mt={1}>
                <Text fontSize="xs" color="gray.500">
                    {criterion.scale_min}
                </Text>
                <Text fontSize="xs" color="gray.500">
                    {criterion.scale_max}
                </Text>
            </Flex>
        </Box>
    );
}
