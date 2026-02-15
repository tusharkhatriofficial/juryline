"use client";

import { useState } from "react";
import {
    Box,
    VStack,
    HStack,
    Heading,
    Text,
    Button,
    Input,
    Textarea,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    FormControl,
    FormLabel,
    FormHelperText,
    useToast,
    Badge,
    Divider,
} from "@chakra-ui/react";
import { HiOutlineCheck } from "react-icons/hi2";
import { updateEvent } from "@/lib/api-services";
import type { Event } from "@/lib/types";
import { ImageUploader } from "@/components/common/ImageUploader";

interface SettingsTabProps {
    event: Event;
    setEvent: React.Dispatch<React.SetStateAction<Event | null>>;
    isDraft: boolean;
}

export function SettingsTab({ event, setEvent, isDraft }: SettingsTabProps) {
    const toast = useToast();
    const [saving, setSaving] = useState(false);

    const [name, setName] = useState(event.name);
    const [description, setDescription] = useState(event.description || "");
    const [startAt, setStartAt] = useState(
        event.start_at ? new Date(event.start_at).toISOString().slice(0, 16) : ""
    );
    const [endAt, setEndAt] = useState(
        event.end_at ? new Date(event.end_at).toISOString().slice(0, 16) : ""
    );
    const [judgesPerSubmission, setJudgesPerSubmission] = useState(event.judges_per_submission);
    const [bannerUrl, setBannerUrl] = useState(event.banner_url || "");

    const handleSave = async () => {
        if (!name.trim()) {
            toast({ title: "Name is required", status: "warning", duration: 2000 });
            return;
        }
        setSaving(true);
        try {
            const updated = await updateEvent(event.id, {
                name: name.trim(),
                description: description.trim() || undefined,
                banner_url: bannerUrl || undefined,
                start_at: startAt ? new Date(startAt).toISOString() : undefined,
                end_at: endAt ? new Date(endAt).toISOString() : undefined,
                judges_per_submission: judgesPerSubmission,
            });
            setEvent(updated);
            toast({ title: "Settings saved", status: "success", duration: 2000 });
        } catch (err: any) {
            toast({
                title: "Failed to save",
                description: err.response?.data?.detail || "Unknown error",
                status: "error",
                duration: 3000,
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <VStack spacing={6} align="stretch">
            <Box>
                <Heading size="sm" color="white">Event Settings</Heading>
                <Text color="whiteAlpha.500" fontSize="sm">
                    Update your event details.
                </Text>
            </Box>

            <Box
                p={6}
                borderRadius="2xl"
                bg="whiteAlpha.50"
                border="1px solid"
                borderColor="whiteAlpha.100"
            >
                <VStack spacing={5} align="stretch">
                    <ImageUploader
                        value={bannerUrl}
                        onChange={setBannerUrl}
                        label="Event Banner"
                        height="200px"
                    />

                    <FormControl>
                        <FormLabel color="whiteAlpha.800">Event Name</FormLabel>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            color="white"
                        />
                    </FormControl>

                    <FormControl>
                        <FormLabel color="whiteAlpha.800">Description</FormLabel>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            color="white"
                            rows={3}
                        />
                    </FormControl>

                    <HStack spacing={4}>
                        <FormControl flex={1}>
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
                        <FormControl flex={1}>
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
                            onChange={(_, val) => setJudgesPerSubmission(isNaN(val) ? 2 : val)}
                        >
                            <NumberInputField color="white" />
                            <NumberInputStepper>
                                <NumberIncrementStepper borderColor="whiteAlpha.200" color="whiteAlpha.600" />
                                <NumberDecrementStepper borderColor="whiteAlpha.200" color="whiteAlpha.600" />
                            </NumberInputStepper>
                        </NumberInput>
                        <FormHelperText color="whiteAlpha.400">
                            Each submission will be reviewed by this many judges
                        </FormHelperText>
                    </FormControl>

                    <Divider borderColor="whiteAlpha.100" />

                    <HStack spacing={3}>
                        <Text color="whiteAlpha.600" fontSize="sm">Status:</Text>
                        <Badge
                            colorScheme={
                                event.status === "draft"
                                    ? "gray"
                                    : event.status === "open"
                                        ? "green"
                                        : event.status === "judging"
                                            ? "purple"
                                            : "red"
                            }
                            textTransform="capitalize"
                        >
                            {event.status}
                        </Badge>
                    </HStack>

                    <HStack spacing={3}>
                        <Text color="whiteAlpha.600" fontSize="sm">Created:</Text>
                        <Text color="whiteAlpha.800" fontSize="sm">
                            {new Date(event.created_at).toLocaleString()}
                        </Text>
                    </HStack>

                    <Button
                        colorScheme="brand"
                        leftIcon={<HiOutlineCheck />}
                        isLoading={saving}
                        onClick={handleSave}
                        alignSelf="flex-end"
                    >
                        Save Changes
                    </Button>
                </VStack>
            </Box>
        </VStack>
    );
}
