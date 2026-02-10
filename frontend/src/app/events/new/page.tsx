"use client";

import { useState } from "react";
import {
    Box,
    Container,
    Heading,
    Text,
    VStack,
    HStack,
    Button,
    FormControl,
    FormLabel,
    FormHelperText,
    Input,
    Textarea,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    useToast,
    IconButton,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { HiOutlineArrowLeft } from "react-icons/hi2";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { createEvent } from "@/lib/api-services";

const MotionBox = motion(Box);

function CreateEventContent() {
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(false);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [startAt, setStartAt] = useState("");
    const [endAt, setEndAt] = useState("");
    const [judgesPerSubmission, setJudgesPerSubmission] = useState(2);

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast({ title: "Event name is required", status: "warning", duration: 2000 });
            return;
        }
        if (!startAt || !endAt) {
            toast({ title: "Start and end dates are required", status: "warning", duration: 2000 });
            return;
        }
        if (new Date(endAt) <= new Date(startAt)) {
            toast({ title: "End date must be after start date", status: "warning", duration: 2000 });
            return;
        }

        setLoading(true);
        try {
            const event = await createEvent({
                name: name.trim(),
                description: description.trim() || undefined,
                start_at: new Date(startAt).toISOString(),
                end_at: new Date(endAt).toISOString(),
                judges_per_submission: judgesPerSubmission,
            });
            toast({ title: "Event created", status: "success", duration: 2000 });
            router.push(`/events/${event.id}`);
        } catch (err: any) {
            toast({
                title: "Failed to create event",
                description: err.response?.data?.detail || "Unknown error",
                status: "error",
                duration: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box minH="100vh" bg="gray.900">
            <Navbar />
            <Container maxW="container.md" py={10}>
                <VStack spacing={8} align="stretch">
                    <MotionBox
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
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
                                Create Event
                            </Heading>
                        </HStack>
                        <Text color="whiteAlpha.500" ml={10}>
                            Set up the basics. You can add form fields, criteria, and judges after creation.
                        </Text>
                    </MotionBox>

                    <MotionBox
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.4 }}
                        p={8}
                        borderRadius="2xl"
                        bg="whiteAlpha.50"
                        backdropFilter="blur(20px)"
                        border="1px solid"
                        borderColor="whiteAlpha.100"
                    >
                        <VStack spacing={6} align="stretch">
                            <FormControl isRequired>
                                <FormLabel color="whiteAlpha.800">Event Name</FormLabel>
                                <Input
                                    placeholder="e.g. HackCity 2026"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    color="white"
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel color="whiteAlpha.800">Description</FormLabel>
                                <Textarea
                                    placeholder="Brief description of the hackathon..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    color="white"
                                    rows={3}
                                />
                            </FormControl>

                            <HStack spacing={4} align="start">
                                <FormControl isRequired flex={1}>
                                    <FormLabel color="whiteAlpha.800">Start Date</FormLabel>
                                    <Input
                                        type="datetime-local"
                                        value={startAt}
                                        onChange={(e) => setStartAt(e.target.value)}
                                        color="white"
                                        sx={{
                                            "&::-webkit-calendar-picker-indicator": {
                                                filter: "invert(1)",
                                            },
                                        }}
                                    />
                                </FormControl>
                                <FormControl isRequired flex={1}>
                                    <FormLabel color="whiteAlpha.800">End Date</FormLabel>
                                    <Input
                                        type="datetime-local"
                                        value={endAt}
                                        onChange={(e) => setEndAt(e.target.value)}
                                        color="white"
                                        sx={{
                                            "&::-webkit-calendar-picker-indicator": {
                                                filter: "invert(1)",
                                            },
                                        }}
                                    />
                                </FormControl>
                            </HStack>

                            <FormControl>
                                <FormLabel color="whiteAlpha.800">Judges per Submission</FormLabel>
                                <NumberInput
                                    min={1}
                                    max={10}
                                    value={judgesPerSubmission}
                                    onChange={(_, val) => setJudgesPerSubmission(val)}
                                >
                                    <NumberInputField color="white" />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper borderColor="whiteAlpha.200" color="whiteAlpha.600" />
                                        <NumberDecrementStepper borderColor="whiteAlpha.200" color="whiteAlpha.600" />
                                    </NumberInputStepper>
                                </NumberInput>
                                <FormHelperText color="whiteAlpha.400">
                                    How many judges should review each submission
                                </FormHelperText>
                            </FormControl>

                            <HStack justify="flex-end" pt={4}>
                                <Button
                                    variant="ghost"
                                    color="whiteAlpha.600"
                                    onClick={() => router.push("/dashboard")}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    colorScheme="brand"
                                    size="lg"
                                    isLoading={loading}
                                    onClick={handleSubmit}
                                >
                                    Create Event
                                </Button>
                            </HStack>
                        </VStack>
                    </MotionBox>
                </VStack>
            </Container>
        </Box>
    );
}

export default function CreateEventPage() {
    return (
        <ProtectedRoute allowedRoles={["organizer"]}>
            <CreateEventContent />
        </ProtectedRoute>
    );
}
