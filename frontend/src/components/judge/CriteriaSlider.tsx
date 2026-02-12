"use client";

import {
    Box,
    Flex,
    Text,
    Slider,
    SliderTrack,
    SliderFilledTrack,
    SliderThumb,
    Badge,
    HStack,
} from "@chakra-ui/react";
import type { Criterion } from "@/lib/types";

interface Props {
    criterion: Criterion;
    value: number;
    onChange: (value: number) => void;
}

function getScoreColor(pct: number): string {
    if (pct < 0.25) return "red";
    if (pct < 0.45) return "orange";
    if (pct < 0.65) return "yellow";
    return "green";
}

export default function CriteriaSlider({ criterion, value, onChange }: Props) {
    const range = criterion.scale_max - criterion.scale_min;
    const pct = range > 0 ? (value - criterion.scale_min) / range : 0;
    const colorScheme = getScoreColor(pct);
    const color = `${colorScheme}.400`;

    // Generate step buttons
    const steps: number[] = [];
    for (let i = criterion.scale_min; i <= criterion.scale_max; i++) {
        steps.push(i);
    }

    return (
        <Box
            bg="whiteAlpha.50"
            borderRadius="xl"
            p={5}
            border="1px solid"
            borderColor="whiteAlpha.100"
            transition="all 0.2s"
            _hover={{ borderColor: "whiteAlpha.200" }}
        >
            {/* Header: Name + Weight | Score Badge */}
            <Flex justify="space-between" align="center" mb={4}>
                <HStack spacing={2}>
                    <Text color="white" fontWeight="semibold" fontSize="md">
                        {criterion.name}
                    </Text>
                    {criterion.weight !== 1 && (
                        <Badge
                            colorScheme="purple"
                            variant="subtle"
                            borderRadius="full"
                            px={2}
                            py={0.5}
                            fontSize="2xs"
                        >
                            {criterion.weight}x
                        </Badge>
                    )}
                </HStack>
                <Flex
                    bg="whiteAlpha.100"
                    borderRadius="xl"
                    px={4}
                    py={1.5}
                    align="baseline"
                    gap={0.5}
                >
                    <Text
                        color={color}
                        fontWeight="bold"
                        fontSize="2xl"
                        fontFamily="mono"
                        lineHeight={1}
                        transition="color 0.3s"
                    >
                        {value}
                    </Text>
                    <Text color="gray.500" fontSize="sm" fontFamily="mono">
                        /{criterion.scale_max}
                    </Text>
                </Flex>
            </Flex>

            {/* Slider */}
            <Box px={1} mb={3}>
                <Slider
                    min={criterion.scale_min}
                    max={criterion.scale_max}
                    step={1}
                    value={value}
                    onChange={onChange}
                    focusThumbOnChange={false}
                >
                    <SliderTrack bg="whiteAlpha.200" h="10px" borderRadius="full">
                        <SliderFilledTrack
                            bg={color}
                            borderRadius="full"
                            transition="background 0.3s"
                        />
                    </SliderTrack>
                    <SliderThumb
                        boxSize={7}
                        bg="white"
                        border="3px solid"
                        borderColor={color}
                        _focus={{
                            boxShadow: `0 0 0 3px rgba(128,90,213,0.4)`,
                        }}
                        transition="border-color 0.3s"
                    />
                </Slider>
            </Box>

            {/* Clickable Step Buttons */}
            <Flex justify="space-between" gap={0.5}>
                {steps.map((step) => {
                    const isActive = step === value;
                    return (
                        <Box
                            key={step}
                            as="button"
                            onClick={() => onChange(step)}
                            flex={1}
                            py={1.5}
                            borderRadius="md"
                            bg={isActive ? color : "transparent"}
                            color={isActive ? "white" : "gray.500"}
                            fontSize="xs"
                            fontWeight={isActive ? "bold" : "medium"}
                            fontFamily="mono"
                            textAlign="center"
                            transition="all 0.15s"
                            _hover={{
                                bg: isActive ? color : "whiteAlpha.100",
                                color: isActive ? "white" : "gray.300",
                            }}
                        >
                            {step}
                        </Box>
                    );
                })}
            </Flex>
        </Box>
    );
}
