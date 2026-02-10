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
    Textarea,
    Select,
    Switch,
    FormControl,
    FormLabel,
    Badge,
    useToast,
    Collapse,
    Tooltip,
    Flex,
    Tag,
    TagLabel,
    TagCloseButton,
    Divider,
} from "@chakra-ui/react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
    HiOutlinePlus,
    HiOutlineTrash,
    HiOutlinePencil,
    HiOutlineDocumentDuplicate,
    HiOutlineChevronUp,
    HiOutlineChevronDown,
    HiOutlineBars3,
    HiOutlineCheck,
    HiOutlineXMark,
} from "react-icons/hi2";
import {
    addFormField,
    updateFormField,
    deleteFormField,
    duplicateFormField,
    reorderFormFields,
} from "@/lib/api-services";
import type { FormField, FieldType } from "@/lib/types";

const MotionBox = motion.create(Box);

const FIELD_TYPE_OPTIONS: { value: FieldType; label: string; icon: string }[] = [
    { value: "short_text", label: "Short Text", icon: "Aa" },
    { value: "long_text", label: "Long Text", icon: "T" },
    { value: "number", label: "Number", icon: "#" },
    { value: "url", label: "URL", icon: "@" },
    { value: "email", label: "Email", icon: "@" },
    { value: "dropdown", label: "Dropdown", icon: "v" },
    { value: "multiple_choice", label: "Multiple Choice", icon: "o" },
    { value: "checkboxes", label: "Checkboxes", icon: "[]" },
    { value: "file_upload", label: "File Upload", icon: "^" },
    { value: "date", label: "Date", icon: "D" },
    { value: "linear_scale", label: "Linear Scale", icon: "---" },
];

const FIELD_TYPE_LABELS: Record<string, string> = {};
FIELD_TYPE_OPTIONS.forEach((o) => {
    FIELD_TYPE_LABELS[o.value] = o.label;
});

interface FormBuilderTabProps {
    eventId: string;
    fields: FormField[];
    setFields: React.Dispatch<React.SetStateAction<FormField[]>>;
    isDraft: boolean;
}

