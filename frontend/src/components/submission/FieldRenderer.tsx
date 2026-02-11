"use client";

import {
    FormControl,
    FormLabel,
    FormErrorMessage,
    FormHelperText,
    Input,
    Textarea,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Select,
    RadioGroup,
    Radio,
    CheckboxGroup,
    Checkbox,
    Slider,
    SliderTrack,
    SliderFilledTrack,
    SliderThumb,
    HStack,
    VStack,
    Text,
    Box,
    Badge,
    Tooltip,
} from "@chakra-ui/react";
import type { FormField } from "@/lib/types";
import { FileUploadField } from "./FileUploadField";

interface FieldProps {
    field: FormField;
    value: any;
    onChange: (value: any) => void;
    error?: string;
}

// ── Short Text ──
function ShortTextField({ field, value, onChange, error }: FieldProps) {
    const maxLen = field.validation?.max_length;
    return (
        <>
            <Input
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                placeholder={field.description || `Enter ${field.label.toLowerCase()}`}
                bg="whiteAlpha.50"
                borderColor={error ? "red.400" : "whiteAlpha.200"}
                _hover={{ borderColor: "whiteAlpha.400" }}
                _focus={{ borderColor: "brand.400", boxShadow: "0 0 0 1px var(--chakra-colors-brand-400)" }}
            />
            {maxLen && (
                <Text fontSize="xs" color="whiteAlpha.500" textAlign="right">
                    {(value || "").length}/{maxLen}
                </Text>
            )}
        </>
    );
}

// ── Long Text ──
function LongTextField({ field, value, onChange, error }: FieldProps) {
    const maxLen = field.validation?.max_length;
    return (
        <>
            <Textarea
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                placeholder={field.description || `Enter ${field.label.toLowerCase()}`}
                minH="120px"
                resize="vertical"
                bg="whiteAlpha.50"
                borderColor={error ? "red.400" : "whiteAlpha.200"}
                _hover={{ borderColor: "whiteAlpha.400" }}
                _focus={{ borderColor: "brand.400", boxShadow: "0 0 0 1px var(--chakra-colors-brand-400)" }}
            />
            {maxLen && (
                <Text fontSize="xs" color="whiteAlpha.500" textAlign="right">
                    {(value || "").length}/{maxLen}
                </Text>
            )}
        </>
    );
}

// ── Number ──
function NumberField({ field, value, onChange, error }: FieldProps) {
    const min = field.validation?.min;
    const max = field.validation?.max;
    return (
        <NumberInput
            value={value ?? ""}
            min={min}
            max={max}
            onChange={(_str, num) => onChange(isNaN(num) ? "" : num)}
        >
            <NumberInputField
                placeholder={field.description || `Enter a number`}
                bg="whiteAlpha.50"
                borderColor={error ? "red.400" : "whiteAlpha.200"}
                _hover={{ borderColor: "whiteAlpha.400" }}
                _focus={{ borderColor: "brand.400", boxShadow: "0 0 0 1px var(--chakra-colors-brand-400)" }}
            />
            <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
            </NumberInputStepper>
        </NumberInput>
    );
}

// ── URL ──
function UrlField({ field, value, onChange, error }: FieldProps) {
    return (
        <Input
            type="url"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.description || "https://..."}
            bg="whiteAlpha.50"
            borderColor={error ? "red.400" : "whiteAlpha.200"}
            _hover={{ borderColor: "whiteAlpha.400" }}
            _focus={{ borderColor: "brand.400", boxShadow: "0 0 0 1px var(--chakra-colors-brand-400)" }}
        />
    );
}

// ── Email ──
function EmailField({ field, value, onChange, error }: FieldProps) {
    return (
        <Input
            type="email"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.description || "email@example.com"}
            bg="whiteAlpha.50"
            borderColor={error ? "red.400" : "whiteAlpha.200"}
            _hover={{ borderColor: "whiteAlpha.400" }}
            _focus={{ borderColor: "brand.400", boxShadow: "0 0 0 1px var(--chakra-colors-brand-400)" }}
        />
    );
}

// ── Dropdown ──
function DropdownField({ field, value, onChange, error }: FieldProps) {
    const options = Array.isArray(field.options) ? field.options : [];
    return (
        <Select
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Select an option..."
            bg="whiteAlpha.50"
            borderColor={error ? "red.400" : "whiteAlpha.200"}
            _hover={{ borderColor: "whiteAlpha.400" }}
            _focus={{ borderColor: "brand.400", boxShadow: "0 0 0 1px var(--chakra-colors-brand-400)" }}
        >
            {options.map((opt: string) => (
                <option key={opt} value={opt} style={{ background: "#1a1a2e" }}>
                    {opt}
                </option>
            ))}
        </Select>
    );
}

