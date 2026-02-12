"use client";

import { useState } from "react";
import {
    Box,
    Flex,
    Heading,
    Text,
    Button,
    VStack,
    HStack,
    Input,
    FormControl,
    FormLabel,
    FormErrorMessage,
    Link,
    useToast,
    Alert,
    AlertIcon,
    AlertDescription,
    Icon,
    OrderedList,
    ListItem,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
    HiOutlineEnvelope,
    HiOutlineScale,
    HiOutlineSparkles,
    HiOutlineArrowLeft,
    HiOutlineInboxArrowDown,
    HiOutlineCursorArrowRays,
    HiOutlineCheckCircle,
    HiOutlinePaperAirplane,
    HiOutlineExclamationTriangle,
} from "react-icons/hi2";
import { createClient } from "@/lib/supabase/client";

const MotionBox = motion.create(Box);
const MotionFlex = motion.create(Flex);

const STEPS = [
    {
        icon: HiOutlineEnvelope,
        title: "Check your invitation email",
        description:
            "An event organizer should have sent you an invitation email with a magic link. Click that link to sign in instantly.",
    },
    {
        icon: HiOutlineInboxArrowDown,
        title: "No email? Request a new link",
        description:
            'If you lost the email or the link expired, enter your email below and we\'ll send you a new sign-in link.',
    },
    {
        icon: HiOutlineCursorArrowRays,
        title: "Click the link in your inbox",
        description:
            "Open the email we send you and click the sign-in link. You'll be taken directly to your dashboard.",
    },
];

