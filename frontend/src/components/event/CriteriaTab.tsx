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
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    FormControl,
    FormLabel,
    useToast,
    Collapse,
    Tooltip,
    Flex,
    SimpleGrid,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
    HiOutlinePlus,
    HiOutlineTrash,
    HiOutlinePencil,
    HiOutlineCheck,
    HiOutlineXMark,
    HiOutlineScale,
} from "react-icons/hi2";
import { addCriterion, updateCriterion, deleteCriterion } from "@/lib/api-services";
import type { Criterion } from "@/lib/types";

const MotionBox = motion(Box);

interface CriteriaTabProps {
    eventId: string;
    criteria: Criterion[];
    setCriteria: React.Dispatch<React.SetStateAction<Criterion[]>>;
    isDraft: boolean;
}

export function CriteriaTab({ eventId, criteria, setCriteria, isDraft }: CriteriaTabProps) {
    const toast = useToast();
    const [showAdd, setShowAdd] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // New criterion
    const [newName, setNewName] = useState("");
    const [newMin, setNewMin] = useState(0);
    const [newMax, setNewMax] = useState(10);
    const [newWeight, setNewWeight] = useState(1);

    // Edit criterion
    const [editName, setEditName] = useState("");
    const [editMin, setEditMin] = useState(0);
    const [editMax, setEditMax] = useState(10);
    const [editWeight, setEditWeight] = useState(1);

    const resetNewForm = () => {
        setNewName("");
        setNewMin(0);
        setNewMax(10);
        setNewWeight(1);
    };

    const handleAdd = async () => {
        if (!newName.trim()) {
            toast({ title: "Name is required", status: "warning", duration: 2000 });
            return;
        }
        setSaving(true);
        try {
            const crit = await addCriterion(eventId, {
                name: newName.trim(),
                scale_min: newMin,
                scale_max: newMax,
                weight: newWeight,
            });
            setCriteria((prev) => [...prev, crit]);
            resetNewForm();
            setShowAdd(false);
            toast({ title: "Criterion added", status: "success", duration: 1500 });
        } catch (err: any) {
            toast({
                title: "Failed to add criterion",
                description: err.response?.data?.detail || "Unknown error",
                status: "error",
                duration: 3000,
            });
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async (id: string) => {
        if (!editName.trim()) {
            toast({ title: "Name is required", status: "warning", duration: 2000 });
            return;
        }
        setSaving(true);
        try {
            const updated = await updateCriterion(eventId, id, {
                name: editName.trim(),
                scale_min: editMin,
                scale_max: editMax,
                weight: editWeight,
            });
            setCriteria((prev) => prev.map((c) => (c.id === id ? updated : c)));
            setEditingId(null);
            toast({ title: "Criterion updated", status: "success", duration: 1500 });
        } catch (err: any) {
            toast({
                title: "Failed to update",
                description: err.response?.data?.detail || "Unknown error",
                status: "error",
                duration: 3000,
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteCriterion(eventId, id);
            setCriteria((prev) => prev.filter((c) => c.id !== id));
            toast({ title: "Criterion deleted", status: "success", duration: 1500 });
        } catch (err: any) {
            toast({
                title: "Failed to delete",
                description: err.response?.data?.detail || "Unknown error",
                status: "error",
                duration: 3000,
            });
        }
    };

    const startEdit = (crit: Criterion) => {
        setEditingId(crit.id);
        setEditName(crit.name);
        setEditMin(crit.scale_min);
        setEditMax(crit.scale_max);
        setEditWeight(crit.weight);
    };

    const totalWeight = criteria.reduce((sum, c) => sum + (c.weight || 0), 0);

    return (
        <VStack spacing={4} align="stretch">
            <Flex justify="space-between" align="center">
                <Box>
                    <Heading size="sm" color="white">
                        Judging Criteria
                    </Heading>
                    <Text color="whiteAlpha.500" fontSize="sm">
                        {isDraft
                            ? "Define how judges will score submissions."
                            : "Criteria are locked after the event opens."}
                    </Text>
                </Box>
                {isDraft && (
                    <Button
                        colorScheme="brand"
                        size="sm"
                        leftIcon={<HiOutlinePlus />}
                        onClick={() => {
                            resetNewForm();
                            setShowAdd(!showAdd);
                        }}
                    >
                        Add Criterion
                    </Button>
                )}
            </Flex>

            {/* Total weight display */}
            {criteria.length > 0 && (
                <HStack
                    p={3}
                    borderRadius="xl"
                    bg="whiteAlpha.50"
                    border="1px solid"
                    borderColor="whiteAlpha.100"
                >
                    <HiOutlineScale color="var(--chakra-colors-brand-300)" />
                    <Text color="whiteAlpha.600" fontSize="sm">
                        Total Weight: <Text as="span" color="white" fontWeight="600">{totalWeight}</Text>
                    </Text>
                </HStack>
            )}

            {/* Add form */}
            <Collapse in={showAdd} animateOpacity>
                <Box
                    p={6}
                    borderRadius="2xl"
                    bg="whiteAlpha.50"
                    border="1px solid"
                    borderColor="brand.400"
                    boxShadow="0 0 20px rgba(124, 58, 237, 0.1)"
                >
                    <VStack spacing={4} align="stretch">
                        <Heading size="xs" color="white">New Criterion</Heading>
                        <FormControl>
                            <FormLabel color="whiteAlpha.700" fontSize="sm">Name</FormLabel>
                            <Input
                                placeholder="e.g. Innovation, Technical Execution"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                color="white"
                                size="sm"
                            />
                        </FormControl>

                        <SimpleGrid columns={3} spacing={4}>
                            <FormControl>
                                <FormLabel color="whiteAlpha.700" fontSize="sm">Min Score</FormLabel>
                                <NumberInput
                                    min={0}
                                    max={100}
                                    value={newMin}
                                    onChange={(_, val) => setNewMin(val)}
                                    size="sm"
                                >
                                    <NumberInputField color="white" />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper borderColor="whiteAlpha.200" color="whiteAlpha.600" />
                                        <NumberDecrementStepper borderColor="whiteAlpha.200" color="whiteAlpha.600" />
                                    </NumberInputStepper>
                                </NumberInput>
                            </FormControl>
                            <FormControl>
                                <FormLabel color="whiteAlpha.700" fontSize="sm">Max Score</FormLabel>
                                <NumberInput
                                    min={1}
                                    max={100}
                                    value={newMax}
                                    onChange={(_, val) => setNewMax(val)}
                                    size="sm"
                                >
                                    <NumberInputField color="white" />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper borderColor="whiteAlpha.200" color="whiteAlpha.600" />
                                        <NumberDecrementStepper borderColor="whiteAlpha.200" color="whiteAlpha.600" />
                                    </NumberInputStepper>
                                </NumberInput>
                            </FormControl>
                            <FormControl>
                                <FormLabel color="whiteAlpha.700" fontSize="sm">Weight</FormLabel>
                                <NumberInput
                                    min={0}
                                    max={100}
                                    step={0.5}
                                    value={newWeight}
                                    onChange={(_, val) => setNewWeight(val)}
                                    size="sm"
                                >
                                    <NumberInputField color="white" />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper borderColor="whiteAlpha.200" color="whiteAlpha.600" />
                                        <NumberDecrementStepper borderColor="whiteAlpha.200" color="whiteAlpha.600" />
                                    </NumberInputStepper>
                                </NumberInput>
                            </FormControl>
                        </SimpleGrid>

                        <HStack justify="flex-end">
                            <Button size="sm" variant="ghost" color="whiteAlpha.600" onClick={() => setShowAdd(false)}>
                                Cancel
                            </Button>
                            <Button size="sm" colorScheme="brand" leftIcon={<HiOutlineCheck />} isLoading={saving} onClick={handleAdd}>
                                Add Criterion
                            </Button>
                        </HStack>
                    </VStack>
                </Box>
            </Collapse>

            {/* Criteria list */}
            {criteria.length === 0 ? (
                <Box
                    p={12}
                    borderRadius="2xl"
                    bg="whiteAlpha.50"
                    border="1px dashed"
                    borderColor="whiteAlpha.200"
                    textAlign="center"
                >
                    <Text color="whiteAlpha.400">
                        No criteria yet. Add criteria to define how judges score submissions.
                    </Text>
                </Box>
            ) : (
                <AnimatePresence>
                    {criteria.map((crit) => (
                        <MotionBox
                            key={crit.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            p={5}
                            borderRadius="2xl"
                            bg="whiteAlpha.50"
                            border="1px solid"
                            borderColor={editingId === crit.id ? "brand.400" : "whiteAlpha.100"}
                            style={{ transition: "all 0.2s" }}
                        >
                            {editingId === crit.id ? (
                                <VStack spacing={3} align="stretch">
                                    <FormControl>
                                        <Input
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            color="white"
                                            size="sm"
                                        />
                                    </FormControl>
                                    <SimpleGrid columns={3} spacing={3}>
                                        <FormControl>
                                            <FormLabel color="whiteAlpha.700" fontSize="xs">Min</FormLabel>
                                            <NumberInput min={0} max={100} value={editMin} onChange={(_, v) => setEditMin(v)} size="sm">
                                                <NumberInputField color="white" />
                                            </NumberInput>
                                        </FormControl>
                                        <FormControl>
                                            <FormLabel color="whiteAlpha.700" fontSize="xs">Max</FormLabel>
                                            <NumberInput min={1} max={100} value={editMax} onChange={(_, v) => setEditMax(v)} size="sm">
                                                <NumberInputField color="white" />
                                            </NumberInput>
                                        </FormControl>
                                        <FormControl>
                                            <FormLabel color="whiteAlpha.700" fontSize="xs">Weight</FormLabel>
                                            <NumberInput min={0} max={100} step={0.5} value={editWeight} onChange={(_, v) => setEditWeight(v)} size="sm">
                                                <NumberInputField color="white" />
                                            </NumberInput>
                                        </FormControl>
                                    </SimpleGrid>
                                    <HStack justify="flex-end">
                                        <Button size="xs" variant="ghost" color="whiteAlpha.600" leftIcon={<HiOutlineXMark />} onClick={() => setEditingId(null)}>
                                            Cancel
                                        </Button>
                                        <Button size="xs" colorScheme="brand" leftIcon={<HiOutlineCheck />} isLoading={saving} onClick={() => handleUpdate(crit.id)}>
                                            Save
                                        </Button>
                                    </HStack>
                                </VStack>
                            ) : (
                                <Flex justify="space-between" align="center">
                                    <Box>
                                        <Text color="white" fontWeight="500" fontSize="sm">
                                            {crit.name}
                                        </Text>
                                        <HStack spacing={3} mt={1}>
                                            <Text color="whiteAlpha.400" fontSize="xs">
                                                Scale: {crit.scale_min} - {crit.scale_max}
                                            </Text>
                                            <Text color="whiteAlpha.400" fontSize="xs">
                                                Weight: {crit.weight}
                                            </Text>
                                        </HStack>
                                    </Box>
                                    {isDraft && (
                                        <HStack spacing={1}>
                                            <Tooltip label="Edit">
                                                <IconButton
                                                    aria-label="Edit"
                                                    icon={<HiOutlinePencil />}
                                                    size="sm"
                                                    variant="ghost"
                                                    color="whiteAlpha.500"
                                                    _hover={{ color: "brand.300" }}
                                                    onClick={() => startEdit(crit)}
                                                />
                                            </Tooltip>
                                            <Tooltip label="Delete">
                                                <IconButton
                                                    aria-label="Delete"
                                                    icon={<HiOutlineTrash />}
                                                    size="sm"
                                                    variant="ghost"
                                                    color="whiteAlpha.500"
                                                    _hover={{ color: "red.300" }}
                                                    onClick={() => handleDelete(crit.id)}
                                                />
                                            </Tooltip>
                                        </HStack>
                                    )}
                                </Flex>
                            )}
                        </MotionBox>
                    ))}
                </AnimatePresence>
            )}
        </VStack>
    );
}
