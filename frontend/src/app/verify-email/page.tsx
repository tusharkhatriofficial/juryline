"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
    Box,
    Container,
    Heading,
    Text,
    VStack,
    Button,
    useToast,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { HiOutlineEnvelope } from "react-icons/hi2";
import { createClient } from "@/lib/supabase/client";

const MotionBox = motion(Box);

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const email = searchParams.get("email") || "your email";
    const toast = useToast();
    const supabase = createClient();

    const handleResend = async () => {
        const { error } = await supabase.auth.resend({
            type: "signup",
            email,
        });

        if (error) {
            toast({
                title: "Failed to resend",
                description: error.message,
                status: "error",
                duration: 4000,
            });
        } else {
            toast({
                title: "Email sent",
                description: "Check your inbox for the verification link.",
                status: "success",
                duration: 4000,
            });
        }
    };

    return (
        <Box minH="100vh" bg="gray.900" position="relative" overflow="hidden">
            <Box
                position="absolute"
                top="20%"
                left="50%"
                transform="translateX(-50%)"
                w="400px"
                h="400px"
                borderRadius="full"
                bg="brand.500"
                filter="blur(150px)"
                opacity={0.1}
            />

            <Container maxW="md" py={24} position="relative" zIndex={1}>
                <MotionBox
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    textAlign="center"
                >
                    <VStack spacing={6}>
                        <MotionBox
                            animate={{
                                scale: [1, 1.05, 1],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        >
                            <Box
                                p={6}
                                borderRadius="full"
                                bg="brand.500"
                                display="inline-flex"
                                color="white"
                            >
                                <HiOutlineEnvelope size={48} />
                            </Box>
                        </MotionBox>

                        <Heading size="lg" color="white">
                            Check Your Email
                        </Heading>

                        <Text color="whiteAlpha.600" maxW="sm">
                            We sent a verification link to{" "}
                            <Text as="span" color="brand.300" fontWeight="600">
                                {email}
                            </Text>
                            . Click the link to verify your account.
                        </Text>

                        <Button
                            variant="ghost"
                            color="whiteAlpha.600"
                            size="sm"
                            onClick={handleResend}
                            _hover={{ color: "brand.300" }}
                        >
                            Didn't receive it? Resend
                        </Button>
                    </VStack>
                </MotionBox>
            </Container>
        </Box>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense>
            <VerifyEmailContent />
        </Suspense>
    );
}
