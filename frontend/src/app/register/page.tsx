"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Box,
    Container,
    Heading,
    Text,
    Button,
    VStack,
    Input,
    FormControl,
    FormLabel,
    FormErrorMessage,
    Select,
    Link,
    useToast,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

const MotionBox = motion(Box);

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("participant");
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const router = useRouter();
    const toast = useToast();
    const supabase = createClient();

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!name.trim()) errs.name = "Name is required";
        if (!email.trim()) errs.email = "Email is required";
        if (password.length < 6) errs.password = "Password must be at least 6 characters";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { name, role },
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) {
                toast({
                    title: "Registration failed",
                    description: error.message,
                    status: "error",
                    duration: 5000,
                });
                return;
            }

            router.push("/verify-email?email=" + encodeURIComponent(email));
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
                top="-20%"
                right="-10%"
                w="500px"
                h="500px"
                borderRadius="full"
                bg="brand.600"
                filter="blur(120px)"
                opacity={0.12}
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
                                Create Account
                            </Heading>
                            <Text color="whiteAlpha.600" fontSize="sm">
                                Join Juryline to organize or participate in hackathons
                            </Text>
                        </VStack>

                        <FormControl isInvalid={!!errors.name}>
                            <FormLabel color="whiteAlpha.700" fontSize="sm">
                                Full Name
                            </FormLabel>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Alex Johnson"
                                size="lg"
                            />
                            <FormErrorMessage>{errors.name}</FormErrorMessage>
                        </FormControl>

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
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min 6 characters"
                                size="lg"
                            />
                            <FormErrorMessage>{errors.password}</FormErrorMessage>
                        </FormControl>

                        <FormControl>
                            <FormLabel color="whiteAlpha.700" fontSize="sm">
                                I am a...
                            </FormLabel>
                            <Select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                size="lg"
                                bg="whiteAlpha.50"
                                borderColor="whiteAlpha.100"
                            >
                                <option value="participant" style={{ background: "#1a202c" }}>
                                    Participant
                                </option>
                                <option value="organizer" style={{ background: "#1a202c" }}>
                                    Organizer
                                </option>
                            </Select>
                        </FormControl>

                        <Button
                            type="submit"
                            colorScheme="brand"
                            size="lg"
                            w="full"
                            isLoading={loading}
                            loadingText="Creating account..."
                        >
                            Sign Up
                        </Button>

                        <Text color="whiteAlpha.500" fontSize="sm">
                            Already have an account?{" "}
                            <Link color="brand.300" href="/login">
                                Log in
                            </Link>
                        </Text>
                    </VStack>
                </MotionBox>
            </Container>
        </Box>
    );
}
