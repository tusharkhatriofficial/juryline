"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    Box,
    Container,
    Heading,
    Text,
    Button,
    VStack,
    HStack,
    Input,
    InputGroup,
    InputRightElement,
    IconButton,
    FormControl,
    FormLabel,
    FormErrorMessage,
    Select,
    Link,
    Progress,
    useToast,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { HiOutlineEye, HiOutlineEyeSlash } from "react-icons/hi2";
import { createClient } from "@/lib/supabase/client";

const MotionBox = motion.create(Box);

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
    if (!pw) return { score: 0, label: "", color: "gray" };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 1) return { score: 20, label: "Weak", color: "red" };
    if (score === 2) return { score: 40, label: "Fair", color: "orange" };
    if (score === 3) return { score: 60, label: "Good", color: "yellow" };
    if (score === 4) return { score: 80, label: "Strong", color: "green" };
    return { score: 100, label: "Very Strong", color: "cyan" };
}

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState("participant");
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const router = useRouter();
    const toast = useToast();
    const supabase = createClient();

    const strength = useMemo(() => getPasswordStrength(password), [password]);

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
                            <InputGroup size="lg">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Min 6 characters"
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
                            {password && (
                                <Box mt={2}>
                                    <Progress
                                        value={strength.score}
                                        size="xs"
                                        borderRadius="full"
                                        colorScheme={strength.color}
                                        bg="whiteAlpha.100"
                                        sx={{
                                            "& > div": {
                                                transition: "width 0.3s ease, background 0.3s ease",
                                            },
                                        }}
                                    />
                                    <HStack justify="space-between" mt={1}>
                                        <Text fontSize="xs" color={`${strength.color}.300`}>
                                            {strength.label}
                                        </Text>
                                        <Text fontSize="xs" color="whiteAlpha.400">
                                            {password.length < 6
                                                ? `${6 - password.length} more characters needed`
                                                : "Looks good"}
                                        </Text>
                                    </HStack>
                                </Box>
                            )}
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