export default function JudgeLoginPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [notJudge, setNotJudge] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const toast = useToast();
    const supabase = createClient();

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!email.trim()) errs.email = "Email is required";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSendLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        setSent(false);
        setNotJudge(false);

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/confirm`,
                    // shouldCreateUser: false ensures only existing users get a link
                    shouldCreateUser: false,
                },
            });

            if (error) {
                // If OTP sign-in fails with shouldCreateUser:false, the user doesn't exist
                // meaning they were never invited
                if (
                    error.message.toLowerCase().includes("signups not allowed") ||
                    error.message.toLowerCase().includes("user not found") ||
                    error.message.toLowerCase().includes("not allowed")
                ) {
                    setNotJudge(true);
                    return;
                }

                toast({
                    title: "Failed to send sign-in link",
                    description: error.message,
                    status: "error",
                    duration: 5000,
                });
                return;
            }

            setSent(true);
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
            {/* Left Panel -- How it works */}
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
                <Box
                    position="absolute"
                    top="-15%"
                    right="-15%"
                    w="400px"
                    h="400px"
                    borderRadius="full"
                    bg="whiteAlpha.100"
                    filter="blur(80px)"
                />
                <Box
                    position="absolute"
                    bottom="-10%"
                    left="-10%"
                    w="300px"
                    h="300px"
                    borderRadius="full"
                    bg="accent.500"
                    filter="blur(100px)"
                    opacity={0.2}
                />

                <VStack
                    spacing={8}
                    maxW="420px"
                    position="relative"
                    zIndex={1}
                    align="start"
                >
                    <HStack spacing={2}>
                        <Icon as={HiOutlineScale} boxSize={6} color="brand.200" />
                        <Text
                            fontSize="2xl"
                            fontWeight="800"
                            color="white"
                            letterSpacing="tight"
                        >
                            Judge Sign In
                        </Text>
                    </HStack>

                    <Heading
                        fontSize="2xl"
                        color="white"
                        fontWeight="700"
                        lineHeight="1.3"
                    >
                        How to sign in
                        <br />
                        <Box as="span" color="brand.200">
                            as a judge
                        </Box>
                    </Heading>

                    <VStack spacing={6} pt={2} w="full" align="start">
                        {STEPS.map((step, i) => (
                            <MotionBox
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                    duration: 0.4,
                                    delay: 0.3 + i * 0.15,
                                }}
                            >
                                <HStack spacing={4} align="start">
                                    <Flex
                                        w={10}
                                        h={10}
                                        borderRadius="lg"
                                        bg="whiteAlpha.150"
                                        align="center"
                                        justify="center"
                                        flexShrink={0}
                                        mt={0.5}
                                    >
                                        <Icon
                                            as={step.icon}
                                            boxSize={5}
                                            color="brand.200"
                                        />
                                    </Flex>
                                    <Box>
                                        <HStack spacing={2} mb={1}>
                                            <Text
                                                color="whiteAlpha.400"
                                                fontSize="xs"
                                                fontWeight="700"
                                            >
                                                STEP {i + 1}
                                            </Text>
                                        </HStack>
                                        <Text
                                            color="white"
                                            fontWeight="600"
                                            fontSize="sm"
                                        >
                                            {step.title}
                                        </Text>
                                        <Text
                                            color="whiteAlpha.600"
                                            fontSize="xs"
                                            mt={1}
                                            lineHeight="1.6"
                                        >
                                            {step.description}
                                        </Text>
                                    </Box>
                                </HStack>
                            </MotionBox>
                        ))}
                    </VStack>
                </VStack>
            </MotionFlex>

            {/* Right Panel -- Form */}
            <Flex
                flex={1}
                align="center"
                justify="center"
                p={{ base: 6, md: 12 }}
                position="relative"
            >
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
                    maxW="440px"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    {/* Back link */}
                    <Link href="/login" _hover={{ textDecoration: "none" }}>
                        <HStack
                            spacing={1}
                            mb={6}
                            color="whiteAlpha.500"
                            _hover={{ color: "brand.300" }}
                            transition="color 0.2s"
                        >
                            <Icon as={HiOutlineArrowLeft} boxSize={4} />
                            <Text fontSize="sm">Back to login</Text>
                        </HStack>
                    </Link>

                    {/* Mobile header */}
                    <HStack
                        spacing={2}
                        mb={6}
                        display={{ base: "flex", lg: "none" }}
                    >
                        <Icon as={HiOutlineScale} boxSize={5} color="brand.300" />
                        <Text
                            fontSize="xl"
                            fontWeight="800"
                            bgGradient="linear(to-r, white, brand.300)"
                            bgClip="text"
                        >
                            Judge Sign In
                        </Text>
                    </HStack>

                    <VStack
                        spacing={6}
                        as="form"
                        onSubmit={handleSendLink}
                        align="stretch"
                    >
                        <VStack
                            spacing={2}
                            align={{ base: "center", lg: "flex-start" }}
                        >
                            <Heading size="lg" color="white" fontWeight="700">
                                Sign in as a Judge
                            </Heading>
                            <Text color="whiteAlpha.500" fontSize="sm">
                                Enter the email your invitation was sent to.
                                We&apos;ll send you a sign-in link.
                            </Text>
                        </VStack>

                        {/* Mobile-only steps */}
                        <Box
                            display={{ base: "block", lg: "none" }}
                            bg="whiteAlpha.50"
                            borderRadius="xl"
                            p={4}
                            border="1px solid"
                            borderColor="whiteAlpha.100"
                        >
                            <Text
                                color="whiteAlpha.500"
                                fontSize="xs"
                                fontWeight="700"
                                textTransform="uppercase"
                                letterSpacing="wider"
                                mb={3}
                            >
                                How it works
                            </Text>
                            <OrderedList
                                spacing={2}
                                color="whiteAlpha.600"
                                fontSize="xs"
                                pl={1}
                            >
                                <ListItem>
                                    An organizer invites you by email with a magic
                                    link
                                </ListItem>
                                <ListItem>
                                    Click the link in the email to sign in
                                    instantly
                                </ListItem>
                                <ListItem>
                                    Lost the email? Enter your email below for a
                                    new link
                                </ListItem>
                            </OrderedList>
                        </Box>

                        {/* Not a judge warning */}
                        {notJudge && (
                            <Alert
                                status="warning"
                                borderRadius="xl"
                                bg="orange.900"
                                color="orange.100"
                            >
                                <AlertIcon />
                                <AlertDescription fontSize="sm">
                                    <Text fontWeight="600" mb={1}>
                                        No judge account found for this email.
                                    </Text>
                                    <Text fontSize="xs" color="orange.200">
                                        Judge accounts are created when an event
                                        organizer invites you. If you believe
                                        you should have access, contact the
                                        organizer who invited you.
                                    </Text>
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Success message */}
                        {sent && (
                            <Alert
                                status="success"
                                borderRadius="xl"
                                bg="green.900"
                                color="green.100"
                            >
                                <AlertIcon />
                                <AlertDescription fontSize="sm">
                                    <Text fontWeight="600" mb={1}>
                                        Sign-in link sent!
                                    </Text>
                                    <Text fontSize="xs" color="green.200">
                                        Check your email inbox for a magic link
                                        from Juryline. Click it to sign in.
                                        It may take a minute to arrive.
                                    </Text>
                                </AlertDescription>
                            </Alert>
                        )}

                        <FormControl isInvalid={!!errors.email}>
                            <FormLabel color="whiteAlpha.700" fontSize="sm">
                                Your email address
                            </FormLabel>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setNotJudge(false);
                                    setSent(false);
                                }}
                                placeholder="judge@example.com"
                                size="lg"
                                bg="whiteAlpha.50"
                                borderColor="whiteAlpha.100"
                                _hover={{ borderColor: "whiteAlpha.200" }}
                                _focus={{
                                    borderColor: "brand.400",
                                    boxShadow:
                                        "0 0 0 1px var(--chakra-colors-brand-400)",
                                }}
                            />
                            <FormErrorMessage>{errors.email}</FormErrorMessage>
                        </FormControl>

                        <Button
                            type="submit"
                            colorScheme="brand"
                            color="white"
                            size="lg"
                            w="full"
                            isLoading={loading}
                            loadingText="Sending link..."
                            leftIcon={<HiOutlinePaperAirplane />}
                            _hover={{
                                transform: "translateY(-1px)",
                                boxShadow:
                                    "0 8px 30px rgba(124, 58, 237, 0.35)",
                            }}
                        >
                            Send Me a Sign-In Link
                        </Button>

                        {/* Info box */}
                        <Box
                            bg="whiteAlpha.50"
                            borderRadius="xl"
                            p={4}
                            border="1px solid"
                            borderColor="whiteAlpha.100"
                        >
                            <HStack spacing={3} align="start">
                                <Icon
                                    as={HiOutlineExclamationTriangle}
                                    color="yellow.400"
                                    boxSize={5}
                                    mt={0.5}
                                    flexShrink={0}
                                />
                                <Box>
                                    <Text
                                        color="whiteAlpha.700"
                                        fontSize="xs"
                                        fontWeight="600"
                                        mb={1}
                                    >
                                        Not invited yet?
                                    </Text>
                                    <Text
                                        color="whiteAlpha.500"
                                        fontSize="xs"
                                        lineHeight="1.6"
                                    >
                                        You can only sign in as a judge if an
                                        event organizer has invited you. If you
                                        are a participant or organizer,{" "}
                                        <Link
                                            color="brand.300"
                                            href="/login"
                                            fontWeight="600"
                                        >
                                            use the regular login
                                        </Link>{" "}
                                        instead.
                                    </Text>
                                </Box>
                            </HStack>
                        </Box>
                    </VStack>
                </MotionBox>
            </Flex>
        </Flex>
    );
}
