"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Box,
    Container,
    Heading,
    Text,
    VStack,
    HStack,
    Button,
    Badge,
    Divider,
    useToast,
    Spinner,
    Center,
    Alert,
    AlertIcon,
    Image,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { HiOutlinePaperAirplane, HiOutlinePencil } from "react-icons/hi2";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { FieldRenderer } from "@/components/submission/FieldRenderer";
import { SubmissionAuthGate } from "@/components/submission/SubmissionAuthGate";
import {
    getEvent,
    listFormFields,
    getMySubmission,
    createSubmission,
    updateSubmission,
} from "@/lib/api-services";
import type { Event, FormField } from "@/lib/types";

const MotionBox = motion.create(Box);

function CountdownTimer({ deadline }: { deadline: string }) {
    const [remaining, setRemaining] = useState("");

    useEffect(() => {
        function update() {
            const diff = new Date(deadline).getTime() - Date.now();
            if (diff <= 0) {
                setRemaining("Closed");
                return;
            }
            const d = Math.floor(diff / 86400000);
            const h = Math.floor((diff % 86400000) / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            const parts: string[] = [];
            if (d > 0) parts.push(`${d}d`);
            if (h > 0) parts.push(`${h}h`);
            parts.push(`${m}m`);
            parts.push(`${s}s`);
            setRemaining(parts.join(" "));
        }
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [deadline]);

    return (
        <Badge colorScheme="purple" fontSize="sm" px={3} py={1} borderRadius="full">
            {remaining === "Closed" ? "Submissions Closed" : `Closes in: ${remaining}`}
        </Badge>
    );
}

function SubmissionFormContent() {
    const params = useParams();
    const router = useRouter();
    const toast = useToast();
    const { role } = useAuth();
    const eventId = params.eventId as string;

    const [event, setEvent] = useState<Event | null>(null);
    const [fields, setFields] = useState<FormField[]>([]);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [existingSubmissionId, setExistingSubmissionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const isEdit = !!existingSubmissionId;

    useEffect(() => {
        loadData();
    }, [eventId]);

    const loadData = async () => {
        try {
            const [eventData, fieldsData] = await Promise.all([
                getEvent(eventId),
                listFormFields(eventId),
            ]);
            setEvent(eventData);
            setFields(fieldsData);

            // Check if participant already submitted
            try {
                const existing = await getMySubmission(eventId);
                if (existing) {
                    setExistingSubmissionId(existing.id);
                    setFormData(existing.form_data || {});
                }
            } catch {
                // No existing submission — that is normal
            }
        } catch {
            toast({
                title: "Failed to load event",
                status: "error",
                duration: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    const setFieldValue = (fieldId: string, value: any) => {
        setFormData((prev) => ({ ...prev, [fieldId]: value }));
        // Clear error when user types
        if (errors[fieldId]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[fieldId];
                return next;
            });
        }
    };

    const validateLocally = (): boolean => {
        const newErrors: Record<string, string> = {};

        for (const field of fields) {
            const val = formData[field.id];
            if (
                field.is_required &&
                (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0))
            ) {
                newErrors[field.id] = `${field.label} is required`;
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateLocally()) {
            toast({
                title: "Please fill in all required fields",
                status: "warning",
                duration: 3000,
            });
            return;
        }

        setSubmitting(true);
        try {
            if (isEdit) {
                await updateSubmission(existingSubmissionId!, formData);
                toast({
                    title: "Submission updated",
                    status: "success",
                    duration: 3000,
                });
            } else {
                const result = await createSubmission(eventId, formData);
                setExistingSubmissionId(result.id);
                toast({
                    title: "Submission created!",
                    description: "Your project has been submitted successfully.",
                    status: "success",
                    duration: 5000,
                });
            }
        } catch (err: any) {
            const detail = err?.response?.data?.detail;
            if (detail?.errors && Array.isArray(detail.errors)) {
                // Map server errors to field errors
                const serverErrors: Record<string, string> = {};
                for (const msg of detail.errors) {
                    // Try to find which field this error belongs to
                    const matchedField = fields.find((f) =>
                        msg.toLowerCase().startsWith(f.label.toLowerCase())
                    );
                    if (matchedField) {
                        serverErrors[matchedField.id] = msg;
                    }
                }
                if (Object.keys(serverErrors).length > 0) {
                    setErrors(serverErrors);
                }
                toast({
                    title: "Validation errors",
                    description: detail.errors.join(", "),
                    status: "error",
                    duration: 5000,
                });
            } else {
                toast({
                    title: isEdit ? "Failed to update" : "Failed to submit",
                    description: typeof detail === "string" ? detail : "Something went wrong",
                    status: "error",
                    duration: 3000,
                });
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Center minH="60vh">
                <Spinner size="xl" color="brand.400" thickness="3px" />
            </Center>
        );
    }

    if (!event) {
        return (
            <Center minH="60vh">
                <Text color="whiteAlpha.600">Event not found</Text>
            </Center>
        );
    }

    if (event.status !== "open") {
        return (
            <Container maxW="container.md" py={10}>
                <Alert status="info" borderRadius="lg" bg="whiteAlpha.100">
                    <AlertIcon />
                    <Text>
                        This event is currently <strong>{event.status}</strong> and is not accepting submissions.
                    </Text>
                </Alert>
            </Container>
        );
    }

    if (role !== "participant") {
        return (
            <Container maxW="container.md" py={10}>
                <Alert status="warning" borderRadius="lg" bg="whiteAlpha.100">
                    <AlertIcon />
                    <Text>
                        Only participants can submit to events. Your role is <strong>{role}</strong>.
                    </Text>
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxW="container.md" py={8}>
            {/* Header */}
            <MotionBox
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                mb={8}
            >
                {event.banner_url && (
                    <Box
                        mb={6}
                        borderRadius="xl"
                        overflow="hidden"
                        maxH="300px"
                    >
                        <Image
                            src={event.banner_url}
                            alt={event.name}
                            w="full"
                            h="full"
                            objectFit="cover"
                        />
                    </Box>
                )}
                <VStack spacing={3} align="start">
                    <HStack justify="space-between" w="100%">
                        <Heading size="lg" color="white">
                            {event.name}
                        </Heading>
                        <CountdownTimer deadline={event.end_at} />
                    </HStack>
                    {event.description && (
                        <Text color="whiteAlpha.600" fontSize="md">
                            {event.description}
                        </Text>
                    )}
                    {isEdit && (
                        <Badge colorScheme="green" fontSize="sm">
                            Editing existing submission
                        </Badge>
                    )}
                </VStack>
            </MotionBox>

            <Divider borderColor="whiteAlpha.200" mb={8} />

            {/* Dynamic form fields */}
            <VStack spacing={6} align="stretch">
                {fields.map((field, idx) => (
                    <MotionBox
                        key={field.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        bg="whiteAlpha.50"
                        border="1px solid"
                        borderColor={errors[field.id] ? "red.400" : "whiteAlpha.100"}
                        borderRadius="xl"
                        p={6}
                    >
                        <FieldRenderer
                            field={field}
                            value={formData[field.id]}
                            onChange={(val) => setFieldValue(field.id, val)}
                            error={errors[field.id]}
                        />
                    </MotionBox>
                ))}
            </VStack>

            {fields.length === 0 && (
                <Center py={10}>
                    <Text color="whiteAlpha.500">
                        No form fields have been configured for this event yet.
                    </Text>
                </Center>
            )}

            {/* Submit button */}
            {fields.length > 0 && (
                <MotionBox
                    mt={8}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <Button
                        size="lg"
                        w="100%"
                        colorScheme="purple"
                        leftIcon={isEdit ? <HiOutlinePencil /> : <HiOutlinePaperAirplane />}
                        onClick={handleSubmit}
                        isLoading={submitting}
                        loadingText={isEdit ? "Updating..." : "Submitting..."}
                    >
                        {isEdit ? "Update Submission" : "Submit Project"}
                    </Button>
                </MotionBox>
            )}
        </Container>
    );
}

export default function SubmitPage() {
    return (
        <ProtectedRoute allowedRoles={["participant"]} fallback={<SubmissionAuthGate />}>
            <Box minH="100vh" bg="gray.900">
                <Navbar />
                <SubmissionFormContent />
            </Box>
        </ProtectedRoute>
    );
}
