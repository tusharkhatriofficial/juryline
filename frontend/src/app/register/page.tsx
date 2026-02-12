"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Box,
    Flex,
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
    Icon,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
    HiOutlineEye,
    HiOutlineEyeSlash,
    HiOutlineArrowRight,
    HiOutlineSparkles,
    HiOutlineDocumentText,
    HiOutlineArrowPath,
    HiOutlinePresentationChartBar,
} from "react-icons/hi2";
import { createClient } from "@/lib/supabase/client";

const MotionBox = motion.create(Box);
const MotionFlex = motion.create(Flex);

const STEPS = [
    { num: "01", title: "Create your event", desc: "Set up criteria, deadlines, and custom forms" },
    { num: "02", title: "Collect submissions", desc: "Participants submit via shareable links" },
    { num: "03", title: "Review & rank", desc: "AI assigns judges, scores aggregate instantly" },
];

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
    const searchParams = useSearchParams();
    const toast = useToast();
    const supabase = createClient();
    const returnTo = searchParams.get("returnTo");

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
        <Flex minH="100vh" bg="gray.900">
            {/* Left Panel -- Branding */}
            <MotionFlex
                display={{ base: "none", lg: "flex" }}
                flex={1}
                direction="column"
                justify="center"
                align="center"
                p={16}
                position="relative"
                overflow="hidden"
                bgGradient="linear(to-br, brand.600, brand.900)"
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
            >
                <Box position="absolute" top="-15%" right="-15%" w="400px" h="400px" borderRadius="full" bg="whiteAlpha.100" filter="blur(80px)" />
                <Box position="absolute" bottom="-10%" left="-10%" w="300px" h="300px" borderRadius="full" bg="accent.500" filter="blur(100px)" opacity={0.2} />

                <VStack spacing={10} maxW="400px" position="relative" zIndex={1}>
                    <VStack spacing={4} textAlign="center">
                        <HStack spacing={2}>
                            <Icon as={HiOutlineSparkles} boxSize={6} color="brand.200" />
                            <Text fontSize="2xl" fontWeight="800" color="white" letterSpacing="tight">
                                Juryline
                            </Text>
                        </HStack>

                        <Heading fontSize="2xl" color="white" fontWeight="700" lineHeight="1.3">
                            Get started in minutes
                        </Heading>
                        <Text color="whiteAlpha.600" fontSize="sm">
                            Everything you need to run a great hackathon
                        </Text>
                    </VStack>

                    <VStack spacing={6} w="full" align="stretch">
                        {STEPS.map((step, i) => (
                            <MotionBox
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: 0.3 + i * 0.15 }}
                            >
                                <HStack spacing={4} align="flex-start">
                                    <Flex
                                        w={10}
                                        h={10}
                                        borderRadius="xl"
                                        bg="whiteAlpha.100"
                                        align="center"
                                        justify="center"
                                        flexShrink={0}
                                        border="1px solid"
                                        borderColor="whiteAlpha.100"
                                    >
                                        <Text fontSize="sm" fontWeight="700" color="brand.200">
                                            {step.num}
                                        </Text>
                                    </Flex>
                                    <VStack spacing={0} align="start">
                                        <Text color="white" fontSize="sm" fontWeight="600">
                                            {step.title}
                                        </Text>
                                        <Text color="whiteAlpha.500" fontSize="xs">
                                            {step.desc}
                                        </Text>
                                    </VStack>
                                </HStack>
                            </MotionBox>
                        ))}
                    </VStack>
                </VStack>
            </MotionFlex>

            {/* Right Panel -- Form */}
            <Flex flex={1} align="center" justify="center" p={{ base: 6, md: 12 }} position="relative">
                <Box
                    position="absolute"
                    top="-20%"
                    right="-10%"
                    w="500px"
                    h="500px"
                    borderRadius="full"
                    bg="brand.600"
                    filter="blur(120px)"
                    opacity={0.08}
                />

                <MotionBox
                    w="full"
                    maxW="420px"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    {/* Mobile logo */}
                    <HStack spacing={2} mb={8} display={{ base: "flex", lg: "none" }} justify="center">
                        <Icon as={HiOutlineSparkles} boxSize={5} color="brand.300" />
                        <Text fontSize="xl" fontWeight="800" bgGradient="linear(to-r, white, brand.300)" bgClip="text">
                            Juryline
                        </Text>
                    </HStack>

                    <VStack spacing={5} as="form" onSubmit={handleSubmit} align="stretch">
                        <VStack spacing={1} align={{ base: "center", lg: "flex-start" }}>
                            <Heading size="lg" color="white" fontWeight="700">
                                Create account
                            </Heading>
                            <Text color="whiteAlpha.500" fontSize="sm">
                                Join Juryline to organize or participate
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
                                bg="whiteAlpha.50"
                                borderColor="whiteAlpha.100"
                                _hover={{ borderColor: "whiteAlpha.200" }}
                                _focus={{ borderColor: "brand.400", boxShadow: "0 0 0 1px var(--chakra-colors-brand-400)" }}
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
                                bg="whiteAlpha.50"
                                borderColor="whiteAlpha.100"
                                _hover={{ borderColor: "whiteAlpha.200" }}
                                _focus={{ borderColor: "brand.400", boxShadow: "0 0 0 1px var(--chakra-colors-brand-400)" }}
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
                                    bg="whiteAlpha.50"
                                    borderColor="whiteAlpha.100"
                                    _hover={{ borderColor: "whiteAlpha.200" }}
                                    _focus={{ borderColor: "brand.400", boxShadow: "0 0 0 1px var(--chakra-colors-brand-400)" }}
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
                                _hover={{ borderColor: "whiteAlpha.200" }}
                                _focus={{ borderColor: "brand.400", boxShadow: "0 0 0 1px var(--chakra-colors-brand-400)" }}
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
                            color="white"
                            size="lg"
                            w="full"
                            isLoading={loading}
                            loadingText="Creating account..."
                            rightIcon={<HiOutlineArrowRight />}
                            _hover={{
                                transform: "translateY(-1px)",
                                boxShadow: "0 8px 30px rgba(124, 58, 237, 0.35)",
                            }}
                        >
                            Create Account
                        </Button>

                        <Text color="whiteAlpha.500" fontSize="sm" textAlign="center">
                            Already have an account?{" "}
                            <Link
                                color="brand.300"
                                href={returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/login"}
                                fontWeight="600"
                                _hover={{ color: "brand.200" }}
                            >
                                Sign in
                            </Link>
                        </Text>
                    </VStack>
                </MotionBox>
            </Flex>
        </Flex>
    );
}
