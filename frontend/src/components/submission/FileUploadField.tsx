"use client";

import { useState, useRef, useCallback } from "react";
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
}

export function FileUploadField({ field, value, onChange, error }: FileUploadFieldProps) {
    const [uploads, setUploads] = useState<UploadState[]>(() => {
        if (Array.isArray(value)) {
            return value.map((url: string) => ({
                url,
                name: url.split("/").pop() || "file",
                progress: 100,
                uploading: false,
            }));
        }
        return [];
    });
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const opts = field.options && !Array.isArray(field.options) ? field.options : {};
    const accept = opts.accept ? (opts.accept as string[]).join(",") : undefined;
    const maxSizeMb = opts.max_size_mb || 100;

    const handleFiles = useCallback(
        async (files: FileList | null) => {
            if (!files || files.length === 0) return;

            const newUploads: UploadState[] = [];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                if (file.size > maxSizeMb * 1024 * 1024) {
                    continue; // skip files that are too large
                }

                const idx = uploads.length + newUploads.length;
                const placeholder: UploadState = {
                    url: "",
                    name: file.name,
                    progress: 0,
                    uploading: true,
                };
                newUploads.push(placeholder);

                setUploads((prev) => [...prev, placeholder]);

                try {
                    const publicUrl = await uploadFileToR2(file, (pct) => {
                        setUploads((prev) =>
                            prev.map((u, j) =>
                                j === idx ? { ...u, progress: pct } : u
                            )
                        );
                    });

                    setUploads((prev) =>
                        prev.map((u, j) =>
                            j === idx
                                ? { ...u, url: publicUrl, progress: 100, uploading: false }
                                : u
                        )
                    );
                } catch {
                    setUploads((prev) =>
                        prev.map((u, j) =>
                            j === idx ? { ...u, progress: 0, uploading: false } : u
                        )
                    );
                }
            }
        },
        [uploads.length, maxSizeMb]
    );

    // Sync urls to parent whenever uploads state changes
    const syncUrls = useCallback(
        (items: UploadState[]) => {
            const urls = items.filter((u) => u.url).map((u) => u.url);
            onChange(urls.length > 0 ? urls : []);
        },
        [onChange]
    );

    const removeFile = (idx: number) => {
        const next = uploads.filter((_, i) => i !== idx);
        setUploads(next);
        syncUrls(next);
    };

    // After uploads complete, sync
    const prevCompleted = useRef(0);
    const completedCount = uploads.filter((u) => !u.uploading && u.url).length;
    if (completedCount !== prevCompleted.current) {
        prevCompleted.current = completedCount;
        const urls = uploads.filter((u) => u.url && !u.uploading).map((u) => u.url);
        if (urls.length > 0) {
            setTimeout(() => onChange(urls), 0);
        }
    }

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