// ── Multiple Choice (Radio) ──
function MultipleChoiceField({ field, value, onChange, error }: FieldProps) {
    const options = Array.isArray(field.options) ? field.options : [];
    return (
        <RadioGroup value={value || ""} onChange={onChange}>
            <VStack align="start" spacing={2}>
                {options.map((opt: string) => (
                    <Radio key={opt} value={opt} colorScheme="purple">
                        {opt}
                    </Radio>
                ))}
            </VStack>
        </RadioGroup>
    );
}

// ── Checkboxes (Multi-select) ──
function CheckboxesField({ field, value, onChange, error }: FieldProps) {
    const options = Array.isArray(field.options) ? field.options : [];
    const selected: string[] = Array.isArray(value) ? value : [];
    return (
        <CheckboxGroup
            value={selected}
            onChange={(vals) => onChange(vals as string[])}
        >
            <VStack align="start" spacing={2}>
                {options.map((opt: string) => (
                    <Checkbox key={opt} value={opt} colorScheme="purple">
                        {opt}
                    </Checkbox>
                ))}
            </VStack>
        </CheckboxGroup>
    );
}

// ── Date ──
function DateField({ field, value, onChange, error }: FieldProps) {
    return (
        <Input
            type="date"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            bg="whiteAlpha.50"
            borderColor={error ? "red.400" : "whiteAlpha.200"}
            _hover={{ borderColor: "whiteAlpha.400" }}
            _focus={{ borderColor: "brand.400", boxShadow: "0 0 0 1px var(--chakra-colors-brand-400)" }}
            sx={{
                "::-webkit-calendar-picker-indicator": { filter: "invert(1)" },
            }}
        />
    );
}

// ── Linear Scale ──
function LinearScaleField({ field, value, onChange, error }: FieldProps) {
    const opts = field.options && !Array.isArray(field.options) ? field.options : {};
    const minVal = opts.min ?? 1;
    const maxVal = opts.max ?? 10;
    const minLabel = opts.min_label || String(minVal);
    const maxLabel = opts.max_label || String(maxVal);
    const current = typeof value === "number" ? value : minVal;

    return (
        <VStack spacing={3} align="stretch">
            <HStack justify="space-between" fontSize="sm" color="whiteAlpha.600">
                <Text>{minLabel}</Text>
                <Text>{maxLabel}</Text>
            </HStack>
            <Slider
                min={minVal}
                max={maxVal}
                step={1}
                value={current}
                onChange={onChange}
                colorScheme="purple"
            >
                <SliderTrack bg="whiteAlpha.200">
                    <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb boxSize={6}>
                    <Text fontSize="xs" fontWeight="bold" color="gray.800">
                        {current}
                    </Text>
                </SliderThumb>
            </Slider>
            <HStack justify="center">
                {Array.from({ length: maxVal - minVal + 1 }, (_, i) => {
                    const n = minVal + i;
                    return (
                        <Tooltip key={n} label={n} placement="top" hasArrow>
                            <Badge
                                cursor="pointer"
                                variant={n === current ? "solid" : "subtle"}
                                colorScheme={n === current ? "purple" : "gray"}
                                onClick={() => onChange(n)}
                                px={2}
                                py={1}
                                borderRadius="md"
                                fontSize="xs"
                            >
                                {n}
                            </Badge>
                        </Tooltip>
                    );
                })}
            </HStack>
        </VStack>
    );
}

// ── Master Renderer ──

const FIELD_COMPONENTS: Record<string, React.FC<FieldProps>> = {
    short_text: ShortTextField,
    long_text: LongTextField,
    number: NumberField,
    url: UrlField,
    email: EmailField,
    dropdown: DropdownField,
    multiple_choice: MultipleChoiceField,
    checkboxes: CheckboxesField,
    file_upload: FileUploadField,
    date: DateField,
    linear_scale: LinearScaleField,
};

export function FieldRenderer({ field, value, onChange, error }: FieldProps) {
    const Component = FIELD_COMPONENTS[field.field_type];
    if (!Component) {
        return (
            <Text color="red.300" fontSize="sm">
                Unknown field type: {field.field_type}
            </Text>
        );
    }

    return (
        <FormControl isInvalid={!!error} isRequired={field.is_required}>
            <FormLabel color="white" fontWeight="semibold">
                {field.label}
            </FormLabel>
            {field.description && field.field_type !== "short_text" && field.field_type !== "long_text" && (
                <FormHelperText mb={2} color="whiteAlpha.500">
                    {field.description}
                </FormHelperText>
            )}
            <Component
                field={field}
                value={value}
                onChange={onChange}
                error={error}
            />
            {error && <FormErrorMessage>{error}</FormErrorMessage>}
        </FormControl>
    );
}
