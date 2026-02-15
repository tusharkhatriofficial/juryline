import {
    Box,
    Button,
    Center,
    FormControl,
    FormLabel,
    Icon,
    Image,
    Input,
    Spinner,
    Text,
    useToast,
    VStack,
} from "@chakra-ui/react";
import { useRef, useState } from "react";
import { HiOutlineCloudArrowUp, HiOutlinePhoto, HiOutlineTrash } from "react-icons/hi2";
import { uploadFileToR2 } from "@/lib/api-services";

interface ImageUploaderProps {
    label?: string;
    value?: string;
    onChange: (url: string) => void;
    aspectRatio?: number;
    height?: string;
}

export function ImageUploader({
    label = "Banner Image",
    value,
    onChange,
    aspectRatio = 16 / 9,
    height = "200px",
}: ImageUploaderProps) {
    const toast = useToast();
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            toast({
                title: "Invalid file type",
                description: "Please upload an image file (PNG, JPG, WEBP).",
                status: "error",
            });
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "File too large",
                description: "Image must be under 5MB.",
                status: "error",
            });
            return;
        }

        setUploading(true);
        try {
            const url = await uploadFileToR2(file);
            onChange(url);
            toast({
                title: "Image uploaded",
                status: "success",
            });
        } catch (error) {
            toast({
                title: "Upload failed",
                description: "Could not upload image. Please try again.",
                status: "error",
            });
            console.error(error);
        } finally {
            setUploading(false);
            // Reset input so validation triggers again if same file selected
            if (inputRef.current) inputRef.current.value = "";
        }
    };

    return (
        <FormControl>
            {label && <FormLabel color="whiteAlpha.800">{label}</FormLabel>}

            <Box
                position="relative"
                h={height}
                w="full"
                borderRadius="xl"
                border="2px dashed"
                borderColor={value ? "transparent" : "whiteAlpha.300"}
                bg={value ? "black" : "whiteAlpha.50"}
                overflow="hidden"
                transition="all 0.2s"
                _hover={{ borderColor: value ? "transparent" : "brand.400" }}
                role="group"
            >
                {value ? (
                    <>
                        <Image
                            src={value}
                            alt="Uploaded image"
                            objectFit="cover"
                            w="full"
                            h="full"
                            opacity={uploading ? 0.5 : 1}
                        />
                        {/* Overlay Actions */}
                        <Box
                            position="absolute"
                            inset={0}
                            bg="blackAlpha.600"
                            opacity={0}
                            _groupHover={{ opacity: 1 }}
                            transition="all 0.2s"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            gap={4}
                        >
                            <Button
                                size="sm"
                                leftIcon={<HiOutlinePhoto />}
                                onClick={() => inputRef.current?.click()}
                            >
                                Change
                            </Button>
                            <Button
                                size="sm"
                                colorScheme="red"
                                variant="ghost"
                                onClick={() => onChange("")}
                            >
                                Remove
                            </Button>
                        </Box>
                    </>
                ) : (
                    <Center h="full" flexDirection="column" gap={3} cursor="pointer" onClick={() => inputRef.current?.click()}>
                        {uploading ? (
                            <Spinner color="brand.400" />
                        ) : (
                            <>
                                <Icon as={HiOutlineCloudArrowUp} boxSize={8} color="whiteAlpha.400" />
                                <Text fontSize="sm" color="whiteAlpha.600">
                                    Click to upload image
                                </Text>
                                <Text fontSize="xs" color="whiteAlpha.400">
                                    PNG, JPG, WEBP (Max 5MB)
                                </Text>
                            </>
                        )}
                    </Center>
                )}

                <Input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    display="none"
                    onChange={handleFileChange}
                />
            </Box>
        </FormControl>
    );
}
