"use client";

import {
    Box,
    Text,
    Link,
    Tag,
    HStack,
    Image,
    VStack,
    Wrap,
    WrapItem,
    AspectRatio,
} from "@chakra-ui/react";
import { HiOutlineArrowTopRightOnSquare, HiOutlineArrowDownTray } from "react-icons/hi2";
import type { FormDataDisplayItem } from "@/lib/types";

interface Props {
    item: FormDataDisplayItem;
}

function isVideoUrl(url: string): boolean {
    return /\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(url);
}

function isImageUrl(url: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|$)/i.test(url);
}

export default function SubmissionFieldDisplay({ item }: Props) {
    const { label, field_type, value } = item;

    if (value === null || value === undefined || value === "") {
        return null;
    }

    const renderValue = () => {
        switch (field_type) {
            case "short_text":
            case "number":
                return (
                    <Text color="white" fontWeight="medium">
                        {String(value)}
                    </Text>
                );

            case "long_text":
                return (
                    <Box
                        bg="whiteAlpha.50"
                        p={3}
                        borderRadius="md"
                        borderLeft="3px solid"
                        borderLeftColor="purple.400"
                    >
                        <Text color="gray.200" whiteSpace="pre-wrap" fontSize="sm">
                            {value}
                        </Text>
                    </Box>
                );

            case "url":
                return (
                    <Link
                        href={value}
                        isExternal
                        color="purple.300"
                        fontWeight="medium"
                        _hover={{ color: "purple.200", textDecor: "underline" }}
                    >
                        {value} <HiOutlineArrowTopRightOnSquare style={{ display: "inline", marginLeft: 2 }} />
                    </Link>
                );

            case "email":
                return (
                    <Link
                        href={`mailto:${value}`}
                        color="purple.300"
                        fontWeight="medium"
                        _hover={{ color: "purple.200" }}
                    >
                        {value}
                    </Link>
                );

            case "dropdown":
            case "multiple_choice":
                return (
                    <Tag colorScheme="purple" size="md">
                        {value}
                    </Tag>
                );

            case "checkboxes":
                if (!Array.isArray(value)) return <Text color="white">{String(value)}</Text>;
                return (
                    <Wrap>
                        {value.map((v: string, i: number) => (
                            <WrapItem key={i}>
                                <Tag colorScheme="purple" variant="subtle" size="sm">
                                    {v}
                                </Tag>
                            </WrapItem>
                        ))}
                    </Wrap>
                );

            case "file_upload":
                if (!Array.isArray(value)) return null;
                return (
                    <VStack align="start" spacing={3} w="100%">
                        {value.map((url: string, i: number) => {
                            if (isVideoUrl(url)) {
                                return (
                                    <AspectRatio key={i} ratio={16 / 9} w="100%" maxW="500px">
                                        <video
                                            src={url}
                                            controls
                                            style={{ borderRadius: "8px" }}
                                        />
                                    </AspectRatio>
                                );
                            }
                            if (isImageUrl(url)) {
                                return (
                                    <Image
                                        key={i}
                                        src={url}
                                        alt={`Upload ${i + 1}`}
                                        maxH="300px"
                                        borderRadius="md"
                                        objectFit="contain"
                                        cursor="pointer"
                                        onClick={() => window.open(url, "_blank")}
                                        _hover={{ opacity: 0.85 }}
                                    />
                                );
                            }
                            // Generic file download
                            const filename = url.split("/").pop() || `File ${i + 1}`;
                            return (
                                <Link
                                    key={i}
                                    href={url}
                                    isExternal
                                    color="purple.300"
                                    fontSize="sm"
                                >
                                    <HiOutlineArrowDownTray style={{ marginRight: 4, display: "inline" }} /> {filename}
                                </Link>
                            );
                        })}
                    </VStack>
                );

            case "date":
                try {
                    const d = new Date(value);
                    return (
                        <Text color="white" fontWeight="medium">
                            {d.toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </Text>
                    );
                } catch {
                    return <Text color="white">{value}</Text>;
                }

            case "linear_scale":
                return (
                    <Text color="white" fontWeight="medium">
                        {value}
                    </Text>
                );

            default:
                return <Text color="white">{String(value)}</Text>;
        }
    };

    return (
        <Box
            pl={4}
            borderLeft="2px solid"
            borderLeftColor="whiteAlpha.100"
            _hover={{ borderLeftColor: "purple.400" }}
            transition="border-color 0.2s"
        >
            <Text
                fontSize="xs"
                color="gray.400"
                textTransform="uppercase"
                letterSpacing="wide"
                fontWeight="semibold"
                mb={1.5}
            >
                {label}
            </Text>
            {renderValue()}
        </Box>
    );
}
