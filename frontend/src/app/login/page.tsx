"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Box,
    Container,
    Heading,
    Text,
    Button,
    VStack,
    Input,
    InputGroup,
    InputRightElement,
    IconButton,
    FormControl,
    FormLabel,
    FormErrorMessage,
    Link,
    useToast,
    Alert,
    AlertIcon,
    AlertDescription,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { HiOutlineEye, HiOutlineEyeSlash } from "react-icons/hi2";
import { createClient } from "@/lib/supabase/client";

const MotionBox = motion.create(Box);

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [unverified, setUnverified] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const router = useRouter();
    const searchParams = useSearchParams();
    const toast = useToast();
    const supabase = createClient();
    const returnTo = searchParams.get("returnTo");

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!email.trim()) errs.email = "Email is required";
        if (!password) errs.password = "Password is required";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        setUnverified(false);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                if (error.message.toLowerCase().includes("email not confirmed")) {
                    setUnverified(true);
                    return;
                }
                toast({
                    title: "Login failed",
                    description: error.message,
                    status: "error",
                    duration: 5000,
                });
                return;
            }

            // Get role for redirect
            const {
                data: { user },
            } = await supabase.auth.getUser();
            const role = user?.user_metadata?.role;

            const redirectMap: Record<string, string> = {
                organizer: "/dashboard",
                judge: "/dashboard",
                participant: "/dashboard",
            };

            router.push(returnTo || redirectMap[role || ""] || "/dashboard");
        } catch {
            toast({
                title: "Something went wrong",
                status: "error",
                duration: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box minH="100vh" bg="gray.900" position="relative" overflow="hidden">
            <Box
                position="absolute"
                bottom="-20%"
                left="-10%"
                w="500px"
                h="500px"
                borderRadius="full"
                bg="accent.500"
                filter="blur(120px)"
                opacity={0.1}
            />

            <Container maxW="md" py={20} position="relative" zIndex={1}>
                <MotionBox
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    p={8}
                    borderRadius="2xl"
                    bg="whiteAlpha.50"
                    backdropFilter="blur(20px)"
                    border="1px solid"
                    borderColor="whiteAlpha.100"
                >
                    <VStack spacing={6} as="form" onSubmit={handleSubmit}>
                        <VStack spacing={2} textAlign="center" w="full">
                            <Heading size="lg" color="white">
                                Welcome Back
                            </Heading>
                            <Text color="whiteAlpha.600" fontSize="sm">
                                Log in to your Juryline account
                            </Text>
                        </VStack>

                        {unverified && (
                            <Alert status="warning" borderRadius="xl" bg="orange.900" color="orange.100">
                                <AlertIcon />
                                <AlertDescription fontSize="sm">
                                    Email not verified. Please check your inbox for the verification link.
                                </AlertDescription>
                            </Alert>
                        )}

                        <FormControl isInvalid={!!errors.email}>
                            <FormLabel color="whiteAlpha.700" fontSize="sm">
                                Email
                            </FormLabel>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="alex@example.com"
                                size="lg"
                            />
                            <FormErrorMessage>{errors.email}</FormErrorMessage>
                        </FormControl>

                        <FormControl isInvalid={!!errors.password}>
                            <FormLabel color="whiteAlpha.700" fontSize="sm">
                                Password
                            </FormLabel>
                            <InputGroup size="lg">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Your password"
                                    pr="3rem"
                                />
                                <InputRightElement>
                                    <IconButton
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        icon={showPassword ? <HiOutlineEyeSlash /> : <HiOutlineEye />}
                                        size="sm"
                                        variant="ghost"
                                        color="whiteAlpha.500"
                                        onClick={() => setShowPassword(!showPassword)}
                                        _hover={{ color: "whiteAlpha.800" }}
                                    />
                                </InputRightElement>
                            </InputGroup>
                            <FormErrorMessage>{errors.password}</FormErrorMessage>
                        </FormControl>

                        <Button
                            type="submit"
                            colorScheme="brand"
                            size="lg"
                            w="full"
                            isLoading={loading}
                            loadingText="Logging in..."
                        >
                            Log In
                        </Button>

                        <Text color="whiteAlpha.500" fontSize="sm">
                            Don't have an account?{" "}
                            <Link color="brand.300" href={returnTo ? `/register?returnTo=${encodeURIComponent(returnTo)}` : "/register"}>
                                Sign up
                            </Link>
                        </Text>
                    </VStack>
                </MotionBox>
            </Container>
        </Box>
    );
}
