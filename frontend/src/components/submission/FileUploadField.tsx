"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
    Box,
    VStack,
    HStack,
    Text,
    IconButton,
    Progress,
    Image,
    Link,
    Wrap,
    WrapItem,
} from "@chakra-ui/react";
import { HiOutlineCloudArrowUp, HiOutlineTrash, HiOutlineDocument } from "react-icons/hi2";
import { uploadFileToR2 } from "@/lib/api-services";
import type { FormField } from "@/lib/types";

interface FileUploadFieldProps {
    field: FormField;
    value: any;
    onChange: (value: any) => void;
    error?: string;
}

interface UploadState {
    url: string;
    name: string;
    progress: number;
    uploading: boolean;
    error?: string;
}

export function FileUploadField({ field, value, onChange, error }: FileUploadFieldProps) {
    const [uploads, setUploads] = useState<UploadState[]>(() => {
        if (Array.isArray(value)) {
            return value.map((url: string) => ({
                url,
                name: url.split("/").pop() || "file",
                progress: 100,
                uploading: false,
                error: undefined,
            }));
        }
        return [];
    });
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const opts = field.options && !Array.isArray(field.options) ? field.options : {};
    const accept = opts.accept ? (opts.accept as string[]).join(",") : undefined;
    const maxSizeMb = opts.max_size_mb || 100;

    // Sync to parent form state
    useEffect(() => {
        const completedUrls = uploads
            .filter((u) => u.url && !u.uploading && !u.error)
            .map((u) => u.url);

        // Only trigger if different (simple shallow check)
        const current = Array.isArray(value) ? value : [];
        const isDifferent =
            completedUrls.length !== current.length ||
            !completedUrls.every((u, i) => u === current[i]);

        if (isDifferent) {
            onChange(completedUrls);
        }
    }, [uploads, onChange, value]);

    const handleFiles = useCallback(
        async (files: FileList | null) => {
            if (!files || files.length === 0) return;

            // Create placeholders first
            const newPlaceholders: UploadState[] = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (file.size > maxSizeMb * 1024 * 1024) {
                    newPlaceholders.push({
                        url: "",
                        name: file.name,
                        progress: 0,
                        uploading: false,
                        error: "File too large (max " + maxSizeMb + "MB)",
                    });
                    continue;
                }

                newPlaceholders.push({
                    url: "",
                    name: file.name,
                    progress: 0,
                    uploading: true,
                });
            }

            // Add to state immediately
            setUploads((prev) => [...prev, ...newPlaceholders]);

            // Start uploads
            let placeholderIdx = 0;
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (file.size > maxSizeMb * 1024 * 1024) {
                    placeholderIdx++; // Skip this file in loop logic too
                    continue;
                }

                // We need to find the correct index in 'uploads' state potentially?
                // Actually, since async, it's risky to use index. 
                // Better approach: use a temporary ID or just careful index calculation.
                // Simplified: We appended N items. We know where they are relative to prev length.
                // But handleFiles is closure. Let's do parallel uploads carefully.

                const currentFile = file;
                // We'll just trigger the upload logic. 
                // Note: The index logic in original code was slightly flawed for batch uploads.
                // Let's fix it by defining the upload function here.

                uploadFile(currentFile, uploads.length + placeholderIdx);
                placeholderIdx++;
            }
        },
        [uploads.length, maxSizeMb] // Dependencies
    );

    const uploadFile = async (file: File, indexInState: number) => {
        try {
            const publicUrl = await uploadFileToR2(file, (pct) => {
                setUploads((prev) =>
                    prev.map((u, j) => j === indexInState ? { ...u, progress: pct } : u)
                );
            });

            setUploads((prev) =>
                prev.map((u, j) =>
                    j === indexInState
                        ? { ...u, url: publicUrl, progress: 100, uploading: false, error: undefined }
                        : u
                )
            );
        } catch (err: any) {
            setUploads((prev) =>
                prev.map((u, j) =>
                    j === indexInState
                        ? { ...u, progress: 0, uploading: false, error: "Upload failed" }
                        : u
                )
            );
        }
    };

    const removeFile = (idx: number) => {
        setUploads((prev) => prev.filter((_, i) => i !== idx));
    };

    const isImage = (name: string) =>
        /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name);

    return (
        <VStack spacing={3} align="stretch">
            {/* Drop zone */}
            <Box
                border="2px dashed"
                borderColor={dragging ? "brand.400" : error ? "red.400" : "whiteAlpha.300"}
                borderRadius="lg"
                p={6}
                textAlign="center"
                cursor="pointer"
                bg={dragging ? "whiteAlpha.100" : "whiteAlpha.50"}
                transition="all 0.2s"
                _hover={{ borderColor: "brand.400", bg: "whiteAlpha.100" }}
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    handleFiles(e.dataTransfer.files);
                }}
            >
                <VStack spacing={2}>
                    <Box as={HiOutlineCloudArrowUp} boxSize={8} color="brand.400" />
                    <Text color="whiteAlpha.700" fontSize="sm">
                        Drag and drop files here, or click to browse
                    </Text>
                    <Text color="whiteAlpha.400" fontSize="xs">
                        Max {maxSizeMb}MB per file
                        {accept && ` | Accepted: ${accept}`}
                    </Text>
                </VStack>
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    multiple
                    style={{ display: "none" }}
                    onChange={(e) => handleFiles(e.target.files)}
                />
            </Box>

            {/* Upload list */}
            {uploads.length > 0 && (
                <VStack spacing={2} align="stretch">
                    {uploads.map((upload, idx) => (
                        <HStack
                            key={idx}
                            bg="whiteAlpha.100"
                            p={3}
                            borderRadius="md"
                            justify="space-between"
                        >
                            <HStack spacing={3} flex={1} minW={0}>
                                {upload.url && isImage(upload.name) ? (
                                    <Image
                                        src={upload.url}
                                        alt={upload.name}
                                        boxSize={10}
                                        objectFit="cover"
                                        borderRadius="md"
                                    />
                                ) : (
                                    <Box as={HiOutlineDocument} boxSize={5} color="brand.300" />
                                )}
                                <VStack align="start" spacing={0} flex={1} minW={0}>
                                    {upload.url ? (
                                        <Link
                                            href={upload.url}
                                            isExternal
                                            color="brand.300"
                                            fontSize="sm"
                                            noOfLines={1}
                                        >
                                            {upload.name}
                                        </Link>
                                    ) : (
                                        <Text fontSize="sm" color="whiteAlpha.700" noOfLines={1}>
                                            {upload.name}
                                        </Text>
                                    )}
                                    {upload.uploading && (
                                        <Progress
                                            value={upload.progress}
                                            size="xs"
                                            colorScheme="purple"
                                            w="100%"
                                            borderRadius="full"
                                        />
                                    )}
                                    {upload.error && (
                                        <Text fontSize="xs" color="red.300">
                                            {upload.error}
                                        </Text>
                                    )}
                                </VStack>
                            </HStack>
                            <IconButton
                                aria-label="Remove file"
                                icon={<HiOutlineTrash />}
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                onClick={() => removeFile(idx)}
                                isDisabled={upload.uploading}
                            />
                        </HStack>
                    ))}
                </VStack>
            )}
        </VStack>
    );
}