export function FormBuilderTab({ eventId, fields, setFields, isDraft }: FormBuilderTabProps) {
    const toast = useToast();
    const [showAdd, setShowAdd] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // New field form state
    const [newLabel, setNewLabel] = useState("");
    const [newType, setNewType] = useState<FieldType>("short_text");
    const [newDescription, setNewDescription] = useState("");
    const [newRequired, setNewRequired] = useState(false);
    const [newOptions, setNewOptions] = useState<string[]>([]);
    const [newOptionInput, setNewOptionInput] = useState("");

    // Edit field state
    const [editLabel, setEditLabel] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editRequired, setEditRequired] = useState(false);
    const [editOptions, setEditOptions] = useState<string[]>([]);
    const [editOptionInput, setEditOptionInput] = useState("");

    const needsOptions = (type: string) =>
        ["dropdown", "multiple_choice", "checkboxes"].includes(type);

    const resetNewForm = () => {
        setNewLabel("");
        setNewType("short_text");
        setNewDescription("");
        setNewRequired(false);
        setNewOptions([]);
        setNewOptionInput("");
    };

    const handleAddField = async () => {
        if (!newLabel.trim()) {
            toast({ title: "Label is required", status: "warning", duration: 2000 });
            return;
        }
        if (needsOptions(newType) && newOptions.length < 2) {
            toast({ title: "Add at least 2 options", status: "warning", duration: 2000 });
            return;
        }
        setSaving(true);
        try {
            const field = await addFormField(eventId, {
                label: newLabel.trim(),
                field_type: newType,
                description: newDescription.trim() || undefined,
                is_required: newRequired,
                options: needsOptions(newType) ? newOptions : undefined,
            });
            setFields((prev) => [...prev, field]);
            resetNewForm();
            setShowAdd(false);
            toast({ title: "Field added", status: "success", duration: 1500 });
        } catch (err: any) {
            toast({
                title: "Failed to add field",
                description: err.response?.data?.detail || "Unknown error",
                status: "error",
                duration: 3000,
            });
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async (fieldId: string) => {
        if (!editLabel.trim()) {
            toast({ title: "Label is required", status: "warning", duration: 2000 });
            return;
        }
        setSaving(true);
        try {
            const field = fields.find((f) => f.id === fieldId);
            const updateData: any = {
                label: editLabel.trim(),
                description: editDescription.trim() || undefined,
                is_required: editRequired,
            };
            if (field && needsOptions(field.field_type)) {
                updateData.options = editOptions;
            }
            const updated = await updateFormField(eventId, fieldId, updateData);
            setFields((prev) => prev.map((f) => (f.id === fieldId ? updated : f)));
            setEditingId(null);
            toast({ title: "Field updated", status: "success", duration: 1500 });
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

    const handleDelete = async (fieldId: string) => {
        try {
            await deleteFormField(eventId, fieldId);
            setFields((prev) => prev.filter((f) => f.id !== fieldId));
            toast({ title: "Field deleted", status: "success", duration: 1500 });
        } catch (err: any) {
            toast({
                title: "Failed to delete",
                description: err.response?.data?.detail || "Unknown error",
                status: "error",
                duration: 3000,
            });
        }
    };

    const handleDuplicate = async (fieldId: string) => {
        try {
            const field = await duplicateFormField(eventId, fieldId);
            setFields((prev) => [...prev, field]);
            toast({ title: "Field duplicated", status: "success", duration: 1500 });
        } catch (err: any) {
            toast({
                title: "Failed to duplicate",
                description: err.response?.data?.detail || "Unknown error",
                status: "error",
                duration: 3000,
            });
        }
    };

    const startEdit = (field: FormField) => {
        setEditingId(field.id);
        setEditLabel(field.label);
        setEditDescription(field.description || "");
        setEditRequired(field.is_required);
        setEditOptions(Array.isArray(field.options) ? field.options as string[] : []);
        setEditOptionInput("");
    };

    const handleReorder = async (newOrder: FormField[]) => {
        setFields(newOrder);
        const order = newOrder.map((f, i) => ({ id: f.id, sort_order: i }));
        try {
            await reorderFormFields(eventId, order);
        } catch {
            toast({ title: "Failed to reorder", status: "error", duration: 2000 });
        }
    };

    const addNewOption = () => {
        const val = newOptionInput.trim();
        if (val && !newOptions.includes(val)) {
            setNewOptions((prev) => [...prev, val]);
            setNewOptionInput("");
        }
    };

    const addEditOption = () => {
        const val = editOptionInput.trim();
        if (val && !editOptions.includes(val)) {
            setEditOptions((prev) => [...prev, val]);
            setEditOptionInput("");
        }
    };

    return (
        <VStack spacing={4} align="stretch">
            {/* Header */}
            <Flex justify="space-between" align="center">
                <Box>
                    <Heading size="sm" color="white">
                        Submission Form Fields
                    </Heading>
                    <Text color="whiteAlpha.500" fontSize="sm">
                        {isDraft
                            ? "Drag to reorder. Add any field type like Google Forms."
                            : "Form fields are locked after the event opens."}
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
                        Add Field
                    </Button>
                )}
            </Flex>

            {/* Add new field form */}
            <Collapse in={showAdd} animateOpacity>
                <MotionBox
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    p={6}
                    borderRadius="2xl"
                    bg="whiteAlpha.50"
                    border="1px solid"
                    borderColor="brand.400"
                    boxShadow="0 0 20px rgba(124, 58, 237, 0.1)"
                >
                    <VStack spacing={4} align="stretch">
                        <Heading size="xs" color="white">
                            New Field
                        </Heading>

                        <HStack spacing={4} align="start">
                            <FormControl flex={2}>
                                <FormLabel color="whiteAlpha.700" fontSize="sm">Label</FormLabel>
                                <Input
                                    placeholder="e.g. Project Name"
                                    value={newLabel}
                                    onChange={(e) => setNewLabel(e.target.value)}
                                    color="white"
                                    size="sm"
                                />
                            </FormControl>
                            <FormControl flex={1}>
                                <FormLabel color="whiteAlpha.700" fontSize="sm">Type</FormLabel>
                                <Select
                                    value={newType}
                                    onChange={(e) => setNewType(e.target.value as FieldType)}
                                    color="white"
                                    size="sm"
                                    bg="whiteAlpha.50"
                                    borderColor="whiteAlpha.100"
                                >
                                    {FIELD_TYPE_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value} style={{ background: "#1a1a2e" }}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>
                        </HStack>

                        <FormControl>
                            <FormLabel color="whiteAlpha.700" fontSize="sm">Description (optional)</FormLabel>
                            <Input
                                placeholder="Help text for this field"
                                value={newDescription}
                                onChange={(e) => setNewDescription(e.target.value)}
                                color="white"
                                size="sm"
                            />
                        </FormControl>

                        <HStack>
                            <FormControl display="flex" alignItems="center" w="auto">
                                <FormLabel color="whiteAlpha.700" fontSize="sm" mb={0} mr={2}>
                                    Required
                                </FormLabel>
                                <Switch
                                    colorScheme="brand"
                                    isChecked={newRequired}
                                    onChange={(e) => setNewRequired(e.target.checked)}
                                />
                            </FormControl>
                        </HStack>

                        {/* Options input for dropdown/choice types */}
                        {needsOptions(newType) && (
                            <FormControl>
                                <FormLabel color="whiteAlpha.700" fontSize="sm">Options</FormLabel>
                                <HStack>
                                    <Input
                                        placeholder="Add option..."
                                        value={newOptionInput}
                                        onChange={(e) => setNewOptionInput(e.target.value)}
                                        color="white"
                                        size="sm"
                                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addNewOption())}
                                    />
                                    <IconButton
                                        aria-label="Add option"
                                        icon={<HiOutlinePlus />}
                                        size="sm"
                                        colorScheme="brand"
                                        variant="ghost"
                                        onClick={addNewOption}
                                    />
                                </HStack>
                                <HStack mt={2} flexWrap="wrap" gap={1}>
                                    {newOptions.map((opt, i) => (
                                        <Tag key={i} size="sm" colorScheme="brand" borderRadius="full">
                                            <TagLabel>{opt}</TagLabel>
                                            <TagCloseButton
                                                onClick={() =>
                                                    setNewOptions((prev) => prev.filter((_, idx) => idx !== i))
                                                }
                                            />
                                        </Tag>
                                    ))}
                                </HStack>
                            </FormControl>
                        )}

                        <HStack justify="flex-end">
                            <Button
                                size="sm"
                                variant="ghost"
                                color="whiteAlpha.600"
                                onClick={() => setShowAdd(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                colorScheme="brand"
                                leftIcon={<HiOutlineCheck />}
                                isLoading={saving}
                                onClick={handleAddField}
                            >
                                Add Field
                            </Button>
                        </HStack>
                    </VStack>
                </MotionBox>
            </Collapse>

            {/* Fields list */}
            {fields.length === 0 ? (
                <Box
                    p={12}
                    borderRadius="2xl"
                    bg="whiteAlpha.50"
                    border="1px dashed"
                    borderColor="whiteAlpha.200"
                    textAlign="center"
                >
                    <Text color="whiteAlpha.400">
                        No form fields yet. Add fields to build your submission form.
                    </Text>
                </Box>
            ) : (
                <Reorder.Group
                    axis="y"
                    values={fields}
                    onReorder={isDraft ? handleReorder : () => {}}
                    as="div"
                    style={{ listStyle: "none" }}
                >
                    <AnimatePresence>
                        {fields.map((field, index) => (
                            <Reorder.Item
                                key={field.id}
                                value={field}
                                as="div"
                                style={{ marginBottom: "12px" }}
                                dragListener={isDraft && editingId !== field.id}
                            >
                                <Box
                                    p={5}
                                    borderRadius="2xl"
                                    bg="whiteAlpha.50"
                                    border="1px solid"
                                    borderColor={editingId === field.id ? "brand.400" : "whiteAlpha.100"}
                                    transition="all 0.2s"
                                    _hover={isDraft ? { borderColor: "whiteAlpha.300" } : {}}
                                >
                                    {editingId === field.id ? (
                                        /* Edit mode */
                                        <VStack spacing={3} align="stretch">
                                            <HStack spacing={3}>
                                                <FormControl flex={2}>
                                                    <Input
                                                        value={editLabel}
                                                        onChange={(e) => setEditLabel(e.target.value)}
                                                        color="white"
                                                        size="sm"
                                                        placeholder="Field label"
                                                    />
                                                </FormControl>
                                                <Badge
                                                    colorScheme="brand"
                                                    px={2}
                                                    py={1}
                                                    borderRadius="md"
                                                    fontSize="xs"
                                                >
                                                    {FIELD_TYPE_LABELS[field.field_type] || field.field_type}
                                                </Badge>
                                            </HStack>
                                            <Input
                                                value={editDescription}
                                                onChange={(e) => setEditDescription(e.target.value)}
                                                color="white"
                                                size="sm"
                                                placeholder="Description (optional)"
                                            />
                                            <HStack>
                                                <FormControl display="flex" alignItems="center" w="auto">
                                                    <FormLabel color="whiteAlpha.700" fontSize="xs" mb={0} mr={2}>
                                                        Required
                                                    </FormLabel>
                                                    <Switch
                                                        colorScheme="brand"
                                                        size="sm"
                                                        isChecked={editRequired}
                                                        onChange={(e) => setEditRequired(e.target.checked)}
                                                    />
                                                </FormControl>
                                            </HStack>

                                            {needsOptions(field.field_type) && (
                                                <FormControl>
                                                    <FormLabel color="whiteAlpha.700" fontSize="xs">Options</FormLabel>
                                                    <HStack>
                                                        <Input
                                                            placeholder="Add option..."
                                                            value={editOptionInput}
                                                            onChange={(e) => setEditOptionInput(e.target.value)}
                                                            color="white"
                                                            size="sm"
                                                            onKeyDown={(e) =>
                                                                e.key === "Enter" && (e.preventDefault(), addEditOption())
                                                            }
                                                        />
                                                        <IconButton
                                                            aria-label="Add option"
                                                            icon={<HiOutlinePlus />}
                                                            size="sm"
                                                            colorScheme="brand"
                                                            variant="ghost"
                                                            onClick={addEditOption}
                                                        />
                                                    </HStack>
                                                    <HStack mt={2} flexWrap="wrap" gap={1}>
                                                        {editOptions.map((opt, i) => (
                                                            <Tag key={i} size="sm" colorScheme="brand" borderRadius="full">
                                                                <TagLabel>{opt}</TagLabel>
                                                                <TagCloseButton
                                                                    onClick={() =>
                                                                        setEditOptions((prev) =>
                                                                            prev.filter((_, idx) => idx !== i)
                                                                        )
                                                                    }
                                                                />
                                                            </Tag>
                                                        ))}
                                                    </HStack>
                                                </FormControl>
                                            )}

                                            <HStack justify="flex-end">
                                                <Button
                                                    size="xs"
                                                    variant="ghost"
                                                    color="whiteAlpha.600"
                                                    leftIcon={<HiOutlineXMark />}
                                                    onClick={() => setEditingId(null)}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    size="xs"
                                                    colorScheme="brand"
                                                    leftIcon={<HiOutlineCheck />}
                                                    isLoading={saving}
                                                    onClick={() => handleUpdate(field.id)}
                                                >
                                                    Save
                                                </Button>
                                            </HStack>
                                        </VStack>
                                    ) : (
                                        /* View mode */
                                        <Flex justify="space-between" align="center">
                                            <HStack spacing={3} flex={1}>
                                                {isDraft && (
                                                    <Box color="whiteAlpha.300" cursor="grab" _active={{ cursor: "grabbing" }}>
                                                        <HiOutlineBars3 size={16} />
                                                    </Box>
                                                )}
                                                <Box>
                                                    <HStack spacing={2}>
                                                        <Text color="white" fontWeight="500" fontSize="sm">
                                                            {field.label}
                                                        </Text>
                                                        {field.is_required && (
                                                            <Text color="red.300" fontSize="xs">*</Text>
                                                        )}
                                                    </HStack>
                                                    <HStack spacing={2} mt={0.5}>
                                                        <Badge
                                                            colorScheme="whiteAlpha"
                                                            fontSize="xs"
                                                            variant="outline"
                                                        >
                                                            {FIELD_TYPE_LABELS[field.field_type] || field.field_type}
                                                        </Badge>
                                                        {field.description && (
                                                            <Text color="whiteAlpha.400" fontSize="xs" noOfLines={1}>
                                                                {field.description}
                                                            </Text>
                                                        )}
                                                    </HStack>
                                                    {needsOptions(field.field_type) && Array.isArray(field.options) && (
                                                        <HStack mt={1} flexWrap="wrap" gap={1}>
                                                            {(field.options as string[]).map((opt, i) => (
                                                                <Tag key={i} size="sm" variant="subtle" colorScheme="gray">
                                                                    <TagLabel>{opt}</TagLabel>
                                                                </Tag>
                                                            ))}
                                                        </HStack>
                                                    )}
                                                </Box>
                                            </HStack>
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
                                                            onClick={() => startEdit(field)}
                                                        />
                                                    </Tooltip>
                                                    <Tooltip label="Duplicate">
                                                        <IconButton
                                                            aria-label="Duplicate"
                                                            icon={<HiOutlineDocumentDuplicate />}
                                                            size="sm"
                                                            variant="ghost"
                                                            color="whiteAlpha.500"
                                                            _hover={{ color: "blue.300" }}
                                                            onClick={() => handleDuplicate(field.id)}
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
                                                            onClick={() => handleDelete(field.id)}
                                                        />
                                                    </Tooltip>
                                                </HStack>
                                            )}
                                        </Flex>
                                    )}
                                </Box>
                            </Reorder.Item>
                        ))}
                    </AnimatePresence>
                </Reorder.Group>
            )}
        </VStack>
    );
}
