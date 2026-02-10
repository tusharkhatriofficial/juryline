"use client";

import { useState } from "react";
import {
    Box,
    VStack,
    HStack,
    Heading,
    Text,
    Button,
    IconButton,
    Input,
    FormControl,
    FormLabel,
    Badge,
    Avatar,
    useToast,
    Collapse,
    Tooltip,
    Flex,
    InputGroup,
    InputLeftElement,
    useClipboard,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
    HiOutlinePlus,
    HiOutlineTrash,
    HiOutlineEnvelope,
    HiOutlineCheck,
    HiOutlineClipboard,
    HiOutlineUserPlus,
} from "react-icons/hi2";
import { inviteJudge, removeJudge } from "@/lib/api-services";
import type { EventJudge } from "@/lib/types";

const MotionBox = motion.create(Box);

interface JudgesTabProps {
    eventId: string;
    judges: EventJudge[];
    setJudges: React.Dispatch<React.SetStateAction<EventJudge[]>>;
}

export function JudgesTab({ eventId, judges, setJudges }: JudgesTabProps) {
    const toast = useToast();
    const [showInvite, setShowInvite] = useState(false);
    const [saving, setSaving] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteName, setInviteName] = useState("");
    const [lastInviteLink, setLastInviteLink] = useState("");

    const { onCopy, hasCopied } = useClipboard(lastInviteLink);

    const handleInvite = async () => {
        if (!inviteEmail.trim() || !inviteName.trim()) {
            toast({ title: "Name and email are required", status: "warning", duration: 2000 });
            return;
        }
        setSaving(true);
        try {
            const result = await inviteJudge(eventId, {
                email: inviteEmail.trim(),
                name: inviteName.trim(),
            });

            if (result.invite_link) {
                setLastInviteLink(result.invite_link);
            }

            // Reload judges list
            const { listJudges } = await import("@/lib/api-services");
            const updated = await listJudges(eventId);
            setJudges(updated);

            setInviteEmail("");
            setInviteName("");
            toast({ title: result.message, status: "success", duration: 2000 });
        } catch (err: any) {
            toast({
                title: "Failed to invite judge",
                description: err.response?.data?.detail || "Unknown error",
                status: "error",
                duration: 3000,
            });
        } finally {
            setSaving(false);
        }
    };

    const handleRemove = async (recordId: string) => {
        try {
            await removeJudge(eventId, recordId);
            setJudges((prev) => prev.filter((j) => j.id !== recordId));
            toast({ title: "Judge removed", status: "success", duration: 1500 });
        } catch (err: any) {
            toast({
                title: "Failed to remove judge",
                description: err.response?.data?.detail || "Unknown error",
                status: "error",
                duration: 3000,
            });
        }
    };

    return (
        <VStack spacing={4} align="stretch">
            <Flex justify="space-between" align="center">
                <Box>
                    <Heading size="sm" color="white">Judges</Heading>
                    <Text color="whiteAlpha.500" fontSize="sm">
                        Invite judges via email. They will receive a magic link to join.
                    </Text>
                </Box>
                <Button
                    colorScheme="brand"
                    size="sm"
                    leftIcon={<HiOutlineUserPlus />}
                    onClick={() => setShowInvite(!showInvite)}
                >
                    Invite Judge
                </Button>
            </Flex>

            {/* Invite form */}
            <Collapse in={showInvite} animateOpacity>
                <Box
                    p={6}
                    borderRadius="2xl"
                    bg="whiteAlpha.50"
                    border="1px solid"
                    borderColor="brand.400"
                    boxShadow="0 0 20px rgba(124, 58, 237, 0.1)"
                >
                    <VStack spacing={4} align="stretch">
                        <Heading size="xs" color="white">Invite a Judge</Heading>
                        <HStack spacing={4}>
                            <FormControl flex={1}>
                                <FormLabel color="whiteAlpha.700" fontSize="sm">Name</FormLabel>
                                <Input
                                    placeholder="Judge name"
                                    value={inviteName}
                                    onChange={(e) => setInviteName(e.target.value)}
                                    color="white"
                                    size="sm"
                                />
                            </FormControl>
                            <FormControl flex={1}>
                                <FormLabel color="whiteAlpha.700" fontSize="sm">Email</FormLabel>
                                <InputGroup size="sm">
                                    <InputLeftElement>
                                        <HiOutlineEnvelope color="var(--chakra-colors-whiteAlpha-400)" />
                                    </InputLeftElement>
                                    <Input
                                        placeholder="judge@example.com"
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        color="white"
                                        onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                                    />
                                </InputGroup>
                            </FormControl>
                        </HStack>

                        {lastInviteLink && (
                            <Box
                                p={3}
                                borderRadius="xl"
                                bg="green.900"
                                border="1px solid"
                                borderColor="green.600"
                            >
                                <Text color="green.200" fontSize="sm" mb={2}>
                                    Invite link generated. Share this with the judge:
                                </Text>
                                <HStack>
                                    <Input
                                        value={lastInviteLink}
                                        isReadOnly
                                        size="sm"
                                        color="white"
                                        fontSize="xs"
                                    />
                                    <IconButton
                                        aria-label="Copy link"
                                        icon={hasCopied ? <HiOutlineCheck /> : <HiOutlineClipboard />}
                                        size="sm"
                                        colorScheme={hasCopied ? "green" : "brand"}
                                        onClick={onCopy}
                                    />
                                </HStack>
                            </Box>
                        )}

                        <HStack justify="flex-end">
                            <Button size="sm" variant="ghost" color="whiteAlpha.600" onClick={() => setShowInvite(false)}>
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                colorScheme="brand"
                                leftIcon={<HiOutlineEnvelope />}
                                isLoading={saving}
                                onClick={handleInvite}
                            >
                                Send Invite
                            </Button>
                        </HStack>
                    </VStack>
                </Box>
            </Collapse>

            {/* Judges list */}
            {judges.length === 0 ? (
                <Box
                    p={12}
                    borderRadius="2xl"
                    bg="whiteAlpha.50"
                    border="1px dashed"
                    borderColor="whiteAlpha.200"
                    textAlign="center"
                >
                    <Text color="whiteAlpha.400">
                        No judges invited yet. Invite judges to review submissions.
                    </Text>
                </Box>
            ) : (
                <AnimatePresence>
                    {judges.map((judge: any) => (
                        <MotionBox
                            key={judge.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            p={4}
                            borderRadius="2xl"
                            bg="whiteAlpha.50"
                            border="1px solid"
                            borderColor="whiteAlpha.100"
                        >
                            <Flex justify="space-between" align="center">
                                <HStack spacing={3}>
                                    <Avatar
                                        size="sm"
                                        name={judge.profiles?.name || "Judge"}
                                        src={judge.profiles?.avatar_url}
                                        bg="purple.500"
                                        color="white"
                                    />
                                    <Box>
                                        <Text color="white" fontWeight="500" fontSize="sm">
                                            {judge.profiles?.name || "Pending"}
                                        </Text>
                                        <Text color="whiteAlpha.400" fontSize="xs">
                                            {judge.profiles?.email || "Invite pending"}
                                        </Text>
                                    </Box>
                                    <Badge
                                        colorScheme={judge.invite_status === "accepted" ? "green" : "yellow"}
                                        fontSize="xs"
                                        borderRadius="full"
                                        textTransform="capitalize"
                                    >
                                        {judge.invite_status}
                                    </Badge>
                                </HStack>
                                <Tooltip label="Remove judge">
                                    <IconButton
                                        aria-label="Remove"
                                        icon={<HiOutlineTrash />}
                                        size="sm"
                                        variant="ghost"
                                        color="whiteAlpha.500"
                                        _hover={{ color: "red.300" }}
                                        onClick={() => handleRemove(judge.id)}
                                    />
                                </Tooltip>
                            </Flex>
                        </MotionBox>
                    ))}
                </AnimatePresence>
            )}
        </VStack>
    );
}
