"use client";

import { useState, Suspense } from "react";
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
    Link,
    useToast,
    Alert,
    AlertIcon,
    AlertDescription,
    Icon,
    Center,
    Spinner,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
    HiOutlineEye,
    HiOutlineEyeSlash,
    HiOutlineArrowRight,
    HiOutlineTrophy,
    HiOutlineUserGroup,
    HiOutlineChartBar,
    HiOutlineSparkles,
    HiOutlineScale,
} from "react-icons/hi2";
import { createClient } from "@/lib/supabase/client";

const MotionBox = motion.create(Box);
const MotionFlex = motion.create(Flex);

const FEATURES = [
    { icon: HiOutlineTrophy, text: "AI-powered judge assignment" },
    { icon: HiOutlineUserGroup, text: "Custom submission forms" },
    { icon: HiOutlineChartBar, text: "Real-time leaderboards" },
];

function LoginPageContent() {
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
                {/* Decorative blobs */}
                <Box position="absolute" top="-15%" right="-15%" w="400px" h="400px" borderRadius="full" bg="whiteAlpha.100" filter="blur(80px)" />
                <Box position="absolute" bottom="-10%" left="-10%" w="300px" h="300px" borderRadius="full" bg="accent.500" filter="blur(100px)" opacity={0.2} />

                <VStack spacing={8} maxW="400px" textAlign="center" position="relative" zIndex={1}>
                    <HStack spacing={2}>
                        <Icon as={HiOutlineSparkles} boxSize={6} color="brand.200" />
                        <Text fontSize="2xl" fontWeight="800" color="white" letterSpacing="tight">
                            Juryline
                        </Text>
                    </HStack>

                    <Heading fontSize="3xl" color="white" fontWeight="700" lineHeight="1.2">
                        Hackathon judging,
                        <br />
                        <Box as="span" color="brand.200">reimagined.</Box>
                    </Heading>

                    <Text color="whiteAlpha.700" fontSize="md" lineHeight="1.7">
                        The modern platform for running fair, transparent, and AI-powered hackathon evaluations.
                    </Text>

                    <VStack spacing={4} pt={4} w="full" align="start">
                        {FEATURES.map((feat, i) => (
                            <MotionBox
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: 0.3 + i * 0.15 }}
                            >
                                <HStack spacing={3}>
                                    <Flex
                                        w={9}
                                        h={9}
                                        borderRadius="lg"
                                        bg="whiteAlpha.150"
                                        align="center"
                                        justify="center"
                                    >
                                        <Icon as={feat.icon} boxSize={4.5} color="brand.200" />
                                    </Flex>
                                    <Text color="whiteAlpha.800" fontSize="sm" fontWeight="500">
                                        {feat.text}
                                    </Text>
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
                    bottom="-20%"
                    left="-10%"
                    w="500px"
                    h="500px"
                    borderRadius="full"
                    bg="accent.500"
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

                    <VStack spacing={6} as="form" onSubmit={handleSubmit} align="stretch">
                        <VStack spacing={1} align={{ base: "center", lg: "flex-start" }}>
                            <Heading size="lg" color="white" fontWeight="700">
                                Welcome back
                            </Heading>
                            <Text color="whiteAlpha.500" fontSize="sm">
                                Sign in to continue to your dashboard
                            </Text>
                        </VStack>

                        {unverified && (
                            <Alert status="warning" borderRadius="xl" bg="orange.900" color="orange.100">
                                <AlertIcon />
                                <AlertDescription fontSize="sm">
                                    Email not verified. Check your inbox for the verification link.
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
                                    placeholder="Your password"
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
                            <FormErrorMessage>{errors.password}</FormErrorMessage>
                        </FormControl>

                        <Button
                            type="submit"
                            colorScheme="brand"
                            color="white"
                            size="lg"
                            w="full"
                            isLoading={loading}
                            loadingText="Signing in..."
                            rightIcon={<HiOutlineArrowRight />}
                            _hover={{
                                transform: "translateY(-1px)",
                                boxShadow: "0 8px 30px rgba(124, 58, 237, 0.35)",
                            }}
                        >
                            Sign In
                        </Button>

                        <Text color="whiteAlpha.500" fontSize="sm" textAlign="center">
                            Don&apos;t have an account?{" "}
                            <Link
                                color="brand.300"
                                href={returnTo ? `/register?returnTo=${encodeURIComponent(returnTo)}` : "/register"}
                                fontWeight="600"
                                _hover={{ color: "brand.200" }}
                            >
                                Create one
                            </Link>
                        </Text>

                        <Box h="1px" bg="whiteAlpha.100" />

                        <Link
                            href="/login/judge"
                            _hover={{ textDecoration: "none" }}
                        >
                            <HStack
                                spacing={3}
                                justify="center"
                                px={4}
                                py={3}
                                borderRadius="xl"
                                border="1px dashed"
                                borderColor="whiteAlpha.200"
                                cursor="pointer"
                                _hover={{ borderColor: "brand.400", bg: "whiteAlpha.50" }}
                                transition="all 0.2s"
                            >
                                <Icon as={HiOutlineScale} color="brand.300" boxSize={4} />
                                <Text color="whiteAlpha.600" fontSize="sm">
                                    Are you a judge?{" "}
                                    <Box as="span" color="brand.300" fontWeight="600">
                                        Click here to sign in
                                    </Box>
                                </Text>
                            </HStack>
                        </Link>
                    </VStack>
                </MotionBox>
            </Flex>
        </Flex>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <Flex minH="100vh" bgGradient="linear(to-br, gray.900, gray.800)">
                <Center w="full">
                    <Spinner size="xl" color="brand.300" />
                </Center>
            </Flex>
        }>
            <LoginPageContent />
        </Suspense>
    );
}
